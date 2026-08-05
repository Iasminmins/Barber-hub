import { NextResponse } from 'next/server'
import { requirePlatformAdmin, platformErrorResponse } from '@/lib/platform-admin'
import { effectiveBillingStatus } from '@/lib/billing-status'

export const dynamic = 'force-dynamic'

const SORT_FIELDS = new Set(['name', 'created_at', 'plan', 'billing_status', 'usersCount'])

export async function GET(request: Request) {
  try {
    const { admin } = await requirePlatformAdmin(request)
    const url = new URL(request.url)
    const search = url.searchParams.get('search')?.trim() ?? ''
    const status = url.searchParams.get('status')?.trim() ?? ''
    const plan = url.searchParams.get('plan')?.trim() ?? ''
    const billing = url.searchParams.get('billing')?.trim() ?? ''
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
          .select('barbershop_id, name, email, role, active')
          .in('barbershop_id', ids)
      : { data: [] as { barbershop_id: string; name: string; email: string; role: string; active: boolean }[] }

    const grouped = new Map<string, { total: number; owner: { name: string; email: string } | null }>()
    for (const member of members ?? []) {
      const entry = grouped.get(member.barbershop_id) ?? { total: 0, owner: null }
      if (member.active) entry.total += 1
      if (member.role === 'owner' && !entry.owner) entry.owner = { name: member.name, email: member.email }
      grouped.set(member.barbershop_id, entry)
    }

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
        ownerPhone: null as string | null,
        trialDaysLeft,
        lastAccessAt: shop.last_payment_at ?? shop.updated_at,
        financialStatus: billingStatus === 'past_due' ? 'inadimplente' : billingStatus === 'active' ? 'em_dia' : billingStatus === 'trialing' ? 'teste' : billingStatus === 'canceled' ? 'cancelada' : 'pendente',
      }
    })

    if (status) items = items.filter((item) => item.billing_status === status)

    if (sort === 'usersCount') {
      items.sort((a, b) => (order === 'asc' ? a.usersCount - b.usersCount : b.usersCount - a.usersCount))
    }

    const total = status ? items.length : (count ?? items.length)
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
