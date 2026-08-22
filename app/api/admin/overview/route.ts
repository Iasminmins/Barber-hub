import { NextResponse } from 'next/server'
import { requirePlatformAdmin, platformErrorResponse } from '@/lib/platform-admin'
import { calculateAdminBillingMetrics } from '@/lib/admin-billing'
import { buildAdminCharts, buildAttentionItems, computePeriodComparison } from '@/lib/admin-charts'
import { asaasRequest } from '@/lib/asaas'
import type { SaasPlanId } from '@/lib/saas-plans'
import { effectiveBillingStatus } from '@/lib/billing-status'

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
    const url = new URL(request.url)
    const periodDays = Math.min(Math.max(Number(url.searchParams.get('period') ?? 30), 7), 365)

    const { data: shops, error } = await admin
      .from('barbershops')
      .select('id, name, slug, plan, billing_status, trial_ends_at, next_billing_date, created_at, updated_at, last_payment_at, asaas_subscription_id, complimentary_until, complimentary_value')
    if (error) throw new Error('Não foi possível carregar as barbearias.')

    const { count: membersCount } = await admin
      .from('members')
      .select('id', { count: 'exact', head: true })
      .eq('active', true)

    const { count: unreadCount } = await admin
      .from('platform_message_inbox')
      .select('id', { count: 'exact', head: true })
      .is('read_at', null)
      .eq('direction', 'inbound')

    const sixMonthsAgo = daysAgoIso(180)
    const { data: messageRows } = await admin
      .from('platform_messages')
      .select('created_at, status')
      .gte('created_at', sixMonthsAgo)

    const assistantPeriod = new Date().toISOString().slice(0, 7)
    const { data: assistantRows } = await admin
      .from('assistant_usage')
      .select('used_count, ai_calls, input_tokens, output_tokens, estimated_cost_usd')
      .eq('period', assistantPeriod)

    const rows = shops ?? []
    const normalizedRows = rows.map((shop) => ({
      ...shop,
      billing_status: effectiveBillingStatus(shop.billing_status, shop.trial_ends_at),
    }))
    const now = Date.now()
    const last7 = daysAgoIso(7)
    const last30 = daysAgoIso(30)

    const byStatus = { trialing: 0, active: 0, past_due: 0, canceled: 0 } as Record<string, number>
    const byPlan = { solo: 0, starter: 0, pro: 0, premium: 0 } as Record<string, number>
    let trialExpiringSoon = 0
    let trialExpired = 0

    for (const shop of normalizedRows) {
      byStatus[shop.billing_status] = (byStatus[shop.billing_status] ?? 0) + 1
      byPlan[shop.plan] = (byPlan[shop.plan] ?? 0) + 1
      if (shop.billing_status === 'trialing' && shop.trial_ends_at) {
        const remaining = new Date(shop.trial_ends_at).getTime() - now
        if (remaining < 0) trialExpired += 1
        else if (remaining <= 7 * 24 * 60 * 60 * 1000) trialExpiringSoon += 1
      }
    }

    const revenue = calculateAdminBillingMetrics(normalizedRows.map((shop) => ({
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

    const messages = messageRows ?? []
    const charts = buildAdminCharts(normalizedRows, receivedThisMonth, new Date(), messages)
    const attention = buildAttentionItems(normalizedRows, unreadCount ?? 0)
    const newShopsComparison = computePeriodComparison(normalizedRows, periodDays)

    const nonTrialing = rows.length - byStatus.trialing
    const delinquencyRate = nonTrialing > 0 ? Number(((byStatus.past_due / nonTrialing) * 100).toFixed(1)) : 0
    const periodStart = daysAgoIso(periodDays)
    const sentStatuses = new Set(['sent', 'delivered', 'read', 'replied'])
    const messagesSent = messages.filter((m) => m.created_at >= periodStart && sentStatuses.has(m.status)).length
    const assistantUsage = (assistantRows ?? []).reduce(
      (totals, row) => ({
        questions: totals.questions + Number(row.used_count ?? 0),
        aiCalls: totals.aiCalls + Number(row.ai_calls ?? 0),
        inputTokens: totals.inputTokens + Number(row.input_tokens ?? 0),
        outputTokens: totals.outputTokens + Number(row.output_tokens ?? 0),
        estimatedCostUsd: totals.estimatedCostUsd + Number(row.estimated_cost_usd ?? 0),
      }),
      { questions: 0, aiCalls: 0, inputTokens: 0, outputTokens: 0, estimatedCostUsd: 0 },
    )

    return NextResponse.json({
      totals: {
        barbershops: rows.length,
        users: membersCount ?? 0,
        newLast7Days: rows.filter((shop) => shop.created_at >= last7).length,
        newLast30Days: rows.filter((shop) => shop.created_at >= last30).length,
        messagesSent,
      },
      billing: {
        trialing: byStatus.trialing,
        active: byStatus.active,
        pastDue: byStatus.past_due,
        canceled: byStatus.canceled,
        trialExpiringSoon,
        trialExpired,
      },
      revenue: { ...revenue, receivedThisMonth, asaasAvailable, delinquencyRate },
      plans: byPlan,
      assistant: {
        period: assistantPeriod,
        questions: assistantUsage.questions,
        aiCalls: assistantUsage.aiCalls,
        inputTokens: assistantUsage.inputTokens,
        outputTokens: assistantUsage.outputTokens,
        estimatedCostUsd: Number(assistantUsage.estimatedCostUsd.toFixed(6)),
      },
      charts,
      attention,
      comparisons: {
        newBarbershops: newShopsComparison,
        periodDays,
      },
      notifications: {
        unreadMessages: unreadCount ?? 0,
      },
    })
  } catch (error) {
    const { message, status } = platformErrorResponse(error)
    return NextResponse.json({ error: message }, { status })
  }
}
