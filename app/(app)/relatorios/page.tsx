'use client'

import * as React from 'react'
import { ArrowDownRight, ArrowUpRight, BarChart3, Cake, Contact, Download, Minus, Package, Users } from 'lucide-react'
import { PageHeader } from '@/components/page-header'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { useAppData } from '@/components/data/app-data-provider'
import { getDefaultRange, type DateRange, type Period } from '@/components/dashboard/period-controls'
import { formatCurrency } from '@/lib/format'
import { downloadExcelWorkbook } from '@/lib/spreadsheet-export'
import { cn } from '@/lib/utils'
import type { FinancialEntry, Order } from '@/lib/types'

const METHOD_LABEL: Record<string, string> = { dinheiro: 'Dinheiro', pix: 'Pix', credito: 'Crédito', debito: 'Débito', outro: 'Outro' }
const orderFinanceDescription = (n: number) => `Comanda #${n}`

const periodTabs: { value: Period; label: string }[] = [
  { value: 'hoje', label: 'Hoje' },
  { value: 'semana', label: 'Semana' },
  { value: 'mes', label: 'Mês' },
  { value: 'ano', label: 'Ano' },
  { value: 'personalizado', label: 'Personalizado' },
]

const periodLabel: Record<Period, string> = { hoje: 'hoje', semana: 'nesta semana', mes: 'neste mês', ano: 'neste ano', personalizado: 'no período' }

function localIso(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
}

function previousRange(range: DateRange): DateRange {
  const start = new Date(`${range.start}T00:00:00`)
  const end = new Date(`${range.end}T00:00:00`)
  const days = Math.round((end.getTime() - start.getTime()) / 86400000) + 1
  const prevEnd = new Date(start)
  prevEnd.setDate(start.getDate() - 1)
  const prevStart = new Date(prevEnd)
  prevStart.setDate(prevEnd.getDate() - (days - 1))
  return { start: localIso(prevStart), end: localIso(prevEnd) }
}

export default function RelatoriosPage() {
  const { barbershop, member, financialEntries, orders, appointments, commissions, employees, catalog, clients } = useAppData()
  const [period, setPeriod] = React.useState<Period>('mes')
  const [range, setRange] = React.useState<DateRange>(() => getDefaultRange('mes'))

  const isManager = member.role === 'owner' || member.role === 'manager'

  function selectPeriod(next: Period) {
    setPeriod(next)
    if (next !== 'personalizado') setRange(getDefaultRange(next))
  }
  function changeStart(start: string) {
    if (!start) return
    setRange((r) => ({ start, end: start > r.end ? start : r.end }))
  }
  function changeEnd(end: string) {
    if (!end) return
    setRange((r) => ({ start: end < r.start ? end : r.start, end }))
  }

  const allEntries = React.useMemo<FinancialEntry[]>(() => {
    const registered = new Set(financialEntries.filter((e) => e.category === 'Comandas').map((e) => e.description))
    const orderEntries: FinancialEntry[] = orders
      .filter((o) => o.status === 'paga' && o.total > 0 && !registered.has(orderFinanceDescription(o.number)))
      .map((o: Order) => ({
        id: `order-${o.id}`,
        barbershopId: o.barbershopId,
        orderId: o.id,
        type: 'entrada',
        category: 'Comandas',
        description: orderFinanceDescription(o.number),
        amount: o.total,
        method: o.method,
        date: o.createdAt.slice(0, 10),
      }))
    return [...financialEntries, ...orderEntries]
  }, [financialEntries, orders])

  const report = React.useMemo(() => {
    const within = (r: DateRange) => allEntries.filter((e) => e.date >= r.start && e.date <= r.end)
    const summarize = (rows: FinancialEntry[]) => {
      const income = rows.filter((e) => e.type === 'entrada').reduce((s, e) => s + e.amount, 0)
      const outcome = rows.filter((e) => e.type === 'saida').reduce((s, e) => s + e.amount, 0)
      const incomeCount = rows.filter((e) => e.type === 'entrada').length
      return { income, outcome, balance: income - outcome, incomeCount, ticket: incomeCount ? income / incomeCount : 0 }
    }

    const rows = within(range)
    const current = summarize(rows)
    const previous = summarize(within(previousRange(range)))
    const delta = previous.income > 0 ? (current.income - previous.income) / previous.income : null

    const catMap = new Map<string, { entrada: number; saida: number }>()
    const methodMap = new Map<string, number>()
    for (const e of rows) {
      const bucket = catMap.get(e.category) ?? { entrada: 0, saida: 0 }
      if (e.type === 'entrada') bucket.entrada += e.amount
      else bucket.saida += e.amount
      catMap.set(e.category, bucket)
      if (e.type === 'entrada') {
        const key = e.method ?? 'outro'
        methodMap.set(key, (methodMap.get(key) ?? 0) + e.amount)
      }
    }
    const byCategory = Array.from(catMap.entries())
      .map(([categoria, v]) => ({ categoria, entradas: v.entrada, saidas: v.saida, saldo: v.entrada - v.saida }))
      .sort((a, b) => b.entradas - a.entradas)
    const byMethod = Array.from(methodMap.entries())
      .map(([m, value]) => ({ metodo: METHOD_LABEL[m] ?? m, value }))
      .sort((a, b) => b.value - a.value)

    return { ...current, previous, delta, byCategory, byMethod }
  }, [allEntries, range])

  const staff = React.useMemo(() => {
    const inRange = (date: string) => date >= range.start && date <= range.end
    const nameById = new Map(employees.map((e) => [e.id, e.name]))
    type Row = { faturamento: number; comandas: number; atendimentos: number; comGerada: number; comPaga: number; comPendente: number }
    const map = new Map<string, Row>()
    const get = (id: string) => {
      let row = map.get(id)
      if (!row) { row = { faturamento: 0, comandas: 0, atendimentos: 0, comGerada: 0, comPaga: 0, comPendente: 0 }; map.set(id, row) }
      return row
    }
    for (const o of orders) {
      if (o.status === 'paga' && o.total > 0 && o.employeeId && inRange(o.createdAt.slice(0, 10))) {
        const row = get(o.employeeId); row.faturamento += o.total; row.comandas += 1
        if (!nameById.has(o.employeeId) && o.employeeName) nameById.set(o.employeeId, o.employeeName)
      }
    }
    for (const a of appointments) {
      if (a.status === 'concluido' && a.employeeId && inRange(a.date)) {
        const row = get(a.employeeId); row.atendimentos += 1
        if (!nameById.has(a.employeeId) && a.employeeName) nameById.set(a.employeeId, a.employeeName)
      }
    }
    for (const c of commissions) {
      if (c.employeeId && inRange(c.date)) {
        const row = get(c.employeeId); row.comGerada += c.amount
        if (c.status === 'paga') row.comPaga += c.amount; else row.comPendente += c.amount
        if (!nameById.has(c.employeeId) && c.employeeName) nameById.set(c.employeeId, c.employeeName)
      }
    }
    const rows = Array.from(map.entries())
      .map(([id, r]) => ({ id, nome: nameById.get(id) ?? 'Sem nome', ...r, ticket: r.comandas ? r.faturamento / r.comandas : 0 }))
      .sort((a, b) => b.faturamento - a.faturamento)
    const totalFat = rows.reduce((s, r) => s + r.faturamento, 0)
    const totalPendente = rows.reduce((s, r) => s + r.comPendente, 0)
    return { rows, totalFat, totalPendente, top: rows[0] ?? null }
  }, [orders, appointments, commissions, employees, range])

  const catalogReport = React.useMemo(() => {
    const inRange = (date: string) => date >= range.start && date <= range.end
    const catById = new Map(catalog.map((c) => [c.id, c]))
    type Row = { refId: string; nome: string; tipo: string; quantidade: number; receita: number; custo: number }
    const map = new Map<string, Row>()
    for (const o of orders) {
      if (o.status !== 'paga' || !inRange(o.createdAt.slice(0, 10))) continue
      for (const it of o.items) {
        const key = it.refId || it.name
        let row = map.get(key)
        if (!row) { row = { refId: key, nome: it.name, tipo: it.type === 'produto' ? 'Produto' : 'Serviço', quantidade: 0, receita: 0, custo: 0 }; map.set(key, row) }
        const cat = catById.get(it.refId)
        row.quantidade += it.quantity
        row.receita += it.quantity * it.unitPrice
        row.custo += it.quantity * (cat?.cost ?? 0)
      }
    }
    const sorted = Array.from(map.values())
      .map((r) => ({ ...r, margem: r.receita - r.custo, margemPct: r.receita ? (r.receita - r.custo) / r.receita : 0 }))
      .sort((a, b) => b.receita - a.receita)
    const totalReceita = sorted.reduce((s, r) => s + r.receita, 0)
    let cumulative = 0
    const rows = sorted.map((r) => {
      cumulative += r.receita
      const share = totalReceita ? cumulative / totalReceita : 0
      const abc: 'A' | 'B' | 'C' = share <= 0.8 ? 'A' : share <= 0.95 ? 'B' : 'C'
      return { ...r, abc }
    })
    const totalMargem = rows.reduce((s, r) => s + r.margem, 0)
    const totalQtd = rows.reduce((s, r) => s + r.quantidade, 0)
    return { rows, totalReceita, totalMargem, totalQtd, top: rows[0] ?? null }
  }, [orders, catalog, range])

  const clientsReport = React.useMemo(() => {
    const inRange = (date: string) => date >= range.start && date <= range.end
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const INACTIVE_DAYS = 60
    const daysSince = (iso?: string) => {
      if (!iso) return Infinity
      const d = new Date(`${iso.slice(0, 10)}T00:00:00`)
      if (Number.isNaN(d.getTime())) return Infinity
      return Math.floor((today.getTime() - d.getTime()) / 86400000)
    }
    const novos = clients.filter((c) => c.createdAt && inRange(c.createdAt.slice(0, 10)))
    const recorrentesCount = clients.filter((c) => (c.visits ?? 0) >= 2).length
    const inativos = clients
      .filter((c) => c.lastVisit && daysSince(c.lastVisit) > INACTIVE_DAYS)
      .map((c) => ({ ...c, dias: daysSince(c.lastVisit) }))
      .sort((a, b) => b.dias - a.dias)
    const topClientes = [...clients]
      .filter((c) => (c.totalSpent ?? 0) > 0)
      .sort((a, b) => (b.totalSpent ?? 0) - (a.totalSpent ?? 0))
      .slice(0, 10)
    const currentMonth = today.getMonth() + 1
    const aniversariantes = clients
      .filter((c) => c.birthDate && Number(c.birthDate.slice(5, 7)) === currentMonth)
      .sort((a, b) => Number(a.birthDate.slice(8, 10)) - Number(b.birthDate.slice(8, 10)))
    return { novos, recorrentesCount, inativos, topClientes, aniversariantes, total: clients.length, inactiveDays: INACTIVE_DAYS }
  }, [clients, range])

  function exportReport() {
    const periodText = `${new Intl.DateTimeFormat('pt-BR').format(new Date(`${range.start}T00:00:00`))} a ${new Intl.DateTimeFormat('pt-BR').format(new Date(`${range.end}T00:00:00`))}`
    downloadExcelWorkbook(`relatorio-faturamento-${range.start}-a-${range.end}`, [
      {
        name: 'Resumo', title: 'Relatório de faturamento', subtitle: `${barbershop.name} • ${periodText}`,
        columns: [{ key: 'indicador', label: 'Indicador', width: 220 }, { key: 'valor', label: 'Valor', width: 130, kind: 'currency' }],
        rows: [
          { indicador: 'Faturamento (entradas)', valor: report.income },
          { indicador: 'Saídas', valor: -report.outcome },
          { indicador: 'Saldo', valor: report.balance },
          { indicador: 'Ticket médio', valor: report.ticket },
          { indicador: 'Faturamento período anterior', valor: report.previous.income },
        ],
      },
      {
        name: 'Por categoria', title: 'Faturamento por categoria', subtitle: `${barbershop.name} • ${periodText}`,
        columns: [
          { key: 'categoria', label: 'Categoria', width: 170 },
          { key: 'entradas', label: 'Entradas', width: 115, kind: 'currency' },
          { key: 'saidas', label: 'Saídas', width: 115, kind: 'currency' },
          { key: 'saldo', label: 'Saldo', width: 115, kind: 'currency' },
        ],
        rows: report.byCategory.map((c) => ({ categoria: c.categoria, entradas: c.entradas, saidas: -c.saidas, saldo: c.saldo })),
      },
      {
        name: 'Por método', title: 'Entradas por método de pagamento', subtitle: `${barbershop.name} • ${periodText}`,
        columns: [{ key: 'metodo', label: 'Método', width: 170 }, { key: 'valor', label: 'Entradas', width: 130, kind: 'currency' }],
        rows: report.byMethod.map((m) => ({ metodo: m.metodo, valor: m.value })),
      },
    ])
  }

  function exportStaff() {
    const periodText = `${new Intl.DateTimeFormat('pt-BR').format(new Date(`${range.start}T00:00:00`))} a ${new Intl.DateTimeFormat('pt-BR').format(new Date(`${range.end}T00:00:00`))}`
    downloadExcelWorkbook(`relatorio-profissionais-${range.start}-a-${range.end}`, [
      {
        name: 'Profissionais', title: 'Desempenho por profissional', subtitle: `${barbershop.name} • ${periodText}`,
        columns: [
          { key: 'nome', label: 'Profissional', width: 180 },
          { key: 'atendimentos', label: 'Atendimentos', width: 110, kind: 'number' },
          { key: 'comandas', label: 'Comandas', width: 100, kind: 'number' },
          { key: 'faturamento', label: 'Faturamento', width: 120, kind: 'currency' },
          { key: 'ticket', label: 'Ticket médio', width: 110, kind: 'currency' },
          { key: 'comGerada', label: 'Comissão gerada', width: 130, kind: 'currency' },
          { key: 'comPaga', label: 'Comissão paga', width: 120, kind: 'currency' },
          { key: 'comPendente', label: 'Comissão pendente', width: 140, kind: 'currency' },
        ],
        rows: staff.rows.map((r) => ({ nome: r.nome, atendimentos: r.atendimentos, comandas: r.comandas, faturamento: r.faturamento, ticket: r.ticket, comGerada: r.comGerada, comPaga: r.comPaga, comPendente: r.comPendente })),
      },
    ])
  }

  function exportCatalog() {
    const periodText = `${new Intl.DateTimeFormat('pt-BR').format(new Date(`${range.start}T00:00:00`))} a ${new Intl.DateTimeFormat('pt-BR').format(new Date(`${range.end}T00:00:00`))}`
    downloadExcelWorkbook(`relatorio-itens-${range.start}-a-${range.end}`, [
      {
        name: 'Itens', title: 'Serviços e produtos mais vendidos', subtitle: `${barbershop.name} • ${periodText}`,
        columns: [
          { key: 'nome', label: 'Item', width: 200 },
          { key: 'tipo', label: 'Tipo', width: 90 },
          { key: 'quantidade', label: 'Qtd', width: 70, kind: 'number' },
          { key: 'receita', label: 'Receita', width: 120, kind: 'currency' },
          { key: 'custo', label: 'Custo', width: 110, kind: 'currency' },
          { key: 'margem', label: 'Margem', width: 120, kind: 'currency' },
          { key: 'margemPct', label: 'Margem %', width: 90 },
          { key: 'abc', label: 'Curva ABC', width: 90 },
        ],
        rows: catalogReport.rows.map((r) => ({ nome: r.nome, tipo: r.tipo, quantidade: r.quantidade, receita: r.receita, custo: r.custo, margem: r.margem, margemPct: `${(r.margemPct * 100).toFixed(1)}%`, abc: r.abc })),
      },
    ])
  }

  function exportClients() {
    downloadExcelWorkbook(`relatorio-clientes-${range.start}-a-${range.end}`, [
      {
        name: 'Top clientes', title: 'Top clientes por gasto (LTV)', subtitle: barbershop.name,
        columns: [
          { key: 'nome', label: 'Cliente', width: 200 },
          { key: 'telefone', label: 'Telefone', width: 130 },
          { key: 'totalGasto', label: 'Total gasto', width: 120, kind: 'currency' },
          { key: 'visitas', label: 'Visitas', width: 80, kind: 'number' },
        ],
        rows: clientsReport.topClientes.map((c) => ({ nome: c.name, telefone: c.phone, totalGasto: c.totalSpent ?? 0, visitas: c.visits ?? 0 })),
      },
      {
        name: 'Inativos', title: `Clientes inativos (+${clientsReport.inactiveDays} dias)`, subtitle: barbershop.name,
        columns: [
          { key: 'nome', label: 'Cliente', width: 200 },
          { key: 'telefone', label: 'Telefone', width: 130 },
          { key: 'dias', label: 'Dias sem voltar', width: 120, kind: 'number' },
        ],
        rows: clientsReport.inativos.map((c) => ({ nome: c.name, telefone: c.phone, dias: c.dias })),
      },
      {
        name: 'Aniversariantes', title: 'Aniversariantes do mês', subtitle: barbershop.name,
        columns: [
          { key: 'nome', label: 'Cliente', width: 200 },
          { key: 'data', label: 'Aniversário', width: 100 },
          { key: 'telefone', label: 'Telefone', width: 130 },
        ],
        rows: clientsReport.aniversariantes.map((c) => ({ nome: c.name, data: `${c.birthDate.slice(8, 10)}/${c.birthDate.slice(5, 7)}`, telefone: c.phone })),
      },
    ])
  }

  if (!isManager) {
    return (
      <div>
        <PageHeader title="Relatórios" description="Análises detalhadas do seu negócio." />
        <Card className="p-6">
          <p className="text-sm text-muted-foreground">Apenas proprietário ou gerente têm acesso aos relatórios.</p>
        </Card>
      </div>
    )
  }

  const maxIncome = Math.max(...report.byCategory.map((c) => c.entradas), 1)

  return (
    <div>
      <PageHeader title="Relatórios" description="Análises detalhadas do seu negócio, com filtro de período e exportação." />

      <div className="mb-6 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="grid grid-cols-2 gap-1 rounded-lg bg-muted p-1 sm:grid-cols-5 lg:max-w-xl lg:flex-1">
          {periodTabs.map((tab) => (
            <button
              key={tab.value}
              type="button"
              onClick={() => selectPeriod(tab.value)}
              className={cn(
                'h-10 rounded-md px-3 text-sm font-semibold transition-colors',
                tab.value === period ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground',
              )}
            >
              {tab.label}
            </button>
          ))}
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {period === 'personalizado' ? (
            <>
              <Input type="date" value={range.start} max={range.end} onChange={(e) => changeStart(e.target.value)} className="h-10 w-auto" aria-label="Data inicial" />
              <span className="text-sm text-muted-foreground">até</span>
              <Input type="date" value={range.end} min={range.start} onChange={(e) => changeEnd(e.target.value)} className="h-10 w-auto" aria-label="Data final" />
            </>
          ) : null}
        </div>
      </div>

      <section>
        <div className="mb-3 flex items-center justify-between gap-2">
          <h2 className="flex items-center gap-2 text-lg font-semibold text-foreground">
            <BarChart3 className="size-5 text-primary" />
            Faturamento {periodLabel[period]}
          </h2>
          <Button variant="outline" size="sm" onClick={exportReport}><Download className="size-4" />Exportar</Button>
        </div>

        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          <Card className="p-4">
            <p className="text-sm text-muted-foreground">Faturamento</p>
            <p className="mt-1 text-2xl font-bold text-success">{formatCurrency(report.income)}</p>
            {report.delta !== null ? (
              <p className={cn('mt-1 inline-flex items-center gap-1 text-xs font-semibold', report.delta >= 0 ? 'text-success' : 'text-destructive')}>
                {report.delta >= 0 ? <ArrowUpRight className="size-3.5" /> : <ArrowDownRight className="size-3.5" />}
                {Math.abs(report.delta * 100).toFixed(1)}% vs. período anterior
              </p>
            ) : (
              <p className="mt-1 inline-flex items-center gap-1 text-xs text-muted-foreground"><Minus className="size-3.5" />sem base anterior</p>
            )}
          </Card>
          <Card className="p-4">
            <p className="text-sm text-muted-foreground">Saídas</p>
            <p className="mt-1 text-2xl font-bold text-destructive">{formatCurrency(report.outcome)}</p>
          </Card>
          <Card className="p-4">
            <p className="text-sm text-muted-foreground">Saldo</p>
            <p className="mt-1 text-2xl font-bold text-foreground">{formatCurrency(report.balance)}</p>
          </Card>
          <Card className="p-4">
            <p className="text-sm text-muted-foreground">Ticket médio</p>
            <p className="mt-1 text-2xl font-bold text-foreground">{formatCurrency(report.ticket)}</p>
            <p className="mt-1 text-xs text-muted-foreground">{report.incomeCount} entradas</p>
          </Card>
        </div>

        <div className="mt-4 grid gap-4 lg:grid-cols-2">
          <Card className="p-5">
            <h3 className="mb-4 font-semibold text-foreground">Faturamento por categoria</h3>
            {report.byCategory.length ? (
              <div className="space-y-3">
                {report.byCategory.map((c) => (
                  <div key={c.categoria}>
                    <div className="mb-1 flex items-center justify-between text-sm">
                      <span className="text-foreground">{c.categoria}</span>
                      <span className="font-semibold text-foreground">{formatCurrency(c.entradas)}</span>
                    </div>
                    <div className="h-2 overflow-hidden rounded-full bg-muted">
                      <div className="h-full rounded-full bg-primary" style={{ width: `${(c.entradas / maxIncome) * 100}%` }} />
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">Nenhuma entrada no período.</p>
            )}
          </Card>
          <Card className="p-5">
            <h3 className="mb-4 font-semibold text-foreground">Por método de pagamento</h3>
            {report.byMethod.length ? (
              <div className="space-y-2">
                {report.byMethod.map((m) => (
                  <div key={m.metodo} className="flex items-center justify-between border-b border-border/60 pb-2 text-sm last:border-0 last:pb-0">
                    <span className="text-muted-foreground">{m.metodo}</span>
                    <span className="font-semibold text-foreground">{formatCurrency(m.value)}</span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">Nenhuma entrada no período.</p>
            )}
          </Card>
        </div>
      </section>

      <section className="mt-8">
        <div className="mb-3 flex items-center justify-between gap-2">
          <h2 className="flex items-center gap-2 text-lg font-semibold text-foreground">
            <Users className="size-5 text-primary" />
            Desempenho por profissional {periodLabel[period]}
          </h2>
          <Button variant="outline" size="sm" onClick={exportStaff}><Download className="size-4" />Exportar</Button>
        </div>

        <div className="grid grid-cols-2 gap-3 lg:grid-cols-3">
          <Card className="p-4">
            <p className="text-sm text-muted-foreground">Faturamento da equipe</p>
            <p className="mt-1 text-2xl font-bold text-foreground">{formatCurrency(staff.totalFat)}</p>
          </Card>
          <Card className="p-4">
            <p className="text-sm text-muted-foreground">Comissões pendentes</p>
            <p className="mt-1 text-2xl font-bold text-destructive">{formatCurrency(staff.totalPendente)}</p>
          </Card>
          <Card className="p-4">
            <p className="text-sm text-muted-foreground">Destaque</p>
            <p className="mt-1 truncate text-2xl font-bold text-foreground">{staff.top ? staff.top.nome : '—'}</p>
            {staff.top ? <p className="mt-1 text-xs text-muted-foreground">{formatCurrency(staff.top.faturamento)} no período</p> : null}
          </Card>
        </div>

        <Card className="mt-4 overflow-hidden">
          {staff.rows.length ? (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[720px] text-sm">
                <thead className="bg-muted/50 text-left">
                  <tr>
                    <th className="px-4 py-3 font-semibold text-foreground">Profissional</th>
                    <th className="px-4 py-3 text-right font-semibold text-foreground">Atend.</th>
                    <th className="px-4 py-3 text-right font-semibold text-foreground">Faturamento</th>
                    <th className="px-4 py-3 text-right font-semibold text-foreground">Ticket médio</th>
                    <th className="px-4 py-3 text-right font-semibold text-foreground">Com. gerada</th>
                    <th className="px-4 py-3 text-right font-semibold text-foreground">Com. paga</th>
                    <th className="px-4 py-3 text-right font-semibold text-foreground">Com. pendente</th>
                  </tr>
                </thead>
                <tbody>
                  {staff.rows.map((r) => (
                    <tr key={r.id} className="border-t border-border/60">
                      <td className="px-4 py-3 font-medium text-foreground">{r.nome}</td>
                      <td className="px-4 py-3 text-right text-muted-foreground">{r.atendimentos}</td>
                      <td className="px-4 py-3 text-right font-semibold text-foreground">{formatCurrency(r.faturamento)}</td>
                      <td className="px-4 py-3 text-right text-muted-foreground">{formatCurrency(r.ticket)}</td>
                      <td className="px-4 py-3 text-right text-muted-foreground">{formatCurrency(r.comGerada)}</td>
                      <td className="px-4 py-3 text-right text-success">{formatCurrency(r.comPaga)}</td>
                      <td className="px-4 py-3 text-right text-destructive">{formatCurrency(r.comPendente)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="p-6 text-sm text-muted-foreground">Nenhuma atividade de profissional no período.</p>
          )}
        </Card>
      </section>

      <section className="mt-8">
        <div className="mb-3 flex items-center justify-between gap-2">
          <h2 className="flex items-center gap-2 text-lg font-semibold text-foreground">
            <Package className="size-5 text-primary" />
            Serviços &amp; produtos mais vendidos {periodLabel[period]}
          </h2>
          <Button variant="outline" size="sm" onClick={exportCatalog}><Download className="size-4" />Exportar</Button>
        </div>

        <div className="grid grid-cols-2 gap-3 lg:grid-cols-3">
          <Card className="p-4">
            <p className="text-sm text-muted-foreground">Receita em itens</p>
            <p className="mt-1 text-2xl font-bold text-foreground">{formatCurrency(catalogReport.totalReceita)}</p>
            <p className="mt-1 text-xs text-muted-foreground">{catalogReport.totalQtd} itens vendidos</p>
          </Card>
          <Card className="p-4">
            <p className="text-sm text-muted-foreground">Margem total</p>
            <p className="mt-1 text-2xl font-bold text-success">{formatCurrency(catalogReport.totalMargem)}</p>
          </Card>
          <Card className="p-4">
            <p className="text-sm text-muted-foreground">Mais vendido</p>
            <p className="mt-1 truncate text-2xl font-bold text-foreground">{catalogReport.top ? catalogReport.top.nome : '—'}</p>
            {catalogReport.top ? <p className="mt-1 text-xs text-muted-foreground">{formatCurrency(catalogReport.top.receita)} em receita</p> : null}
          </Card>
        </div>

        <Card className="mt-4 overflow-hidden">
          {catalogReport.rows.length ? (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[760px] text-sm">
                <thead className="bg-muted/50 text-left">
                  <tr>
                    <th className="px-4 py-3 font-semibold text-foreground">Item</th>
                    <th className="px-4 py-3 font-semibold text-foreground">Tipo</th>
                    <th className="px-4 py-3 text-right font-semibold text-foreground">Qtd</th>
                    <th className="px-4 py-3 text-right font-semibold text-foreground">Receita</th>
                    <th className="px-4 py-3 text-right font-semibold text-foreground">Margem</th>
                    <th className="px-4 py-3 text-right font-semibold text-foreground">Margem %</th>
                    <th className="px-4 py-3 text-center font-semibold text-foreground">ABC</th>
                  </tr>
                </thead>
                <tbody>
                  {catalogReport.rows.map((r) => (
                    <tr key={r.refId} className="border-t border-border/60">
                      <td className="px-4 py-3 font-medium text-foreground">{r.nome}</td>
                      <td className="px-4 py-3 text-muted-foreground">{r.tipo}</td>
                      <td className="px-4 py-3 text-right text-muted-foreground">{r.quantidade}</td>
                      <td className="px-4 py-3 text-right font-semibold text-foreground">{formatCurrency(r.receita)}</td>
                      <td className="px-4 py-3 text-right text-foreground">{formatCurrency(r.margem)}</td>
                      <td className="px-4 py-3 text-right text-muted-foreground">{(r.margemPct * 100).toFixed(0)}%</td>
                      <td className="px-4 py-3 text-center">
                        <span className={cn('inline-flex size-6 items-center justify-center rounded-full text-xs font-bold', r.abc === 'A' ? 'bg-success/15 text-success' : r.abc === 'B' ? 'bg-gold/20 text-gold-foreground' : 'bg-muted text-muted-foreground')}>{r.abc}</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="p-6 text-sm text-muted-foreground">Nenhum item vendido no período.</p>
          )}
        </Card>
      </section>

      <section className="mt-8">
        <div className="mb-3 flex items-center justify-between gap-2">
          <h2 className="flex items-center gap-2 text-lg font-semibold text-foreground">
            <Contact className="size-5 text-primary" />
            Clientes
          </h2>
          <Button variant="outline" size="sm" onClick={exportClients}><Download className="size-4" />Exportar</Button>
        </div>

        <div className="grid grid-cols-3 gap-3">
          <Card className="p-4">
            <p className="text-sm text-muted-foreground">Novos {periodLabel[period]}</p>
            <p className="mt-1 text-2xl font-bold text-success">{clientsReport.novos.length}</p>
          </Card>
          <Card className="p-4">
            <p className="text-sm text-muted-foreground">Recorrentes</p>
            <p className="mt-1 text-2xl font-bold text-foreground">{clientsReport.recorrentesCount}</p>
            <p className="mt-1 text-xs text-muted-foreground">de {clientsReport.total} clientes</p>
          </Card>
          <Card className="p-4">
            <p className="text-sm text-muted-foreground">Inativos</p>
            <p className="mt-1 text-2xl font-bold text-destructive">{clientsReport.inativos.length}</p>
            <p className="mt-1 text-xs text-muted-foreground">+{clientsReport.inactiveDays} dias sem voltar</p>
          </Card>
        </div>

        <div className="mt-4 grid gap-4 lg:grid-cols-2">
          <Card className="p-5">
            <h3 className="mb-4 font-semibold text-foreground">Top clientes por gasto</h3>
            {clientsReport.topClientes.length ? (
              <div className="space-y-3">
                {clientsReport.topClientes.map((c, i) => (
                  <div key={c.id} className="flex items-center gap-3">
                    <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">{i + 1}</span>
                    <span className="flex-1 truncate text-sm text-foreground">{c.name}</span>
                    <span className="text-xs text-muted-foreground">{c.visits ?? 0} visitas</span>
                    <span className="text-sm font-semibold text-foreground">{formatCurrency(c.totalSpent ?? 0)}</span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">Sem histórico de gastos ainda.</p>
            )}
          </Card>
          <Card className="p-5">
            <h3 className="mb-4 flex items-center gap-2 font-semibold text-foreground"><Cake className="size-4 text-gold-foreground" />Aniversariantes do mês</h3>
            {clientsReport.aniversariantes.length ? (
              <div className="space-y-2">
                {clientsReport.aniversariantes.map((c) => (
                  <div key={c.id} className="flex items-center justify-between border-b border-border/60 pb-2 text-sm last:border-0 last:pb-0">
                    <span className="truncate text-foreground">{c.name}</span>
                    <span className="shrink-0 text-muted-foreground">{c.birthDate.slice(8, 10)}/{c.birthDate.slice(5, 7)} · {c.phone || 's/ telefone'}</span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">Nenhum aniversariante este mês.</p>
            )}
          </Card>
        </div>

        {clientsReport.inativos.length ? (
          <Card className="mt-4 p-5">
            <h3 className="mb-4 font-semibold text-foreground">Clientes inativos (+{clientsReport.inactiveDays} dias)</h3>
            <div className="grid gap-2 sm:grid-cols-2">
              {clientsReport.inativos.slice(0, 12).map((c) => (
                <div key={c.id} className="flex items-center justify-between rounded-lg border border-border/60 px-3 py-2 text-sm">
                  <span className="truncate text-foreground">{c.name}</span>
                  <span className="shrink-0 text-xs text-muted-foreground">há {c.dias} dias</span>
                </div>
              ))}
            </div>
            {clientsReport.inativos.length > 12 ? <p className="mt-3 text-xs text-muted-foreground">+{clientsReport.inativos.length - 12} outros — veja a lista completa no Excel.</p> : null}
          </Card>
        ) : null}
      </section>
    </div>
  )
}
