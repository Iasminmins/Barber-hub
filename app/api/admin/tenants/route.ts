import { NextResponse } from 'next/server'
import { requirePlatformAdmin, platformErrorResponse } from '@/lib/platform-admin'
import { effectiveBillingStatus } from '@/lib/billing-status'
import type { createAdminSupabaseClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

const SORT_FIELDS = new Set(['name', 'created_at', 'plan', 'billing_status', 'usersCount', 'trial_ends_at', 'next_billing_date'])

/** Máximo de usuários varridos no Auth (5 páginas de 1000) antes de desistir da paginação. */
const AUTH_PAGE_SIZE = 1000
const AUTH_MAX_PAGES = 5

/**
 * Último login real de cada responsável (`auth.users.last_sign_in_at`).
 * O schema `auth` não é exposto via PostgREST, então a leitura passa pela Admin API.
 * Retorna `null` quando a consulta falha — aí o painel volta para o proxy antigo
 * em vez de afirmar que ninguém nunca acessou.
 */
async function fetchLastSignIns(
  admin: ReturnType<typeof createAdminSupabaseClient>,
  userIds: string[],
): Promise<Map<string, string | null> | null> {
  if (userIds.length === 0) return new Map()
  const wanted = new Set(userIds)
  const found = new Map<string, string | null>()

  try {
    for (let page = 1; page <= AUTH_MAX_PAGES; page += 1) {
      const { data, error } = await admin.auth.admin.listUsers({ page, perPage: AUTH_PAGE_SIZE })
      if (error) return null
      const users = data?.users ?? []
      for (const user of users) {
        if (wanted.has(user.id)) found.set(user.id, user.last_sign_in_at ?? null)
      }
      if (users.length < AUTH_PAGE_SIZE || found.size === wanted.size) break
    }
  } catch {
    return null
  }

  return found
}

export async function GET(request: Request) {
  try {
    const { admin } = await requirePlatformAdmin(request)
    const url = new URL(request.url)
    const search = url.searchParams.get('search')?.trim() ?? ''
    const status = url.searchParams.get('status')?.trim() ?? ''
    const plan = url.searchParams.get('plan')?.trim() ?? ''
    const billing = url.searchParams.get('billing')?.trim() ?? ''
    const city = url.searchParams.get('city')?.trim() ?? ''
    const sort = url.searchParams.get('sort')?.trim() ?? 'created_at'
    const order = url.searchParams.get('order') === 'asc' ? 'asc' : 'desc'
    const page = Math.max(Number(url.searchParams.get('page') ?? 1), 1)
    const pageSize = Math.min(Math.max(Number(url.searchParams.get('pageSize') ?? 20), 5), 100)
    const offset = (page - 1) * pageSize

    let query = admin
      .from('barbershops')
      .select('id, name, slug, city, color, plan, billing_status, trial_ends_at, next_billing_date, last_payment_at, created_at, updated_at, asaas_subscription_id, complimentary_until, complimentary_reason, complimentary_value', { count: 'exact' })

    if (search) {
      query = query.or(`name.ilike.%${search}%,slug.ilike.%${search}%,city.ilike.%${search}%`)
    }
    if (plan) query = query.eq('plan', plan)
    if (city) query = query.ilike('city', `%${city}%`)
    const today = new Date().toISOString().slice(0, 10)
    if (billing === 'complimentary') query = query.gte('complimentary_until', today)
    if (billing === 'due7') {
      const end = new Date()
      end.setDate(end.getDate() + 7)
      query = query.gte('next_billing_date', today).lte('next_billing_date', end.toISOString().slice(0, 10))
    }

    if (SORT_FIELDS.has(sort) && sort !== 'usersCount') {
      query = query.order(sort, { ascending: order === 'asc' })
    } else {
      query = query.order('created_at', { ascending: false })
    }

    const { data: shops, error, count } = await query
    if (error) throw new Error('Não foi possível listar as contas.')

    const ids = (shops ?? []).map((shop) => shop.id)
    const { data: members } = ids.length
      ? await admin
          .from('members')
          .select('id, barbershop_id, user_id, name, email, role, active, phone')
          .in('barbershop_id', ids)
      : { data: [] as { id: string; barbershop_id: string; user_id: string; name: string; email: string; role: string; active: boolean; phone: string | null }[] }

    type OwnerInfo = {
      total: number
      owner: { name: string; email: string } | null
      ownerId: string | null
      ownerUserId: string | null
      ownerPhone: string | null
    }

    const grouped = new Map<string, OwnerInfo>()
    for (const member of members ?? []) {
      const entry = grouped.get(member.barbershop_id)
        ?? { total: 0, owner: null, ownerId: null, ownerUserId: null, ownerPhone: null }
      if (member.active) entry.total += 1
      if (member.role === 'owner' && !entry.owner) {
        entry.owner = { name: member.name, email: member.email }
        entry.ownerId = member.id
        entry.ownerUserId = member.user_id ?? null
        entry.ownerPhone = member.phone ?? null
      }
      grouped.set(member.barbershop_id, entry)
    }

    const ownerUserIds = [...grouped.values()].map((info) => info.ownerUserId).filter((id): id is string => Boolean(id))
    const lastSignIns = await fetchLastSignIns(admin, ownerUserIds)

    let items = (shops ?? []).map((shop) => {
      const info = grouped.get(shop.id)
      const billingStatus = effectiveBillingStatus(shop.billing_status, shop.trial_ends_at)
      const trialDaysLeft = billingStatus === 'trialing' && shop.trial_ends_at
        ? Math.ceil((new Date(shop.trial_ends_at).getTime() - Date.now()) / 86400000)
        : null
      return {
        ...shop,
        billing_status: billingStatus,
        hasSubscription: Boolean(shop.asaas_subscription_id),
        usersCount: info?.total ?? 0,
        owner: info?.owner ?? null,
        ownerId: info?.ownerId ?? null,
        ownerPhone: info?.ownerPhone ?? null,
        trialDaysLeft,
        // `undefined` = não foi possível ler o Auth (o painel cai no proxy);
        // `null` = usuário existe e nunca fez login.
        lastSignInAt: lastSignIns ? (info?.ownerUserId ? lastSignIns.get(info.ownerUserId) ?? null : null) : undefined,
        lastAccessAt: shop.last_payment_at ?? shop.updated_at,
        financialStatus: billingStatus === 'past_due' ? 'inadimplente' : billingStatus === 'active' ? 'em_dia' : billingStatus === 'trialing' ? 'teste' : billingStatus === 'canceled' ? 'cancelada' : 'pendente',
      }
    })

    if (status) items = items.filter((item) => item.billing_status === status)

    // "attention": inadimplentes + cobranças que vencem nos próximos 7 dias (inclui vencidas)
    if (billing === 'attention') {
      const limit = new Date()
      limit.setDate(limit.getDate() + 7)
      const limitDate = limit.toISOString().slice(0, 10)
      items = items.filter((item) => (
        item.billing_status === 'past_due' || (item.next_billing_date && item.next_billing_date <= limitDate)
      ))
    }

    if (sort === 'usersCount') {
      items.sort((a, b) => (order === 'asc' ? a.usersCount - b.usersCount : b.usersCount - a.usersCount))
    }

    const filteredInMemory = Boolean(status) || billing === 'attention'
    const total = filteredInMemory ? items.length : (count ?? items.length)
    const paginated = items.slice(offset, offset + pageSize)

    return NextResponse.json({
      items: paginated,
      count: total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
    })
  } catch (error) {
    const { message, status } = platformErrorResponse(error)
    return NextResponse.json({ error: message }, { status })
  }
}
