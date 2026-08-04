export type TenantRow = {
  id: string
  name: string
  slug: string
  city: string | null
  plan: 'starter' | 'pro' | 'premium'
  billing_status: 'trialing' | 'active' | 'past_due' | 'canceled'
  trial_ends_at: string | null
  next_billing_date: string | null
  last_payment_at: string | null
  complimentary_until: string | null
  complimentary_reason: string | null
  complimentary_value: number
  created_at: string
  hasSubscription: boolean
  usersCount: number
  owner: { name: string; email: string } | null
  trialDaysLeft: number | null
}

export type Overview = {
  totals: { barbershops: number; users: number; newLast7Days: number; newLast30Days: number }
  billing: {
    trialing: number
    active: number
    pastDue: number
    canceled: number
    trialExpiringSoon: number
    trialExpired: number
  }
  plans: Record<string, number>
  revenue: {
    mrr: number
    forecast30Days: number
    averageTicket: number
    complimentaryCount: number
    complimentaryValue: number
    conversionRate: number
    contractedCompanies: number
    newThisMonth: number
    receivedThisMonth: number
    asaasAvailable: boolean
  }
}
