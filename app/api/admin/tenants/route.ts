import { NextResponse } from 'next/server'
import { requirePlatformAdmin, platformErrorResponse } from '@/lib/platform-admin'

export const dynamic = 'force-dynamic'

export async function GET(request: Request) {
  try {
    const { admin } = await requirePlatformAdmin(request)
    const url = new URL(request.url)
    const search = url.searchParams.get('search')?.trim() ?? ''
    const status = url.searchParams.get('status')?.trim() ?? ''
    const plan = url.searchParams.get('plan')?.trim() ?? ''
    const limit = Math.min(Number(url.searchParams.get('limit') ?? 100), 200)

    let query = admin
      .from('barbershops')
      .select('id, name, slug, city, plan, billing_status, trial_ends_at, next_billing_date, last_payment_at, created_at, asaas_subscription_id')
      .order('created_at', { ascending: false })
      .limit(limit)

    if (search) query = query.or(`name.ilike.%${search}%,slug.ilike.%${search}%,city.ilike.%${search}%`)
    if (status) query = query.eq('billing_status', status)
    if (plan) query = query.eq('plan', plan)

    const { data: shops, error } = await query
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

    const items = (shops ?? []).map((shop) => {
      const info = grouped.get(shop.id)
      const trialDaysLeft = shop.billing_status === 'trialing' && shop.trial_ends_at
        ? Math.ceil((new Date(shop.trial_ends_at).getTime() - Date.now()) / 86400000)
        : null
      return {
        ...shop,
        hasSubscription: Boolean(shop.asaas_subscription_id),
        usersCount: info?.total ?? 0,
        owner: info?.owner ?? null,
        trialDaysLeft,
      }
    })

    return NextResponse.json({ items, count: items.length })
  } catch (error) {
    const { message, status } = platformErrorResponse(error)
    return NextResponse.json({ error: message }, { status })
  }
}
