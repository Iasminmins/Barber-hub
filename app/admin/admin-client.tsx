'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { Building2, Users, Timer, ShieldAlert, RefreshCw, Loader2, Search, LogOut } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { AccessGate } from './access-gate'
import { usePlatformSession } from './use-platform-session'
import { TenantActions } from './tenant-actions'
import type { Overview, TenantRow } from './types'

const selectClass =
  'h-9 rounded-md border border-border bg-background px-3 text-sm outline-none focus:ring-2 focus:ring-ring'

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

function formatDate(value: string | null) {
  if (!value) return '—'
  return new Date(value).toLocaleDateString('pt-BR')
}

export function AdminClient() {
  const { gate, adminName, token, signIn, signOut } = usePlatformSession()
  const [overview, setOverview] = useState<Overview | null>(null)
  const [tenants, setTenants] = useState<TenantRow[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState('')
  const [plan, setPlan] = useState('')

  const load = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const params = new URLSearchParams()
      if (search.trim()) params.set('search', search.trim())
      if (status) params.set('status', status)
      if (plan) params.set('plan', plan)

      const headers = { Authorization: `Bearer ${token}` }
      const [overviewResponse, tenantsResponse] = await Promise.all([
        fetch('/api/admin/overview', { headers }),
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
  }, [token, search, status, plan])

  useEffect(() => {
    if (gate !== 'granted') return
    const timer = window.setTimeout(() => {
      void load()
    }, 250)
    return () => window.clearTimeout(timer)
  }, [gate, load])

  const cards = useMemo(() => {
    if (!overview) return []
    return [
      { label: 'Barbearias', value: overview.totals.barbershops, hint: `+${overview.totals.newLast7Days} em 7 dias`, icon: Building2 },
      { label: 'Usuários ativos', value: overview.totals.users, hint: `+${overview.totals.newLast30Days} contas em 30 dias`, icon: Users },
      { label: 'Em teste', value: overview.billing.trialing, hint: `${overview.billing.trialExpiringSoon} vencendo em 7 dias`, icon: Timer },
      { label: 'Assinantes ativos', value: overview.billing.active, hint: `${overview.billing.pastDue} em atraso · ${overview.billing.canceled} canceladas`, icon: ShieldAlert },
    ]
  }, [overview])

  if (gate !== 'granted') {
    return <AccessGate gate={gate} onSignIn={signIn} />
  }

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="mx-auto max-w-7xl space-y-6">
        <header className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Administração da plataforma
            </p>
            <h1 className="text-2xl font-semibold">Barber Hub · Painel do SaaS</h1>
            {adminName ? (
              <p className="text-sm text-muted-foreground">Conectado como {adminName}</p>
            ) : null}
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" disabled={loading} onClick={() => void load()}>
              {loading ? <Loader2 className="size-4 animate-spin" /> : <RefreshCw className="size-4" />}
              <span className="ml-2">Atualizar</span>
            </Button>
            <Button variant="outline" size="sm" onClick={() => void signOut()}>
              <LogOut className="size-4" />
              <span className="ml-2">Sair</span>
            </Button>
          </div>
        </header>

        {error ? (
          <div className="rounded-md border border-destructive/40 bg-destructive/10 p-3 text-sm text-destructive">
            {error}
          </div>
        ) : null}

        <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {cards.map((card) => (
            <Card key={card.label} className="p-5">
              <div className="flex items-start justify-between">
                <p className="text-sm text-muted-foreground">{card.label}</p>
                <card.icon className="size-4 text-muted-foreground" />
              </div>
              <p className="mt-2 text-3xl font-semibold">{card.value}</p>
              <p className="mt-1 text-xs text-muted-foreground">{card.hint}</p>
            </Card>
          ))}
        </section>

        {overview ? (
          <section className="flex flex-wrap gap-3 text-sm">
            {Object.entries(overview.plans).map(([planName, total]) => (
              <span key={planName} className="rounded-full border border-border px-3 py-1">
                Plano <strong className="capitalize">{planName}</strong>: {total}
              </span>
            ))}
            <span className="rounded-full border border-amber-300 bg-amber-50 px-3 py-1 text-amber-800">
              Testes expirados: {overview.billing.trialExpired}
            </span>
          </section>
        ) : null}

        <Card className="overflow-hidden">
          <div className="flex flex-wrap items-center gap-3 border-b border-border p-4">
            <div className="relative min-w-56 flex-1">
              <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                className="pl-9"
                placeholder="Buscar por nome, slug ou cidade…"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
              />
            </div>
            <select className={selectClass} value={status} onChange={(event) => setStatus(event.target.value)}>
              <option value="">Todos os status</option>
              <option value="trialing">Em teste</option>
              <option value="active">Ativas</option>
              <option value="past_due">Em atraso</option>
              <option value="canceled">Canceladas</option>
            </select>
            <select className={selectClass} value={plan} onChange={(event) => setPlan(event.target.value)}>
              <option value="">Todos os planos</option>
              <option value="starter">Starter</option>
              <option value="pro">Pro</option>
              <option value="premium">Premium</option>
            </select>
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
                  <tr key={tenant.id} className="border-t border-border align-middle">
                    <td className="px-4 py-3">
                      <Link
                        href={`/admin/contas/${tenant.id}`}
                        className="font-medium hover:underline"
                      >
                        {tenant.name}
                      </Link>
                      <p className="text-xs text-muted-foreground">
                        /{tenant.slug}{tenant.city ? ` · ${tenant.city}` : ''}
                      </p>
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
                      <span className={`rounded-full px-2 py-1 text-xs font-medium ${statusStyle[tenant.billing_status]}`}>
                        {statusLabel[tenant.billing_status]}
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
                        <span className="text-muted-foreground">
                          {tenant.next_billing_date ? `Próx.: ${formatDate(tenant.next_billing_date)}` : '—'}
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">{formatDate(tenant.created_at)}</td>
                    <td className="px-4 py-3">
                      <TenantActions
                        tenant={tenant}
                        token={token}
                        onChanged={() => void load()}
                        onError={setError}
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="border-t border-border px-4 py-3 text-xs text-muted-foreground">
            {loading ? 'Carregando…' : `${tenants.length} conta(s) listada(s)`}
          </div>
        </Card>
      </div>
    </div>
  )
}
