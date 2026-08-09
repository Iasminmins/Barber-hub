'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { ArrowRight, ChevronLeft, ChevronRight, AlertTriangle, MapPin, Building2 } from 'lucide-react'
import { buttonVariants } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Select } from '@/components/ui/select'
import { PlatformShell } from '@/components/platform/platform-shell'
import { EmptyState } from '@/components/platform/empty-state'
import { StatusBadge, billingLabel, billingTone, type StatusTone } from '@/components/platform/status-badge'
import { PlanPill } from '@/components/platform/plan-pill'
import { usePlatformSession } from '@/app/plataforma/use-platform-session'
import type { TenantRow } from '@/app/plataforma/types'
import { formatDate, daysUntil, initials } from '@/lib/format'
import { cn } from '@/lib/utils'

export type TenantListVariant = 'default' | 'subscriptions' | 'trials' | 'billing'

const TRIAL_TOTAL_DAYS = 30

function tenantStatus(t: TenantRow): { label: string; tone: StatusTone } {
  if (t.billing_status === 'past_due' && t.next_billing_date && t.next_billing_date >= new Date().toISOString().slice(0, 10)) {
    return { label: 'Cobrança agendada', tone: 'warning' }
  }
  return {
    label: billingLabel[t.billing_status] ?? t.billing_status,
    tone: billingTone[t.billing_status] ?? 'neutral',
  }
}

/** Texto relativo do vencimento: "vence em 3 dias", "venceu há 2 dias", "vence hoje". */
function dueLabel(iso: string | null) {
  if (!iso) return { text: '—', tone: 'muted' as const }
  const days = daysUntil(iso)
  if (!Number.isFinite(days)) return { text: '—', tone: 'muted' as const }
  if (days < 0) return { text: `venceu há ${Math.abs(days)} ${Math.abs(days) === 1 ? 'dia' : 'dias'}`, tone: 'danger' as const }
  if (days === 0) return { text: 'vence hoje', tone: 'danger' as const }
  if (days <= 7) return { text: `vence em ${days} ${days === 1 ? 'dia' : 'dias'}`, tone: 'warning' as const }
  return { text: `em ${days} dias`, tone: 'muted' as const }
}

const dueToneClass = {
  danger: 'text-destructive',
  warning: 'text-amber-600 dark:text-amber-400',
  muted: 'text-muted-foreground',
}

function TrialProgress({ daysLeft }: { daysLeft: number | null }) {
  if (daysLeft === null) return <span className="text-muted-foreground">—</span>

  const clamped = Math.max(0, Math.min(daysLeft, TRIAL_TOTAL_DAYS))
  const pct = Math.round((clamped / TRIAL_TOTAL_DAYS) * 100)
  const tone = daysLeft <= 0 ? 'bg-destructive' : daysLeft <= 3 ? 'bg-destructive' : daysLeft <= 7 ? 'bg-amber-500' : 'bg-primary'

  return (
    <div className="min-w-[112px]">
      <p className={cn('text-[13px]', daysLeft <= 3 ? 'text-destructive' : 'text-foreground')}>
        {daysLeft <= 0 ? 'Expirado' : `${daysLeft}/${TRIAL_TOTAL_DAYS} dias`}
      </p>
      <div className="mt-1.5 h-1 w-full overflow-hidden rounded-full bg-muted">
        <div className={cn('h-full rounded-full transition-[width] duration-200', tone)} style={{ width: `${pct}%` }} />
      </div>
    </div>
  )
}

export type TenantListPreset = {
  title: string
  description: string
  initialStatus?: string
  initialPlan?: string
  initialBilling?: string
  variant?: TenantListVariant
}

export function TenantListView({
  title,
  description,
  initialStatus = '',
  initialPlan = '',
  initialBilling = '',
  variant = 'default',
}: TenantListPreset) {
  const { gate, adminName, signOut } = usePlatformSession()
  const [tenants, setTenants] = useState<TenantRow[]>([])
  const [count, setCount] = useState(0)
  const [totalPages, setTotalPages] = useState(1)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState(initialStatus)
  const [plan, setPlan] = useState(initialPlan)
  const [billing, setBilling] = useState(initialBilling)
  const [city, setCity] = useState('')
  const [page, setPage] = useState(1)

  const sortParams = useMemo(() => {
    if (variant === 'trials') return { sort: 'trial_ends_at', order: 'asc' }
    if (variant === 'billing') return { sort: 'next_billing_date', order: 'asc' }
    if (variant === 'subscriptions') return { sort: 'next_billing_date', order: 'asc' }
    return { sort: 'created_at', order: 'desc' }
  }, [variant])

  const load = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const params = new URLSearchParams()
      if (search.trim()) params.set('search', search.trim())
      if (status) params.set('status', status)
      if (plan) params.set('plan', plan)
      if (billing) params.set('billing', billing)
      if (city.trim()) params.set('city', city.trim())
      params.set('sort', sortParams.sort)
      params.set('order', sortParams.order)
      params.set('page', String(page))
      params.set('pageSize', '20')
      const res = await fetch(`/api/admin/tenants?${params}`, { cache: 'no-store' })
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
  }, [search, status, plan, billing, city, sortParams, page])

  useEffect(() => {
    if (gate === 'anon') { window.location.replace('/login'); return }
    if (gate !== 'granted') return
    const timer = window.setTimeout(() => { void load() }, 250)
    return () => window.clearTimeout(timer)
  }, [gate, load])

  // volta para a primeira página quando os filtros mudam
  useEffect(() => { setPage(1) }, [search, status, plan, billing, city])

  const rangeLabel = useMemo(() => {
    if (count === 0) return '0 conta(s)'
    const from = (page - 1) * 20 + 1
    const to = Math.min(page * 20, count)
    return `${from}–${to} de ${count} conta(s)`
  }, [page, count])

  const pastDueCount = useMemo(
    () => tenants.filter((t) => t.billing_status === 'past_due').length,
    [tenants],
  )

  if (gate !== 'granted') {
    return <div className="flex min-h-screen items-center justify-center text-sm text-muted-foreground">Verificando acesso…</div>
  }

  const showSkeleton = loading && tenants.length === 0
  const showCity = variant === 'default'
  const showStatusFilter = variant === 'default' || variant === 'billing'
  const showBillingFilter = variant === 'default' || variant === 'subscriptions'

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
      <div className="mx-auto max-w-[1600px] space-y-4">
        {error ? (
          <div className="rounded-xl border border-destructive/30 bg-destructive/[0.07] px-3.5 py-2.5 text-[13px] text-destructive">
            {error}
          </div>
        ) : null}

        {variant === 'billing' && pastDueCount > 0 ? (
          <div className="flex items-start gap-2 rounded-xl border border-destructive/30 bg-destructive/[0.07] px-3.5 py-2.5 text-[13px] text-destructive">
            <AlertTriangle className="mt-0.5 size-4 shrink-0" />
            <span>
              {pastDueCount} {pastDueCount === 1 ? 'conta está inadimplente' : 'contas estão inadimplentes'} nesta página.
              Priorize o contato antes do bloqueio automático.
            </span>
          </div>
        ) : null}

        <Card className="pf-card-lift overflow-hidden rounded-xl border-border/60 p-0">
          <div className="flex flex-wrap items-center gap-2 border-b border-border/60 p-4">
            {showStatusFilter ? (
              <Select className="h-9 w-[150px] rounded-xl text-sm" value={status} onChange={(e) => setStatus(e.target.value)} aria-label="Status">
                <option value="">Todos os status</option>
                <option value="trialing">Em teste</option>
                <option value="active">Ativas</option>
                <option value="past_due">Em atraso</option>
                <option value="canceled">Canceladas</option>
              </Select>
            ) : null}

            <Select className="h-9 w-[140px] rounded-xl text-sm" value={plan} onChange={(e) => setPlan(e.target.value)} aria-label="Plano">
              <option value="">Todos os planos</option>
              <option value="starter">Starter</option>
              <option value="pro">Pro</option>
              <option value="premium">Premium</option>
            </Select>

            {showBillingFilter ? (
              <Select className="h-9 w-[170px] rounded-xl text-sm" value={billing} onChange={(e) => setBilling(e.target.value)} aria-label="Cobrança">
                <option value="">Todas as cobranças</option>
                <option value="complimentary">Cortesias ativas</option>
                <option value="due7">Vencendo em 7 dias</option>
              </Select>
            ) : null}

            {showCity ? (
              <div className="relative w-[180px]">
                <MapPin className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  className="h-9 rounded-xl pl-9 text-sm"
                  placeholder="Cidade"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  aria-label="Filtrar por cidade"
                />
              </div>
            ) : null}

            <span className="ml-auto text-[11px] uppercase tracking-wide text-muted-foreground">
              {loading ? 'Carregando…' : rangeLabel}
            </span>
          </div>

          {showSkeleton ? (
            <div className="space-y-3 p-4">
              {[0, 1, 2, 3, 4].map((i) => <div key={i} className="pf-skeleton h-12 rounded-lg" />)}
            </div>
          ) : tenants.length === 0 ? (
            <EmptyState
              icon={Building2}
              title="Nenhuma conta encontrada"
              description="Ajuste os filtros ou a busca para ver as barbearias cadastradas."
              className="border-none"
            />
          ) : (
            <>
              {/* Desktop — tabela */}
              <div className="hidden overflow-x-auto lg:block">
                <table className="w-full text-sm">
                  <thead className="border-b border-border/60 bg-muted/30 text-left">
                    <tr className="text-[11px] uppercase tracking-wide text-muted-foreground">
                      <th className="px-4 py-3 font-normal">Barbearia</th>
                      {variant === 'default' ? <th className="px-4 py-3 font-normal">Cidade</th> : null}
                      <th className="px-4 py-3 font-normal">Responsável</th>
                      <th className="px-4 py-3 font-normal">Status</th>
                      {variant === 'trials' ? (
                        <th className="px-4 py-3 font-normal">Dias restantes</th>
                      ) : (
                        <th className="px-4 py-3 font-normal">Plano</th>
                      )}
                      {variant === 'default' ? null : (
                        <th className="px-4 py-3 font-normal">
                          {variant === 'trials' ? 'Fim do teste' : variant === 'billing' ? 'Vencimento' : 'Próxima cobrança'}
                        </th>
                      )}
                      <th className="px-4 py-3 text-right font-normal">Ações</th>
                    </tr>
                  </thead>
                  <tbody>
                    {tenants.map((t) => {
                      const st = tenantStatus(t)
                      const due = dueLabel(t.next_billing_date)
                      const highlightDue = variant === 'billing' || variant === 'subscriptions'
                      return (
                        <tr key={t.id} className="border-b border-border/60 align-middle transition-colors duration-150 last:border-b-0 hover:bg-muted/40">
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-3">
                              <span className="flex size-[30px] shrink-0 items-center justify-center rounded-full bg-primary/10 text-[11px] font-medium uppercase text-primary">
                                {initials(t.name)}
                              </span>
                              <div className="min-w-0">
                                <Link href={`/plataforma/contas/${t.id}`} className="block truncate font-medium text-foreground hover:underline">
                                  {t.name}
                                </Link>
                                <p className="truncate text-[11px] text-muted-foreground">/{t.slug}</p>
                              </div>
                            </div>
                          </td>

                          {variant === 'default' ? (
                            <td className="px-4 py-3 text-[13px] text-muted-foreground">{t.city || '—'}</td>
                          ) : null}

                          <td className="px-4 py-3">
                            {t.owner ? (
                              <>
                                <p className="truncate text-[13px] text-foreground">{t.owner.name}</p>
                                <p className="truncate text-[11px] text-muted-foreground">{t.owner.email}</p>
                              </>
                            ) : (
                              <span className="text-muted-foreground">—</span>
                            )}
                          </td>

                          <td className="px-4 py-3"><StatusBadge tone={st.tone} label={st.label} /></td>

                          {variant === 'trials' ? (
                            <td className="px-4 py-3"><TrialProgress daysLeft={t.trialDaysLeft} /></td>
                          ) : (
                            <td className="px-4 py-3"><PlanPill plan={t.plan} /></td>
                          )}

                          {variant === 'default' ? null : (
                            <td className="px-4 py-3">
                              {variant === 'trials' ? (
                                <p className="text-[13px] text-muted-foreground">{formatDate(t.trial_ends_at)}</p>
                              ) : (
                                <>
                                  <p className={cn('text-[13px]', highlightDue ? 'font-medium text-foreground' : 'text-muted-foreground')}>
                                    {t.next_billing_date ? formatDate(t.next_billing_date) : '—'}
                                  </p>
                                  <p className={cn('text-[11px]', dueToneClass[due.tone])}>{due.text}</p>
                                </>
                              )}
                              {t.complimentary_until && t.complimentary_until >= new Date().toISOString().slice(0, 10) ? (
                                <p className="mt-1 text-[11px] text-gold">Cortesia até {formatDate(t.complimentary_until)}</p>
                              ) : null}
                            </td>
                          )}

                          <td className="px-4 py-3 text-right">
                            <Link className={buttonVariants({ variant: 'outline', size: 'sm', className: 'rounded-xl' })} href={`/plataforma/contas/${t.id}`}>
                              Gerenciar <ArrowRight className="ml-1 size-3.5" />
                            </Link>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>

              {/* Mobile — cards */}
              <div className="divide-y divide-border/60 lg:hidden">
                {tenants.map((t) => {
                  const st = tenantStatus(t)
                  const due = dueLabel(t.next_billing_date)
                  return (
                    <div key={t.id} className="p-4">
                      <div className="flex items-start gap-3">
                        <span className="flex size-[30px] shrink-0 items-center justify-center rounded-full bg-primary/10 text-[11px] font-medium uppercase text-primary">
                          {initials(t.name)}
                        </span>
                        <div className="min-w-0 flex-1">
                          <Link href={`/plataforma/contas/${t.id}`} className="block truncate font-medium text-foreground">{t.name}</Link>
                          <p className="truncate text-[11px] text-muted-foreground">
                            /{t.slug}{t.city ? ` · ${t.city}` : ''}
                          </p>
                        </div>
                        <StatusBadge tone={st.tone} label={st.label} />
                      </div>

                      <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1.5">
                        <PlanPill plan={t.plan} />
                        {variant === 'trials' ? (
                          <span className="text-[11px] text-muted-foreground">
                            {t.trialDaysLeft !== null && t.trialDaysLeft > 0 ? `${t.trialDaysLeft} dias restantes` : 'Teste expirado'}
                          </span>
                        ) : (
                          <span className={cn('text-[11px]', dueToneClass[due.tone])}>
                            {t.next_billing_date ? `${formatDate(t.next_billing_date)} · ${due.text}` : '—'}
                          </span>
                        )}
                      </div>

                      {variant === 'trials' ? (
                        <div className="mt-2"><TrialProgress daysLeft={t.trialDaysLeft} /></div>
                      ) : null}

                      <Link
                        href={`/plataforma/contas/${t.id}`}
                        className={buttonVariants({ variant: 'outline', size: 'sm', className: 'mt-3 w-full rounded-xl' })}
                      >
                        Gerenciar <ArrowRight className="ml-1 size-3.5" />
                      </Link>
                    </div>
                  )
                })}
              </div>
            </>
          )}

          <div className="flex items-center justify-between border-t border-border/60 px-4 py-3 text-[11px] text-muted-foreground">
            <span>{rangeLabel}</span>
            <div className="flex items-center gap-1">
              <button
                type="button"
                disabled={page <= 1 || loading}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                aria-label="Página anterior"
                className="flex size-8 items-center justify-center rounded-lg border border-border/60 transition-colors duration-150 hover:bg-muted/40 disabled:opacity-40"
              >
                <ChevronLeft className="size-4" />
              </button>
              <span className="px-2">Página {page} de {totalPages}</span>
              <button
                type="button"
                disabled={page >= totalPages || loading}
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                aria-label="Próxima página"
                className="flex size-8 items-center justify-center rounded-lg border border-border/60 transition-colors duration-150 hover:bg-muted/40 disabled:opacity-40"
              >
                <ChevronRight className="size-4" />
              </button>
            </div>
          </div>
        </Card>
      </div>
    </PlatformShell>
  )
}
