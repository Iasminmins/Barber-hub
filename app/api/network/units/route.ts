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

function cleanEmail(value: unknown) {
  if (typeof value !== 'string') throw new Error('E-mail inválido.')
  const email = value.trim().toLowerCase()
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 254) throw new Error('Informe um e-mail válido.')
  return email
}

function cleanPassword(value: unknown) {
  if (typeof value !== 'string' || value.length < 8 || value.length > 72) {
    throw new Error('A senha deve ter entre 8 e 72 caracteres.')
  }
  return value
}

async function authenticatedOwner(request: Request) {
  const authorization = request.headers.get('authorization')
  const accessToken = authorization?.startsWith('Bearer ') ? authorization.slice(7) : ''
  if (!accessToken) throw new Error('Sessão não encontrada.')

  const authenticated = createAuthenticatedServerClient(accessToken)
  const { data: userData, error: userError } = await authenticated.auth.getUser(accessToken)
  if (userError || !userData.user) throw new Error('Sessão inválida ou expirada.')

  const { data: memberships, error: membershipError } = await authenticated
    .from('members')
    .select('barbershop_id, name, email, role')
    .eq('user_id', userData.user.id)
    .eq('role', 'owner')
    .eq('active', true)
  if (membershipError || !memberships?.length) throw new Error('Somente o proprietário pode gerenciar unidades.')

  const shopIds = memberships.map((membership) => membership.barbershop_id)
  const { data: shops, error: shopError } = await authenticated
    .from('barbershops')
    .select('id, name, color, logo_url, plan, network_id')
    .in('id', shopIds)
  if (shopError) throw new Error(shopError.message)

  const primary = shops?.find((shop) => shop.plan === 'premium' && shop.network_id)
  if (!primary) throw new Error('O gerenciamento de unidades está disponível somente no plano Premium. Aplique também a migração multiunidade no Supabase.')

  return {
    admin: createAdminSupabaseClient(),
    user: userData.user,
    membership: memberships.find((item) => item.barbershop_id === primary.id)!,
    primary,
  }
}

export async function POST(request: Request) {
  try {
    const { admin, user, membership, primary } = await authenticatedOwner(request)
    const body = await request.json().catch(() => ({}))
    const name = cleanText(body.name, 'Nome da unidade', 2, 100)
    const city = cleanText(body.city, 'Cidade', 2, 100)
    const responsibleName = cleanText(body.responsibleName, 'Nome do responsável', 2, 100)
    const email = cleanEmail(body.email)
    const password = cleanPassword(body.password)

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

    const { data: createdUser, error: userCreateError } = await admin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { name: responsibleName },
    })
    if (userCreateError || !createdUser.user) {
      await admin.from('barbershops').delete().eq('id', shop.id)
      throw new Error(userCreateError?.message.includes('already') ? 'Este e-mail já possui uma conta no BarberHub.' : userCreateError?.message ?? 'Não foi possível criar o acesso da unidade.')
    }

    const { error: memberError } = await admin.from('members').insert([
      {
        barbershop_id: shop.id,
        user_id: user.id,
        name: membership.name,
        email: membership.email,
        role: 'owner',
        active: true,
      },
      {
        barbershop_id: shop.id,
        user_id: createdUser.user.id,
        name: responsibleName,
        email,
        role: 'manager',
        active: true,
      },
    ])
    if (memberError) {
      await Promise.all([
        admin.from('barbershops').delete().eq('id', shop.id),
        admin.auth.admin.deleteUser(createdUser.user.id),
      ])
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

export async function PATCH(request: Request) {
  try {
    const { admin, primary } = await authenticatedOwner(request)
    const body = await request.json().catch(() => ({}))
    const unitId = typeof body.unitId === 'string' ? body.unitId : ''
    const name = cleanText(body.name, 'Nome da unidade', 2, 100)
    const city = cleanText(body.city, 'Cidade', 2, 100)
    if (!unitId) throw new Error('Unidade inválida.')

    const { data: target, error: targetError } = await admin
      .from('barbershops')
      .select('id, network_id')
      .eq('id', unitId)
      .single()
    if (targetError || !target || target.network_id !== primary.network_id) throw new Error('Unidade não encontrada nesta rede.')

    const { data: unit, error: updateError } = await admin
      .from('barbershops')
      .update({ name, city })
      .eq('id', unitId)
      .select('id, name, city')
      .single()
    if (updateError || !unit) throw new Error(updateError?.message ?? 'Não foi possível editar a unidade.')

    return NextResponse.json({ unit })
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Não foi possível editar a unidade.' },
      { status: 400 },
    )
  }
}
