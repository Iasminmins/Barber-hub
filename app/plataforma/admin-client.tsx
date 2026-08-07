'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { Building2, Users, Timer, ShieldAlert, DollarSign, TrendingUp, Gift, Percent, ArrowRight, MessageSquare, AlertOctagon, Download } from 'lucide-react'
import { Button, buttonVariants } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Select } from '@/components/ui/select'
import { PlatformShell } from '@/components/platform/platform-shell'
import { MetricCard } from '@/components/platform/metric-card'
import { AdminCharts } from '@/components/platform/admin-charts'
import { AttentionPanel } from '@/components/platform/attention-panel'
import { SectionHeader } from '@/components/platform/section-header'
import { usePlatformSession } from './use-platform-session'
import type { Overview, TenantRow } from './types'
import { formatDate, formatPercent } from '@/lib/format'

const statusLabel: Record<string, string> = {
  trialing: 'Em teste',
  active: 'Ativa',
  past_due: 'Em atraso',
  canceled: 'Cancelada',
}

const statusStyle: Record<string, string> = {
  trialing: 'bg-amber-100 text-amber-800',
  active: 'bg-emerald-100 text-emerald-800',
  past_due: 'bg-red-100 text-red-800',
  canceled: 'bg-muted text-muted-foreground',
}

function formatMoney(value: number) {
  return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

function tenantStatus(tenant: TenantRow) {
  if (tenant.billing_status === 'past_due' && tenant.next_billing_date && tenant.next_billing_date >= new Date().toISOString().slice(0, 10)) {
    return { label: 'Cobrança agendada', style: 'bg-amber-100 text-amber-800' }
  }
  return { label: statusLabel[tenant.billing_status], style: statusStyle[tenant.billing_status] }
}

export function AdminClient() {
  const { gate, adminName, token, signOut } = usePlatformSession()
  const [overview, setOverview] = useState<Overview | null>(null)
  const [tenants, setTenants] = useState<TenantRow[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState('')
  const [plan, setPlan] = useState('')
  const [billingFilter, setBillingFilter] = useState('')
  const [period, setPeriod] = useState(30)

  const load = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const params = new URLSearchParams()
      if (search.trim()) params.set('search', search.trim())
      if (status) params.set('status', status)
      if (plan) params.set('plan', plan)
      if (billingFilter) params.set('billing', billingFilter)

      const headers = { Authorization: `Bearer ${token}` }
      const [overviewResponse, tenantsResponse] = await Promise.all([
        fetch(`/api/admin/overview?period=${period}`, { headers }),
        fetch(`/api/admin/tenants?${params}`, { headers }),
      ])
      const overviewData = await overviewResponse.json()
      const tenantsData = await tenantsResponse.json()
      if (!overviewResponse.ok) throw new Error(overviewData.error ?? 'Falha ao carregar métricas.')
      if (!tenantsResponse.ok) throw new Error(tenantsData.error ?? 'Falha ao carregar contas.')
      setOverview(overviewData)
      setTenants(tenantsData.items ?? [])
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : 'Falha ao carregar dados.')
    } finally {
      setLoading(false)
    }
  }, [token, search, status, plan, billingFilter, period])

  useEffect(() => {
    if (gate === 'anon') { window.location.replace('/login'); return }
    if (gate !== 'granted') return
    const timer = window.setTimeout(() => { void load() }, 250)
    return () => window.clearTimeout(timer)
  }, [gate, load])

  const topKpis = useMemo(() => {
    if (!overview) return []
    return [
      { label: 'Total de barbearias', value: overview.totals.barbershops, hint: `+${overview.totals.newLast7Days} em 7 dias`, icon: Building2 },
      { label: 'Receita mensal (MRR)', value: formatMoney(overview.revenue.mrr), hint: `${overview.revenue.contractedCompanies} contratos ativos`, icon: DollarSign, accent: 'gold' as const },
      { label: 'Taxa de inadimplência', value: formatPercent(overview.revenue.delinquencyRate), hint: `${overview.billing.pastDue} conta(s) em atraso`, icon: AlertOctagon, accent: overview.revenue.delinquencyRate > 10 ? 'danger' as const : 'default' as const },
      { label: 'Mensagens enviadas', value: overview.totals.messagesSent, hint: `Últimos ${period} dia(s)`, icon: MessageSquare, accent: 'success' as const },
    ]
  }, [overview, period])

  const executiveInsights = useMemo(() => {
    if (!overview) return []
    return [
      { label: 'MRR', value: formatMoney(overview.revenue.mrr), tone: 'gold' as const },
      { label: 'Inadimplência', value: formatPercent(overview.revenue.delinquencyRate), tone: overview.revenue.delinquencyRate > 10 ? 'danger' as const : 'success' as const },
      { label: 'Novas barbearias', value: `${overview.comparisons?.newBarbershops.current ?? 0} no período`, tone: 'default' as const },
      { label: 'Conversão', value: `${overview.revenue.conversionRate}%`, tone: 'default' as const },
    ]
  }, [overview])

  async function handleExport() {
    if (!overview) return
    const { buildPlatformReportSheets } = await import('@/lib/platform-report-export')
    const { downloadExcelWorkbook } = await import('@/lib/spreadsheet-export')
    downloadExcelWorkbook(`barber-hub-visao-geral-${new Date().toISOString().slice(0, 10)}`, buildPlatformReportSheets(overview, tenants))
  }

  const revenueCards = useMemo(() => {
    if (!overview) return []
    const r = overview.revenue
    return [
      { label: 'MRR contratado', value: formatMoney(r.mrr), hint: `${r.contractedCompanies} empresas contratadas`, icon: DollarSign, accent: 'gold' as const },
      { label: 'Previsão · 30 dias', value: formatMoney(r.forecast30Days), hint: 'Cobranças previstas no período', icon: TrendingUp },
      { label: 'Recebido no mês', value: r.asaasAvailable ? formatMoney(r.receivedThisMonth) : 'Indisponível', hint: r.asaasAvailable ? 'Pagamentos confirmados no Asaas' : 'Asaas não respondeu', icon: DollarSign, accent: 'success' as const },
      { label: 'Ticket médio', value: formatMoney(r.averageTicket), hint: 'Por empresa contratada', icon: Building2 },
      { label: 'Conversão', value: `${r.conversionRate}%`, hint: 'Teste para assinatura', icon: Percent },
      { label: 'Cortesias ativas', value: r.complimentaryCount, hint: `${formatMoney(r.complimentaryValue)} concedidos`, icon: Gift, accent: 'gold' as const },
    ]
  }, [overview])

  const summaryCards = useMemo(() => {
    if (!overview) return []
    const t = overview.totals
    const b = overview.billing
    return [
      { label: 'Barbearias', value: t.barbershops, hint: `+${t.newLast7Days} em 7 dias`, icon: Building2 },
      { label: 'Usuários ativos', value: t.users, hint: `+${t.newLast30Days} contas em 30 dias`, icon: Users },
      { label: 'Em teste', value: b.trialing, hint: `${b.trialExpiringSoon} vencendo em 7 dias`, icon: Timer, accent: 'warning' as const },
      { label: 'Assinantes ativos', value: b.active, hint: `${b.pastDue} em atraso · ${b.canceled} canceladas`, icon: ShieldAlert, accent: 'success' as const },
    ]
  }, [overview])

  if (gate !== 'granted') {
    return <div className="flex min-h-screen items-center justify-center text-sm text-muted-foreground">Verificando acesso…</div>
  }

  return (
    <PlatformShell
      adminName={adminName ?? ''}
      title="Visão geral"
      description="Acompanhe barbearias, assinaturas, cobranças e testes em um só lugar."
      unreadMessages={overview?.notifications?.unreadMessages ?? 0}
      loading={loading}
      period={period}
      onPeriodChange={setPeriod}
      onRefresh={() => void load()}
      onSignOut={() => void signOut()}
      globalSearch={search}
      onGlobalSearchChange={setSearch}
      onGlobalSearchSubmit={() => void load()}
    >
      <div className="mx-auto max-w-[1600px] space-y-6">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <SectionHeader
            title="Visão geral"
            description="Resumo executivo da operação da plataforma."
            insights={executiveInsights}
            className="flex-1"
          />
          <Button variant="outline" size="sm" className="rounded-xl" disabled={!overview} onClick={() => void handleExport()}>
            <Download className="size-4" />
            <span className="ml-2">Exportar</span>
          </Button>
        </div>

        {error ? (
          <div className="rounded-xl border border-destructive/40 bg-destructive/10 p-3 text-sm text-destructive">
            {error}
          </div>
        ) : null}

        <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {topKpis.map((card) => (
            <MetricCard key={card.label} {...card} loading={loading && !overview} />
          ))}
        </section>

        <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {revenueCards.map((card) => (
            <MetricCard key={card.label} {...card} loading={loading && !overview} />
          ))}
        </section>

        <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {summaryCards.map((card) => (
            <MetricCard key={card.label} {...card} loading={loading && !overview} />
          ))}
        </section>

        {overview ? (
          <section className="flex flex-wrap gap-2 text-sm">
            {Object.entries(overview.plans).map(([planName, total]) => (
              <span key={planName} className="rounded-full border border-border bg-card px-3 py-1">
                Plano <strong className="capitalize">{planName}</strong>: {total}
              </span>
            ))}
            <span className="rounded-full border border-amber-300 bg-amber-50 px-3 py-1 text-amber-800">
              Testes expirados: {overview.billing.trialExpired}
            </span>
          </section>
        ) : null}

        {overview?.charts ? <AdminCharts charts={overview.charts} loading={loading && !overview} /> : null}

        {overview?.attention && overview.attention.length > 0 ? (
          <AttentionPanel items={overview.attention} loading={loading && !overview} />
        ) : null}

        <Card className="pf-card-lift overflow-hidden rounded-2xl border-border/70">
          <div className="flex flex-wrap items-center gap-3 border-b border-border/70 p-4">
            <p className="text-sm font-semibold text-foreground">Barbearias</p>
            <div className="ml-auto flex flex-wrap gap-2">
              <Select className="h-9 w-[150px] rounded-xl text-sm" value={status} onChange={(e) => setStatus(e.target.value)}>
                <option value="">Todos os status</option>
                <option value="trialing">Em teste</option>
                <option value="active">Ativas</option>
                <option value="past_due">Em atraso</option>
                <option value="canceled">Canceladas</option>
              </Select>
              <Select className="h-9 w-[140px] rounded-xl text-sm" value={plan} onChange={(e) => setPlan(e.target.value)}>
                <option value="">Todos os planos</option>
                <option value="starter">Starter</option>
                <option value="pro">Pro</option>
                <option value="premium">Premium</option>
              </Select>
              <Select className="h-9 w-[170px] rounded-xl text-sm" value={billingFilter} onChange={(e) => setBillingFilter(e.target.value)}>
                <option value="">Todas as cobranças</option>
                <option value="complimentary">Cortesias ativas</option>
                <option value="due7">Vencendo em 7 dias</option>
              </Select>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-muted/50 text-left text-xs uppercase text-muted-foreground">
                <tr>
                  <th className="px-4 py-3">Barbearia</th>
                  <th className="px-4 py-3">Responsável</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Usuários</th>
                  <th className="px-4 py-3">Teste / cobrança</th>
                  <th className="px-4 py-3">Cadastro</th>
                  <th className="px-4 py-3 text-right">Ações</th>
                </tr>
              </thead>
              <tbody>
                {tenants.length === 0 && !loading ? (
                  <tr>
                    <td colSpan={7} className="px-4 py-10 text-center text-muted-foreground">
                      Nenhuma conta encontrada com esses filtros.
                    </td>
                  </tr>
                ) : null}

                {tenants.map((tenant) => (
                  <tr key={tenant.id} className="border-t border-border/70 align-middle transition-colors hover:bg-muted/30">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-xs font-bold uppercase text-primary">
                          {tenant.name.slice(0, 2)}
                        </span>
                        <div className="min-w-0">
                          <Link href={`/plataforma/contas/${tenant.id}`} className="font-medium hover:underline">
                            {tenant.name}
                          </Link>
                          <p className="text-xs text-muted-foreground">
                            /{tenant.slug}{tenant.city ? ` · ${tenant.city}` : ''}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      {tenant.owner ? (
                        <>
                          <p>{tenant.owner.name}</p>
                          <p className="text-xs text-muted-foreground">{tenant.owner.email}</p>
                        </>
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`rounded-full px-2 py-1 text-xs font-medium ${tenantStatus(tenant).style}`}>
                        {tenantStatus(tenant).label}
                      </span>
                    </td>
                    <td className="px-4 py-3">{tenant.usersCount}</td>
                    <td className="px-4 py-3">
                      {tenant.billing_status === 'trialing' ? (
                        <span className={tenant.trialDaysLeft !== null && tenant.trialDaysLeft < 0 ? 'text-destructive' : ''}>
                          {tenant.trialDaysLeft !== null && tenant.trialDaysLeft < 0
                            ? `Expirou em ${formatDate(tenant.trial_ends_at)}`
                            : `${tenant.trialDaysLeft} dia(s) restante(s)`}
                        </span>
                      ) : (
                        <div className="text-muted-foreground">
                          <span>{tenant.next_billing_date ? `Próx.: ${formatDate(tenant.next_billing_date)}` : '—'}</span>
                          {tenant.complimentary_until && tenant.complimentary_until >= new Date().toISOString().slice(0, 10) ? (
                            <p className="mt-1 text-xs font-medium text-amber-700">Cortesia até {formatDate(tenant.complimentary_until)}</p>
                          ) : null}
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">{formatDate(tenant.created_at)}</td>
                    <td className="px-4 py-3 text-right">
                      <Link className={buttonVariants({ variant: 'outline', size: 'sm', className: 'rounded-xl' })} href={`/plataforma/contas/${tenant.id}`}>
                        Gerenciar <ArrowRight className="ml-1 size-3.5" />
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="border-t border-border/70 px-4 py-3 text-xs text-muted-foreground">
            {loading ? 'Carregando…' : `${tenants.length} conta(s) listada(s)`}
          </div>
        </Card>
      </div>
    </PlatformShell>
  )
}
