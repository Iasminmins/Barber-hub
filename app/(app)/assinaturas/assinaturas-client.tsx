'use client'

import * as React from 'react'
import Link from 'next/link'
import { CalendarDays, CreditCard, DollarSign, Edit3, ListChecks, Pencil, Plus, ReceiptText, Repeat, Save, Search, TrendingUp, Users } from 'lucide-react'
import { PageHeader } from '@/components/page-header'
import { StatusBadge } from '@/components/status-badge'
import { Badge } from '@/components/ui/badge'
import { Button, buttonVariants } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Dialog, DialogHeader } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Progress } from '@/components/ui/progress'
import { Select } from '@/components/ui/select'
import { Tabs } from '@/components/ui/tabs'
import { Textarea } from '@/components/ui/textarea'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { daysUntil, formatCurrency, formatDate } from '@/lib/format'
import type { CatalogItem, FinancialEntry, Plan, PlanCycle, PlanRules, Subscription, SubscriptionStatus } from '@/lib/types'
import { useAppData } from '@/components/data/app-data-provider'

type View = 'assinaturas' | 'planos' | 'financeiro'
type SubscriptionFilter = 'ativas' | 'vencendo' | 'vencidas' | 'todas'
type SubscriptionDraft = { id:string; clientId:string; planId:string; price:string; startDate:string; dueDate:string; status:SubscriptionStatus; creditsUsed:string; creditsTotal:string }

type PlanDraft = {
  id?: string
  name: string
  price: string
  type: Plan['type']
  credits: string
  description: string
  active: boolean
  cycle: PlanCycle
  cycleDays: string
  globalServiceLimit: string
  includedServices: Array<{ serviceId: string; limit: string }>
}

const emptyDraft: PlanDraft = {
  name: '',
  price: '',
  type: 'mensal',
  credits: '',
  description: '',
  active: true,
  cycle: 'mensal',
  cycleDays: '30',
  globalServiceLimit: '',
  includedServices: [],
}

const cycleOptions: Array<{ value: PlanCycle; label: string; days: number }> = [
  { value: 'mensal', label: 'Mensal', days: 30 },
  { value: 'trimestral', label: 'Trimestral', days: 90 },
  { value: 'semestral', label: 'Semestral', days: 180 },
  { value: 'anual', label: 'Anual', days: 365 },
]

function parseMoney(value: string) {
  const normalized = value.replace(/\./g, '').replace(',', '.').replace(/[^\d.]/g, '')
  return Number(normalized || 0)
}

function toDraft(plan: Plan): PlanDraft {
  const rules = plan.rules ?? { cycle: 'mensal', cycleDays: 30, includedServices: [] }
  return {
    id: plan.id,
    name: plan.name,
    price: String(plan.price).replace('.', ','),
    type: plan.type,
    credits: plan.credits ? String(plan.credits) : '',
    description: plan.description,
    active: plan.active,
    cycle: rules.cycle,
    cycleDays: String(rules.cycleDays),
    globalServiceLimit: rules.globalServiceLimit ? String(rules.globalServiceLimit) : '',
    includedServices: rules.includedServices.map((service) => ({
      serviceId: service.serviceId,
      limit: service.limit ? String(service.limit) : '',
    })),
  }
}

function toPlanRules(draft: PlanDraft): PlanRules {
  const cycle = cycleOptions.find((option) => option.value === draft.cycle) ?? cycleOptions[0]
  const cycleDays = Number(draft.cycleDays || cycle.days) || cycle.days
  const globalServiceLimit = Number(draft.globalServiceLimit || 0) || undefined

  return {
    cycle: draft.cycle,
    cycleDays,
    globalServiceLimit,
    includedServices: draft.includedServices.map((service) => ({
      serviceId: service.serviceId,
      limit: Number(service.limit || 0) || undefined,
    })),
  }
}

const PAYMENT_METHOD_LABEL: Record<string, string> = {
  dinheiro: 'Dinheiro',
  pix: 'Pix',
  credito: 'Credito',
  debito: 'Debito',
  outro: 'Outro',
}

function isSubscriptionRevenue(entry: FinancialEntry) {
  const text = `${entry.category} ${entry.description}`
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()

  return entry.type === 'entrada' && (text.includes('assinatura') || text.includes('plano'))
}

function derivedSubscriptionStatus(subscription: Subscription): SubscriptionStatus {
  if (subscription.status === 'cancelado') return 'cancelado'
  const due = daysUntil(subscription.dueDate)
  if (due < 0) return 'vencido'
  if (due <= 7) return 'vencendo'
  return 'ativo'
}

function statusPriority(status: SubscriptionStatus) {
  if (status === 'vencendo') return 0
  if (status === 'ativo') return 1
  if (status === 'vencido') return 2
  return 3
}

export function AssinaturasClient({
  catalog,
  financialEntries,
  plans: initialPlans,
  subscriptions,
}: {
  catalog: CatalogItem[]
  financialEntries: FinancialEntry[]
  plans: Plan[]
  subscriptions: Subscription[]
}) {
  const { barbershop, clients, insertRecord, updateRecord } = useAppData()
  const [view, setView] = React.useState<View>('assinaturas')
  const [plans, setPlans] = React.useState(initialPlans)
  const [subscriptionRecords, setSubscriptionRecords] = React.useState(subscriptions)
  const [editingSubscription, setEditingSubscription] = React.useState<SubscriptionDraft | null>(null)
  const [subscriptionStatus, setSubscriptionStatus] = React.useState('')
  const [subscriptionFilter, setSubscriptionFilter] = React.useState<SubscriptionFilter>('ativas')
  const [subscriptionSearch, setSubscriptionSearch] = React.useState('')
  const [saleSearch, setSaleSearch] = React.useState('')
  const [draft, setDraft] = React.useState<PlanDraft>(emptyDraft)
  const [planDialogOpen, setPlanDialogOpen] = React.useState(false)
  const [planDraftTab, setPlanDraftTab] = React.useState<'basicos' | 'regras'>('basicos')
  const enrichedSubscriptions = React.useMemo(
    () => subscriptionRecords
      .map((subscription) => ({
        ...subscription,
        displayStatus: derivedSubscriptionStatus(subscription),
      }))
      .sort((a, b) => {
        const statusComparison = statusPriority(a.displayStatus) - statusPriority(b.displayStatus)
        if (statusComparison !== 0) return statusComparison
        return a.displayStatus === 'vencido'
          ? b.dueDate.localeCompare(a.dueDate)
          : a.dueDate.localeCompare(b.dueDate)
      }),
    [subscriptionRecords],
  )
  const active = enrichedSubscriptions.filter((s) => s.displayStatus === 'ativo' || s.displayStatus === 'vencendo')
  const expiring = enrichedSubscriptions.filter((s) => s.displayStatus === 'vencendo')
  const overdue = enrichedSubscriptions.filter((s) => s.displayStatus === 'vencido')
  const filteredSubscriptions = React.useMemo(() => {
    const query = subscriptionSearch.trim().toLowerCase()
    return enrichedSubscriptions
      .filter((subscription) => {
        if (subscriptionFilter === 'ativas') return subscription.displayStatus === 'ativo' || subscription.displayStatus === 'vencendo'
        if (subscriptionFilter === 'vencendo') return subscription.displayStatus === 'vencendo'
        if (subscriptionFilter === 'vencidas') return subscription.displayStatus === 'vencido'
        return true
      })
      .filter((subscription) => {
        if (!query) return true
        return `${subscription.clientName} ${subscription.planName}`.toLowerCase().includes(query)
      })
  }, [enrichedSubscriptions, subscriptionFilter, subscriptionSearch])
  const services = catalog.filter((item) => item.type === 'servico' && item.active)
  const mrr = active.reduce((sum, sub) => sum + sub.price, 0)
  const subscriptionSales = React.useMemo(
    () => financialEntries.filter(isSubscriptionRevenue).sort((a, b) => b.date.localeCompare(a.date)),
    [financialEntries],
  )
  const totalSubscriptionRevenue = subscriptionSales.reduce((sum, entry) => sum + entry.amount, 0)
  const filteredSubscriptionSales = subscriptionSales.filter((entry) => {
    const query = saleSearch.trim().toLowerCase()
    if (!query) return true
    return `${entry.description} ${entry.category} ${entry.method ?? ''}`.toLowerCase().includes(query)
  })
  const editing = Boolean(draft.id)

  React.useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    if (params.get('tab') === 'planos' || window.location.hash === '#planos') {
      setView('planos')
      window.setTimeout(() => document.getElementById('planos')?.scrollIntoView({ block: 'start' }), 0)
    }
  }, [])

  function resetDraft() {
    setDraft(emptyDraft)
    setPlanDraftTab('basicos')
  }

  function openPlanDialog(plan?: Plan) {
    setDraft(plan ? toDraft(plan) : emptyDraft)
    setPlanDraftTab('basicos')
    setPlanDialogOpen(true)
  }

  function toggleDraftService(serviceId: string, checked: boolean) {
    setDraft((current) => ({
      ...current,
      includedServices: checked
        ? [...current.includedServices, { serviceId, limit: '' }]
        : current.includedServices.filter((service) => service.serviceId !== serviceId),
    }))
  }

  function setDraftServiceLimit(serviceId: string, limit: string) {
    setDraft((current) => ({
      ...current,
      includedServices: current.includedServices.map((service) =>
        service.serviceId === serviceId ? { ...service, limit } : service,
      ),
    }))
  }

  async function savePlan() {
    const price = parseMoney(draft.price)
    const credits = Number(draft.credits || 0) || undefined
    const rules = toPlanRules(draft)

    if (!draft.name.trim()) return

    if (draft.id) {
      const result = await updateRecord('plans', draft.id, { name: draft.name.trim(), price, type: draft.type, credits: draft.type === 'mensal' ? null : credits, description: draft.description.trim() || null, active: draft.active, rules })
      if (result.error) { window.alert(result.error); return }
      setPlans((current) =>
        current.map((plan) =>
          plan.id === draft.id
            ? {
                ...plan,
                name: draft.name.trim(),
                price,
                type: draft.type,
                credits: draft.type === 'mensal' ? undefined : credits,
                description: draft.description.trim(),
                active: draft.active,
                rules,
              }
            : plan,
        ),
      )
    } else {
      const result = await insertRecord('plans', { barbershop_id: barbershop.id, name: draft.name.trim(), price, type: draft.type, credits: draft.type === 'mensal' ? null : credits, description: draft.description.trim() || null, active: draft.active, rules })
      if (result.error || !result.data) { window.alert(result.error ?? 'Não foi possível salvar o plano.'); return }
      const next: Plan = {
        id: result.data.id,
        barbershopId: barbershop.id,
        name: draft.name.trim(),
        price,
        type: draft.type,
        credits: draft.type === 'mensal' ? undefined : credits,
        description: draft.description.trim(),
        active: draft.active,
        rules,
      }
      setPlans((current) => [next, ...current])
    }

    resetDraft()
    setPlanDialogOpen(false)
    setView('planos')
  }

  async function saveSubscription() {
    if (!editingSubscription) return
    const client = clients.find((item) => item.id === editingSubscription.clientId)
    const plan = plans.find((item) => item.id === editingSubscription.planId)
    const price = parseMoney(editingSubscription.price)
    if (!client || !plan || !editingSubscription.startDate || !editingSubscription.dueDate) { setSubscriptionStatus('Preencha cliente, plano e datas.'); return }
    const creditsUsed = Number(editingSubscription.creditsUsed || 0), creditsTotal = Number(editingSubscription.creditsTotal || 0)
    if (price < 0 || creditsUsed < 0 || creditsTotal < 0) { setSubscriptionStatus('Informe valores válidos.'); return }
    const result = await updateRecord('subscriptions', editingSubscription.id, { client_id:client.id, client_name:client.name, plan_id:plan.id, plan_name:plan.name, price, start_date:editingSubscription.startDate, due_date:editingSubscription.dueDate, status:editingSubscription.status, credits_used:creditsTotal ? creditsUsed : null, credits_total:creditsTotal || null })
    if (result.error) { setSubscriptionStatus(result.error); return }
    setSubscriptionRecords((current) => current.map((sub) => sub.id === editingSubscription.id ? { ...sub, clientId:client.id, clientName:client.name, planId:plan.id, planName:plan.name, price, startDate:editingSubscription.startDate, dueDate:editingSubscription.dueDate, status:editingSubscription.status, creditsUsed:creditsTotal?creditsUsed:undefined, creditsTotal:creditsTotal||undefined } : sub))
    setEditingSubscription(null)
  }

  return (
    <div>
      <PageHeader
        title="Assinaturas"
        description="Planos recorrentes, pacotes, créditos e clientes com vencimento próximo."
      >
        <Button variant="outline" size="sm">
          <Repeat className="size-4" />
          Renovar vencidas
        </Button>
        <Link href="/assinaturas/nova" className={buttonVariants({ variant: 'gold', size: 'sm' })}>
          <Plus className="size-4" />
          Nova assinatura
        </Link>
      </PageHeader>

      <div id="planos" className="mb-4 flex flex-wrap items-center justify-between gap-3 scroll-mt-24">
        <Tabs
          items={[
            { value: 'assinaturas', label: 'Assinaturas' },
            { value: 'planos', label: 'Planos' },
            { value: 'financeiro', label: 'Financeiro' },
          ]}
          value={view}
          onValueChange={(value) => setView(value as View)}
        />
        {view === 'planos' && (
          <Button variant="outline" size="sm" onClick={() => openPlanDialog()}>
            <Plus className="size-4" />
            Escrever novo plano
          </Button>
        )}
      </div>

      <div className="mb-4 grid gap-3 lg:grid-cols-2">
        <Card className="min-h-40 border-primary/10 bg-primary/5 p-6">
          <div className="flex items-start justify-between gap-3">
            <p className="font-semibold text-foreground">Assinantes Ativos</p>
            <Users className="size-5 text-primary" />
          </div>
          <p className="mt-10 text-3xl font-bold tabular-nums text-foreground">{active.length}</p>
          <p className="text-sm text-muted-foreground">{expiring.length} vencendo · {overdue.length} vencidas</p>
        </Card>
        <Card className="min-h-40 border-pink-100 bg-pink-50/80 p-6">
          <div className="flex items-start justify-between gap-3">
            <p className="font-semibold text-foreground">Receita Estimada (Ciclo)</p>
            <TrendingUp className="size-5 text-pink-500" />
          </div>
          <p className="mt-10 text-3xl font-bold tabular-nums text-foreground">{formatCurrency(mrr)}</p>
          <p className="text-sm text-muted-foreground">Baseado em assinaturas ativas</p>
        </Card>
      </div>

      {view === 'assinaturas' ? (
        <Card className="overflow-hidden">
          <div className="flex flex-col gap-3 border-b border-border p-4 xl:flex-row xl:items-center xl:justify-between">
            <div className="relative min-w-0 xl:max-w-sm xl:flex-1">
              <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={subscriptionSearch}
                onChange={(event) => setSubscriptionSearch(event.target.value)}
                placeholder="Buscar cliente ou plano"
                className="pl-9"
              />
            </div>
            <div className="flex flex-wrap gap-1.5">
              {[
                ['ativas', `Ativas (${active.length})`],
                ['vencendo', `Vencendo (${expiring.length})`],
                ['vencidas', `Vencidas (${overdue.length})`],
                ['todas', `Todas (${enrichedSubscriptions.length})`],
              ].map(([key, label]) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => setSubscriptionFilter(key as SubscriptionFilter)}
                  className={`rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
                    subscriptionFilter === key ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground hover:text-foreground'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Cliente</TableHead>
                <TableHead>Plano</TableHead>
                <TableHead>Vencimento</TableHead>
                <TableHead className="text-right">Valor</TableHead>
                <TableHead>Uso</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredSubscriptions.map((sub) => {
                const due = daysUntil(sub.dueDate)
                const hasCredits = sub.creditsTotal && sub.creditsTotal > 0
                return (
                  <TableRow key={sub.id}>
                    <TableCell className="font-medium text-foreground">{sub.clientName}</TableCell>
                    <TableCell className="text-muted-foreground">{sub.planName}</TableCell>
                    <TableCell>
                      <div>
                        <p className="text-sm text-foreground">{formatDate(sub.dueDate)}</p>
                        <p className="text-xs text-muted-foreground">
                          {due < 0 ? `${Math.abs(due)} dias atrás` : `em ${due} dias`}
                        </p>
                      </div>
                    </TableCell>
                    <TableCell className="text-right font-medium tabular-nums">
                      {formatCurrency(sub.price)}
                    </TableCell>
                    <TableCell>
                      {hasCredits ? (
                        <div className="min-w-28">
                          <div className="mb-1 flex justify-between text-xs text-muted-foreground">
                            <span>{sub.creditsUsed} usados</span>
                            <span>{sub.creditsTotal}</span>
                          </div>
                          <Progress value={((sub.creditsUsed ?? 0) / sub.creditsTotal!) * 100} />
                        </div>
                      ) : (
                        <Badge variant="secondary">Recorrente</Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      <StatusBadge status={sub.displayStatus} />
                    </TableCell>
                    <TableCell className="text-right"><Button variant="ghost" size="icon-sm" aria-label={`Editar assinatura de ${sub.clientName}`} onClick={()=>{setSubscriptionStatus('');setEditingSubscription({id:sub.id,clientId:sub.clientId,planId:sub.planId,price:String(sub.price).replace('.',','),startDate:sub.startDate,dueDate:sub.dueDate,status:sub.status,creditsUsed:String(sub.creditsUsed??''),creditsTotal:String(sub.creditsTotal??'')})}}><Pencil className="size-4"/></Button></TableCell>
                  </TableRow>
                )
              })}
              {filteredSubscriptions.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="h-28 text-center text-sm text-muted-foreground">
                    Nenhuma assinatura encontrada neste filtro.
                  </TableCell>
                </TableRow>
              ) : null}
            </TableBody>
          </Table>
        </Card>
      ) : view === 'planos' ? (
        <div>
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {plans.map((plan) => (
              <Card key={plan.id} className="flex min-h-72 flex-col justify-between overflow-hidden p-5">
                <div className="mb-3 flex items-start justify-between gap-3">
                  <div>
                    <h3 className="truncate text-lg font-semibold text-foreground">{plan.name}</h3>
                    <p className="mt-1 line-clamp-2 min-h-10 text-sm text-muted-foreground">{plan.description || 'Sem descricao externa.'}</p>
                  </div>
                  <StatusBadge status={plan.active ? 'ativo' : 'cancelado'} />
                </div>
                <div className="mb-4 flex items-center justify-between">
                  <span className="flex items-center gap-2 text-sm capitalize text-muted-foreground">
                    {plan.type === 'mensal' ? <CreditCard className="size-4" /> : <Users className="size-4" />}
                    {plan.type}
                    {plan.credits ? ` · ${plan.credits} créditos` : ''}
                  </span>
                  <span className="text-2xl font-bold tabular-nums text-foreground">{formatCurrency(plan.price)}</span>
                </div>
                <div className="mb-4 grid gap-3 sm:grid-cols-3">
                  <div className="rounded-md border border-border bg-muted/30 p-3">
                    <CalendarDays className="mb-2 size-4 text-muted-foreground" />
                    <p className="text-xs text-muted-foreground">Ciclo</p>
                    <p className="mt-1 text-sm font-semibold text-foreground">
                      {cycleOptions.find((option) => option.value === plan.rules?.cycle)?.label ?? 'Mensal'}
                    </p>
                  </div>
                  <div className="rounded-md border border-border bg-muted/30 p-3">
                    <TrendingUp className="mb-2 size-4 text-muted-foreground" />
                    <p className="text-xs text-muted-foreground">Limite</p>
                    <p className="mt-1 text-sm font-semibold text-foreground">
                      {plan.rules?.globalServiceLimit ? `${plan.rules.globalServiceLimit}/ciclo` : 'Sem teto'}
                    </p>
                  </div>
                  <div className="rounded-md border border-border bg-muted/30 p-3">
                    <ListChecks className="mb-2 size-4 text-muted-foreground" />
                    <p className="text-xs text-muted-foreground">Servicos</p>
                    <p className="mt-1 text-sm font-semibold text-foreground">{plan.rules?.includedServices.length ?? 0}</p>
                  </div>
                </div>
                <Button variant="outline" size="sm" className="w-full" onClick={() => openPlanDialog(plan)}>
                  <Edit3 className="size-4" />
                  Editar plano
                </Button>
              </Card>
            ))}
          </div>

          <Card className="hidden h-fit p-5">
            <h2 className="mb-1 font-semibold text-foreground">
              {editing ? 'Editar plano' : 'Escrever novo plano'}
            </h2>
            <p className="mb-4 text-sm text-muted-foreground">
              Preencha os dados do plano aqui. Depois ele aparece no seletor da tela Nova assinatura.
            </p>
            <div className="grid gap-4">
              <div className="space-y-2">
                <Label htmlFor="planName">Nome do plano</Label>
                <Input
                  id="planName"
                  value={draft.name}
                  onChange={(event) => setDraft((current) => ({ ...current, name: event.target.value }))}
                  placeholder="Ex.: Clube Barba Premium"
                />
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="planType">Tipo</Label>
                  <Select
                    id="planType"
                    value={draft.type}
                    onChange={(event) => setDraft((current) => ({ ...current, type: event.target.value as Plan['type'] }))}
                  >
                    <option value="mensal">Mensal</option>
                    <option value="pacote">Pacote</option>
                    <option value="creditos">Créditos</option>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="planPrice">Valor</Label>
                  <Input
                    id="planPrice"
                    value={draft.price}
                    onChange={(event) => setDraft((current) => ({ ...current, price: event.target.value }))}
                    placeholder="149,90"
                  />
                </div>
              </div>
              {draft.type !== 'mensal' && (
                <div className="space-y-2">
                  <Label htmlFor="planCredits">Quantidade de créditos</Label>
                  <Input
                    id="planCredits"
                    type="number"
                    value={draft.credits}
                    onChange={(event) => setDraft((current) => ({ ...current, credits: event.target.value }))}
                    placeholder="4"
                  />
                </div>
              )}
              <div className="space-y-2">
                <Label htmlFor="planDescription">Descrição</Label>
                <Textarea
                  id="planDescription"
                  value={draft.description}
                  onChange={(event) => setDraft((current) => ({ ...current, description: event.target.value }))}
                  placeholder="Explique o que está incluso no plano..."
                  className="min-h-28"
                />
              </div>
              <label className="flex items-center justify-between gap-3 rounded-md border border-border bg-muted/40 px-3 py-2 text-sm">
                <span className="font-medium text-foreground">Plano ativo</span>
                <input
                  type="checkbox"
                  checked={draft.active}
                  onChange={(event) => setDraft((current) => ({ ...current, active: event.target.checked }))}
                  className="size-4 accent-[var(--primary)]"
                />
              </label>
              <div className="flex gap-2">
                <Button variant="gold" className="flex-1" type="button" onClick={savePlan}>
                  <Save className="size-4" />
                  {editing ? 'Salvar edição' : 'Salvar plano'}
                </Button>
                {editing && (
                  <Button variant="outline" type="button" onClick={resetDraft}>
                    Cancelar
                  </Button>
                )}
              </div>
            </div>
          </Card>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="grid gap-4 lg:grid-cols-3">
            <Card className="p-6">
              <div className="flex items-start justify-between gap-3">
                <p className="font-semibold text-success">Receita Total de Assinaturas</p>
                <DollarSign className="size-5 text-success" />
              </div>
              <p className="mt-10 text-3xl font-bold tabular-nums text-success">
                {formatCurrency(totalSubscriptionRevenue)}
              </p>
              <p className="text-sm text-muted-foreground">Todo o historico recebido</p>
            </Card>
            <Card className="p-6">
              <div className="flex items-start justify-between gap-3">
                <p className="font-semibold text-foreground">Receita Recorrente (MRR Est.)</p>
                <TrendingUp className="size-5 text-muted-foreground" />
              </div>
              <p className="mt-10 text-3xl font-bold tabular-nums text-foreground">{formatCurrency(mrr)}</p>
              <p className="text-sm text-muted-foreground">Baseado nas assinaturas ativas hoje</p>
            </Card>
            <Card className="p-6">
              <div className="flex items-start justify-between gap-3">
                <p className="font-semibold text-foreground">Vendas Realizadas</p>
                <CreditCard className="size-5 text-muted-foreground" />
              </div>
              <p className="mt-10 text-3xl font-bold tabular-nums text-foreground">{subscriptionSales.length}</p>
              <p className="text-sm text-muted-foreground">Planos vendidos ou renovados</p>
            </Card>
          </div>

          <Card className="overflow-hidden">
            <div className="flex flex-col gap-3 border-b border-border p-5 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="text-lg font-semibold text-foreground">Historico de Vendas</h2>
                <p className="text-sm text-muted-foreground">Clique em uma venda para ver detalhes de uso.</p>
              </div>
              <div className="relative w-full sm:max-w-xs">
                <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  value={saleSearch}
                  onChange={(event) => setSaleSearch(event.target.value)}
                  placeholder="Buscar cliente..."
                  className="pl-9"
                />
              </div>
            </div>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Data</TableHead>
                  <TableHead>Cliente</TableHead>
                  <TableHead>Plano</TableHead>
                  <TableHead>Metodo</TableHead>
                  <TableHead className="text-right">Valor</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredSubscriptionSales.map((entry) => (
                  <TableRow key={entry.id}>
                    <TableCell className="text-muted-foreground">{formatDate(entry.date)}</TableCell>
                    <TableCell className="font-medium text-foreground">{entry.description}</TableCell>
                    <TableCell>
                      <Badge variant="secondary">{entry.category}</Badge>
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {entry.method ? PAYMENT_METHOD_LABEL[entry.method] : 'A definir'}
                    </TableCell>
                    <TableCell className="text-right font-semibold tabular-nums text-success">
                      {formatCurrency(entry.amount)}
                    </TableCell>
                  </TableRow>
                ))}
                {filteredSubscriptionSales.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="h-28 text-center text-sm text-muted-foreground">
                      <ReceiptText className="mx-auto mb-2 size-5" />
                      Nenhuma receita de assinatura encontrada.
                    </TableCell>
                  </TableRow>
                ) : null}
              </TableBody>
            </Table>
          </Card>
        </div>
      )}
      <Dialog open={planDialogOpen} onClose={()=>setPlanDialogOpen(false)} className="sm:max-w-3xl">
        <DialogHeader title={editing ? 'Editar Plano' : 'Novo Plano'} description="Configure os detalhes do seu plano de assinatura." />
        <Tabs
          items={[
            { value: 'basicos', label: 'Dados Basicos' },
            { value: 'regras', label: 'Regras e Limites' },
          ]}
          value={planDraftTab}
          onValueChange={(value) => setPlanDraftTab(value as 'basicos' | 'regras')}
          className="mb-6 grid w-full grid-cols-2"
        />
        {planDraftTab === 'basicos' ? (
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Nome do Plano">
              <Input
                value={draft.name}
                onChange={(event) => setDraft((current) => ({ ...current, name: event.target.value }))}
                placeholder="Plano Corte De Cabelo"
              />
            </Field>
            <Field label="Valor Mensal (R$)">
              <Input
                inputMode="decimal"
                value={draft.price}
                onChange={(event) => setDraft((current) => ({ ...current, price: event.target.value }))}
                placeholder="79,90"
              />
            </Field>
            <Field label="Tipo do plano">
              <Select
                value={draft.type}
                onChange={(event) => setDraft((current) => ({ ...current, type: event.target.value as Plan['type'] }))}
              >
                <option value="mensal">Mensal</option>
                <option value="pacote">Pacote</option>
                <option value="creditos">Creditos</option>
              </Select>
            </Field>
            <label className="flex items-center justify-between gap-3 rounded-md border border-border bg-muted/40 px-3 py-2 text-sm">
              <span className="font-medium text-foreground">Plano ativo</span>
              <input
                type="checkbox"
                checked={draft.active}
                onChange={(event) => setDraft((current) => ({ ...current, active: event.target.checked }))}
                className="size-4 accent-[var(--primary)]"
              />
            </label>
            {draft.type !== 'mensal' ? (
              <Field label="Quantidade de creditos">
                <Input
                  type="number"
                  min="0"
                  value={draft.credits}
                  onChange={(event) => setDraft((current) => ({ ...current, credits: event.target.value }))}
                  placeholder="4"
                />
              </Field>
            ) : null}
            <div className="space-y-2 sm:col-span-2">
              <Label>Descricao Externa</Label>
              <Textarea
                value={draft.description}
                onChange={(event) => setDraft((current) => ({ ...current, description: event.target.value }))}
                placeholder="Cortes ilimitados somente de segunda ate quarta."
                className="min-h-24"
              />
            </div>
            <div className="space-y-2 sm:col-span-2">
              <Label>Validade do Plano (Ciclo)</Label>
              <div className="grid gap-2 sm:grid-cols-4">
                {cycleOptions.map((option) => (
                  <Button
                    key={option.value}
                    type="button"
                    variant={draft.cycle === option.value ? 'gold' : 'outline'}
                    onClick={() => setDraft((current) => ({ ...current, cycle: option.value, cycleDays: String(option.days) }))}
                  >
                    {option.label}
                  </Button>
                ))}
              </div>
              <Input
                type="number"
                min="1"
                value={draft.cycleDays}
                onChange={(event) => setDraft((current) => ({ ...current, cycleDays: event.target.value }))}
              />
              <p className="text-sm text-muted-foreground">O sistema renova os limites a cada ciclo configurado.</p>
            </div>
          </div>
        ) : (
          <div className="space-y-5">
            <div className="rounded-lg border border-border p-5">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h3 className="flex items-center gap-2 text-lg font-semibold text-foreground">
                    <TrendingUp className="size-5 text-primary" />
                    Limite Global de Servicos
                  </h3>
                  <p className="mt-2 text-sm text-muted-foreground">
                    Define um teto maximo de agendamentos por ciclo, independente do servico escolhido.
                  </p>
                </div>
                <div className="flex items-center gap-2 rounded-md border border-border bg-background px-3 py-2">
                  <Input
                    type="number"
                    min="0"
                    value={draft.globalServiceLimit}
                    onChange={(event) => setDraft((current) => ({ ...current, globalServiceLimit: event.target.value }))}
                    placeholder="8"
                    className="w-20 border-0 p-0 text-center shadow-none"
                  />
                  <span className="text-sm font-medium text-muted-foreground">/ciclo</span>
                </div>
              </div>
            </div>
            <div>
              <div className="mb-3 flex items-center justify-between gap-3">
                <h3 className="font-semibold text-foreground">Servicos Inclusos no Plano</h3>
                <p className="text-sm text-muted-foreground">Clique para incluir/remover</p>
              </div>
              <div className="max-h-72 space-y-2 overflow-y-auto pr-2">
                {services.map((service) => {
                  const selected = draft.includedServices.find((item) => item.serviceId === service.id)
                  return (
                    <label
                      key={service.id}
                      className="flex items-center justify-between gap-3 rounded-lg border border-border p-3 text-sm transition-colors hover:bg-muted/40"
                    >
                      <span className="flex min-w-0 items-center gap-3">
                        <input
                          type="checkbox"
                          checked={Boolean(selected)}
                          onChange={(event) => toggleDraftService(service.id, event.target.checked)}
                          className="size-4 accent-[var(--primary)]"
                        />
                        <span className={selected ? 'font-semibold text-foreground' : 'font-medium text-muted-foreground'}>{service.name}</span>
                      </span>
                      {selected ? (
                        <span className="flex items-center gap-2 text-muted-foreground">
                          Limite especifico:
                          <Input
                            type="number"
                            min="0"
                            value={selected.limit}
                            onChange={(event) => setDraftServiceLimit(service.id, event.target.value)}
                            className="w-20"
                          />
                        </span>
                      ) : null}
                    </label>
                  )
                })}
                {services.length === 0 ? (
                  <div className="rounded-lg border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
                    Cadastre servicos no catalogo para selecionar aqui.
                  </div>
                ) : null}
              </div>
            </div>
          </div>
        )}
        <div className="mt-6 flex justify-end gap-2">
          <Button variant="outline" type="button" onClick={()=>setPlanDialogOpen(false)}>Cancelar</Button>
          <Button variant="gold" type="button" onClick={savePlan}>
            <Save className="size-4" />
            Salvar Alteracoes
          </Button>
        </div>
      </Dialog>
      <Dialog open={Boolean(editingSubscription)} onClose={()=>setEditingSubscription(null)} className="sm:max-w-2xl">
        {editingSubscription?<><DialogHeader title="Editar assinatura" description="Corrija cliente, plano, datas, valor, créditos e status."/><div className="grid gap-4 sm:grid-cols-2">
          <Field label="Cliente"><Select value={editingSubscription.clientId} onChange={e=>setEditingSubscription({...editingSubscription,clientId:e.target.value})}>{clients.map(c=><option key={c.id} value={c.id}>{c.name}</option>)}</Select></Field>
          <Field label="Plano"><Select value={editingSubscription.planId} onChange={e=>setEditingSubscription({...editingSubscription,planId:e.target.value})}>{plans.map(p=><option key={p.id} value={p.id}>{p.name}</option>)}</Select></Field>
          <Field label="Início"><Input type="date" value={editingSubscription.startDate} onChange={e=>setEditingSubscription({...editingSubscription,startDate:e.target.value})}/></Field>
          <Field label="Próximo vencimento"><Input type="date" value={editingSubscription.dueDate} onChange={e=>setEditingSubscription({...editingSubscription,dueDate:e.target.value})}/></Field>
          <Field label="Valor"><Input inputMode="decimal" value={editingSubscription.price} onChange={e=>setEditingSubscription({...editingSubscription,price:e.target.value})}/></Field>
          <Field label="Status"><Select value={editingSubscription.status} onChange={e=>setEditingSubscription({...editingSubscription,status:e.target.value as SubscriptionStatus})}><option value="ativo">Ativo</option><option value="vencendo">Vencendo</option><option value="vencido">Vencido</option><option value="cancelado">Cancelado</option></Select></Field>
          <Field label="Créditos usados"><Input type="number" min="0" value={editingSubscription.creditsUsed} onChange={e=>setEditingSubscription({...editingSubscription,creditsUsed:e.target.value})}/></Field>
          <Field label="Créditos totais"><Input type="number" min="0" value={editingSubscription.creditsTotal} onChange={e=>setEditingSubscription({...editingSubscription,creditsTotal:e.target.value})}/></Field>
        </div>{subscriptionStatus?<p className="mt-4 text-sm text-destructive">{subscriptionStatus}</p>:null}<div className="mt-5 flex justify-end gap-2"><Button variant="outline" onClick={()=>setEditingSubscription(null)}>Cancelar</Button><Button variant="gold" onClick={saveSubscription}><Save className="size-4"/>Salvar alterações</Button></div></>:null}
      </Dialog>
    </div>
  )
}

function Field({label,children}:{label:string;children:React.ReactNode}) { return <div className="space-y-2"><Label>{label}</Label>{children}</div> }
