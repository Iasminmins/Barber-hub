/**
 * Camada de acesso a dados do BarberHub.
 *
 * PONTO ÚNICO DE TROCA POR SUPABASE:
 * Hoje estas funções leem das fixtures em lib/mock-data.ts. Para ir a produção,
 * reescreva cada função aqui usando o cliente Supabase, respeitando o
 * barbershop_id da sessão e as políticas de RLS.
 */

import {
  appointments as _appointments,
  barbershops as _barbershops,
  catalog as _catalog,
  clients as _clients,
  commissions as _commissions,
  employees as _employees,
  financialEntries as _financial,
  imports as _imports,
  orders as _orders,
  plans as _plans,
  revenueByMethod as _revenueByMethod,
  revenueSeries as _revenueSeries,
  subscriptions as _subscriptions,
} from './mock-data'
import { daysUntil } from './format'

export function getBarbershops() {
  return _barbershops
}

export function getActiveBarbershop() {
  return _barbershops[0]
}

export function getEmployees() {
  return _employees
}

export function getClients() {
  return _clients
}

export function getCatalog() {
  return _catalog
}

export function getServices() {
  return _catalog.filter((c) => c.type === 'servico')
}

export function getProducts() {
  return _catalog.filter((c) => c.type === 'produto')
}

export function getAppointments() {
  return _appointments
}

export function getOrders() {
  return _orders
}

export function getPlans() {
  return _plans
}

export function getSubscriptions() {
  return _subscriptions
}

export function getCommissions() {
  return _commissions
}

export function getFinancialEntries() {
  return _financial
}

export function getImports() {
  return _imports
}

export function getRevenueSeries() {
  return _revenueSeries
}

export function getRevenueByMethod() {
  return _revenueByMethod
}

function todayISO() {
  return new Date().toISOString().slice(0, 10)
}

export function getDashboardMetrics() {
  const orders = _orders
  const today = todayISO()
  const paidToday = orders.filter((o) => o.status === 'paga' && o.createdAt === today)
  const revenueToday = paidToday.reduce((s, o) => s + o.total, 0)
  const openOrders = orders.filter((o) => o.status === 'aberta').length
  const pendingOrders = orders.filter((o) => o.status === 'pendente').length
  const canceledOrders = orders.filter((o) => o.status === 'cancelada').length
  const paidCount = paidToday.length
  const avgTicket = paidCount > 0 ? revenueToday / paidCount : 0

  const newClients = _clients.filter((c) => daysUntil(c.createdAt) >= -7).length
  const recurringClients = _clients.filter((c) => c.tags.includes('recorrente')).length
  const atRiskClients = _clients.filter((c) => c.tags.includes('inativo')).length

  const activeSubs = _subscriptions.filter((s) => s.status === 'ativo').length
  const expiringSubs = _subscriptions.filter((s) => s.status === 'vencendo').length

  const lowStock = _catalog.filter(
    (c) => c.type === 'produto' && (c.stock ?? 0) <= (c.minStock ?? 0),
  ).length

  const pendingCommissions = _commissions
    .filter((c) => c.status === 'pendente')
    .reduce((s, c) => s + c.amount, 0)

  const weekRevenue = _revenueSeries.reduce((s, d) => s + d.receita, 0)
  const monthRevenue = weekRevenue * 4.1

  return {
    revenueToday,
    weekRevenue,
    monthRevenue,
    openOrders,
    paidCount,
    pendingOrders,
    canceledOrders,
    avgTicket,
    newClients,
    recurringClients,
    atRiskClients,
    activeSubs,
    expiringSubs,
    lowStock,
    pendingCommissions,
  }
}

export function getBarberRanking() {
  const map = new Map<string, { name: string; revenue: number; services: number }>()
  for (const o of _orders.filter((o) => o.status === 'paga')) {
    const cur = map.get(o.employeeId) ?? { name: o.employeeName, revenue: 0, services: 0 }
    cur.revenue += o.total
    cur.services += o.items.filter((i) => i.type === 'servico').length
    map.set(o.employeeId, cur)
  }

  const seed: Record<string, { revenue: number; services: number }> = {
    emp_1: { revenue: 4820, services: 62 },
    emp_2: { revenue: 3210, services: 48 },
    emp_3: { revenue: 3980, services: 54 },
    emp_6: { revenue: 4540, services: 49 },
    emp_7: { revenue: 1880, services: 29 },
  }

  for (const [id, s] of Object.entries(seed)) {
    const emp = _employees.find((e) => e.id === id)
    const cur = map.get(id) ?? { name: emp?.name ?? '', revenue: 0, services: 0 }
    cur.revenue += s.revenue
    cur.services += s.services
    map.set(id, cur)
  }

  return Array.from(map.values()).sort((a, b) => b.revenue - a.revenue)
}

export function getUpcomingAppointments(limit = 6) {
  const today = todayISO()
  return _appointments
    .filter((a) => a.date >= today && ['agendado', 'confirmado', 'chegou'].includes(a.status))
    .sort((a, b) => (a.date + a.start).localeCompare(b.date + b.start))
    .slice(0, limit)
}

export function getExpiringSubscriptions() {
  return _subscriptions
    .filter((s) => s.status === 'vencendo' || s.status === 'vencido')
    .sort((a, b) => daysUntil(a.dueDate) - daysUntil(b.dueDate))
}

export function getLowStockProducts() {
  return _catalog.filter(
    (c) => c.type === 'produto' && (c.stock ?? 0) <= (c.minStock ?? 0),
  )
}
