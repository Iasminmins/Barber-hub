export type PaymentMethodConfig = {
  id: string
  name: string
  slug: string
  active: boolean
}

export type BusinessDayKey = 'domingo' | 'segunda' | 'terca' | 'quarta' | 'quinta' | 'sexta' | 'sabado'

export type BusinessDayConfig = {
  closed: boolean
  start: string
  end: string
}

export type AgendaSettings = {
  lowStockAlert: number
  planCommissionMode: 'receita' | 'servico'
  businessHours: Record<BusinessDayKey, BusinessDayConfig>
}

export const businessDays: Array<{ key: BusinessDayKey; label: string }> = [
  { key: 'domingo', label: 'Domingo' },
  { key: 'segunda', label: 'Segunda' },
  { key: 'terca', label: 'Terça' },
  { key: 'quarta', label: 'Quarta' },
  { key: 'quinta', label: 'Quinta' },
  { key: 'sexta', label: 'Sexta' },
  { key: 'sabado', label: 'Sábado' },
]

export const defaultPaymentMethods: PaymentMethodConfig[] = [
  { id: 'pix', name: 'PIX', slug: 'PIX', active: true },
  { id: 'credito', name: 'Cartão de Crédito', slug: 'CARTAO_CREDITO', active: true },
  { id: 'debito', name: 'Cartão de Débito', slug: 'CARTAO_DEBITO', active: true },
  { id: 'dinheiro', name: 'Dinheiro', slug: 'DINHEIRO', active: true },
]

export const defaultAgendaSettings: AgendaSettings = {
  lowStockAlert: 5,
  planCommissionMode: 'receita',
  businessHours: {
    domingo: { closed: true, start: '09:00', end: '19:30' },
    segunda: { closed: false, start: '09:00', end: '19:30' },
    terca: { closed: false, start: '09:00', end: '19:30' },
    quarta: { closed: false, start: '09:00', end: '19:30' },
    quinta: { closed: false, start: '09:00', end: '19:30' },
    sexta: { closed: false, start: '09:00', end: '19:30' },
    sabado: { closed: false, start: '09:00', end: '18:00' },
  },
}

export function normalizePaymentMethods(value: unknown): PaymentMethodConfig[] {
  if (!Array.isArray(value)) return defaultPaymentMethods

  const methods = value
    .map((method) => {
      if (!method || typeof method !== 'object') return null
      const record = method as Record<string, unknown>
      const name = String(record.name ?? '').trim()
      const slug = String(record.slug ?? '').trim()
      if (!name || !slug) return null
      return {
        id: String(record.id ?? slug.toLowerCase()),
        name,
        slug,
        active: record.active !== false,
      }
    })
    .filter((method): method is PaymentMethodConfig => Boolean(method))

  return methods.length ? methods.slice(0, 8) : defaultPaymentMethods
}

function normalizeBusinessHour(value: unknown, fallback: BusinessDayConfig): BusinessDayConfig {
  if (!value || typeof value !== 'object') return fallback
  const record = value as Record<string, unknown>
  return {
    closed: Boolean(record.closed),
    start: typeof record.start === 'string' && record.start ? record.start.slice(0, 5) : fallback.start,
    end: typeof record.end === 'string' && record.end ? record.end.slice(0, 5) : fallback.end,
  }
}

export function normalizeAgendaSettings(value: unknown): AgendaSettings {
  if (!value || typeof value !== 'object') return defaultAgendaSettings
  const record = value as Record<string, unknown>
  const hours = record.businessHours && typeof record.businessHours === 'object'
    ? record.businessHours as Record<string, unknown>
    : {}

  return {
    lowStockAlert: Number.isFinite(Number(record.lowStockAlert)) ? Number(record.lowStockAlert) : defaultAgendaSettings.lowStockAlert,
    planCommissionMode: record.planCommissionMode === 'servico' ? 'servico' : 'receita',
    businessHours: Object.fromEntries(
      businessDays.map(({ key }) => [
        key,
        normalizeBusinessHour(hours[key], defaultAgendaSettings.businessHours[key]),
      ]),
    ) as AgendaSettings['businessHours'],
  }
}

export function makePaymentSlug(name: string) {
  return name
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-zA-Z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '')
    .toUpperCase()
}
