import { NextResponse } from 'next/server'
import type { AsaasPayment } from '@/lib/asaas'
import { createAdminSupabaseClient } from '@/lib/supabase/server'
import { isUuid, readLimitedJson, RequestBodyError, safeTokenEqual } from '@/lib/http-security'

type AsaasWebhook = { event?: string; payment?: AsaasPayment }

export async function POST(request: Request) {
  const expectedToken = process.env.ASAAS_WEBHOOK_TOKEN
  const receivedToken = request.headers.get('asaas-access-token')
  if (!safeTokenEqual(receivedToken, expectedToken)) {
    return NextResponse.json({ error: 'Webhook não autorizado.' }, { status: 401 })
  }

  let payload: AsaasWebhook
  try {
    payload = await readLimitedJson<AsaasWebhook>(request, 128 * 1024)
  } catch (error) {
    const status = error instanceof RequestBodyError ? error.status : 400
    return NextResponse.json({ error: 'Webhook inválido.' }, { status })
  }
  const payment = payload.payment
  if (!payment) return NextResponse.json({ received: true })

  const admin = createAdminSupabaseClient()
  let barbershopId = payment.externalReference
  if (!barbershopId && payment.subscription) {
    const { data } = await admin.from('barbershops').select('id').eq('asaas_subscription_id', payment.subscription).maybeSingle()
    barbershopId = data?.id
  }
  if (!barbershopId || !isUuid(barbershopId)) return NextResponse.json({ received: true })

  const { data: barbershop, error: barbershopError } = await admin
    .from('barbershops')
    .select('id, asaas_subscription_id')
    .eq('id', barbershopId)
    .maybeSingle()
  if (barbershopError) return NextResponse.json({ error: 'Falha interna.' }, { status: 500 })
  if (!barbershop) return NextResponse.json({ received: true })
  if (payment.subscription && barbershop.asaas_subscription_id && payment.subscription !== barbershop.asaas_subscription_id) {
    return NextResponse.json({ error: 'Assinatura não corresponde à empresa.' }, { status: 400 })
  }

  let updateError: { message: string } | null = null
  if (payload.event === 'PAYMENT_CONFIRMED' || payload.event === 'PAYMENT_RECEIVED') {
    const dueDate = payment.dueDate ? new Date(`${payment.dueDate}T12:00:00`) : new Date()
    dueDate.setMonth(dueDate.getMonth() + 1)
    const result = await admin.from('barbershops').update({
      billing_status: 'active',
      last_payment_at: new Date().toISOString(),
      next_billing_date: dueDate.toISOString().slice(0, 10),
    }).eq('id', barbershopId)
    updateError = result.error
  } else if (payload.event === 'PAYMENT_OVERDUE') {
    const result = await admin.from('barbershops').update({ billing_status: 'past_due' }).eq('id', barbershopId)
    updateError = result.error
  } else if (payload.event === 'PAYMENT_REFUNDED' || payload.event === 'PAYMENT_DELETED') {
    const result = await admin.from('barbershops').update({ billing_status: 'past_due' }).eq('id', barbershopId)
    updateError = result.error
  }

  if (updateError) return NextResponse.json({ error: 'Falha interna.' }, { status: 500 })

  return NextResponse.json({ received: true })
}
