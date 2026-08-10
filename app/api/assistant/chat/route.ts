import { NextResponse } from 'next/server'
import {
  buildAssistantAnswer,
  buildAssistantMetricData,
  canUseAssistantIntent,
  classifyAssistantIntent,
  getAssistantMonthlyBudgetUsd,
  getAssistantMonthlyLimit,
  getAssistantPeriod,
  getNextAssistantResetDate,
  type AssistantIntent,
} from '@/lib/assistant'
import { classifyAssistantIntentWithAi } from '@/lib/assistant-ai'
import { readLimitedJson, RequestBodyError } from '@/lib/http-security'
import { createAdminSupabaseClient, createAuthenticatedServerClient } from '@/lib/supabase/server'
import type { Appointment, Client, FinancialEntry, Order, OrderItem, Role } from '@/lib/types'

type AssistantRequest = {
  question?: string
}

type Membership = {
  id: string
  barbershop_id: string
  employee_id: string | null
  role: Role
}

type UsageRow = {
  used_count: number
  ai_calls?: number
  input_tokens?: number
  output_tokens?: number
  estimated_cost_usd?: number
}

type BarbershopPlanRow = {
  plan: string
}

const dataIntents = new Set<AssistantIntent>([
  'revenue_today',
  'revenue_month',
  'revenue_year',
  'orders_today',
  'payment_methods_today',
  'appointments_today',
  'appointments_tomorrow',
  'new_clients_month',
  'top_service_month',
  'top_employee_month',
])

function bearerToken(request: Request) {
  const authorization = request.headers.get('authorization') ?? ''
  return authorization.startsWith('Bearer ') ? authorization.slice(7) : ''
}

function jsonError(error: string, status: number) {
  return NextResponse.json({ error }, { status })
}

function isAdminRole(role: Role) {
  return role === 'owner' || role === 'manager'
}

export async function POST(request: Request) {
  try {
    const token = bearerToken(request)
    if (!token) return jsonError('Sessao invalida.', 401)

    const authenticated = createAuthenticatedServerClient(token)
    const { data: userData, error: userError } = await authenticated.auth.getUser()
    if (userError || !userData.user) return jsonError('Sessao invalida.', 401)

    const body = await readLimitedJson<AssistantRequest>(request, 8 * 1024)
    const question = String(body.question ?? '').trim()
    if (!question) return jsonError('Digite uma pergunta para o assistente.', 400)
    if (question.length > 500) return jsonError('Pergunta muito longa.', 400)

    const { data: memberships, error: membershipError } = await authenticated
      .from('members')
      .select('id, barbershop_id, employee_id, role')
      .eq('user_id', userData.user.id)
      .eq('active', true)
      .order('created_at')

    if (membershipError) throw membershipError
    const membership = (memberships?.[0] ?? null) as Membership | null
    if (!membership) return jsonError('Esta conta nao possui uma barbearia ativa.', 403)

    const now = new Date()
    const period = getAssistantPeriod(now)
    const admin = createAdminSupabaseClient()
    const monthlyLimit = await getBarbershopAssistantLimit(admin, membership.barbershop_id)
    const monthlyBudgetUsd = await getBarbershopAssistantBudget(admin, membership.barbershop_id)
    const usage = await getAssistantUsage(admin, userData.user.id, period)
    const shopCostUsd = await getAssistantShopCostUsd(admin, membership.barbershop_id, period)
    if (usage.usedCount >= monthlyLimit) {
      return NextResponse.json({
        answer: `Voce atingiu o limite mensal de perguntas. O limite renova em ${getNextAssistantResetDate(now)}.`,
        intent: 'out_of_scope',
        remaining: 0,
        limit: monthlyLimit,
      })
    }

    const localIntent = classifyAssistantIntent(question)
    const canSpendAi = shopCostUsd < monthlyBudgetUsd
    const aiClassification = localIntent === 'out_of_scope' && canSpendAi
      ? await classifyAssistantIntentWithAi(question)
      : null
    const intent = aiClassification?.intent ?? localIntent
    if (intent === 'out_of_scope') {
      return NextResponse.json({
        answer: localIntent === 'out_of_scope' && !canSpendAi
          ? 'O limite mensal de custo do assistente inteligente foi atingido. Ainda posso responder perguntas conhecidas da Barber Hub.'
          : buildAssistantAnswer({ intent }),
        intent,
        remaining: monthlyLimit - usage.usedCount,
        limit: monthlyLimit,
      })
    }

    if (!canUseAssistantIntent(intent, membership.role)) {
      const nextUsage = await incrementAssistantUsage(admin, {
        barbershopId: membership.barbershop_id,
        userId: userData.user.id,
        period,
        usage,
        aiClassification,
      })
      return NextResponse.json({
        answer: buildAssistantAnswer({ intent, denied: true }),
        intent,
        remaining: Math.max(0, monthlyLimit - nextUsage.usedCount),
        limit: monthlyLimit,
      })
    }

    const data = dataIntents.has(intent)
      ? await loadAssistantData(admin, membership, intent, now)
      : undefined

    const nextUsage = await incrementAssistantUsage(admin, {
      barbershopId: membership.barbershop_id,
      userId: userData.user.id,
      period,
      usage,
      aiClassification,
    })

    return NextResponse.json({
      answer: buildAssistantAnswer({ intent, data }),
      intent,
      remaining: Math.max(0, monthlyLimit - nextUsage.usedCount),
      limit: monthlyLimit,
    })
  } catch (error) {
    if (error instanceof RequestBodyError) return jsonError(error.message, error.status)
    return jsonError(error instanceof Error ? error.message : 'Nao foi possivel consultar o assistente agora.', 500)
  }
}

async function getBarbershopAssistantLimit(admin: ReturnType<typeof createAdminSupabaseClient>, barbershopId: string) {
  const { data, error } = await admin
    .from('barbershops')
    .select('plan')
    .eq('id', barbershopId)
    .single<BarbershopPlanRow>()

  if (error) throw error
  return getAssistantMonthlyLimit(data?.plan)
}

async function getBarbershopAssistantBudget(admin: ReturnType<typeof createAdminSupabaseClient>, barbershopId: string) {
  const { data, error } = await admin
    .from('barbershops')
    .select('plan')
    .eq('id', barbershopId)
    .single<BarbershopPlanRow>()

  if (error) throw error
  return getAssistantMonthlyBudgetUsd(data?.plan)
}

async function getAssistantUsage(admin: ReturnType<typeof createAdminSupabaseClient>, userId: string, period: string) {
  const { data, error } = await admin
    .from('assistant_usage')
    .select('used_count')
    .eq('user_id', userId)
    .eq('period', period)
    .maybeSingle<UsageRow>()

  if (error) throw error
  return {
    usedCount: Number(data?.used_count ?? 0),
    aiCalls: Number(data?.ai_calls ?? 0),
    inputTokens: Number(data?.input_tokens ?? 0),
    outputTokens: Number(data?.output_tokens ?? 0),
    estimatedCostUsd: Number(data?.estimated_cost_usd ?? 0),
  }
}

async function getAssistantShopCostUsd(admin: ReturnType<typeof createAdminSupabaseClient>, barbershopId: string, period: string) {
  const { data, error } = await admin
    .from('assistant_usage')
    .select('estimated_cost_usd')
    .eq('barbershop_id', barbershopId)
    .eq('period', period)

  if (error) throw error
  return (data ?? []).reduce((sum, row) => sum + Number(row.estimated_cost_usd ?? 0), 0)
}

async function incrementAssistantUsage(
  admin: ReturnType<typeof createAdminSupabaseClient>,
  input: {
    barbershopId: string
    userId: string
    period: string
    usage: { usedCount: number; aiCalls: number; inputTokens: number; outputTokens: number; estimatedCostUsd: number }
    aiClassification: Awaited<ReturnType<typeof classifyAssistantIntentWithAi>> | null
  },
) {
  const nextUsage = {
    usedCount: input.usage.usedCount + 1,
    aiCalls: input.usage.aiCalls + (input.aiClassification ? 1 : 0),
    inputTokens: input.usage.inputTokens + (input.aiClassification?.inputTokens ?? 0),
    outputTokens: input.usage.outputTokens + (input.aiClassification?.outputTokens ?? 0),
    estimatedCostUsd: input.usage.estimatedCostUsd + (input.aiClassification?.estimatedCostUsd ?? 0),
  }
  const { error } = await admin
    .from('assistant_usage')
    .upsert({
      barbershop_id: input.barbershopId,
      user_id: input.userId,
      period: input.period,
      used_count: nextUsage.usedCount,
      ai_calls: nextUsage.aiCalls,
      input_tokens: nextUsage.inputTokens,
      output_tokens: nextUsage.outputTokens,
      estimated_cost_usd: nextUsage.estimatedCostUsd,
    }, { onConflict: 'user_id,period' })

  if (error) throw error
  return nextUsage
}

async function loadAssistantData(
  admin: ReturnType<typeof createAdminSupabaseClient>,
  membership: Membership,
  intent: AssistantIntent,
  now: Date,
) {
  const barbershopId = membership.barbershop_id
  const onlyEmployeeId = isAdminRole(membership.role) ? '' : membership.employee_id ?? ''

  const [orders, orderItems, financialEntries, appointments, clients] = await Promise.all([
    fetchRows(admin.from('orders').select('*').eq('barbershop_id', barbershopId)),
    fetchRows(admin.from('order_items').select('*').eq('barbershop_id', barbershopId)),
    isAdminRole(membership.role)
      ? fetchRows(admin.from('financial_entries').select('*').eq('barbershop_id', barbershopId))
      : Promise.resolve([]),
    fetchRows(
      onlyEmployeeId
        ? admin.from('appointments').select('*').eq('barbershop_id', barbershopId).eq('employee_id', onlyEmployeeId)
        : admin.from('appointments').select('*').eq('barbershop_id', barbershopId),
    ),
    isAdminRole(membership.role)
      ? fetchRows(admin.from('clients').select('*').eq('barbershop_id', barbershopId))
      : Promise.resolve([]),
  ])

  const itemsByOrder = new Map<string, OrderItem[]>()
  for (const item of orderItems as any[]) {
    const orderId = String(item.order_id ?? '')
    const current = itemsByOrder.get(orderId) ?? []
    current.push({
      id: String(item.id ?? ''),
      refId: String(item.ref_id ?? ''),
      type: item.type,
      name: String(item.name ?? ''),
      quantity: Number(item.quantity ?? 0),
      unitPrice: Number(item.unit_price ?? 0),
    })
    itemsByOrder.set(orderId, current)
  }

  const mappedOrders = (orders as any[])
    .filter((order) => !onlyEmployeeId || order.employee_id === onlyEmployeeId)
    .map((order): Order => ({
      id: String(order.id ?? ''),
      barbershopId: String(order.barbershop_id ?? ''),
      appointmentId: order.appointment_id ?? undefined,
      number: Number(order.number ?? 0),
      clientId: order.client_id ?? undefined,
      clientName: String(order.client_name ?? ''),
      employeeId: String(order.employee_id ?? ''),
      employeeName: String(order.employee_name ?? ''),
      items: itemsByOrder.get(String(order.id ?? '')) ?? [],
      discount: Number(order.discount ?? 0),
      surcharge: Number(order.surcharge ?? 0),
      status: order.status,
      method: order.method ?? undefined,
      total: Number(order.total ?? 0),
      createdAt: String(order.created_at ?? ''),
    }))

  return buildAssistantMetricData({
    intent,
    now,
    orders: mappedOrders,
    financialEntries: (financialEntries as any[]).map((entry): FinancialEntry => ({
      id: String(entry.id ?? ''),
      barbershopId: String(entry.barbershop_id ?? ''),
      orderId: entry.order_id ?? undefined,
      type: entry.type,
      category: String(entry.category ?? ''),
      description: String(entry.description ?? ''),
      amount: Number(entry.amount ?? 0),
      method: entry.method ?? undefined,
      date: String(entry.date ?? ''),
    })),
    appointments: (appointments as any[]).map((appointment): Appointment => ({
      id: String(appointment.id ?? ''),
      barbershopId: String(appointment.barbershop_id ?? ''),
      clientId: String(appointment.client_id ?? ''),
      clientName: String(appointment.client_name ?? ''),
      employeeId: String(appointment.employee_id ?? ''),
      employeeName: String(appointment.employee_name ?? ''),
      serviceId: String(appointment.service_id ?? ''),
      serviceName: String(appointment.service_name ?? ''),
      date: String(appointment.date ?? ''),
      start: String(appointment.start ?? '').slice(0, 5),
      durationMin: Number(appointment.duration_min ?? 0),
      status: appointment.status,
      price: Number(appointment.price ?? 0),
      notes: appointment.notes ?? undefined,
      createdAt: appointment.created_at ?? undefined,
    })),
    clients: (clients as any[]).map((client): Client => ({
      id: String(client.id ?? ''),
      barbershopId: String(client.barbershop_id ?? ''),
      name: String(client.name ?? ''),
      phone: String(client.phone ?? ''),
      email: String(client.email ?? ''),
      birthDate: String(client.birth_date ?? ''),
      postalCode: String(client.postal_code ?? ''),
      address: String(client.address ?? ''),
      addressNumber: String(client.address_number ?? ''),
      addressComplement: String(client.address_complement ?? ''),
      neighborhood: String(client.neighborhood ?? ''),
      city: String(client.city ?? ''),
      state: String(client.state ?? ''),
      preferredDay: String(client.preferred_day ?? ''),
      notes: String(client.notes ?? ''),
      tags: Array.isArray(client.tags) ? client.tags : [],
      totalSpent: Number(client.total_spent ?? 0),
      visits: Number(client.visits ?? 0),
      lastVisit: String(client.last_visit ?? ''),
      favoriteService: String(client.favorite_service ?? ''),
      preferredBarber: String(client.preferred_barber ?? ''),
      createdAt: String(client.created_at ?? ''),
    })),
  })
}

async function fetchRows(query: any) {
  const { data, error } = await query
  if (error) throw error
  return data ?? []
}
