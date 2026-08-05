export type BillingStatus = 'trialing' | 'active' | 'past_due' | 'canceled'

const BILLING_STATUSES = new Set<BillingStatus>(['trialing', 'active', 'past_due', 'canceled'])

export function effectiveBillingStatus(status: string, trialEndsAt?: string | null, now = new Date()): BillingStatus {
  if (!BILLING_STATUSES.has(status as BillingStatus)) {
    throw new Error(`Status de cobrança inválido: ${status}`)
  }

  const billingStatus = status as BillingStatus
  if (billingStatus !== 'past_due' || !trialEndsAt) return billingStatus
  const trialEnd = new Date(trialEndsAt)
  if (Number.isNaN(trialEnd.getTime())) return billingStatus
  trialEnd.setHours(0, 0, 0, 0)
  const today = new Date(now)
  today.setHours(0, 0, 0, 0)
  return trialEnd >= today ? 'trialing' : billingStatus
}
