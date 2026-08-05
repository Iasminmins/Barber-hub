import { getSaasPlan, type SaasPlanId } from './saas-plans'
import { effectiveBillingStatus } from './billing-status'

export type MessageChannel = 'whatsapp' | 'email' | 'sms' | 'in_app'
export type MessageStatus = 'draft' | 'scheduled' | 'queued' | 'sent' | 'delivered' | 'read' | 'replied' | 'failed' | 'cancelled'

export type MessageTemplate = {
  id: string
  slug: string
  name: string
  channel: MessageChannel
  subject: string | null
  body: string
  variables: string[]
}

export type RecipientContext = {
  nome_responsavel: string
  nome_barbearia: string
  plano: string
  dias_restantes: string
  data_vencimento: string
  link_pagamento: string
}

export type RecipientFilter = {
  search?: string
  status?: string
  plan?: string
  billing?: string
  city?: string
  barbershopIds?: string[]
  trialExpiring?: boolean
  pastDue?: boolean
  inactive?: boolean
}

export const MESSAGE_VARIABLES = [
  'nome_responsavel',
  'nome_barbearia',
  'plano',
  'dias_restantes',
  'data_vencimento',
  'link_pagamento',
] as const

export function personalizeMessage(template: string, context: Partial<RecipientContext>) {
  return template.replace(/\{\{(\w+)\}\}/g, (_, key: string) => context[key as keyof RecipientContext] ?? `{{${key}}}`)
}

export function buildRecipientContext(shop: {
  name: string
  plan: string
  trial_ends_at: string | null
  next_billing_date: string | null
  slug: string
}, owner: { name: string; email: string } | null): RecipientContext {
  const trialDaysLeft = shop.trial_ends_at
    ? Math.ceil((new Date(shop.trial_ends_at).getTime() - Date.now()) / 86400000)
    : null

  return {
    nome_responsavel: owner?.name ?? 'Responsável',
    nome_barbearia: shop.name,
    plano: shop.plan.charAt(0).toUpperCase() + shop.plan.slice(1),
    dias_restantes: trialDaysLeft !== null ? String(Math.max(0, trialDaysLeft)) : '—',
    data_vencimento: shop.next_billing_date?.slice(0, 10) ?? shop.trial_ends_at?.slice(0, 10) ?? '—',
    link_pagamento: `${process.env.NEXT_PUBLIC_APP_URL ?? ''}/dashboard`,
  }
}

/** Estimativa de custo por canal (placeholder até integração real) */
export function estimateChannelCost(channel: MessageChannel, count: number): number | null {
  const rates: Partial<Record<MessageChannel, number>> = {
    sms: 0.12,
    whatsapp: 0.08,
  }
  const rate = rates[channel]
  return rate !== undefined ? Number((rate * count).toFixed(2)) : null
}

export interface MessageProvider {
  channel: MessageChannel
  send(payload: {
    to: string
    subject?: string
    body: string
    recipientId: string
  }): Promise<{ success: boolean; providerRef?: string; error?: string }>
}

/** Provedores stub — não simulam envio real */
export class StubMessageProvider implements MessageProvider {
  constructor(public channel: MessageChannel) {}

  async send() {
    return {
      success: false,
      error: `Canal ${this.channel} ainda não configurado. Configure o provedor em Configurações.`,
    }
  }
}

export function getMessageProvider(channel: MessageChannel): MessageProvider {
  return new StubMessageProvider(channel)
}

export type ShopRow = {
  id: string
  name: string
  slug: string
  city: string | null
  plan: SaasPlanId
  billing_status: string
  trial_ends_at: string | null
  next_billing_date: string | null
  last_payment_at: string | null
  created_at: string
  updated_at: string
  asaas_subscription_id: string | null
  complimentary_until: string | null
}

export function matchesRecipientFilter(
  shop: ShopRow,
  owner: { name: string; email: string } | null,
  filter: RecipientFilter,
) {
  const billingStatus = effectiveBillingStatus(shop.billing_status, shop.trial_ends_at)
  const today = new Date().toISOString().slice(0, 10)

  if (filter.barbershopIds?.length && !filter.barbershopIds.includes(shop.id)) return false
  if (filter.status && billingStatus !== filter.status) return false
  if (filter.plan && shop.plan !== filter.plan) return false
  if (filter.city && !(shop.city ?? '').toLowerCase().includes(filter.city.toLowerCase())) return false

  if (filter.search) {
    const q = filter.search.toLowerCase()
    const haystack = [shop.name, shop.slug, shop.city ?? '', owner?.name ?? '', owner?.email ?? ''].join(' ').toLowerCase()
    if (!haystack.includes(q)) return false
  }

  if (filter.billing === 'complimentary' && !(shop.complimentary_until && shop.complimentary_until >= today)) return false
  if (filter.billing === 'due7') {
    if (!shop.next_billing_date) return false
    const end = new Date()
    end.setDate(end.getDate() + 7)
    if (shop.next_billing_date < today || shop.next_billing_date > end.toISOString().slice(0, 10)) return false
  }

  if (filter.trialExpiring) {
    if (billingStatus !== 'trialing' || !shop.trial_ends_at) return false
    const remaining = new Date(shop.trial_ends_at).getTime() - Date.now()
    if (remaining < 0 || remaining > 7 * 86400000) return false
  }

  if (filter.pastDue && billingStatus !== 'past_due') return false

  if (filter.inactive) {
    const ref = shop.last_payment_at ?? shop.updated_at
    const daysSince = (Date.now() - new Date(ref).getTime()) / 86400000
    if (daysSince < 30) return false
  }

  return true
}

export function computeMrrForShops(shops: ShopRow[]) {
  return shops
    .filter((s) => s.asaas_subscription_id && effectiveBillingStatus(s.billing_status, s.trial_ends_at) !== 'trialing' && s.billing_status !== 'canceled')
    .reduce((sum, s) => sum + getSaasPlan(s.plan).monthlyPrice, 0)
}
