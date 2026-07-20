import { NextResponse } from 'next/server'
import type { AsaasPayment } from '@/lib/asaas'
import { createAdminSupabaseClient } from '@/lib/supabase/server'

type AsaasWebhook = { event?: string; payment?: AsaasPayment }

export async function POST(request: Request) {
  const expectedToken = process.env.ASAAS_WEBHOOK_TOKEN
  const receivedToken = request.headers.get('asaas-access-token')
  if (!expectedToken || receivedToken !== expectedToken) {
    return NextResponse.json({ error: 'Webhook não autorizado.' }, { status: 401 })
  }

  const payload = await request.json() as AsaasWebhook
  const payment = payload.payment
  if (!payment) return NextResponse.json({ received: true })

  const admin = createAdminSupabaseClient()
  let barbershopId = payment.externalReference
  if (!barbershopId && payment.subscription) {
    const { data } = await admin.from('barbershops').select('id').eq('asaas_subscription_id', payment.subscription).maybeSingle()
    barbershopId = data?.id
  }
  if (!barbershopId) return NextResponse.json({ received: true })

  if (payload.event === 'PAYMENT_CONFIRMED' || payload.event === 'PAYMENT_RECEIVED') {
    const dueDate = payment.dueDate ? new Date(`${payment.dueDate}T12:00:00`) : new Date()
    dueDate.setMonth(dueDate.getMonth() + 1)
    await admin.from('barbershops').update({
      billing_status: 'active',
      last_payment_at: new Date().toISOString(),
      next_billing_date: dueDate.toISOString().slice(0, 10),
    }).eq('id', barbershopId)
  } else if (payload.event === 'PAYMENT_OVERDUE') {
    await admin.from('barbershops').update({ billing_status: 'past_due' }).eq('id', barbershopId)
  } else if (payload.event === 'PAYMENT_REFUNDED' || payload.event === 'PAYMENT_DELETED') {
    await admin.from('barbershops').update({ billing_status: 'past_due' }).eq('id', barbershopId)
  }

  return NextResponse.json({ received: true })
}
