import { NextResponse } from 'next/server'
import { asaasRequest } from '@/lib/asaas'
import { getBillingContext } from '@/lib/billing-auth'
import { createAdminSupabaseClient } from '@/lib/supabase/server'
import { getSaasPlan, saasPlans, type SaasPlanId } from '@/lib/saas-plans'

function parsePlan(plan: unknown): SaasPlanId {
  if (typeof plan !== 'string') throw new Error('Plano inválido.')
  const candidate = saasPlans.find((item) => item.id === plan)
  if (!candidate) throw new Error('Plano inválido.')
  return candidate.id
}

export async function PATCH(request: Request) {
  try {
    const { barbershop } = await getBillingContext(request)
    const body = await request.json().catch(() => ({}))
    const planId = parsePlan(body.plan)
    const plan = getSaasPlan(planId)

    if (barbershop.plan === planId) {
      return NextResponse.json({ plan: planId, message: 'Este plano já está selecionado.' })
    }

    if (barbershop.asaas_subscription_id) {
      await asaasRequest(`/subscriptions/${barbershop.asaas_subscription_id}`, {
        method: 'PUT',
        body: JSON.stringify({
          value: plan.monthlyPrice,
          cycle: 'MONTHLY',
          description: `BarberHub - Plano ${plan.name}`,
          updatePendingPayments: true,
        }),
      })
    }

    const supabase = createAdminSupabaseClient()
    const { error } = await supabase
      .from('barbershops')
      .update({ plan: planId })
      .eq('id', barbershop.id)

    if (error) throw new Error(error.message)

    return NextResponse.json({
      plan: planId,
      message: barbershop.asaas_subscription_id
        ? 'Plano atualizado no BarberHub e na assinatura do Asaas.'
        : 'Plano atualizado para a cobrança futura.',
    })
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Não foi possível alterar o plano.' },
      { status: 400 },
    )
  }
}
