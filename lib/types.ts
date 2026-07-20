/**
 * BarberHub — Domain types
 *
 * These types mirror the planned Supabase/Postgres schema (see db/schema.sql).
 * Every operational entity carries `barbershopId` to enforce multi-tenant
 * isolation once Row Level Security is wired up.
 */

export type Role = 'owner' | 'manager' | 'barber' | 'reception'

export type PaymentMethod = 'dinheiro' | 'pix' | 'credito' | 'debito' | 'outro'

export interface Barbershop {
  id: string
  name: string
  slug: string
  color: string
  city: string
  billingDocument: string
  plan: 'starter' | 'pro' | 'premium'
  billingStatus: 'trialing' | 'active' | 'past_due' | 'canceled'
  trialEndsAt: string
  nextBillingDate?: string
}

export interface Member {
  id: string
  barbershopId: string
  name: string
  email: string
  role: Role
  active: boolean
}

export interface Employee {
  id: string
  barbershopId: string
  name: string
  role: string
  phone: string
  email: string
  active: boolean
  serviceCommission: number // %
  productCommission: number // %
  subscriptionCommission: number // %
  avatarColor?: string
}

export type ClientTag = 'vip' | 'recorrente' | 'inativo' | 'inadimplente' | 'aniversariante'

export interface Client {
  id: string
  barbershopId: string
  name: string
  phone: string
  email: string
  birthDate: string
  address: string
  notes: string
  tags: ClientTag[]
  totalSpent: number
  visits: number
  lastVisit: string
  favoriteService: string
  preferredBarber: string
  createdAt: string
}

export type CatalogType = 'produto' | 'servico'

export interface CatalogItem {
  id: string
  barbershopId: string
  type: CatalogType
  name: string
  category: string
  price: number
  cost: number
  durationMin?: number // services
  stock?: number // products
  minStock?: number // products
  commission: number // %
  active: boolean
}

export type AppointmentStatus =
  | 'agendado'
  | 'confirmado'
  | 'chegou'
  | 'concluido'
  | 'cancelado'
  | 'faltou'

export interface Appointment {
  id: string
  barbershopId: string
  clientId: string
  clientName: string
  employeeId: string
  employeeName: string
  serviceId: string
  serviceName: string
  date: string // YYYY-MM-DD
  start: string // HH:mm
  durationMin: number
  status: AppointmentStatus
  price: number
}

export type OrderStatus = 'aberta' | 'paga' | 'pendente' | 'cancelada'

export interface OrderItem {
  id: string
  refId: string
  type: CatalogType
  name: string
  quantity: number
  unitPrice: number
}

export interface Order {
  id: string
  barbershopId: string
  number: number
  clientId?: string
  clientName: string
  employeeId: string
  employeeName: string
  items: OrderItem[]
  discount: number
  surcharge: number
  status: OrderStatus
  method?: PaymentMethod
  total: number
  createdAt: string
}

export type SubscriptionStatus = 'ativo' | 'vencendo' | 'vencido' | 'cancelado'

export interface Plan {
  id: string
  barbershopId: string
  name: string
  price: number
  type: 'mensal' | 'pacote' | 'creditos'
  credits?: number
  description: string
  active: boolean
}

export interface Subscription {
  id: string
  barbershopId: string
  planId: string
  planName: string
  clientId: string
  clientName: string
  price: number
  startDate: string
  dueDate: string
  status: SubscriptionStatus
  creditsUsed?: number
  creditsTotal?: number
}

export type CommissionStatus = 'pendente' | 'paga'

export interface Commission {
  id: string
  barbershopId: string
  employeeId: string
  employeeName: string
  origin: 'servico' | 'produto' | 'assinatura'
  reference: string
  base: number
  rate: number
  amount: number
  status: CommissionStatus
  date: string
}

export type FinancialType = 'entrada' | 'saida'

export interface FinancialEntry {
  id: string
  barbershopId: string
  type: FinancialType
  category: string
  description: string
  amount: number
  method?: PaymentMethod
  date: string
}

export type ImportStatus = 'concluida' | 'com_erros' | 'processando' | 'desfeita'

export interface ImportRecord {
  id: string
  barbershopId: string
  entity: 'clientes' | 'produtos' | 'servicos' | 'funcionarios' | 'assinaturas' | 'comandas'
  fileName: string
  totalRows: number
  importedRows: number
  errorRows: number
  status: ImportStatus
  createdAt: string
  createdBy: string
}
