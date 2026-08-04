export type BillingStatus = 'trialing' | 'active' | 'past_due' | 'canceled'

export function effectiveBillingStatus(status: BillingStatus, trialEndsAt?: string | null, now = new Date()): BillingStatus {
  if (status !== 'past_due' || !trialEndsAt) return status
  const trialEnd = new Date(trialEndsAt)
  if (Number.isNaN(trialEnd.getTime())) return status
  trialEnd.setHours(0, 0, 0, 0)
  const today = new Date(now)
  today.setHours(0, 0, 0, 0)
  return trialEnd >= today ? 'trialing' : status
}
