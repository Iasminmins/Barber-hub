import { NextResponse } from 'next/server'
import { requirePlatformAdmin, platformErrorResponse } from '@/lib/platform-admin'

export const dynamic = 'force-dynamic'

function daysAgoIso(days: number) {
  const date = new Date()
  date.setHours(0, 0, 0, 0)
  date.setDate(date.getDate() - days)
  return date.toISOString()
}

export async function GET(request: Request) {
  try {
    const { admin } = await requirePlatformAdmin(request)

    const { data: shops, error } = await admin
      .from('barbershops')
      .select('id, plan, billing_status, trial_ends_at, created_at')
    if (error) throw new Error('Não foi possível carregar as barbearias.')

    const { count: membersCount } = await admin
      .from('members')
      .select('id', { count: 'exact', head: true })
      .eq('active', true)

    const rows = shops ?? []
    const now = Date.now()
    const last7 = daysAgoIso(7)
    const last30 = daysAgoIso(30)

    const byStatus = { trialing: 0, active: 0, past_due: 0, canceled: 0 } as Record<string, number>
    const byPlan = { starter: 0, pro: 0, premium: 0 } as Record<string, number>
    let trialExpiringSoon = 0
    let trialExpired = 0

    for (const shop of rows) {
      byStatus[shop.billing_status] = (byStatus[shop.billing_status] ?? 0) + 1
      byPlan[shop.plan] = (byPlan[shop.plan] ?? 0) + 1
      if (shop.billing_status === 'trialing' && shop.trial_ends_at) {
        const remaining = new Date(shop.trial_ends_at).getTime() - now
        if (remaining < 0) trialExpired += 1
        else if (remaining <= 7 * 24 * 60 * 60 * 1000) trialExpiringSoon += 1
      }
    }

    return NextResponse.json({
      totals: {
        barbershops: rows.length,
        users: membersCount ?? 0,
        newLast7Days: rows.filter((shop) => shop.created_at >= last7).length,
        newLast30Days: rows.filter((shop) => shop.created_at >= last30).length,
      },
      billing: {
        trialing: byStatus.trialing,
        active: byStatus.active,
        pastDue: byStatus.past_due,
        canceled: byStatus.canceled,
        trialExpiringSoon,
        trialExpired,
      },
      plans: byPlan,
    })
  } catch (error) {
    const { message, status } = platformErrorResponse(error)
    return NextResponse.json({ error: message }, { status })
  }
}
