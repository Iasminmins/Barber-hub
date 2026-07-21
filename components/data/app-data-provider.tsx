'use client'

import * as React from 'react'
import { createBrowserSupabaseClient } from '@/lib/supabase/client'
import { defaultAgendaSettings, defaultPaymentMethods, normalizeAgendaSettings, normalizePaymentMethods } from '@/lib/barbershop-settings'
import type { Appointment, Barbershop, CatalogItem, Client, Commission, Employee, FinancialEntry, ImportRecord, Member, Order, Plan, Subscription } from '@/lib/types'

type AppData = {
  barbershop: Barbershop
  member: Member
  employees: Employee[]
  clients: Client[]
  catalog: CatalogItem[]
  appointments: Appointment[]
  orders: Order[]
  plans: Plan[]
  subscriptions: Subscription[]
  commissions: Commission[]
  financialEntries: FinancialEntry[]
  imports: ImportRecord[]
}

const fallbackShop: Barbershop = { id: '', name: '', slug: '', color: '#1E3A32', city: '', logoUrl: '', billingDocument: '', plan: 'starter', billingStatus: 'trialing', trialEndsAt: '', paymentMethods: defaultPaymentMethods, agendaSettings: defaultAgendaSettings }
type MutationResult = { error?: string; data?: any }
type AppDataContextValue = AppData & {
  refresh: () => Promise<void>
  insertRecord: (table: string, values: Record<string, unknown>) => Promise<MutationResult>
  insertMany: (table: string, values: Record<string, unknown>[]) => Promise<MutationResult>
  updateRecord: (table: string, id: string, values: Record<string, unknown>) => Promise<MutationResult>
  deleteRecord: (table: string, id: string) => Promise<MutationResult>
}
const AppDataContext = React.createContext<AppDataContextValue | null>(null)
const num = (value: unknown) => Number(value ?? 0)
const dataLoadTimeoutMs = 20000

function withTimeout<T>(promise: PromiseLike<T>, message: string) {
  return Promise.race([
    Promise.resolve(promise),
    new Promise<never>((_, reject) => {
      window.setTimeout(() => reject(new Error(message)), dataLoadTimeoutMs)
    }),
  ])
}

export function AppDataProvider({ children }: { children: React.ReactNode }) {
  const [value, setValue] = React.useState<AppData | null>(null)
  const [error, setError] = React.useState('')
  const [loadingMessage, setLoadingMessage] = React.useState('Carregando dados da sua barbearia...')

  const load = React.useCallback(async () => {
    setError('')
    const supabase = createBrowserSupabaseClient()
    const { data: sessionData, error: sessionError } = await withTimeout(
      supabase.auth.getSession(),
      'A sessão demorou demais para responder. Atualize a página e tente novamente.',
    )
    const user = sessionData.session?.user
    if (sessionError || !user) {
      setLoadingMessage('Redirecionando para o login...')
      window.location.replace('/login')
      return
    }

    const { data: memberships, error: memberError } = await withTimeout(
      supabase
        .from('members')
        .select('id, barbershop_id, name, email, role, active')
        .eq('user_id', user.id)
        .eq('active', true)
        .limit(1),
      'A barbearia demorou demais para carregar. Atualize a página e tente novamente.',
    )
    if (memberError) { setError(memberError.message); return }

    const shopId = memberships?.[0]?.barbershop_id
    if (!shopId) { setError('Esta conta não possui uma barbearia vinculada.'); return }
    const { data: shop, error: shopError } = await withTimeout(
      supabase.from('barbershops').select('*').eq('id', shopId).single(),
      'Os dados da unidade demoraram demais para carregar. Atualize a página e tente novamente.',
    )
    if (shopError || !shop) { setError(shopError?.message ?? 'Barbearia não encontrada.'); return }

    const results = await withTimeout(
      Promise.all([
        supabase.from('employees').select('*').eq('barbershop_id', shopId).order('name'),
        supabase.from('clients').select('*').eq('barbershop_id', shopId).order('name'),
        supabase.from('catalog_items').select('*').eq('barbershop_id', shopId).order('name'),
        supabase.from('appointments').select('*').eq('barbershop_id', shopId).order('date').order('start'),
        supabase.from('orders').select('*').eq('barbershop_id', shopId).order('number', { ascending: false }),
        supabase.from('order_items').select('*').eq('barbershop_id', shopId),
        supabase.from('plans').select('*').eq('barbershop_id', shopId).order('name'),
        supabase.from('subscriptions').select('*').eq('barbershop_id', shopId).order('due_date'),
        supabase.from('commissions').select('*').eq('barbershop_id', shopId).order('date', { ascending: false }),
        supabase.from('financial_entries').select('*').eq('barbershop_id', shopId).order('date', { ascending: false }),
        supabase.from('import_records').select('*').eq('barbershop_id', shopId).order('created_at', { ascending: false }),
      ]),
      'Os dados da plataforma demoraram demais para carregar. Atualize a página e tente novamente.',
    )
    const failed = results.find((result) => result.error)
    if (failed?.error) { setError(failed.error.message); return }
    const [employees, clients, catalog, appointments, orders, orderItems, plans, subscriptions, commissions, financial, imports] = results.map((result) => result.data ?? [])

    setValue({
      barbershop: {
        id: shopId,
        name: shop.name,
        slug: shop.slug,
        color: shop.color,
        city: shop.city ?? '',
        logoUrl: shop.logo_url ?? '',
        billingDocument: shop.billing_document ?? '',
        plan: shop.plan,
        billingStatus: shop.billing_status ?? 'trialing',
        trialEndsAt: shop.trial_ends_at ?? shop.created_at,
        nextBillingDate: shop.next_billing_date ?? undefined,
        paymentMethods: normalizePaymentMethods(shop.payment_methods),
        agendaSettings: normalizeAgendaSettings(shop.agenda_settings),
      },
      member: { id: memberships[0].id, barbershopId: shopId, name: memberships[0].name, email: memberships[0].email, role: memberships[0].role, active: memberships[0].active },
      employees: employees.map((r: any) => ({ id:r.id, barbershopId:r.barbershop_id, name:r.name, role:r.role, phone:r.phone??'', email:r.email??'', active:r.active, serviceCommission:num(r.service_commission), productCommission:num(r.product_commission), subscriptionCommission:num(r.subscription_commission), avatarColor:r.avatar_color??undefined })),
      clients: clients.map((r: any) => ({ id:r.id, barbershopId:r.barbershop_id, name:r.name, phone:r.phone??'', email:r.email??'', birthDate:r.birth_date??'', address:r.address??'', notes:r.notes??'', tags:r.tags??[], totalSpent:num(r.total_spent), visits:num(r.visits), lastVisit:r.last_visit??'', favoriteService:r.favorite_service??'', preferredBarber:r.preferred_barber??'', createdAt:r.created_at })),
      catalog: catalog.map((r: any) => ({ id:r.id, barbershopId:r.barbershop_id, type:r.type, name:r.name, category:r.category??'', price:num(r.price), cost:num(r.cost), durationMin:r.duration_min??undefined, stock:r.stock??undefined, minStock:r.min_stock??undefined, commission:num(r.commission), active:r.active })),
      appointments: appointments.map((r: any) => ({ id:r.id, barbershopId:r.barbershop_id, clientId:r.client_id??'', clientName:r.client_name, employeeId:r.employee_id??'', employeeName:r.employee_name, serviceId:r.service_id??'', serviceName:r.service_name, date:r.date, start:String(r.start).slice(0,5), durationMin:num(r.duration_min), status:r.status, price:num(r.price) })),
      orders: orders.map((r: any) => ({ id:r.id, barbershopId:r.barbershop_id, number:num(r.number), clientId:r.client_id??undefined, clientName:r.client_name, employeeId:r.employee_id??'', employeeName:r.employee_name, items:orderItems.filter((i:any)=>i.order_id===r.id).map((i:any)=>({ id:i.id, refId:i.ref_id??'', type:i.type, name:i.name, quantity:num(i.quantity), unitPrice:num(i.unit_price) })), discount:num(r.discount), surcharge:num(r.surcharge), status:r.status, method:r.method??undefined, total:num(r.total), createdAt:r.created_at })),
      plans: plans.map((r:any)=>({ id:r.id, barbershopId:r.barbershop_id, name:r.name, price:num(r.price), type:r.type, credits:r.credits??undefined, description:r.description??'', active:r.active })),
      subscriptions: subscriptions.map((r:any)=>({ id:r.id, barbershopId:r.barbershop_id, planId:r.plan_id??'', planName:r.plan_name, clientId:r.client_id??'', clientName:r.client_name, price:num(r.price), startDate:r.start_date, dueDate:r.due_date, status:r.status, creditsUsed:r.credits_used??undefined, creditsTotal:r.credits_total??undefined })),
      commissions: commissions.map((r:any)=>({ id:r.id, barbershopId:r.barbershop_id, employeeId:r.employee_id??'', employeeName:r.employee_name, origin:r.origin, reference:r.reference, base:num(r.base), rate:num(r.rate), amount:num(r.amount), status:r.status, date:r.date })),
      financialEntries: financial.map((r:any)=>({ id:r.id, barbershopId:r.barbershop_id, type:r.type, category:r.category, description:r.description, amount:num(r.amount), method:r.method??undefined, date:r.date })),
      imports: imports.map((r:any)=>({ id:r.id, barbershopId:r.barbershop_id, entity:r.entity, fileName:r.file_name, totalRows:num(r.total_rows), importedRows:num(r.imported_rows), errorRows:num(r.error_rows), status:r.status, createdAt:r.created_at, createdBy:r.created_by })),
    })
  }, [])

  const insertRecord = React.useCallback(async (table: string, values: Record<string, unknown>) => {
    const supabase = createBrowserSupabaseClient()
    const { data, error: mutationError } = await supabase.from(table).insert(values).select().single()
    if (mutationError) return { error: mutationError.message }
    await load()
    return { data }
  }, [load])

  const updateRecord = React.useCallback(async (table: string, id: string, values: Record<string, unknown>) => {
    const supabase = createBrowserSupabaseClient()
    const { data, error: mutationError } = await supabase.from(table).update(values).eq('id', id).select().single()
    if (mutationError) return { error: mutationError.message }
    await load()
    return { data }
  }, [load])

  const insertMany = React.useCallback(async (table: string, values: Record<string, unknown>[]) => {
    const supabase = createBrowserSupabaseClient()
    const { data, error: mutationError } = await supabase.from(table).insert(values).select()
    if (mutationError) return { error: mutationError.message }
    await load()
    return { data }
  }, [load])

  const deleteRecord = React.useCallback(async (table: string, id: string) => {
    const supabase = createBrowserSupabaseClient()
    const { error: mutationError } = await supabase.from(table).delete().eq('id', id)
    if (mutationError) return { error: mutationError.message }
    await load()
    return {}
  }, [load])

  React.useEffect(() => {
    void load().catch((loadError) => {
      setError(loadError instanceof Error ? loadError.message : 'Erro inesperado ao carregar os dados.')
    })
  }, [load])
  if (error) return (
    <main className="grid min-h-screen place-items-center p-6 text-center">
      <div>
        <h1 className="text-xl font-bold">Não foi possível carregar os dados</h1>
        <p className="mt-2 text-sm text-muted-foreground">{error}</p>
        <button
          type="button"
          onClick={() => window.location.reload()}
          className="mt-4 rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground"
        >
          Tentar novamente
        </button>
      </div>
    </main>
  )
  if (!value) return <main className="grid min-h-screen place-items-center text-sm text-muted-foreground">{loadingMessage}</main>
  return <AppDataContext.Provider value={{ ...value, refresh: load, insertRecord, insertMany, updateRecord, deleteRecord }}>{children}</AppDataContext.Provider>
}

export function useAppData() {
  const value = React.useContext(AppDataContext)
  if (!value) throw new Error('useAppData fora do AppDataProvider')
  return value
}

export { fallbackShop }
