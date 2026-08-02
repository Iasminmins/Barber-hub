import { NextResponse } from 'next/server'
import { createAdminSupabaseClient, createAuthenticatedServerClient } from '@/lib/supabase/server'

function cleanText(value: unknown, label: string, min: number, max: number) {
  if (typeof value !== 'string') throw new Error(`${label} inválido.`)
  const cleaned = value.trim().replace(/\s+/g, ' ')
  if (cleaned.length < min || cleaned.length > max) throw new Error(`${label} deve ter entre ${min} e ${max} caracteres.`)
  return cleaned
}

function makeSlug(value: string) {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
}

async function authenticatedOwner(request: Request) {
  const authorization = request.headers.get('authorization')
  const accessToken = authorization?.startsWith('Bearer ') ? authorization.slice(7) : ''
  if (!accessToken) throw new Error('Sessão não encontrada.')

  const authenticated = createAuthenticatedServerClient(accessToken)
  const { data: userData, error: userError } = await authenticated.auth.getUser(accessToken)
  if (userError || !userData.user) throw new Error('Sessão inválida ou expirada.')

  const admin = createAdminSupabaseClient()
  const { data: memberships, error: membershipError } = await admin
    .from('members')
    .select('barbershop_id, name, email, role')
    .eq('user_id', userData.user.id)
    .eq('role', 'owner')
    .eq('active', true)
  if (membershipError || !memberships?.length) throw new Error('Somente o proprietário pode gerenciar unidades.')

  const shopIds = memberships.map((membership) => membership.barbershop_id)
  const { data: shops, error: shopError } = await admin
    .from('barbershops')
    .select('id, name, color, logo_url, plan, network_id')
    .in('id', shopIds)
  if (shopError) throw new Error(shopError.message)

  const primary = shops?.find((shop) => shop.plan === 'premium' && shop.network_id)
  if (!primary) throw new Error('O gerenciamento de unidades está disponível somente no plano Premium. Aplique também a migração multiunidade no Supabase.')

  return { admin, user: userData.user, membership: memberships.find((item) => item.barbershop_id === primary.id)!, primary }
}

export async function POST(request: Request) {
  try {
    const { admin, user, membership, primary } = await authenticatedOwner(request)
    const body = await request.json().catch(() => ({}))
    const name = cleanText(body.name, 'Nome da unidade', 2, 100)
    const city = cleanText(body.city, 'Cidade', 2, 100)

    const { data: network, error: networkError } = await admin
      .from('networks')
      .select('id, max_units')
      .eq('id', primary.network_id)
      .single()
    if (networkError || !network) throw new Error('Rede Premium não encontrada.')

    const { count, error: countError } = await admin
      .from('barbershops')
      .select('id', { count: 'exact', head: true })
      .eq('network_id', network.id)
    if (countError) throw new Error(countError.message)
    if ((count ?? 0) >= network.max_units) throw new Error(`Seu plano permite até ${network.max_units} unidades.`)

    const baseSlug = makeSlug(`${name}-${city}`) || 'nova-unidade'
    const slug = `${baseSlug}-${crypto.randomUUID().slice(0, 6)}`
    const { data: shop, error: insertError } = await admin
      .from('barbershops')
      .insert({
        name,
        city,
        slug,
        color: primary.color,
        logo_url: primary.logo_url,
        plan: 'premium',
        billing_status: 'active',
        network_id: network.id,
      })
      .select('id, name, slug, city, color, logo_url, plan, network_id')
      .single()
    if (insertError || !shop) throw new Error(insertError?.message ?? 'Não foi possível criar a unidade.')

    const { error: memberError } = await admin.from('members').insert({
      barbershop_id: shop.id,
      user_id: user.id,
      name: membership.name,
      email: membership.email,
      role: 'owner',
      active: true,
    })
    if (memberError) {
      await admin.from('barbershops').delete().eq('id', shop.id)
      throw new Error(memberError.message)
    }

    return NextResponse.json({ unit: shop }, { status: 201 })
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Não foi possível adicionar a unidade.' },
      { status: 400 },
    )
  }
}
