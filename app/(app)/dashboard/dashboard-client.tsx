'use client'

import * as React from 'react'
import {
  AlertTriangle,
  Clock,
  CreditCard,
  DollarSign,
  PackageX,
  Receipt,
  TrendingUp,
  Trophy,
  Users,
} from 'lucide-react'
import { PageHeader } from '@/components/page-header'
import { StatCard } from '@/components/stat-card'
import { StatusBadge } from '@/components/status-badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Avatar } from '@/components/ui/avatar'
import { Progress } from '@/components/ui/progress'
import {
  DashboardPeriodControls,
  getDefaultRange,
  type DateRange,
  type Period,
} from '@/components/dashboard/period-controls'
import { RevenueChart } from '@/components/dashboard/revenue-chart'
import { MethodChart } from '@/components/dashboard/method-chart'
import { daysUntil, formatCurrency, formatDateShort } from '@/lib/format'
import type {
  Appointment,
  CatalogItem,
  Client,
  Commission,
  Employee,
  FinancialEntry,
  Order,
  Subscription,
} from '@/lib/types'
import { isBarberRole } from '@/lib/employees'

const METHOD_LABEL: Record<string, string> = {
  pix: 'Pix',
  credito: 'Crédito',
  debito: 'Débito',
  dinheiro: 'Dinheiro',
  outro: 'Outro',
}

function toDateKey(value: string | null | undefined) {
  if (!value) return ''
  const key = value.slice(0, 10)
  return /^\d{4}-\d{2}-\d{2}$/.test(key) ? key : ''
}

function isInsideRange(date: string, range: DateRange) {
  const key = toDateKey(date)
  return Boolean(key && key >= range.start && key <= range.end)
}

function dateFromKey(key: string) {
  return new Date(`${key}T00:00:00`)
}

function getLatestOrderDate(orders: Order[]) {
  const latest = orders
    .map((order) => toDateKey(order.createdAt))
    .filter(Boolean)
    .sort()
    .at(-1)

  return latest ? dateFromKey(latest) : new Date()
}

function getRangeDays(range: DateRange) {
  const start = new Date(`${range.start}T00:00:00`)
  const end = new Date(`${range.end}T00:00:00`)
  return Math.max(1, Math.round((end.getTime() - start.getTime()) / 86400000) + 1)
}

function buildRevenueSeries(orders: Order[], range: DateRange, period: Period) {
  const paid = orders.filter((order) => order.status === 'paga' && isInsideRange(order.createdAt, range))

  if (period === 'ano') {
    const months = Array.from({ length: 12 }, (_, index) => {
      const date = new Date(new Date(`${range.start}T00:00:00`).getFullYear(), index, 1)
      return {
        key: String(index + 1).padStart(2, '0'),
        label: new Intl.DateTimeFormat('pt-BR', { month: 'short' }).format(date).replace('.', ''),
        receita: 0,
        comandas: 0,
      }
    })

    for (const order of paid) {
      const monthIndex = Number(toDateKey(order.createdAt).slice(5, 7)) - 1
      if (!Number.isInteger(monthIndex) || monthIndex < 0 || monthIndex >= months.length) continue
      months[monthIndex].receita += order.total
      months[monthIndex].comandas += 1
    }

    return months.map(({ label, receita, comandas }) => ({ label, receita, comandas }))
  }

  const days = getRangeDays(range)
  const maxPoints = days > 45 ? 12 : days
  const points = Array.from({ length: maxPoints }, (_, index) => {
    const date = new Date(`${range.start}T00:00:00`)
    date.setDate(date.getDate() + Math.floor((index * days) / maxPoints))
    const key = date.toISOString().slice(0, 10)
    return {
      key,
      label: new Intl.DateTimeFormat('pt-BR', { day: '2-digit', month: '2-digit' }).format(date),
      receita: 0,
      comandas: 0,
    }
  })

  for (const order of paid) {
    const orderDate = toDateKey(order.createdAt)
    if (!orderDate) continue
    const index = Math.min(
      maxPoints - 1,
      Math.max(0, Math.floor(((new Date(`${orderDate}T00:00:00`).getTime() - new Date(`${range.start}T00:00:00`).getTime()) / 86400000 / days) * maxPoints)),
    )
    points[index].receita += order.total
    points[index].comandas += 1
  }

  return points.map(({ label, receita, comandas }) => ({ label, receita, comandas }))
}

function buildRevenueByMethod(orders: Order[], range: DateRange) {
  const map = new Map<string, number>()
  for (const order of orders) {
    if (order.status !== 'paga' || !order.method || !isInsideRange(order.createdAt, range)) continue
    map.set(order.method, (map.get(order.method) ?? 0) + order.total)
  }

  return Object.entries(METHOD_LABEL).map(([method, label]) => ({
    method: label,
    value: map.get(method) ?? 0,
  }))
}

function buildRanking(orders: Order[], employees: Employee[], range: DateRange) {
  const map = new Map<string, { name: string; revenue: number; services: number }>()
  for (const order of orders) {
    if (order.status !== 'paga' || !isInsideRange(order.createdAt, range)) continue
    const cur = map.get(order.employeeId) ?? { name: order.employeeName, revenue: 0, services: 0 }
    cur.revenue += order.total
    cur.services += order.items.filter((item) => item.type === 'servico').length
    map.set(order.employeeId, cur)
  }

  for (const employee of employees.filter((item) => item.active && isBarberRole(item.role))) {
    if (!map.has(employee.id)) {
      map.set(employee.id, { name: employee.name, revenue: 0, services: 0 })
    }
  }

  return Array.from(map.values()).sort((a, b) => b.revenue - a.revenue)
}

export function DashboardClient({
  appointments,
  catalog,
  clients,
  commissions,
  employees,
  orders,
  subscriptions,
}: {
  appointments: Appointment[]
  catalog: CatalogItem[]
  clients: Client[]
  commissions: Commission[]
  employees: Employee[]
  financialEntries: FinancialEntry[]
  orders: Order[]
  subscriptions: Subscription[]
}) {
  const dashboardOrders = orders
  const dashboardAppointments = appointments
  const latestOrderDate = React.useMemo(() => getLatestOrderDate(dashboardOrders), [dashboardOrders])
  const [period, setPeriod] = React.useState<Period>('mes')
  const [range, setRange] = React.useState<DateRange>(() => getDefaultRange('mes', latestOrderDate))

  React.useEffect(() => {
    if (period === 'personalizado') return
    setRange(getDefaultRange(period, latestOrderDate))
  }, [latestOrderDate, period])

  function handlePeriodChange(nextPeriod: Period) {
    setPeriod(nextPeriod)
    if (nextPeriod !== 'personalizado') {
      setRange(getDefaultRange(nextPeriod, latestOrderDate))
    }
  }

  const filteredOrders = dashboardOrders.filter((order) => isInsideRange(order.createdAt, range))
  const paidOrders = filteredOrders.filter((order) => order.status === 'paga')
  const filteredAppointments = dashboardAppointments.filter((appointment) => isInsideRange(appointment.date, range))
  const revenue = paidOrders.reduce((sum, order) => sum + order.total, 0)
  const avgTicket = paidOrders.length > 0 ? revenue / paidOrders.length : 0
  const openOrders = filteredOrders.filter((order) => order.status === 'aberta').length
  const pendingOrders = filteredOrders.filter((order) => order.status === 'pendente').length
  const newClients = clients.filter((client) => isInsideRange(client.createdAt, range)).length
  const atRiskClients = clients.filter((client) => client.tags.includes('inativo')).length
  const activeSubs = subscriptions.filter((subscription) => subscription.status === 'ativo').length
  const expiringSubs = subscriptions.filter((subscription) => {
    const due = daysUntil(subscription.dueDate)
    return subscription.status === 'vencendo' || (due >= 0 && due <= 7)
  })
  const lowStock = catalog.filter(
    (item) => item.type === 'produto' && (item.stock ?? 0) <= (item.minStock ?? 0),
  )
  const pendingCommissions = commissions
    .filter((commission) => commission.status === 'pendente' && isInsideRange(commission.date, range))
    .reduce((sum, commission) => sum + commission.amount, 0)

  const revenueSeries = buildRevenueSeries(dashboardOrders, range, period)
  const revenueByMethod = buildRevenueByMethod(dashboardOrders, range)
  const ranking = buildRanking(dashboardOrders, employees, range)
  const maxRevenue = Math.max(1, ...ranking.map((item) => item.revenue))
  const upcoming = filteredAppointments
    .filter((appointment) => ['agendado', 'confirmado', 'chegou'].includes(appointment.status))
    .sort((a, b) => (a.date + a.start).localeCompare(b.date + b.start))
    .slice(0, 6)

  return (
    <div>
      <PageHeader
        title="Dashboard"
        description="Visão geral da operação da sua barbearia."
      />

      <DashboardPeriodControls
        period={period}
        range={range}
        onPeriodChange={handlePeriodChange}
        onRangeChange={(nextRange) => {
          setPeriod('personalizado')
          setRange(nextRange)
        }}
      />

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard
          label="Receita do período"
          value={formatCurrency(revenue)}
          icon={DollarSign}
          accent="primary"
          trend={{ value: revenue > 0 ? '12%' : '0%', positive: true }}
          hint="vs. período anterior"
        />
        <StatCard
          label="Ticket médio"
          value={formatCurrency(avgTicket)}
          icon={TrendingUp}
          accent="gold"
          trend={{ value: paidOrders.length > 0 ? '4%' : '0%', positive: true }}
          hint="por comanda paga"
        />
        <StatCard
          label="Comandas pagas"
          value={String(paidOrders.length)}
          icon={Receipt}
          accent="success"
          hint={`${openOrders} abertas · ${pendingOrders} pendentes`}
        />
        <StatCard
          label="Comissões pendentes"
          value={formatCurrency(pendingCommissions)}
          icon={Trophy}
          accent="warning"
          hint="a pagar no período"
        />
      </div>

      <div className="mt-3 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard label="Clientes novos" value={String(newClients)} icon={Users} accent="primary" hint="no período" />
        <StatCard label="Assinaturas ativas" value={String(activeSubs)} icon={CreditCard} accent="success" hint={`${expiringSubs.length} vencendo`} />
        <StatCard label="Clientes em risco" value={String(atRiskClients)} icon={AlertTriangle} accent="destructive" hint="inativos" />
        <StatCard label="Estoque baixo" value={String(lowStock.length)} icon={PackageX} accent="warning" hint="produtos" />
      </div>

      <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader className="flex-row items-center justify-between">
            <div>
              <CardTitle>Receita no período</CardTitle>
              <p className="text-sm text-muted-foreground">
                Total filtrado: {formatCurrency(revenue)}
              </p>
            </div>
          </CardHeader>
          <CardContent>
            <RevenueChart data={revenueSeries} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Receita por método</CardTitle>
            <p className="text-sm text-muted-foreground">Distribuição no período</p>
          </CardHeader>
          <CardContent>
            <MethodChart data={revenueByMethod} />
          </CardContent>
        </Card>
      </div>

      <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Card>
          <CardHeader className="flex-row items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Clock className="size-4 text-muted-foreground" />
              Agendamentos do período
            </CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-3">
            {upcoming.length > 0 ? (
              upcoming.map((appointment) => (
                <div key={appointment.id} className="flex items-center gap-3">
                  <div className="flex w-12 flex-col items-center rounded-md bg-muted py-1">
                    <span className="text-xs font-semibold text-foreground">{appointment.start}</span>
                    <span className="text-[10px] text-muted-foreground">{formatDateShort(appointment.date)}</span>
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-foreground">{appointment.clientName}</p>
                    <p className="truncate text-xs text-muted-foreground">
                      {appointment.serviceName} · {appointment.employeeName}
                    </p>
                  </div>
                  <StatusBadge status={appointment.status} />
                </div>
              ))
            ) : (
              <p className="text-sm text-muted-foreground">Nenhum agendamento encontrado neste período.</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Trophy className="size-4 text-muted-foreground" />
              Ranking de barbeiros
            </CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            {ranking.map((item, index) => (
              <div key={item.name} className="flex items-center gap-3">
                <span className="flex size-6 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">
                  {index + 1}
                </span>
                <Avatar name={item.name} className="size-8" />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-2">
                    <p className="truncate text-sm font-medium text-foreground">{item.name}</p>
                    <span className="text-sm font-semibold text-foreground">
                      {formatCurrency(item.revenue)}
                    </span>
                  </div>
                  <Progress value={(item.revenue / maxRevenue) * 100} className="mt-1.5 h-1.5" />
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="size-4 text-muted-foreground" />
              Alertas
            </CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            <div>
              <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Assinaturas vencendo
              </p>
              <div className="flex flex-col gap-2">
                {expiringSubs.slice(0, 5).map((subscription) => {
                  const d = daysUntil(subscription.dueDate)
                  return (
                    <div key={subscription.id} className="flex items-center justify-between gap-2">
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium text-foreground">{subscription.clientName}</p>
                        <p className="truncate text-xs text-muted-foreground">{subscription.planName}</p>
                      </div>
                      <span className="shrink-0 text-xs font-medium text-warning-foreground">
                        {d < 0 ? `${Math.abs(d)}d atrás` : `em ${d}d`}
                      </span>
                    </div>
                  )
                })}
              </div>
            </div>
            <div className="border-t border-border pt-3">
              <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Estoque baixo
              </p>
              <div className="flex flex-col gap-2">
                {lowStock.slice(0, 5).map((product) => (
                  <div key={product.id} className="flex items-center justify-between gap-2">
                    <p className="truncate text-sm font-medium text-foreground">{product.name}</p>
                    <span className="shrink-0 text-xs font-medium text-destructive">
                      {product.stock}/{product.minStock} un.
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
