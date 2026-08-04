import { getSaasPlan, type SaasPlanId } from './saas-plans'

export type BillingStatus = 'trialing' | 'active' | 'past_due' | 'canceled'

export type AdminBillingRow = {
  plan: SaasPlanId
  billingStatus: BillingStatus
  nextBillingDate: string | null
  complimentaryUntil: string | null
  complimentaryValue: number
  hasSubscription: boolean
  createdAt: string
}

function dateKey(date: Date) {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

function localDate(value: string) {
  return new Date(`${value.slice(0, 10)}T12:00:00`)
}

export function addComplimentaryPeriod(
  currentDate: string | null,
  period: { days?: number; months?: number },
  now = new Date(),
) {
  const today = new Date(now)
  today.setHours(12, 0, 0, 0)
  const current = currentDate ? localDate(currentDate) : today
  const base = Number.isNaN(current.getTime()) || current < today ? today : current
  const result = new Date(base)

  if (period.months) {
    const originalDay = result.getDate()
    result.setDate(1)
    result.setMonth(result.getMonth() + period.months)
    const lastDay = new Date(result.getFullYear(), result.getMonth() + 1, 0, 12).getDate()
    result.setDate(Math.min(originalDay, lastDay))
  } else {
    result.setDate(result.getDate() + (period.days ?? 0))
  }

  return dateKey(result)
}

export function calculateAdminBillingMetrics(rows: AdminBillingRow[], now = new Date()) {
  const today = dateKey(now)
  const forecastEndDate = new Date(now)
  forecastEndDate.setDate(forecastEndDate.getDate() + 30)
  const forecastEnd = dateKey(forecastEndDate)
  const monthPrefix = today.slice(0, 7)
  const contracted = rows.filter((row) => row.hasSubscription && row.billingStatus !== 'trialing' && row.billingStatus !== 'canceled')
  const mrr = contracted.reduce((sum, row) => sum + getSaasPlan(row.plan).monthlyPrice, 0)
  const forecast30Days = contracted.reduce((sum, row) => {
    if (!row.nextBillingDate || row.nextBillingDate < today || row.nextBillingDate > forecastEnd) return sum
    return sum + getSaasPlan(row.plan).monthlyPrice
  }, 0)
  const complimentary = rows.filter((row) => Boolean(row.complimentaryUntil && row.complimentaryUntil >= today))
  const eligibleForConversion = rows.filter((row) => row.billingStatus !== 'canceled')
  const converted = eligibleForConversion.filter((row) => row.hasSubscription).length

  return {
    mrr,
    forecast30Days,
    averageTicket: contracted.length ? Number((mrr / contracted.length).toFixed(2)) : 0,
    complimentaryCount: complimentary.length,
    complimentaryValue: complimentary.reduce((sum, row) => sum + row.complimentaryValue, 0),
    conversionRate: eligibleForConversion.length ? Number(((converted / eligibleForConversion.length) * 100).toFixed(1)) : 0,
    contractedCompanies: contracted.length,
    newThisMonth: rows.filter((row) => row.createdAt.startsWith(monthPrefix)).length,
  }
}
