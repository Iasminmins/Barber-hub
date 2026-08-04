import { NextResponse } from 'next/server'
import { requirePlatformAdmin, platformErrorResponse } from '@/lib/platform-admin'
import { calculateAdminBillingMetrics } from '@/lib/admin-billing'
import { asaasRequest } from '@/lib/asaas'
import type { SaasPlanId } from '@/lib/saas-plans'

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
      .select('id, plan, billing_status, trial_ends_at, next_billing_date, created_at, asaas_subscription_id, complimentary_until, complimentary_value')
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

    const revenue = calculateAdminBillingMetrics(rows.map((shop) => ({
      plan: shop.plan as SaasPlanId,
      billingStatus: shop.billing_status,
      nextBillingDate: shop.next_billing_date,
      complimentaryUntil: shop.complimentary_until,
      complimentaryValue: Number(shop.complimentary_value ?? 0),
      hasSubscription: Boolean(shop.asaas_subscription_id),
      createdAt: shop.created_at,
    })))

    let receivedThisMonth = 0
    let asaasAvailable = true
    try {
      const monthStart = new Date()
      monthStart.setDate(1)
      const today = new Date()
      const dateKey = (date: Date) => date.toISOString().slice(0, 10)
      const payments = await asaasRequest<{ data?: Array<{ value?: number }> }>(
        `/payments?status=RECEIVED&paymentDate%5Bge%5D=${dateKey(monthStart)}&paymentDate%5Ble%5D=${dateKey(today)}&limit=100`,
      )
      receivedThisMonth = (payments.data ?? []).reduce((sum, payment) => sum + Number(payment.value ?? 0), 0)
    } catch {
      asaasAvailable = false
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
      revenue: { ...revenue, receivedThisMonth, asaasAvailable },
      plans: byPlan,
    })
  } catch (error) {
    const { message, status } = platformErrorResponse(error)
    return NextResponse.json({ error: message }, { status })
  }
}
