import { NextResponse } from 'next/server'
import { asaasRequest, type AsaasPayment, type AsaasSubscription } from '@/lib/asaas'
import { getBillingContext } from '@/lib/billing-auth'
import { getSaasPlan, type SaasPlanId } from '@/lib/saas-plans'
import { createAdminSupabaseClient } from '@/lib/supabase/server'

type PaymentList = { data?: AsaasPayment[] }

export async function POST(request: Request) {
  try {
    const { member, barbershop } = await getBillingContext(request)
    const admin = createAdminSupabaseClient()

    if (barbershop.asaas_subscription_id) {
      const payments = await asaasRequest<PaymentList>(`/subscriptions/${barbershop.asaas_subscription_id}/payments`)
      const payment = payments.data?.find((item) => item.status !== 'RECEIVED' && item.status !== 'CONFIRMED') ?? payments.data?.[0]
      if (payment?.invoiceUrl) return NextResponse.json({ url: payment.invoiceUrl })
    }

    let customerId = barbershop.asaas_customer_id as string | null
    if (!customerId) {
      const customer = await asaasRequest<{ id: string }>('/customers', {
        method: 'POST',
        body: JSON.stringify({
          name: barbershop.name,
          email: member.email,
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
    return NextResponse.json({ url: payment.invoiceUrl })
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Não foi possível iniciar o pagamento.' }, { status: 400 })
  }
}
