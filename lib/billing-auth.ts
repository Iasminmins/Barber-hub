import { createAdminSupabaseClient, createAuthenticatedServerClient } from '@/lib/supabase/server'

export async function getBillingContext(request: Request) {
  const authorization = request.headers.get('authorization')
  const accessToken = authorization?.startsWith('Bearer ') ? authorization.slice(7) : ''
  if (!accessToken) throw new Error('Sessão não encontrada.')

  const supabase = createAuthenticatedServerClient(accessToken)
  const { data: userData, error: userError } = await supabase.auth.getUser(accessToken)
  if (userError || !userData.user) throw new Error('Sessão inválida ou expirada.')

  const { data: member, error: memberError } = await supabase
    .from('members')
    .select('barbershop_id, name, email, role')
    .eq('user_id', userData.user.id)
    .eq('active', true)
    .single()
  if (memberError || !member) throw new Error('Empresa não encontrada para esta conta.')
  if (member.role !== 'owner') throw new Error('Somente o proprietário pode gerenciar pagamentos.')

  const admin = createAdminSupabaseClient()
  const { data: barbershop, error: shopError } = await admin
    .from('barbershops')
    .select('id, name, plan, billing_status, trial_ends_at, next_billing_date, billing_document, asaas_customer_id, asaas_subscription_id')
    .eq('id', member.barbershop_id)
    .single()
  if (shopError || !barbershop) throw new Error('Dados de cobrança não encontrados. Aplique a migração do banco.')

  return { member, barbershop }
}
