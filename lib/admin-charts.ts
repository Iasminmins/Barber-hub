import { getSaasPlan, type SaasPlanId } from './saas-plans'
import { effectiveBillingStatus } from './billing-status'

type ShopRow = {
  plan: SaasPlanId
  billing_status: string
  trial_ends_at: string | null
  created_at: string
  asaas_subscription_id: string | null
}

function monthKey(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
}

function monthLabel(key: string) {
  const [year, month] = key.split('-')
  const date = new Date(Number(year), Number(month) - 1, 1)
  return date.toLocaleDateString('pt-BR', { month: 'short', year: '2-digit' })
}

function lastMonths(count: number, now = new Date()) {
  const keys: string[] = []
  for (let i = count - 1; i >= 0; i -= 1) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
    keys.push(monthKey(d))
  }
  return keys
}

type MessageRow = { created_at: string; status: string }

const SENT_MESSAGE_STATUSES = new Set(['sent', 'delivered', 'read', 'replied'])

export function buildAdminCharts(shops: ShopRow[], receivedThisMonth: number, now = new Date(), messages: MessageRow[] = []) {
  const months = lastMonths(6, now)

  const newBarbershops = months.map((key) => ({
    label: monthLabel(key),
    total: shops.filter((s) => s.created_at.startsWith(key)).length,
  }))

  const messagesSent = months.map((key) => ({
    label: monthLabel(key),
    total: messages.filter((m) => m.created_at.startsWith(key) && SENT_MESSAGE_STATUSES.has(m.status)).length,
  }))

  const mrrEvolution = months.map((key) => {
    const mrr = shops
      .filter((s) => {
        if (!s.asaas_subscription_id) return false
        const status = effectiveBillingStatus(s.billing_status, s.trial_ends_at)
        if (status === 'trialing' || status === 'canceled') return false
        return s.created_at.slice(0, 7) <= key
      })
      .reduce((sum, s) => sum + getSaasPlan(s.plan).monthlyPrice, 0)
    return { label: monthLabel(key), mrr }
  })

  const monthlyRevenue = months.map((key, index) => ({
    label: monthLabel(key),
    receita: index === months.length - 1 ? receivedThisMonth : mrrEvolution[index]?.mrr ?? 0,
  }))

  const byPlan = { starter: 0, pro: 0, premium: 0 } as Record<string, number>
  const byStatus = { trialing: 0, active: 0, past_due: 0, canceled: 0 } as Record<string, number>

  for (const shop of shops) {
    byPlan[shop.plan] = (byPlan[shop.plan] ?? 0) + 1
    const status = effectiveBillingStatus(shop.billing_status, shop.trial_ends_at)
    byStatus[status] = (byStatus[status] ?? 0) + 1
  }

  const planDistribution = Object.entries(byPlan).map(([plan, total]) => ({
    name: plan.charAt(0).toUpperCase() + plan.slice(1),
    value: total,
  }))

  const statusDistribution = [
    { name: 'Em teste', value: byStatus.trialing, key: 'trialing' },
    { name: 'Ativa', value: byStatus.active, key: 'active' },
    { name: 'Em atraso', value: byStatus.past_due, key: 'past_due' },
    { name: 'Cancelada', value: byStatus.canceled, key: 'canceled' },
  ]

  const eligible = shops.filter((s) => effectiveBillingStatus(s.billing_status, s.trial_ends_at) !== 'canceled')
  const converted = eligible.filter((s) => Boolean(s.asaas_subscription_id)).length
  const conversion = {
    trialing: byStatus.trialing,
    converted,
    rate: eligible.length ? Number(((converted / eligible.length) * 100).toFixed(1)) : 0,
  }

  return {
    monthlyRevenue,
    mrrEvolution,
    newBarbershops,
    messagesSent,
    conversion,
    planDistribution,
    statusDistribution,
  }
}

export type AttentionItem = {
  id: string
  type: 'trial_expiring' | 'past_due' | 'inactive' | 'payment_due' | 'subscription_expiring' | 'unread_message'
  title: string
  description: string
  barbershopId: string
  barbershopName: string
  action: { label: string; href: string }
  severity: 'high' | 'medium' | 'low'
}

type AttentionShop = {
  id: string
  name: string
  slug: string
  billing_status: string
  trial_ends_at: string | null
  next_billing_date: string | null
  last_payment_at: string | null
  updated_at: string
}

export function buildAttentionItems(shops: AttentionShop[], unreadCount = 0): AttentionItem[] {
  const items: AttentionItem[] = []
  const today = new Date().toISOString().slice(0, 10)
  const now = Date.now()

  for (const shop of shops) {
    const status = effectiveBillingStatus(shop.billing_status, shop.trial_ends_at)
    const href = `/plataforma/contas/${shop.id}`

    if (status === 'trialing' && shop.trial_ends_at) {
      const remaining = new Date(shop.trial_ends_at).getTime() - now
      if (remaining >= 0 && remaining <= 7 * 86400000) {
        const days = Math.ceil(remaining / 86400000)
        items.push({
          id: `trial-${shop.id}`,
          type: 'trial_expiring',
          title: shop.name,
          description: `Teste gratuito vence em ${days} dia(s)`,
          barbershopId: shop.id,
          barbershopName: shop.name,
          action: { label: 'Estender teste', href },
          severity: days <= 2 ? 'high' : 'medium',
        })
      }
    }

    if (status === 'past_due') {
      items.push({
        id: `past-due-${shop.id}`,
        type: 'past_due',
        title: shop.name,
        description: 'Cobrança em atraso',
        barbershopId: shop.id,
        barbershopName: shop.name,
        action: { label: 'Ver cobrança', href },
        severity: 'high',
      })
    }

    if (shop.next_billing_date && shop.next_billing_date >= today) {
      const end = new Date()
      end.setDate(end.getDate() + 7)
      if (shop.next_billing_date <= end.toISOString().slice(0, 10) && status === 'active') {
        items.push({
          id: `due-${shop.id}`,
          type: 'payment_due',
          title: shop.name,
          description: `Cobrança prevista para ${shop.next_billing_date.slice(0, 10).split('-').reverse().join('/')}`,
          barbershopId: shop.id,
          barbershopName: shop.name,
          action: { label: 'Enviar lembrete', href: `/plataforma/mensagens?barbershop=${shop.id}` },
          severity: 'medium',
        })
      }
    }

    const ref = shop.last_payment_at ?? shop.updated_at
    const daysSince = (now - new Date(ref).getTime()) / 86400000
    if (daysSince >= 30 && status !== 'canceled') {
      items.push({
        id: `inactive-${shop.id}`,
        type: 'inactive',
        title: shop.name,
        description: `Sem atividade recente (${Math.floor(daysSince)} dias)`,
        barbershopId: shop.id,
        barbershopName: shop.name,
        action: { label: 'Enviar mensagem', href: `/plataforma/mensagens?barbershop=${shop.id}` },
        severity: 'low',
      })
    }
  }

  if (unreadCount > 0) {
    items.push({
      id: 'unread-messages',
      type: 'unread_message',
      title: 'Mensagens',
      description: `${unreadCount} conversa(s) aguardando resposta`,
      barbershopId: '',
      barbershopName: '',
      action: { label: 'Abrir caixa de entrada', href: '/plataforma/mensagens?tab=inbox' },
      severity: 'medium',
    })
  }

  const severityOrder = { high: 0, medium: 1, low: 2 }
  return items.sort((a, b) => severityOrder[a.severity] - severityOrder[b.severity]).slice(0, 12)
}

export function computePeriodComparison(
  shops: { created_at: string; asaas_subscription_id: string | null; billing_status: string; trial_ends_at: string | null; plan: SaasPlanId }[],
  periodDays: number,
  now = new Date(),
) {
  const end = now.getTime()
  const start = end - periodDays * 86400000
  const prevStart = start - periodDays * 86400000

  const inRange = (createdAt: string, from: number, to: number) => {
    const t = new Date(createdAt).getTime()
    return t >= from && t < to
  }

  const current = shops.filter((s) => inRange(s.created_at, start, end)).length
  const previous = shops.filter((s) => inRange(s.created_at, prevStart, start)).length
  const delta = previous ? Number((((current - previous) / previous) * 100).toFixed(1)) : current ? 100 : 0

  return { current, previous, delta }
}
