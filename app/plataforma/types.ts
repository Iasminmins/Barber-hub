export type TenantRow = {
  id: string
  name: string
  slug: string
  city: string | null
  color?: string
  plan: 'starter' | 'pro' | 'premium'
  billing_status: 'trialing' | 'active' | 'past_due' | 'canceled'
  trial_ends_at: string | null
  next_billing_date: string | null
  last_payment_at: string | null
  complimentary_until: string | null
  complimentary_reason: string | null
  complimentary_value: number
  created_at: string
  updated_at?: string
  hasSubscription: boolean
  usersCount: number
  owner: { name: string; email: string } | null
  ownerPhone?: string | null
  trialDaysLeft: number | null
  lastAccessAt?: string | null
  financialStatus?: string
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
  charts?: {
    monthlyRevenue: { label: string; receita: number }[]
    mrrEvolution: { label: string; mrr: number }[]
    newBarbershops: { label: string; total: number }[]
    conversion: { trialing: number; converted: number; rate: number }
    planDistribution: { name: string; value: number }[]
    statusDistribution: { name: string; value: number; key: string }[]
  }
  attention?: AttentionItem[]
  comparisons?: {
    newBarbershops: { current: number; previous: number; delta: number }
    periodDays: number
  }
  notifications?: { unreadMessages: number }
}

export type AttentionItem = {
  id: string
  type: string
  title: string
  description: string
  barbershopId: string
  barbershopName: string
  action: { label: string; href: string }
  severity: 'high' | 'medium' | 'low'
}

export type MessageTemplate = {
  id: string
  slug: string
  name: string
  channel: 'whatsapp' | 'email' | 'sms' | 'in_app'
  subject: string | null
  body: string
  variables: string[]
}

export type PlatformMessage = {
  id: string
  channel: string
  subject: string | null
  body: string
  status: string
  scheduled_at: string | null
  sent_at: string | null
  recipient_count: number
  admin_email: string
  estimated_cost: number | null
  created_at: string
}

export type PlatformNavItem = {
  href: string
  label: string
  icon: string
  badge?: number
}
