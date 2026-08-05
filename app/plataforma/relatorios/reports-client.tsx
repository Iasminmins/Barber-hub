'use client'

import { useCallback, useEffect, useState } from 'react'
import { DollarSign, Percent, TrendingUp, Building2 } from 'lucide-react'
import { PlatformShell } from '@/components/platform/platform-shell'
import { MetricCard } from '@/components/platform/metric-card'
import { AdminCharts } from '@/components/platform/admin-charts'
import { usePlatformSession } from '../use-platform-session'
import type { Overview } from '../types'

function money(v: number) {
  return v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

export function ReportsClient() {
  const { gate, adminName, token, signOut } = usePlatformSession()
  const [overview, setOverview] = useState<Overview | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [period, setPeriod] = useState(90)

  const load = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const res = await fetch(`/api/admin/overview?period=${period}`, { headers: { Authorization: `Bearer ${token}` } })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Falha ao carregar relatórios.')
      setOverview(data)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Falha ao carregar relatórios.')
    } finally {
      setLoading(false)
    }
  }, [token, period])

  useEffect(() => {
    if (gate === 'anon') { window.location.replace('/login'); return }
    if (gate === 'granted') void load()
  }, [gate, load])

  if (gate !== 'granted') {
    return <div className="flex min-h-screen items-center justify-center text-sm text-muted-foreground">Verificando acesso…</div>
  }

  const r = overview?.revenue
  const cards = overview ? [
    { label: 'MRR contratado', value: money(r!.mrr), hint: `${r!.contractedCompanies} empresas`, icon: DollarSign, accent: 'gold' as const },
    { label: 'Recebido no mês', value: r!.asaasAvailable ? money(r!.receivedThisMonth) : 'Indisponível', hint: 'Pagamentos confirmados', icon: TrendingUp, accent: 'success' as const },
    { label: 'Ticket médio', value: money(r!.averageTicket), hint: 'Por empresa contratada', icon: Building2 },
    { label: 'Conversão', value: `${r!.conversionRate}%`, hint: 'Teste para assinatura', icon: Percent },
  ] : []

  return (
    <PlatformShell
      adminName={adminName ?? ''}
      title="Relatórios"
      description="Receita, MRR, novas barbearias, conversão e distribuição de contas."
      loading={loading}
      period={period}
      onPeriodChange={setPeriod}
      onRefresh={() => void load()}
      onSignOut={() => void signOut()}
      showGlobalSearch={false}
      showNewMessage={false}
    >
      <div className="mx-auto max-w-[1600px] space-y-6">
        {error ? (
          <div className="rounded-xl border border-destructive/40 bg-destructive/10 p-3 text-sm text-destructive">{error}</div>
        ) : null}

        <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {cards.map((c) => <MetricCard key={c.label} {...c} loading={loading && !overview} />)}
        </section>

        {overview?.charts ? <AdminCharts charts={overview.charts} loading={loading && !overview} /> : null}
      </div>
    </PlatformShell>
  )
}
