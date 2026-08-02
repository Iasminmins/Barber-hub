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
    const { barbershop, user } = await getBillingContext(request)
    const body = await request.json().catch(() => ({}))
    const planId = parsePlan(body.plan)
    const plan = getSaasPlan(planId)
    const supabase = createAdminSupabaseClient()

    if (barbershop.plan === planId) {
      return NextResponse.json({ plan: planId, message: 'Este plano já está selecionado.' })
    }

    if (barbershop.network_id && planId !== 'premium') {
      const { count, error: countError } = await supabase
        .from('barbershops')
        .select('id', { count: 'exact', head: true })
        .eq('network_id', barbershop.network_id)
      if (countError) throw new Error(countError.message)
      if ((count ?? 0) > 1) throw new Error('Remova as unidades adicionais antes de sair do plano Premium.')
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

    const { error } = await supabase
      .from('barbershops')
      .update({ plan: planId })
      .eq('id', barbershop.id)

    if (error) throw new Error(error.message)

    if (planId === 'premium' && !barbershop.network_id) {
      const { data: network, error: networkError } = await supabase
        .from('networks')
        .insert({ name: barbershop.name, primary_barbershop_id: barbershop.id })
        .select('id')
        .single()
      if (networkError || !network) throw new Error(networkError?.message ?? 'Não foi possível preparar a gestão multiunidade.')

      const [{ error: shopNetworkError }, { error: memberNetworkError }] = await Promise.all([
        supabase.from('barbershops').update({ network_id: network.id }).eq('id', barbershop.id),
        supabase.from('network_members').insert({ network_id: network.id, user_id: user.id, role: 'owner' }),
      ])
      if (shopNetworkError || memberNetworkError) throw new Error(shopNetworkError?.message ?? memberNetworkError?.message ?? 'Não foi possível preparar a gestão multiunidade.')
    }

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
