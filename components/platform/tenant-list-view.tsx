'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { ArrowRight, ChevronLeft, ChevronRight } from 'lucide-react'
import { buttonVariants } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Select } from '@/components/ui/select'
import { PlatformShell } from '@/components/platform/platform-shell'
import { usePlatformSession } from '@/app/plataforma/use-platform-session'
import type { TenantRow } from '@/app/plataforma/types'
import { formatDate } from '@/lib/format'

const statusLabel: Record<string, string> = { trialing: 'Em teste', active: 'Ativa', past_due: 'Em atraso', canceled: 'Cancelada' }
const statusStyle: Record<string, string> = {
  trialing: 'bg-amber-100 text-amber-800', active: 'bg-emerald-100 text-emerald-800',
  past_due: 'bg-red-100 text-red-800', canceled: 'bg-muted text-muted-foreground',
}

function tenantStatus(t: TenantRow) {
  if (t.billing_status === 'past_due' && t.next_billing_date && t.next_billing_date >= new Date().toISOString().slice(0, 10)) {
    return { label: 'Cobrança agendada', style: 'bg-amber-100 text-amber-800' }
  }
  return { label: statusLabel[t.billing_status], style: statusStyle[t.billing_status] }
}

export type TenantListPreset = {
  title: string
  description: string
  initialStatus?: string
  initialPlan?: string
  initialBilling?: string
}

export function TenantListView({ title, description, initialStatus = '', initialPlan = '', initialBilling = '' }: TenantListPreset) {
  const { gate, adminName, token, signOut } = usePlatformSession()
  const [tenants, setTenants] = useState<TenantRow[]>([])
  const [count, setCount] = useState(0)
  const [totalPages, setTotalPages] = useState(1)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState(initialStatus)
  const [plan, setPlan] = useState(initialPlan)
  const [billing, setBilling] = useState(initialBilling)
  const [page, setPage] = useState(1)

  const load = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const params = new URLSearchParams()
      if (search.trim()) params.set('search', search.trim())
      if (status) params.set('status', status)
      if (plan) params.set('plan', plan)
      if (billing) params.set('billing', billing)
      params.set('page', String(page))
      params.set('pageSize', '20')
      const res = await fetch(`/api/admin/tenants?${params}`, { headers: { Authorization: `Bearer ${token}` } })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Falha ao carregar contas.')
      setTenants(data.items ?? [])
      setCount(data.count ?? 0)
      setTotalPages(data.totalPages ?? 1)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Falha ao carregar contas.')
    } finally {
      setLoading(false)
    }
  }, [token, search, status, plan, billing, page])

  useEffect(() => {
    if (gate === 'anon') { window.location.replace('/login'); return }
    if (gate !== 'granted') return
    const timer = window.setTimeout(() => { void load() }, 250)
    return () => window.clearTimeout(timer)
  }, [gate, load])

  // reset to first page when filters change
  useEffect(() => { setPage(1) }, [search, status, plan, billing])

  const rangeLabel = useMemo(() => {
    if (count === 0) return '0 conta(s)'
    const from = (page - 1) * 20 + 1
    const to = Math.min(page * 20, count)
    return `${from}–${to} de ${count} conta(s)`
  }, [page, count])

  if (gate !== 'granted') {
    return <div className="flex min-h-screen items-center justify-center text-sm text-muted-foreground">Verificando acesso…</div>
  }

  return (
    <PlatformShell
      adminName={adminName ?? ''}
      title={title}
      description={description}
      loading={loading}
      onRefresh={() => void load()}
      onSignOut={() => void signOut()}
      globalSearch={search}
      onGlobalSearchChange={setSearch}
      onGlobalSearchSubmit={() => void load()}
      showPeriod={false}
      showNewMessage={false}
    >
      <div className="mx-auto max-w-[1600px] space-y-5">
        {error ? (
          <div className="rounded-xl border border-destructive/40 bg-destructive/10 p-3 text-sm text-destructive">{error}</div>
        ) : null}

        <Card className="overflow-hidden rounded-2xl border-border/70 shadow-sm">
          <div className="flex flex-wrap items-center gap-2 border-b border-border/70 p-4">
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
            <Select className="h-9 w-[170px] rounded-xl text-sm" value={billing} onChange={(e) => setBilling(e.target.value)}>
              <option value="">Todas as cobranças</option>
              <option value="complimentary">Cortesias ativas</option>
              <option value="due7">Vencendo em 7 dias</option>
            </Select>
            <span className="ml-auto text-xs text-muted-foreground">{loading ? 'Carregando…' : rangeLabel}</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-muted/50 text-left text-xs uppercase text-muted-foreground">
                <tr>
                  <th className="px-4 py-3">Barbearia</th>
                  <th className="px-4 py-3">Responsável</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Plano</th>
                  <th className="px-4 py-3">Usuários</th>
                  <th className="px-4 py-3">Teste / cobrança</th>
                  <th className="px-4 py-3 text-right">Ações</th>
                </tr>
              </thead>
              <tbody>
                {tenants.length === 0 && !loading ? (
                  <tr><td colSpan={7} className="px-4 py-10 text-center text-muted-foreground">Nenhuma conta encontrada com esses filtros.</td></tr>
                ) : null}
                {tenants.map((t) => (
                  <tr key={t.id} className="border-t border-border/70 align-middle transition-colors hover:bg-muted/30">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-xs font-bold uppercase text-primary">{t.name.slice(0, 2)}</span>
                        <div className="min-w-0">
                          <Link href={`/plataforma/contas/${t.id}`} className="font-medium hover:underline">{t.name}</Link>
                          <p className="text-xs text-muted-foreground">/{t.slug}{t.city ? ` · ${t.city}` : ''}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      {t.owner ? (<><p>{t.owner.name}</p><p className="text-xs text-muted-foreground">{t.owner.email}</p></>) : <span className="text-muted-foreground">—</span>}
                    </td>
                    <td className="px-4 py-3"><span className={`rounded-full px-2 py-1 text-xs font-medium ${tenantStatus(t).style}`}>{tenantStatus(t).label}</span></td>
                    <td className="px-4 py-3 capitalize">{t.plan}</td>
                    <td className="px-4 py-3">{t.usersCount}</td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {t.billing_status === 'trialing'
                        ? (t.trialDaysLeft !== null && t.trialDaysLeft < 0 ? `Expirou em ${formatDate(t.trial_ends_at)}` : `${t.trialDaysLeft} dia(s) restante(s)`)
                        : (t.next_billing_date ? `Próx.: ${formatDate(t.next_billing_date)}` : '—')}
                      {t.complimentary_until && t.complimentary_until >= new Date().toISOString().slice(0, 10)
                        ? <p className="mt-1 text-xs font-medium text-amber-700">Cortesia até {formatDate(t.complimentary_until)}</p> : null}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <Link className={buttonVariants({ variant: 'outline', size: 'sm', className: 'rounded-xl' })} href={`/plataforma/contas/${t.id}`}>Gerenciar <ArrowRight className="ml-1 size-3.5" /></Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="flex items-center justify-between border-t border-border/70 px-4 py-3 text-xs text-muted-foreground">
            <span>{rangeLabel}</span>
            <div className="flex items-center gap-1">
              <button type="button" disabled={page <= 1 || loading} onClick={() => setPage((p) => Math.max(1, p - 1))}
                className="flex size-8 items-center justify-center rounded-lg border border-border/70 disabled:opacity-40 hover:bg-muted">
                <ChevronLeft className="size-4" />
              </button>
              <span className="px-2">Página {page} de {totalPages}</span>
              <button type="button" disabled={page >= totalPages || loading} onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                className="flex size-8 items-center justify-center rounded-lg border border-border/70 disabled:opacity-40 hover:bg-muted">
                <ChevronRight className="size-4" />
              </button>
            </div>
          </div>
        </Card>
      </div>
    </PlatformShell>
  )
}
