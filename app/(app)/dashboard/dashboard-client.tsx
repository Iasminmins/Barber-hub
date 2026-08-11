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
import { Select } from '@/components/ui/select'
import {
  DashboardPeriodControls,
  getDefaultRange,
  type DateRange,
  type Period,
} from '@/components/dashboard/period-controls'
import { RevenueChart } from '@/components/dashboard/revenue-chart'
import { MethodChart } from '@/components/dashboard/method-chart'
import { OwnerPhoneReminder } from '@/components/dashboard/owner-phone-reminder'
import { daysUntil, formatCurrency, formatDateShort } from '@/lib/format'
import type {
  Appointment,
  CatalogItem,
  Client,
  Commission,
  Employee,
  FinancialEntry,
  ImportRecord,
  Order,
  Subscription,
} from '@/lib/types'
import { isBarberRole } from '@/lib/employees'
import { isLowStock } from '@/lib/inventory'
import { buildFirstClientActivity, getEffectiveClientStartDate } from '@/lib/client-start'
import type { DashboardReport } from '@/lib/dashboard-report-pdf'
import { getClientsWithoutReturn, isExpiredUnconfirmedAppointment, type ReturnFilter } from '@/lib/dashboard-retention'

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

function getRangeDays(range: DateRange) {
  const start = new Date(`${range.start}T00:00:00`)
  const end = new Date(`${range.end}T00:00:00`)
  return Math.max(1, Math.round((end.getTime() - start.getTime()) / 86400000) + 1)
}

function getSaoPauloHour(value: string) {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return -1

  const hour = new Intl.DateTimeFormat('pt-BR', {
    hour: '2-digit',
    hourCycle: 'h23',
    timeZone: 'America/Sao_Paulo',
  }).format(date)

  return Number(hour)
}

function normalizeText(value: string) {
  return value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim().toLowerCase()
}

function isStandaloneRevenue(entry: FinancialEntry) {
  return entry.type === 'entrada' && !entry.orderId && normalizeText(entry.category) !== 'comandas'
}

function buildRevenueSeries(orders: Order[], financialEntries: FinancialEntry[], range: DateRange, period: Period) {
  const paid = orders.filter((order) => order.status === 'paga' && isInsideRange(order.createdAt, range))
  const extraRevenue = financialEntries.filter((entry) => isStandaloneRevenue(entry) && isInsideRange(entry.date, range))

  if (range.start === range.end) {
    const hours = Array.from({ length: 24 }, (_, hour) => ({
      label: `${String(hour).padStart(2, '0')}:00`,
      receita: 0,
      comandas: 0,
    }))

    for (const order of paid) {
      const hour = getSaoPauloHour(order.createdAt)
      if (!Number.isInteger(hour) || hour < 0 || hour > 23) continue
      hours[hour].receita += order.total
      hours[hour].comandas += 1
    }
    // Movimentações financeiras têm somente a data, portanto são exibidas ao meio-dia.
    for (const entry of extraRevenue) hours[12].receita += entry.amount

    return hours
  }

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
    for (const entry of extraRevenue) {
      const monthIndex = Number(toDateKey(entry.date).slice(5, 7)) - 1
      if (monthIndex >= 0 && monthIndex < months.length) months[monthIndex].receita += entry.amount
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
  for (const entry of extraRevenue) {
    const entryDate = toDateKey(entry.date)
    if (!entryDate) continue
    const index = Math.min(
      maxPoints - 1,
      Math.max(0, Math.floor(((new Date(`${entryDate}T00:00:00`).getTime() - new Date(`${range.start}T00:00:00`).getTime()) / 86400000 / days) * maxPoints)),
    )
    points[index].receita += entry.amount
  }

  return points.map(({ label, receita, comandas }) => ({ label, receita, comandas }))
}

function buildRevenueByMethod(orders: Order[], financialEntries: FinancialEntry[], range: DateRange) {
  const map = new Map<string, number>()
  for (const order of orders) {
    if (order.status !== 'paga' || !order.method || !isInsideRange(order.createdAt, range)) continue
    map.set(order.method, (map.get(order.method) ?? 0) + order.total)
  }
  for (const entry of financialEntries) {
    if (!isStandaloneRevenue(entry) || !entry.method || !isInsideRange(entry.date, range)) continue
    map.set(entry.method, (map.get(entry.method) ?? 0) + entry.amount)
  }

  return Object.entries(METHOD_LABEL).map(([method, label]) => ({
    method: label,
    value: map.get(method) ?? 0,
  }))
}

function buildRanking(orders: Order[], employees: Employee[], range: DateRange) {
  const map = new Map<string, { name: string; revenue: number; services: number }>()
  const employeeKeyByName = new Map(
    employees.map((employee) => [
      employee.name
        .trim()
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/\s+/g, ' '),
      employee.id,
    ]),
  )
  for (const order of orders) {
    if (order.status !== 'paga' || !isInsideRange(order.createdAt, range)) continue
    const normalizedName = order.employeeName
      .trim()
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/\s+/g, ' ')
    const key = order.employeeId || employeeKeyByName.get(normalizedName) || `name:${normalizedName}`
    const cur = map.get(key) ?? { name: order.employeeName, revenue: 0, services: 0 }
    cur.revenue += order.total
    cur.services += order.items.filter((item) => item.type === 'servico').length
    map.set(key, cur)
  }

  for (const employee of employees.filter((item) => item.active && isBarberRole(item.role))) {
    if (!map.has(employee.id)) {
      map.set(employee.id, { name: employee.name, revenue: 0, services: 0 })
    }
  }

  return Array.from(map.values()).sort((a, b) => b.revenue - a.revenue)
}

function isSubscriptionOrder(order: Order) {
  return order.items.some((item) => item.name.startsWith('[Assinatura]'))
}

export function DashboardClient({
  barbershopName,
  appointments,
  catalog,
  clients,
  commissions,
  employees,
  financialEntries,
  imports,
  orders,
  subscriptions,
  lowStockThreshold,
  isBarber = false,
  memberId,
  memberPhone,
  updateMemberPhone,
}: {
  barbershopName: string
  appointments: Appointment[]
  catalog: CatalogItem[]
  clients: Client[]
  commissions: Commission[]
  employees: Employee[]
  financialEntries: FinancialEntry[]
  imports: ImportRecord[]
  orders: Order[]
  subscriptions: Subscription[]
  lowStockThreshold: number
  isBarber?: boolean
  memberId: string
  memberPhone: string
  updateMemberPhone: (phone: string) => Promise<{ error?: string }>
}) {
  const dashboardOrders = orders
  const dashboardAppointments = appointments
  const [period, setPeriod] = React.useState<Period>('mes')
  const [range, setRange] = React.useState<DateRange>(() => getDefaultRange('mes'))
  const [isExportingPdf, setIsExportingPdf] = React.useState(false)
  const [exportError, setExportError] = React.useState('')
  const [returnFilter, setReturnFilter] = React.useState<ReturnFilter>(60)

  function handlePeriodChange(nextPeriod: Period) {
    setPeriod(nextPeriod)
    if (nextPeriod !== 'personalizado') {
      setRange(getDefaultRange(nextPeriod))
    }
  }

  const filteredOrders = dashboardOrders.filter((order) => isInsideRange(order.createdAt, range))
  const paidOrders = filteredOrders.filter((order) => order.status === 'paga')
  const extraRevenue = financialEntries.filter((entry) => isStandaloneRevenue(entry) && isInsideRange(entry.date, range))
  const filteredAppointments = dashboardAppointments.filter((appointment) => isInsideRange(appointment.date, range))
  const orderRevenue = paidOrders.reduce((sum, order) => sum + order.total, 0)
  const revenue = orderRevenue + extraRevenue.reduce((sum, entry) => sum + entry.amount, 0)
  const subscriptionOrderRevenue = paidOrders
    .filter(isSubscriptionOrder)
    .reduce((sum, order) => sum + order.total, 0)
  const subscriptionRevenueEntries = extraRevenue.filter((entry) => normalizeText(entry.category).includes('assinatura'))
  const otherRevenueEntries = extraRevenue.filter((entry) => !normalizeText(entry.category).includes('assinatura'))
  const subscriptionRevenue = subscriptionRevenueEntries.reduce((sum, entry) => sum + entry.amount, 0) + subscriptionOrderRevenue
  const otherRevenue = otherRevenueEntries.reduce((sum, entry) => sum + entry.amount, 0)
  const pdvRevenue = orderRevenue - subscriptionOrderRevenue
  const avgTicket = paidOrders.length > 0 ? orderRevenue / paidOrders.length : 0
  const openOrders = filteredOrders.filter((order) => order.status === 'aberta').length
  const pendingOrders = filteredOrders.filter((order) => order.status === 'pendente').length
  const firstClientActivity = buildFirstClientActivity(dashboardOrders, dashboardAppointments)
  const newClients = clients.filter((client) => {
    const effectiveStart = getEffectiveClientStartDate(client, firstClientActivity, imports)
    return isInsideRange(effectiveStart, range)
  }).length
  const atRiskClients = clients.filter((client) => client.tags.includes('inativo')).length
  const today = new Date().toISOString().slice(0, 10)
  const clientsWithoutReturn = getClientsWithoutReturn(clients, dashboardOrders, returnFilter, today)
  const activeSubs = subscriptions.filter((subscription) => subscription.status === 'ativo').length
  const expiringSubs = subscriptions.filter((subscription) => {
    const due = daysUntil(subscription.dueDate)
    return subscription.status === 'vencendo' || (due >= 0 && due <= 7)
  })
  const lowStock = catalog.filter(
    (item) => item.type === 'produto' && isLowStock(item.stock, item.minStock, lowStockThreshold),
  )
  const pendingCommissions = commissions
    .filter((commission) => commission.status === 'pendente' && isInsideRange(commission.date, range))
    .reduce((sum, commission) => sum + commission.amount, 0)

  const revenueSeries = buildRevenueSeries(dashboardOrders, financialEntries, range, period)
  const isSingleDay = range.start === range.end
  const revenueByMethod = buildRevenueByMethod(dashboardOrders, financialEntries, range)
  const ranking = buildRanking(dashboardOrders, employees, range)
  const maxRevenue = Math.max(1, ...ranking.map((item) => item.revenue))
  const expiredAppointments = filteredAppointments.filter((appointment) => isExpiredUnconfirmedAppointment(appointment, today))
  const upcoming = filteredAppointments
    .filter((appointment) => ['agendado', 'confirmado', 'chegou'].includes(appointment.status))
    .filter((appointment) => !isExpiredUnconfirmedAppointment(appointment, today))
    .sort((a, b) => (a.date + a.start).localeCompare(b.date + b.start))
    .slice(0, 6)

  async function handleExportPdf() {
    if (isExportingPdf) return
    setIsExportingPdf(true)
    setExportError('')

    const report: DashboardReport = {
      barbershopName,
      range,
      generatedAt: new Date().toISOString(),
      financial: {
        revenue,
        pdvRevenue,
        subscriptionRevenue,
        otherRevenue,
        averageTicket: avgTicket,
        pendingCommissions,
      },
      operational: {
        paidOrders: paidOrders.length,
        openOrders,
        pendingOrders,
        newClients,
        activeSubscriptions: activeSubs,
        atRiskClients,
        lowStockItems: lowStock.length,
      },
      revenueByMethod: revenueByMethod.filter((item) => item.value > 0),
      ranking,
      paidOrders: paidOrders.map((order) => ({
        number: order.number,
        date: order.createdAt,
        clientName: order.clientName,
        employeeName: order.employeeName,
        method: order.method ? (METHOD_LABEL[order.method] ?? order.method) : 'Nao informado',
        total: order.total,
      })),
    }

    try {
      const { downloadDashboardReportPdf } = await import('@/lib/dashboard-report-pdf')
      downloadDashboardReportPdf(report)
    } catch {
      setExportError('Nao foi possivel gerar o PDF. Tente novamente.')
    } finally {
      setIsExportingPdf(false)
    }
  }

  return (
    <div>
      <PageHeader
        title={isBarber ? 'Meu painel' : 'Dashboard'}
        description={isBarber ? 'Sua agenda, produção, faturamento e comissões.' : 'Visão geral da operação da sua barbearia.'}
      />

      <OwnerPhoneReminder memberId={memberId} phone={memberPhone} updateMemberPhone={updateMemberPhone} />

      <DashboardPeriodControls
        period={period}
        range={range}
        onPeriodChange={handlePeriodChange}
        onRangeChange={(nextRange) => {
          setPeriod('personalizado')
          setRange(nextRange)
        }}
        onExportPdf={handleExportPdf}
        isExportingPdf={isExportingPdf}
      />
      {exportError ? <p role="alert" className="-mt-3 mb-5 text-sm font-medium text-destructive">{exportError}</p> : null}

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard
          label="Receita do período"
          value={formatCurrency(revenue)}
          icon={DollarSign}
          accent="primary"
          details={
            <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-[11px]">
              <span className="inline-flex items-center gap-1 font-medium text-foreground">
                <span className="size-2 rounded-full bg-primary" />
                PDV {formatCurrency(pdvRevenue)}
              </span>
              <span className="text-muted-foreground">·</span>
              <span className="inline-flex items-center gap-1 font-medium text-foreground">
                <span className="size-2 rounded-full bg-gold" />
                Assinaturas {formatCurrency(subscriptionRevenue)}
              </span>
              {otherRevenue > 0 ? (
                <>
                  <span className="text-muted-foreground">·</span>
                  <span className="font-medium text-foreground">Outras {formatCurrency(otherRevenue)}</span>
                </>
              ) : null}
            </div>
          }
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

      {!isBarber ? <div className="mt-3 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard
          label="Clientes novos"
          value={String(newClients)}
          icon={Users}
          accent="primary"
          hint="no período"
          href={`/clientes?filtro=novos&inicio=${range.start}&fim=${range.end}`}
        />
        <StatCard label="Assinaturas ativas" value={String(activeSubs)} icon={CreditCard} accent="success" hint={`${expiringSubs.length} vencendo`} />
        <StatCard label="Clientes sem retorno" value={String(clientsWithoutReturn.length)} icon={AlertTriangle} accent="destructive" hint={`há ${returnFilter} dias`} />
        <StatCard label="Estoque baixo" value={String(lowStock.length)} icon={PackageX} accent="warning" hint="produtos" />
      </div> : null}

      <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader className="flex-row items-center justify-between">
            <div>
              <CardTitle>{isSingleDay ? 'Faturamento por horário' : 'Receita no período'}</CardTitle>
              <p className="text-sm text-muted-foreground">
                {isSingleDay ? 'Distribuição das vendas ao longo do dia' : `Total filtrado: ${formatCurrency(revenue)}`}
              </p>
            </div>
          </CardHeader>
          <CardContent>
            <RevenueChart data={revenueSeries} hourly={isSingleDay} />
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
              {isBarber ? 'Meu desempenho' : 'Ranking de barbeiros'}
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

        {!isBarber ? <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="size-4 text-muted-foreground" />
              Alertas
            </CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            <div className="flex items-center justify-between gap-3 rounded-md bg-muted/50 p-3">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Clientes sem retorno</p>
                <p className="text-2xl font-semibold text-foreground">{clientsWithoutReturn.length}</p>
                <p className="text-xs text-muted-foreground">há {returnFilter} dias ou mais</p>
              </div>
              <Select aria-label="Período sem retorno" value={returnFilter} onChange={(event) => setReturnFilter(Number(event.target.value) as ReturnFilter)} className="h-8 w-auto text-xs">
                <option value="30">30 dias</option>
                <option value="60">60 dias</option>
                <option value="90">90 dias</option>
              </Select>
            </div>
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
        </Card> : null}
      </div>
    </div>
  )
}
