import { createAuthenticatedServerClient } from '@/lib/supabase/server'

export async function getBillingContext(request: Request) {
  const authorization = request.headers.get('authorization')
  const accessToken = authorization?.startsWith('Bearer ') ? authorization.slice(7) : ''
  if (!accessToken) throw new Error('Sessão não encontrada.')

  const supabase = createAuthenticatedServerClient(accessToken)
  const { data: userData, error: userError } = await supabase.auth.getUser(accessToken)
  if (userError || !userData.user) throw new Error('Sessão inválida ou expirada.')

  const { data: members, error: memberError } = await supabase
    .from('members')
    .select('barbershop_id, name, email, role')
    .eq('user_id', userData.user.id)
    .eq('active', true)
    .eq('role', 'owner')
  if (memberError || !members?.length) throw new Error('Somente o proprietário pode gerenciar pagamentos.')

  const { data: barbershops, error: shopError } = await supabase
    .from('barbershops')
    .select('id, name, plan, billing_status, trial_ends_at, next_billing_date, billing_document, asaas_customer_id, asaas_subscription_id, network_id')
    .in('id', members.map((member) => member.barbershop_id))
  const barbershop = barbershops?.find((shop) => shop.asaas_subscription_id || shop.asaas_customer_id)
    ?? barbershops?.find((shop) => shop.plan === 'premium' && shop.network_id)
    ?? barbershops?.[0]
  if (shopError || !barbershop) throw new Error('Dados de cobrança não encontrados. Aplique a migração do banco.')
  const member = members.find((item) => item.barbershop_id === barbershop.id) ?? members[0]

  return { supabase, member, barbershop, user: userData.user }
}
