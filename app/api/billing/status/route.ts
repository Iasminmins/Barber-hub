import { NextResponse } from 'next/server'
import { getBillingContext } from '@/lib/billing-auth'

export async function GET(request: Request) {
  try {
    const { barbershop } = await getBillingContext(request)
    return NextResponse.json({
      status: barbershop.billing_status,
      trialEndsAt: barbershop.trial_ends_at,
      nextBillingDate: barbershop.next_billing_date,
      hasSubscription: Boolean(barbershop.asaas_subscription_id),
    })
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Não foi possível carregar a cobrança.' }, { status: 400 })
  }
}
