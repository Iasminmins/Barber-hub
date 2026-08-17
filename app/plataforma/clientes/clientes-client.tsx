'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import {
  Mail, MessageCircle, ArrowRight, Download, Users, Check, X, Loader2, Pencil, UserRound, Trash2,
} from 'lucide-react'
import { Button, buttonVariants } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Select } from '@/components/ui/select'
import { PlatformShell } from '@/components/platform/platform-shell'
import { EmptyState } from '@/components/platform/empty-state'
import { StatusBadge, billingLabel, billingTone } from '@/components/platform/status-badge'
import { PlanPill } from '@/components/platform/plan-pill'
import { usePlatformSession } from '../use-platform-session'
import type { TenantRow } from '../types'
import { formatDate, initials } from '@/lib/format'
import { whatsappUrl } from '@/lib/whatsapp'
import { situationalWhatsAppMessage } from '@/lib/platform-whatsapp-templates'
import { downloadExcelWorkbook } from '@/lib/spreadsheet-export'
import { cn } from '@/lib/utils'

type StatusFilter = '' | 'active' | 'trialing' | 'past_due' | 'canceled'
type SortKey = 'recent' | 'name' | 'access' | 'billing'

const FILTERS: { key: StatusFilter; label: string; tone: 'neutral' | 'success' | 'warning' | 'danger' }[] = [
  { key: '', label: 'Todos', tone: 'neutral' },
  { key: 'active', label: 'Ativos', tone: 'success' },
  { key: 'trialing', label: 'Em teste', tone: 'warning' },
  { key: 'past_due', label: 'Em atraso', tone: 'danger' },
  { key: 'canceled', label: 'Cancelados', tone: 'neutral' },
]

const chipActive: Record<string, string> = {
  neutral: 'border-foreground/20 bg-muted/60 text-foreground',
  success: 'border-primary/30 bg-primary/[0.08] text-primary',
  warning: 'border-amber-500/35 bg-amber-500/[0.1] text-amber-700 dark:text-amber-400',
  danger: 'border-destructive/35 bg-destructive/[0.08] text-destructive',
}

const accessDot: Record<string, string> = {
  success: 'bg-primary',
  warning: 'bg-amber-500',
  neutral: 'bg-muted-foreground/50',
}

const kpiBar: Record<string, string> = {
  neutral: 'bg-foreground/20',
  success: 'bg-primary',
  warning: 'bg-amber-500',
  danger: 'bg-destructive',
}

/**
 * Último acesso do responsável. Usa o login real (`lastSignInAt`) e só cai no
 * `updated_at` da barbearia quando a API não conseguiu ler o Auth — nesse caso
 * o valor é marcado como aproximado.
 */
function lastAccess(row: TenantRow) {
  const authKnown = row.lastSignInAt !== undefined
  const iso = authKnown ? row.lastSignInAt : (row.updated_at ?? row.lastAccessAt ?? null)

  if (authKnown && row.lastSignInAt === null) {
    return { label: 'Nunca acessou', tone: 'neutral' as const, estimated: false }
  }
  if (!iso) return { label: '—', tone: 'neutral' as const, estimated: false }
  const time = new Date(iso).getTime()
  if (Number.isNaN(time)) return { label: '—', tone: 'neutral' as const, estimated: false }

  const minutes = Math.max(0, Math.floor((Date.now() - time) / 60000))
  const hours = Math.floor(minutes / 60)
  const days = Math.floor(hours / 24)

  const label = minutes < 1
    ? 'agora'
    : minutes < 60
      ? `há ${minutes} min`
      : hours < 24
        ? `há ${hours}h`
        : days < 30
          ? `há ${days} ${days === 1 ? 'dia' : 'dias'}`
          : `há ${Math.floor(days / 30)} ${Math.floor(days / 30) === 1 ? 'mês' : 'meses'}`

  const tone = days < 2 ? 'success' as const : days <= 7 ? 'warning' as const : 'neutral' as const
  return { label, tone, estimated: !authKnown }
}

function accessTime(row: TenantRow) {
  const iso = row.lastSignInAt !== undefined ? row.lastSignInAt : (row.updated_at ?? row.lastAccessAt ?? null)
  if (!iso) return 0
  const time = new Date(iso).getTime()
  return Number.isNaN(time) ? 0 : time
}

function waLinkFor(row: TenantRow) {
  if (!row.ownerPhone) return null
  const message = situationalWhatsAppMessage({
    ownerName: row.owner?.name ?? '',
    barbershopName: row.name,
    plan: row.plan,
    billingStatus: row.billing_status,
    trialEndsAt: row.trial_ends_at,
    nextBillingDate: row.next_billing_date,
  })
  return whatsappUrl(row.ownerPhone, message) || null
}

function KpiCard({ label, value, hint, tone, loading }: {
  label: string
  value: number
  hint: string
  tone: keyof typeof kpiBar
  loading: boolean
}) {
  return (
    <Card className="pf-card-lift relative overflow-hidden rounded-xl border-border/60 p-4">
      <span className={cn('absolute inset-x-0 top-0 h-0.5', kpiBar[tone])} aria-hidden="true" />
      <p className="text-[11px] uppercase tracking-wide text-muted-foreground">{label}</p>
      {loading ? (
        <div className="pf-skeleton mt-2 h-7 w-14 rounded-md" />
      ) : (
        <p className="mt-1.5 text-2xl font-medium tabular-nums leading-none text-foreground">{value}</p>
      )}
      <p className="mt-2 text-[11px] text-muted-foreground">{hint}</p>
    </Card>
  )
}

export function ClientesClient() {
  const { gate, adminName, signOut } = usePlatformSession()
  const [rows, setRows] = useState<TenantRow[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState<StatusFilter>('')
  const [sort, setSort] = useState<SortKey>('recent')
  const [phoneEdit, setPhoneEdit] = useState<{ id: string; value: string } | null>(null)
  const [savingPhone, setSavingPhone] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const params = new URLSearchParams()
      if (search.trim()) params.set('search', search.trim())
      params.set('pageSize', '100')
      const res = await fetch(`/api/admin/tenants?${params}`, { cache: 'no-store' })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Falha ao carregar responsáveis.')
      setRows(data.items ?? [])
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Falha ao carregar responsáveis.')
    } finally {
      setLoading(false)
    }
  }, [search])

  useEffect(() => {
    if (gate === 'anon') { window.location.replace('/login'); return }
    if (gate !== 'granted') return
    const timer = window.setTimeout(() => { void load() }, 250)
    return () => window.clearTimeout(timer)
  }, [gate, load])

  const counts = useMemo(() => ({
    total: rows.length,
    active: rows.filter((r) => r.billing_status === 'active').length,
    trialing: rows.filter((r) => r.billing_status === 'trialing').length,
    past_due: rows.filter((r) => r.billing_status === 'past_due').length,
    canceled: rows.filter((r) => r.billing_status === 'canceled').length,
  }), [rows])

  const visible = useMemo(() => {
    const filtered = status ? rows.filter((r) => r.billing_status === status) : rows
    const sorted = [...filtered]
    sorted.sort((a, b) => {
      if (sort === 'name') return a.name.localeCompare(b.name, 'pt-BR')
      if (sort === 'access') return accessTime(b) - accessTime(a)
      if (sort === 'billing') {
        const av = a.next_billing_date ?? '9999-12-31'
        const bv = b.next_billing_date ?? '9999-12-31'
        return av.localeCompare(bv)
      }
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    })
    return sorted
  }, [rows, status, sort])

  async function savePhone(row: TenantRow) {
    if (!row.ownerId || !phoneEdit) return
    setSavingPhone(true)
    try {
      const res = await fetch(`/api/admin/members/${row.ownerId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: phoneEdit.value.trim() || null }),
      })
      const data = await res.json()
      if (!res.ok) { setError(data.error ?? 'Não foi possível salvar o telefone.'); return }
      setRows((list) => list.map((r) => (r.id === row.id ? { ...r, ownerPhone: data.member?.phone ?? null } : r)))
      setPhoneEdit(null)
    } catch {
      setError('Não foi possível salvar o telefone.')
    } finally {
      setSavingPhone(false)
    }
  }

  async function deleteTenant(row: TenantRow) {
    if (!window.confirm(`Excluir definitivamente a conta "${row.name}"? Todos os dados da barbearia serão apagados.`)) return
    const confirmation = window.prompt(`Digite o slug da conta para confirmar: ${row.slug}`)
    if (confirmation?.trim() !== row.slug) {
      setError('Exclusão cancelada: o slug informado não confere.')
      return
    }
    setDeletingId(row.id)
    setError('')
    try {
      const response = await fetch(`/api/admin/tenants/${row.id}?confirm=${encodeURIComponent(row.slug)}&deleteUsers=true`, { method: 'DELETE' })
      const data = await response.json().catch(() => ({}))
      if (!response.ok) throw new Error(data.error ?? 'Não foi possível excluir a conta.')
      setRows((current) => current.filter((item) => item.id !== row.id))
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Não foi possível excluir a conta.')
    } finally {
      setDeletingId(null)
    }
  }

  function exportRows() {
    downloadExcelWorkbook('clientes-barber-hub', [{
      name: 'Clientes',
      title: 'Clientes da plataforma',
      columns: [
        { key: 'barbearia', label: 'Barbearia', width: 180 },
        { key: 'responsavel', label: 'Responsável', width: 160 },
        { key: 'email', label: 'E-mail', width: 200 },
        { key: 'telefone', label: 'Telefone', width: 130 },
        { key: 'status', label: 'Status', width: 110 },
        { key: 'plano', label: 'Plano', width: 100 },
        { key: 'proxima_cobranca', label: 'Próxima cobrança', width: 130, kind: 'date' },
        { key: 'ultimo_acesso', label: 'Último acesso', width: 130 },
      ],
      rows: visible.map((r) => ({
        barbearia: r.name,
        responsavel: r.owner?.name ?? '',
        email: r.owner?.email ?? '',
        telefone: r.ownerPhone ?? '',
        status: billingLabel[r.billing_status] ?? r.billing_status,
        plano: r.plan,
        proxima_cobranca: r.next_billing_date ?? '',
        ultimo_acesso: lastAccess(r).label,
      })),
    }])
  }

  if (gate !== 'granted') {
    return <div className="flex min-h-screen items-center justify-center text-sm text-muted-foreground">Verificando acesso…</div>
  }

  const showSkeleton = loading && rows.length === 0

  return (
    <PlatformShell
      adminName={adminName ?? ''}
      title="Clientes"
      description="Responsáveis pelas barbearias cadastradas na plataforma."
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
          <div className="rounded-xl border border-destructive/30 bg-destructive/[0.07] px-3.5 py-2.5 text-[13px] text-destructive">
            {error}
          </div>
        ) : null}

        <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
          <KpiCard label="Total de clientes" value={counts.total} hint="Contas cadastradas" tone="neutral" loading={showSkeleton} />
          <KpiCard label="Assinantes ativos" value={counts.active} hint="Com assinatura em dia" tone="success" loading={showSkeleton} />
          <KpiCard label="Em teste" value={counts.trialing} hint="Período gratuito em andamento" tone="warning" loading={showSkeleton} />
          <KpiCard label="Em atraso" value={counts.past_due} hint="Pagamento pendente" tone="danger" loading={showSkeleton} />
        </div>

        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-1 no-scrollbar">
            {FILTERS.map((filter) => {
              const count = filter.key === '' ? counts.total : counts[filter.key]
              const isActive = status === filter.key
              return (
                <button
                  key={filter.key || 'all'}
                  type="button"
                  onClick={() => setStatus(filter.key)}
                  className={cn(
                    'flex shrink-0 items-center gap-1.5 rounded-full border px-3 py-1.5 text-[13px] transition-colors duration-150',
                    isActive ? chipActive[filter.tone] : 'border-border/60 text-muted-foreground hover:bg-muted/40',
                  )}
                >
                  {filter.label}
                  <span className="tabular-nums opacity-70">({count})</span>
                </button>
              )
            })}
          </div>

          <div className="flex items-center gap-2">
            <Select
              className="h-9 w-[176px] rounded-xl text-sm"
              value={sort}
              onChange={(e) => setSort(e.target.value as SortKey)}
              aria-label="Ordenar por"
            >
              <option value="recent">Mais recentes</option>
              <option value="name">Nome (A–Z)</option>
              <option value="access">Último acesso</option>
              <option value="billing">Próxima cobrança</option>
            </Select>
            <Button
              variant="outline"
              size="sm"
              className="rounded-xl transition-colors duration-150"
              onClick={exportRows}
              disabled={visible.length === 0}
            >
              <Download className="size-4" />
              <span className="ml-2 hidden sm:inline">Exportar</span>
            </Button>
          </div>
        </div>

        {showSkeleton ? (
          <Card className="overflow-hidden rounded-xl border-border/60 p-4">
            <div className="space-y-3">
              {[0, 1, 2, 3, 4].map((i) => <div key={i} className="pf-skeleton h-12 rounded-lg" />)}
            </div>
          </Card>
        ) : visible.length === 0 ? (
          <Card className="rounded-xl border-border/60 p-2">
            <EmptyState
              icon={Users}
              title="Nenhum cliente encontrado"
              description="Ajuste a busca ou selecione outro filtro de status para ver as contas cadastradas."
              className="border-none"
            />
          </Card>
        ) : (
          <>
            {/* Desktop — tabela */}
            <Card className="hidden overflow-hidden rounded-xl border-border/60 p-0 lg:block">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="border-b border-border/60 bg-muted/30 text-left">
                    <tr className="text-[11px] uppercase tracking-wide text-muted-foreground">
                      <th className="px-4 py-3 font-normal">Barbearia</th>
                      <th className="px-4 py-3 font-normal">Contato</th>
                      <th className="px-4 py-3 font-normal">Status</th>
                      <th className="px-4 py-3 font-normal">Plano</th>
                      <th className="px-4 py-3 font-normal">Último acesso</th>
                      <th className="px-4 py-3 text-right font-normal">Ações</th>
                    </tr>
                  </thead>
                  <tbody>
                    {visible.map((row) => {
                      const access = lastAccess(row)
                      const canceled = row.billing_status === 'canceled'
                      const wa = waLinkFor(row)
                      const editing = phoneEdit?.id === row.id
                      return (
                        <tr
                          key={row.id}
                          className={cn(
                            'border-b border-border/60 align-middle transition-colors duration-150 last:border-b-0 hover:bg-muted/40',
                            canceled && 'opacity-60',
                          )}
                        >
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-3">
                              <span className="flex size-[30px] shrink-0 items-center justify-center rounded-full bg-primary/10 text-[11px] font-medium uppercase text-primary">
                                {initials(row.name)}
                              </span>
                              <div className="min-w-0">
                                <Link href={`/plataforma/contas/${row.id}`} className="block truncate font-medium text-foreground hover:underline">
                                  {row.name}
                                </Link>
                                <p className="truncate text-[11px] text-muted-foreground">
                                  /{row.slug}
                                  {row.owner?.name ? ` · ${row.owner.name}` : ''}
                                </p>
                              </div>
                            </div>
                          </td>

                          <td className="px-4 py-3">
                            <p className="truncate text-[13px] text-foreground">{row.owner?.email || '—'}</p>
                            {editing ? (
                              <div className="mt-1 flex items-center gap-1.5">
                                <Input
                                  autoFocus
                                  value={phoneEdit.value}
                                  onChange={(e) => setPhoneEdit({ id: row.id, value: e.target.value })}
                                  placeholder="(11) 91234-5678"
                                  className="h-8 w-36 text-xs"
                                />
                                <Button size="icon-sm" className="rounded-lg" disabled={savingPhone} onClick={() => void savePhone(row)}>
                                  {savingPhone ? <Loader2 className="size-3.5 animate-spin" /> : <Check className="size-3.5" />}
                                </Button>
                                <Button size="icon-sm" variant="ghost" onClick={() => setPhoneEdit(null)} aria-label="Cancelar">
                                  <X className="size-3.5" />
                                </Button>
                              </div>
                            ) : row.ownerPhone ? (
                              <button
                                type="button"
                                className="mt-0.5 flex items-center gap-1.5 text-[11px] text-muted-foreground transition-colors duration-150 hover:text-foreground"
                                onClick={() => row.ownerId && setPhoneEdit({ id: row.id, value: row.ownerPhone ?? '' })}
                                disabled={!row.ownerId}
                              >
                                <MessageCircle className="size-3.5 text-emerald-600" />
                                {row.ownerPhone}
                                {row.ownerId ? <Pencil className="size-3 opacity-60" /> : null}
                              </button>
                            ) : row.ownerId ? (
                              <button
                                type="button"
                                className="mt-0.5 text-[11px] text-primary underline-offset-2 hover:underline"
                                onClick={() => setPhoneEdit({ id: row.id, value: '' })}
                              >
                                Adicionar telefone
                              </button>
                            ) : (
                              <p className="mt-0.5 text-[11px] text-muted-foreground">Sem responsável ativo</p>
                            )}
                          </td>

                          <td className="px-4 py-3">
                            <StatusBadge
                              tone={billingTone[row.billing_status] ?? 'neutral'}
                              label={billingLabel[row.billing_status] ?? row.billing_status}
                            />
                          </td>

                          <td className="px-4 py-3">
                            <PlanPill plan={row.plan} />
                            <p className="mt-1 text-[11px] text-muted-foreground">
                              {row.billing_status === 'trialing'
                                ? (row.trial_ends_at ? `Teste até ${formatDate(row.trial_ends_at)}` : '—')
                                : row.next_billing_date ? `Cobra ${formatDate(row.next_billing_date)}` : '—'}
                            </p>
                          </td>

                          <td className="px-4 py-3">
                            <span
                              className="flex items-center gap-2 text-[13px] text-muted-foreground"
                              title={access.estimated ? 'Estimado pela última atualização da conta — login real indisponível' : undefined}
                            >
                              <span className={cn('size-1.5 shrink-0 rounded-full', accessDot[access.tone])} aria-hidden="true" />
                              {access.estimated ? `~ ${access.label}` : access.label}
                            </span>
                          </td>

                          <td className="px-4 py-3">
                            <div className="flex items-center justify-end gap-1">
                              {row.owner?.email ? (
                                <a
                                  href={`mailto:${row.owner.email}`}
                                  className={buttonVariants({ variant: 'ghost', size: 'icon-sm', className: 'rounded-lg' })}
                                  aria-label={`Enviar e-mail para ${row.owner.name}`}
                                  title="Enviar e-mail"
                                >
                                  <Mail className="size-4" />
                                </a>
                              ) : null}
                              {wa && !canceled ? (
                                <a
                                  href={wa}
                                  target="_blank"
                                  rel="noreferrer"
                                  className={buttonVariants({ variant: 'ghost', size: 'icon-sm', className: 'rounded-lg text-emerald-600' })}
                                  aria-label={`Enviar WhatsApp para ${row.owner?.name ?? row.name}`}
                                  title="Enviar WhatsApp"
                                >
                                  <MessageCircle className="size-4" />
                                </a>
                              ) : (
                                <span
                                  className="flex size-8 items-center justify-center rounded-lg text-muted-foreground/40"
                                  title={canceled ? 'Conta cancelada' : 'Sem telefone cadastrado'}
                                  aria-hidden="true"
                                >
                                  <MessageCircle className="size-4" />
                                </span>
                              )}
                              <Link
                                href={`/plataforma/contas/${row.id}`}
                                className={buttonVariants({ variant: 'outline', size: 'sm', className: 'ml-1 rounded-xl' })}
                              >
                                Gerenciar <ArrowRight className="ml-1 size-3.5" />
                              </Link>
                              <Button
                                variant="ghost"
                                size="icon-sm"
                                className="rounded-lg text-destructive hover:bg-destructive/10"
                                onClick={() => void deleteTenant(row)}
                                disabled={deletingId === row.id}
                                aria-label={`Excluir a conta ${row.name}`}
                                title="Excluir conta definitivamente"
                              >
                                {deletingId === row.id ? <Loader2 className="size-4 animate-spin" /> : <Trash2 className="size-4" />}
                              </Button>
                            </div>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            </Card>

            {/* Mobile — cards */}
            <div className="space-y-3 lg:hidden">
              {visible.map((row) => {
                const access = lastAccess(row)
                const canceled = row.billing_status === 'canceled'
                const wa = waLinkFor(row)
                const editing = phoneEdit?.id === row.id
                return (
                  <Card key={row.id} className={cn('rounded-xl border-border/60 p-4', canceled && 'opacity-60')}>
                    <div className="flex items-start gap-3">
                      <span className="flex size-[30px] shrink-0 items-center justify-center rounded-full bg-primary/10 text-[11px] font-medium uppercase text-primary">
                        {initials(row.name)}
                      </span>
                      <div className="min-w-0 flex-1">
                        <Link href={`/plataforma/contas/${row.id}`} className="block truncate font-medium text-foreground">
                          {row.name}
                        </Link>
                        <p className="truncate text-[11px] text-muted-foreground">
                          {row.owner?.name || 'Sem responsável'}{row.owner?.email ? ` · ${row.owner.email}` : ''}
                        </p>
                      </div>
                      <StatusBadge
                        tone={billingTone[row.billing_status] ?? 'neutral'}
                        label={billingLabel[row.billing_status] ?? row.billing_status}
                      />
                    </div>

                    <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1.5">
                      <PlanPill plan={row.plan} />
                      <span className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
                        <span className={cn('size-1.5 rounded-full', accessDot[access.tone])} aria-hidden="true" />
                        {access.estimated ? `~ ${access.label}` : access.label}
                      </span>
                      <span className="text-[11px] text-muted-foreground">
                        {row.next_billing_date ? `Cobra ${formatDate(row.next_billing_date)}` : '—'}
                      </span>
                    </div>

                    <div className="mt-3 flex items-center gap-2">
                      {editing ? (
                        <>
                          <Input
                            autoFocus
                            value={phoneEdit.value}
                            onChange={(e) => setPhoneEdit({ id: row.id, value: e.target.value })}
                            placeholder="(11) 91234-5678"
                            className="h-9 flex-1 text-xs"
                          />
                          <Button size="icon-sm" className="rounded-lg" disabled={savingPhone} onClick={() => void savePhone(row)}>
                            {savingPhone ? <Loader2 className="size-3.5 animate-spin" /> : <Check className="size-3.5" />}
                          </Button>
                          <Button size="icon-sm" variant="ghost" onClick={() => setPhoneEdit(null)} aria-label="Cancelar">
                            <X className="size-3.5" />
                          </Button>
                        </>
                      ) : (
                        <>
                          {wa && !canceled ? (
                            <a
                              href={wa}
                              target="_blank"
                              rel="noreferrer"
                              className={buttonVariants({ variant: 'outline', size: 'sm', className: 'flex-1 rounded-xl text-emerald-700' })}
                            >
                              <MessageCircle className="size-4" />
                              <span className="ml-2">WhatsApp</span>
                            </a>
                          ) : row.ownerId && !row.ownerPhone ? (
                            <Button
                              variant="outline"
                              size="sm"
                              className="flex-1 rounded-xl"
                              onClick={() => setPhoneEdit({ id: row.id, value: '' })}
                            >
                              <UserRound className="size-4" />
                              <span className="ml-2">Cadastrar telefone</span>
                            </Button>
                          ) : null}
                          <Link
                            href={`/plataforma/contas/${row.id}`}
                            className={buttonVariants({ variant: 'outline', size: 'sm', className: 'flex-1 rounded-xl' })}
                          >
                            Gerenciar <ArrowRight className="ml-1 size-3.5" />
                          </Link>
                          <Button
                            variant="ghost"
                            size="icon-sm"
                            className="rounded-lg text-destructive hover:bg-destructive/10"
                            onClick={() => void deleteTenant(row)}
                            disabled={deletingId === row.id}
                            aria-label={`Excluir a conta ${row.name}`}
                            title="Excluir conta definitivamente"
                          >
                            {deletingId === row.id ? <Loader2 className="size-4 animate-spin" /> : <Trash2 className="size-4" />}
                          </Button>
                        </>
                      )}
                    </div>
                  </Card>
                )
              })}
            </div>
          </>
        )}
      </div>
    </PlatformShell>
  )
}
