import { NextResponse } from 'next/server'
import { asaasRequest, isStaleAsaasLinkError, type AsaasPayment, type AsaasSubscription } from '@/lib/asaas'
import { getBillingContext } from '@/lib/billing-auth'
import { getSaasPlan, type SaasPlanId } from '@/lib/saas-plans'
import { onlyDigits } from '@/lib/billing-document'
import { createAdminSupabaseClient } from '@/lib/supabase/server'
import { computeFirstChargeValue, effectiveCouponStatus } from '@/lib/platform-coupons'

type PaymentList = { data?: AsaasPayment[] }

export async function POST(request: Request) {
  try {
    const { member, barbershop } = await getBillingContext(request)
    const admin = createAdminSupabaseClient()

    let customerId = barbershop.asaas_customer_id as string | null

    if (barbershop.asaas_subscription_id) {
      try {
        const payments = await asaasRequest<PaymentList>(`/subscriptions/${barbershop.asaas_subscription_id}/payments`)
        const payment = payments.data?.find((item) => item.status !== 'RECEIVED' && item.status !== 'CONFIRMED') ?? payments.data?.[0]
        if (payment?.invoiceUrl) return NextResponse.json({ url: payment.invoiceUrl })
      } catch (error) {
        // O Asaas remove a assinatura junto com o cliente removido: descarta o customerId salvo e recria abaixo.
        if (!isStaleAsaasLinkError(error)) throw error
        customerId = null
      }
    }

    // Cupom só é validado/aplicado na criação de uma assinatura nova — o desconto vale
    // apenas na 1ª cobrança, então uma assinatura já existente nunca passa por aqui.
    let coupon: { id: string; discount_type: 'percentage' | 'fixed'; discount_value: number; redemptions_count: number } | null = null
    const body = await request.json().catch(() => ({}))
    const couponCode = typeof body.couponCode === 'string' ? body.couponCode.trim().toUpperCase() : ''
    if (couponCode) {
      const { data: couponRow } = await admin.from('platform_coupons').select('*').eq('code', couponCode).maybeSingle()
      if (!couponRow) throw new Error('Cupom não encontrado.')
      const status = effectiveCouponStatus(couponRow)
      if (status !== 'active') throw new Error(status === 'expired' ? 'Este cupom está expirado.' : 'Este cupom não está mais disponível.')
      if (couponRow.max_redemptions !== null && couponRow.redemptions_count >= couponRow.max_redemptions) {
        throw new Error('Este cupom já atingiu o limite de usos.')
      }
      if (couponRow.applicable_plans.length && !couponRow.applicable_plans.includes(barbershop.plan)) {
        throw new Error(`Este cupom só é válido para os planos: ${couponRow.applicable_plans.join(', ')}.`)
      }
      coupon = couponRow
    }

    if (!customerId) {
      const cpfCnpj = onlyDigits(String(barbershop.billing_document ?? ''))
      if (cpfCnpj.length !== 11 && cpfCnpj.length !== 14) {
        throw new Error('Para criar esta cobranca e necessario preencher o CPF ou CNPJ da empresa em Configuracoes.')
      }

      const customer = await asaasRequest<{ id: string }>('/customers', {
        method: 'POST',
        body: JSON.stringify({
          name: barbershop.name,
          email: member.email,
          cpfCnpj,
          externalReference: barbershop.id,
          notificationDisabled: false,
        }),
      })
      customerId = customer.id
    }

    const plan = getSaasPlan(barbershop.plan as SaasPlanId)
    const today = new Date()
    const trialEnd = new Date(barbershop.trial_ends_at)
    const firstDueDate = trialEnd > today ? trialEnd : today
    const nextDueDate = firstDueDate.toISOString().slice(0, 10)
    const subscription = await asaasRequest<AsaasSubscription>('/subscriptions', {
      method: 'POST',
      body: JSON.stringify({
        customer: customerId,
        billingType: 'UNDEFINED',
        value: plan.monthlyPrice,
        nextDueDate,
        cycle: 'MONTHLY',
        description: `BarberHub - Plano ${plan.name}`,
        externalReference: barbershop.id,
      }),
    })

    const { error: updateError } = await admin.from('barbershops').update({
      asaas_customer_id: customerId,
      asaas_subscription_id: subscription.id,
      next_billing_date: subscription.nextDueDate ?? nextDueDate,
    }).eq('id', barbershop.id)
    if (updateError) throw new Error(updateError.message)

    const payments = await asaasRequest<PaymentList>(`/subscriptions/${subscription.id}/payments`)
    const payment = payments.data?.[0]
    if (!payment?.invoiceUrl) throw new Error('Assinatura criada, mas o link da primeira cobrança ainda não ficou disponível. Tente novamente em instantes.')

    if (coupon) {
      const discountedValue = computeFirstChargeValue(plan.monthlyPrice, coupon)
      await asaasRequest(`/payments/${payment.id}`, { method: 'PUT', body: JSON.stringify({ value: discountedValue }) })
      await admin.from('platform_coupon_redemptions').insert({
        coupon_id: coupon.id,
        barbershop_id: barbershop.id,
        barbershop_name: barbershop.name,
        discount_applied: Number((plan.monthlyPrice - discountedValue).toFixed(2)),
        note: 'Aplicado automaticamente no checkout (1ª cobrança).',
      })
      await admin.from('platform_coupons').update({
        redemptions_count: coupon.redemptions_count + 1,
        updated_at: new Date().toISOString(),
      }).eq('id', coupon.id)
    }

    return NextResponse.json({ url: payment.invoiceUrl })
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Não foi possível iniciar o pagamento.' }, { status: 400 })
  }
}
