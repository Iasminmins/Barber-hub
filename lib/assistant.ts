import type { Appointment, CatalogItem, Client, FinancialEntry, Order, Role } from './types'
import { formatCurrency, formatDateShort } from './format'

export type AssistantPlan = 'starter' | 'pro' | 'premium'

export const ASSISTANT_MONTHLY_LIMIT_BY_PLAN: Record<AssistantPlan, number> = {
  starter: 20,
  pro: 50,
  premium: 150,
}

export const ASSISTANT_MONTHLY_BUDGET_USD_BY_PLAN: Record<AssistantPlan, number> = {
  starter: 0.05,
  pro: 0.1,
  premium: 0.3,
}

const assistantInputUsdPerMillion = 0.1
const assistantOutputUsdPerMillion = 0.6

export type AssistantIntent =
  | 'revenue_today'
  | 'revenue_week'
  | 'revenue_month'
  | 'revenue_year'
  | 'orders_today'
  | 'payment_methods_today'
  | 'appointments_today'
  | 'appointments_tomorrow'
  | 'appointments_week'
  | 'appointments_month'
  | 'appointments_year'
  | 'clients_month'
  | 'clients_year'
  | 'new_clients_month'
  | 'top_service_month'
  | 'top_employee_month'
  | 'help_create_order'
  | 'help_create_client'
  | 'help_reports'
  | 'help_public_booking_link'
  | 'help_employee_photo'
  | 'help_schedule_hours'
  | 'platform_help'
  | 'out_of_scope'

export const ASSISTANT_INTENTS: AssistantIntent[] = [
  'revenue_today',
  'revenue_week',
  'revenue_month',
  'revenue_year',
  'orders_today',
  'payment_methods_today',
  'appointments_today',
  'appointments_tomorrow',
  'appointments_week',
  'appointments_month',
  'appointments_year',
  'clients_month',
  'clients_year',
  'new_clients_month',
  'top_service_month',
  'top_employee_month',
  'help_create_order',
  'help_create_client',
  'help_reports',
  'help_public_booking_link',
  'help_employee_photo',
  'help_schedule_hours',
  'platform_help',
  'out_of_scope',
]

export type AssistantData =
  | { kind: 'money'; total: number; orders?: number }
  | { kind: 'count'; count: number }
  | { kind: 'payment_methods'; methods: Array<{ method: string; total: number }> }
  | { kind: 'appointments'; period: string; appointments: Array<{ date: string; start: string; clientName: string; serviceName: string; employeeName: string; status: string }> }
  | { kind: 'top_item'; name: string; total: number; quantity?: number }
  | { kind: 'empty' }

export type AssistantAnswerInput = {
  intent: AssistantIntent
  data?: AssistantData
  denied?: boolean
  remaining?: number
}

const financialIntents = new Set<AssistantIntent>([
  'revenue_today',
  'revenue_week',
  'revenue_month',
  'revenue_year',
  'orders_today',
  'payment_methods_today',
  'clients_month',
  'clients_year',
  'new_clients_month',
  'top_service_month',
  'top_employee_month',
])

const assistantIntentSet = new Set<AssistantIntent>(ASSISTANT_INTENTS)

const methodLabels: Record<string, string> = {
  dinheiro: 'Dinheiro',
  pix: 'Pix',
  credito: 'Credito',
  debito: 'Debito',
  outro: 'Outro',
}

const platformModuleWords = [
  'agenda',
  'agendamento',
  'horario',
  'comanda',
  'pdv',
  'cliente',
  'produto',
  'servico',
  'assinatura',
  'funcionario',
  'barbeiro',
  'profissional',
  'financeiro',
  'relatorio',
  'importacao',
  'exportacao',
  'comissao',
  'estoque',
  'pagamento',
  'plano',
  'link publico',
  'barber hub',
  'barberhub',
]

export function normalizeAssistantText(value: string) {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/essa[mn]?semana/g, 'essa semana')
    .trim()
    .toLowerCase()
}

function hasAny(text: string, words: string[]) {
  return words.some((word) => text.includes(word))
}

function hasAllGroups(text: string, groups: string[][]) {
  return groups.every((group) => hasAny(text, group))
}

export function classifyAssistantIntent(question: string): AssistantIntent {
  const text = normalizeAssistantText(question)
  if (!text) return 'out_of_scope'

  if (hasAny(text, ['criar comanda', 'abrir comanda', 'nova comanda', 'fazer comanda'])) return 'help_create_order'
  if (hasAny(text, ['cadastrar cliente', 'novo cliente', 'criar cliente', 'adicionar cliente'])) return 'help_create_client'
  if (hasAny(text, ['gerar relatorio', 'relatorio', 'exportar pdf', 'pdf mensal'])) return 'help_reports'
  if (hasAllGroups(text, [
    ['link', 'url', 'endereco'],
    ['agenda', 'agendamento', 'marcacao', 'horario'],
  ]) || hasAny(text, ['agendamento online', 'agenda online', 'link publico'])) return 'help_public_booking_link'
  if (hasAllGroups(text, [
    ['foto', 'imagem', 'avatar'],
    ['funcionario', 'funcionarios', 'barbeiro', 'profissional'],
  ])) return 'help_employee_photo'
  if (hasAllGroups(text, [
    ['horario', 'horarios', 'funcionamento', 'disponibilidade'],
    ['agenda', 'agendamento', 'atendimento'],
  ])) return 'help_schedule_hours'

  if (hasAllGroups(text, [['agenda', 'agendas', 'agendamento', 'agendamentos', 'horario', 'horarios'], ['semana', 'semanal']])) return 'appointments_week'
  if (hasAllGroups(text, [['agenda', 'agendas', 'agendamento', 'agendamentos', 'horario', 'horarios'], ['mes', 'mensal']])) return 'appointments_month'
  if (hasAllGroups(text, [['agenda', 'agendas', 'agendamento', 'agendamentos', 'horario', 'horarios'], ['ano', 'anual']])) return 'appointments_year'
  if (hasAny(text, ['agenda amanha', 'agendamentos amanha', 'amanha na agenda'])) return 'appointments_tomorrow'
  if (hasAny(text, ['agenda hoje', 'agendamentos hoje', 'horarios hoje', 'tenho hoje'])) return 'appointments_today'

  if (hasAny(text, ['forma de pagamento', 'formas de pagamento', 'pagamento mais usado', 'pix', 'cartao', 'dinheiro'])) {
    return 'payment_methods_today'
  }
  if (hasAny(text, ['comandas hoje', 'quantas comandas', 'comanda hoje'])) return 'orders_today'
  if (hasAny(text, ['faturou hoje', 'faturamento hoje', 'receita hoje', 'vendeu hoje', 'quanto deu hoje'])) return 'revenue_today'
  if (hasAllGroups(text, [['faturou', 'faturamos', 'faturamento', 'receita', 'vendeu', 'vendas', 'quanto deu'], ['semana']])) return 'revenue_week'
  if (hasAllGroups(text, [['faturou', 'faturamos', 'faturamento', 'receita', 'vendeu', 'vendas', 'quanto deu'], ['mes', 'mensal']])) return 'revenue_month'
  if (hasAllGroups(text, [['faturou', 'faturamos', 'faturamento', 'receita', 'vendeu', 'vendas', 'quanto deu'], ['ano', 'anual']])) return 'revenue_year'
  if (hasAllGroups(text, [['cliente', 'clientes'], ['mes', 'mensal']])) return 'clients_month'
  if (hasAllGroups(text, [['cliente', 'clientes'], ['ano', 'anual']])) return 'clients_year'
  if (hasAny(text, ['clientes novos', 'cliente novo'])) return 'new_clients_month'
  if (hasAny(text, ['servico mais vendido', 'servico mais saiu', 'servico campeao'])) return 'top_service_month'
  if (hasAny(text, ['funcionario que mais vendeu', 'barbeiro que mais vendeu', 'quem mais vendeu', 'ranking'])) return 'top_employee_month'
  if (hasAny(text, platformModuleWords)) return 'platform_help'

  return 'out_of_scope'
}

export function shouldUseAssistantAiFallback(intent: AssistantIntent, canSpendAi: boolean) {
  return canSpendAi && (intent === 'out_of_scope' || intent === 'platform_help')
}

export function parseAiAssistantIntent(raw: string): AssistantIntent {
  try {
    const cleaned = raw.trim().replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '')
    const jsonStart = cleaned.indexOf('{')
    const jsonEnd = cleaned.lastIndexOf('}')
    const parsed = JSON.parse(jsonStart >= 0 && jsonEnd > jsonStart ? cleaned.slice(jsonStart, jsonEnd + 1) : cleaned) as { intent?: unknown }
    const intent = typeof parsed.intent === 'string' ? parsed.intent : ''
    return assistantIntentSet.has(intent as AssistantIntent) ? intent as AssistantIntent : 'out_of_scope'
  } catch {
    return 'out_of_scope'
  }
}

export function canUseAssistantIntent(intent: AssistantIntent, role: Role) {
  if (!financialIntents.has(intent)) return true
  return role === 'owner' || role === 'manager'
}

export function getAssistantPeriod(now: Date) {
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
}

export function getAssistantMonthlyLimit(plan: string | null | undefined) {
  return ASSISTANT_MONTHLY_LIMIT_BY_PLAN[plan as AssistantPlan] ?? ASSISTANT_MONTHLY_LIMIT_BY_PLAN.starter
}

export function getAssistantMonthlyBudgetUsd(plan: string | null | undefined) {
  return ASSISTANT_MONTHLY_BUDGET_USD_BY_PLAN[plan as AssistantPlan] ?? ASSISTANT_MONTHLY_BUDGET_USD_BY_PLAN.starter
}

export function estimateAssistantAiCostUsd(input: { inputTokens: number; outputTokens: number }) {
  return (input.inputTokens / 1_000_000) * assistantInputUsdPerMillion
    + (input.outputTokens / 1_000_000) * assistantOutputUsdPerMillion
}

export function getNextAssistantResetDate(now: Date) {
  const next = new Date(now.getFullYear(), now.getMonth() + 1, 1)
  return next.toISOString().slice(0, 10)
}

export function toDateKey(value: string | null | undefined) {
  if (!value) return ''
  const key = value.slice(0, 10)
  return /^\d{4}-\d{2}-\d{2}$/.test(key) ? key : ''
}

export function todayKey(now = new Date()) {
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`
}

export function monthKey(now = new Date()) {
  return todayKey(now).slice(0, 7)
}

export function tomorrowKey(now = new Date()) {
  const tomorrow = new Date(now)
  tomorrow.setDate(tomorrow.getDate() + 1)
  return todayKey(tomorrow)
}

export function isStandaloneRevenue(entry: Pick<FinancialEntry, 'type' | 'orderId' | 'category'>) {
  return entry.type === 'entrada' && !entry.orderId && normalizeAssistantText(entry.category) !== 'comandas'
}

export function buildAssistantMetricData(input: {
  intent: AssistantIntent
  now?: Date
  orders?: Order[]
  appointments?: Appointment[]
  clients?: Client[]
  catalog?: CatalogItem[]
  financialEntries?: FinancialEntry[]
}): AssistantData {
  const now = input.now ?? new Date()
  const today = todayKey(now)
  const month = monthKey(now)
  const orders = input.orders ?? []
  const financialEntries = input.financialEntries ?? []

  if (input.intent === 'revenue_today' || input.intent === 'revenue_week' || input.intent === 'revenue_month' || input.intent === 'revenue_year') {
    const key = input.intent === 'revenue_today' ? today : input.intent === 'revenue_month' ? month : input.intent === 'revenue_year' ? String(now.getFullYear()) : ''
    const weekStart = input.intent === 'revenue_week' ? startOfWeekKey(now) : ''
    const paidOrders = orders.filter((order) => {
      if (order.status !== 'paga') return false
      const date = toDateKey(order.createdAt)
      return input.intent === 'revenue_week' ? date >= weekStart && date <= today : date.startsWith(key)
    })
    const extraRevenue = financialEntries.filter((entry) => {
      if (!isStandaloneRevenue(entry)) return false
      const date = toDateKey(entry.date)
      return input.intent === 'revenue_week' ? date >= weekStart && date <= today : date.startsWith(key)
    })
    return {
      kind: 'money',
      total: paidOrders.reduce((sum, order) => sum + order.total, 0) + extraRevenue.reduce((sum, entry) => sum + entry.amount, 0),
      orders: paidOrders.length,
    }
  }

  if (input.intent === 'orders_today') {
    return { kind: 'count', count: orders.filter((order) => toDateKey(order.createdAt) === today).length }
  }

  if (input.intent === 'payment_methods_today') {
    const map = new Map<string, number>()
    for (const order of orders) {
      if (order.status !== 'paga' || !order.method || toDateKey(order.createdAt) !== today) continue
      map.set(order.method, (map.get(order.method) ?? 0) + order.total)
    }
    for (const entry of financialEntries) {
      if (!isStandaloneRevenue(entry) || !entry.method || toDateKey(entry.date) !== today) continue
      map.set(entry.method, (map.get(entry.method) ?? 0) + entry.amount)
    }
    return {
      kind: 'payment_methods',
      methods: Array.from(map.entries())
        .map(([method, total]) => ({ method: methodLabels[method] ?? method, total }))
        .sort((a, b) => b.total - a.total),
    }
  }

  if (
    input.intent === 'appointments_today'
    || input.intent === 'appointments_tomorrow'
    || input.intent === 'appointments_week'
    || input.intent === 'appointments_month'
    || input.intent === 'appointments_year'
  ) {
    const tomorrow = tomorrowKey(now)
    const weekStart = startOfWeekKey(now)
    const year = String(now.getFullYear())
    const periodLabel = input.intent === 'appointments_today'
      ? 'hoje'
      : input.intent === 'appointments_tomorrow'
        ? 'amanha'
        : input.intent === 'appointments_week'
          ? 'esta semana'
          : input.intent === 'appointments_month'
            ? 'este mes'
            : 'este ano'
    const appointments = (input.appointments ?? [])
      .filter((appointment) => {
        if (input.intent === 'appointments_today') return appointment.date === today
        if (input.intent === 'appointments_tomorrow') return appointment.date === tomorrow
        if (input.intent === 'appointments_week') return appointment.date >= weekStart && appointment.date <= today
        if (input.intent === 'appointments_month') return appointment.date.startsWith(month)
        return appointment.date.startsWith(year)
      })
      .sort((a, b) => `${a.date} ${a.start}`.localeCompare(`${b.date} ${b.start}`))
      .map((appointment) => ({
        date: appointment.date,
        start: appointment.start,
        clientName: appointment.clientName,
        serviceName: appointment.serviceName,
        employeeName: appointment.employeeName,
        status: appointment.status,
      }))
    return { kind: 'appointments', period: periodLabel, appointments }
  }

  if (input.intent === 'new_clients_month') {
    return { kind: 'count', count: (input.clients ?? []).filter((client) => toDateKey(client.createdAt).startsWith(month)).length }
  }

  if (input.intent === 'clients_month' || input.intent === 'clients_year') {
    const period = input.intent === 'clients_month' ? month : String(now.getFullYear())
    return { kind: 'count', count: (input.clients ?? []).filter((client) => toDateKey(client.createdAt).startsWith(period)).length }
  }

  if (input.intent === 'top_service_month') {
    const map = new Map<string, { name: string; total: number; quantity: number }>()
    for (const order of orders.filter((order) => order.status === 'paga' && toDateKey(order.createdAt).startsWith(month))) {
      for (const item of order.items.filter((item) => item.type === 'servico')) {
        const current = map.get(item.name) ?? { name: item.name, total: 0, quantity: 0 }
        current.quantity += item.quantity
        current.total += item.quantity * item.unitPrice
        map.set(item.name, current)
      }
    }
    const top = Array.from(map.values()).sort((a, b) => b.total - a.total)[0]
    return top ? { kind: 'top_item', ...top } : { kind: 'empty' }
  }

  if (input.intent === 'top_employee_month') {
    const map = new Map<string, { name: string; total: number }>()
    for (const order of orders.filter((order) => order.status === 'paga' && toDateKey(order.createdAt).startsWith(month))) {
      const current = map.get(order.employeeId) ?? { name: order.employeeName, total: 0 }
      current.total += order.total
      map.set(order.employeeId, current)
    }
    const top = Array.from(map.values()).sort((a, b) => b.total - a.total)[0]
    return top ? { kind: 'top_item', ...top } : { kind: 'empty' }
  }

  return { kind: 'empty' }
}

function startOfWeekKey(now: Date) {
  const date = new Date(now)
  const day = date.getDay()
  const diff = day === 0 ? 6 : day - 1
  date.setDate(date.getDate() - diff)
  return todayKey(date)
}

export function buildAssistantAnswer(input: AssistantAnswerInput) {
  if (input.intent === 'out_of_scope') {
    return 'Posso ajudar apenas com a Barber Hub e os dados da sua barbearia.'
  }
  if (input.denied) {
    return 'Esse tipo de dado esta disponivel apenas para dono ou gerente da barbearia.'
  }

  if (input.intent === 'help_create_order') {
    return 'Para criar uma comanda, abra Comandas, clique em Nova comanda, selecione cliente, responsavel e itens, depois salve o pagamento quando finalizar.'
  }
  if (input.intent === 'help_create_client') {
    return 'Para cadastrar cliente, abra Clientes, clique em Novo cliente, preencha os dados principais e salve.'
  }
  if (input.intent === 'help_reports') {
    return 'Para gerar relatorios, abra Relatorios, escolha o periodo e use as opcoes de exportacao disponiveis na tela.'
  }
  if (input.intent === 'help_public_booking_link') {
    return 'Para ajustar o link publico da agenda, abra Configuracoes, revise o link/slug publico da barbearia e salve. Depois use a pagina Agendar para conferir como o cliente vai ver.'
  }
  if (input.intent === 'help_employee_photo') {
    return 'Para adicionar foto de funcionario, abra Funcionarios, edite o funcionario desejado e atualize a foto/avatar no cadastro dele.'
  }
  if (input.intent === 'help_schedule_hours') {
    return 'Para ajustar horario da agenda, abra Configuracoes, revise os horarios de funcionamento e salve. Depois confira a Agenda para validar os horarios disponiveis.'
  }
  if (input.intent === 'platform_help') {
    return 'Isso parece ser uma duvida da Barber Hub. Posso ajudar com agenda, comandas, clientes, produtos, funcionarios, financeiro, relatorios, assinaturas, importacao, exportacao e configuracoes.'
  }

  const data = input.data
  if (!data || data.kind === 'empty') return 'Nao encontrei dados para esse periodo.'

  if (data.kind === 'money') {
    const suffix = typeof data.orders === 'number' ? ` em ${data.orders} comanda${data.orders === 1 ? '' : 's'} paga${data.orders === 1 ? '' : 's'}` : ''
    return `O total foi ${formatCurrency(data.total)}${suffix}.`
  }
  if (data.kind === 'count') return `Encontrei ${data.count} registro${data.count === 1 ? '' : 's'} nesse periodo.`
  if (data.kind === 'payment_methods') {
    if (data.methods.length === 0) return 'Nao encontrei pagamentos registrados hoje.'
    const summary = data.methods.slice(0, 3).map((item) => `${item.method}: ${formatCurrency(item.total)}`).join(', ')
    return `Hoje por forma de pagamento: ${summary}.`
  }
  if (data.kind === 'appointments') {
    if (data.appointments.length === 0) return `Nao encontrei agendamentos para ${data.period}.`
    const first = data.appointments.slice(0, 3).map((item) => `${formatDateShort(item.date)} ${item.start} ${item.clientName} (${item.serviceName})`).join('; ')
    return `Encontrei ${data.appointments.length} agendamento${data.appointments.length === 1 ? '' : 's'} em ${data.period}: ${first}.`
  }
  if (data.kind === 'top_item') {
    const quantity = typeof data.quantity === 'number' ? ` (${data.quantity} venda${data.quantity === 1 ? '' : 's'})` : ''
    return `O destaque do mes e ${data.name}, com ${formatCurrency(data.total)}${quantity}.`
  }

  return 'Nao encontrei dados para esse periodo.'
}
