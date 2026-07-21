import type {
  Appointment,
  Barbershop,
  CatalogItem,
  Client,
  Commission,
  Employee,
  FinancialEntry,
  ImportRecord,
  Order,
  Plan,
  Subscription,
} from './types'
import { defaultAgendaSettings, defaultPaymentMethods } from './barbershop-settings'

const emptyBarbershop: Barbershop = {
  id: 'unconfigured',
  name: 'Sua barbearia',
  slug: 'sua-barbearia',
  color: '#1E3A32',
  city: 'Configure sua conta',
  billingDocument: '',
  plan: 'starter',
  billingStatus: 'trialing',
  trialEndsAt: '',
  paymentMethods: defaultPaymentMethods,
  agendaSettings: defaultAgendaSettings,
}

export function getBarbershops(): Barbershop[] {
  return [emptyBarbershop]
}

export function getActiveBarbershop(): Barbershop {
  return emptyBarbershop
}

export function getEmployees(): Employee[] {
  return []
}

export function getClients(): Client[] {
  return []
}

export function getCatalog(): CatalogItem[] {
  return []
}

export function getServices(): CatalogItem[] {
  return []
}

export function getProducts(): CatalogItem[] {
  return []
}

export function getAppointments(): Appointment[] {
  return []
}

export function getOrders(): Order[] {
  return []
}

export function getPlans(): Plan[] {
  return []
}

export function getSubscriptions(): Subscription[] {
  return []
}

export function getCommissions(): Commission[] {
  return []
}

export function getFinancialEntries(): FinancialEntry[] {
  return []
}

export function getImports(): ImportRecord[] {
  return []
}

export function getRevenueSeries() {
  return []
}

export function getRevenueByMethod(): Array<{ method: string; value: number }> {
  return [
    { method: 'Pix', value: 0 },
    { method: 'Crédito', value: 0 },
    { method: 'Débito', value: 0 },
    { method: 'Dinheiro', value: 0 },
    { method: 'Outro', value: 0 },
  ]
}

export function getDashboardMetrics() {
  return {
    revenueToday: 0,
    weekRevenue: 0,
    monthRevenue: 0,
    openOrders: 0,
    paidCount: 0,
    pendingOrders: 0,
    canceledOrders: 0,
    avgTicket: 0,
    newClients: 0,
    recurringClients: 0,
    atRiskClients: 0,
    activeSubs: 0,
    expiringSubs: 0,
    lowStock: 0,
    pendingCommissions: 0,
  }
}

export function getBarberRanking(): Array<{ name: string; services: number; revenue: number }> {
  return []
}

export function getUpcomingAppointments(): Appointment[] {
  return []
}

export function getExpiringSubscriptions(): Subscription[] {
  return []
}

export function getLowStockProducts(): CatalogItem[] {
  return []
}
