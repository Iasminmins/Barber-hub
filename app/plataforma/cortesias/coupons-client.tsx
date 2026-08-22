'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  Ticket, Gift, Plus, Loader2, Search, Copy, Check, Ban, Sparkles,
  CalendarClock, X,
} from 'lucide-react'
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Select } from '@/components/ui/select'
import { Dialog, DialogHeader } from '@/components/ui/dialog'
import { Tabs } from '@/components/ui/tabs'
import { PlatformShell } from '@/components/platform/platform-shell'
import { SectionHeader } from '@/components/platform/section-header'
import { EmptyState } from '@/components/platform/empty-state'
import { FeedbackBanner } from '@/components/platform/feedback-banner'
import { usePlatformSession } from '../use-platform-session'
import type { Coupon, CouponRedemption, TenantRow } from '../types'
import { formatDate } from '@/lib/format'
import { formatDiscount, generateCouponCode } from '@/lib/platform-coupons'
import { cn } from '@/lib/utils'

const PLANS = ['solo', 'starter', 'pro', 'premium'] as const
const PLAN_LABEL: Record<string, string> = { starter: 'Starter', pro: 'Pro', premium: 'Premium' }

const COUPON_STATUS_LABEL: Record<string, string> = { active: 'Ativo', expired: 'Expirado', disabled: 'Desativado' }
const COUPON_STATUS_STYLE: Record<string, string> = {
  active: 'bg-emerald-100 text-emerald-800',
  expired: 'bg-muted text-muted-foreground',
  disabled: 'bg-red-100 text-red-800',
}

type Tab = 'cupons' | 'cortesias'
type Feedback = { type: 'ok' | 'error'; text: string } | null

function money(v: number) {
  return v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

function monthKey(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
}
function monthLabel(key: string) {
  const [year, month] = key.split('-')
  return new Date(Number(year), Number(month) - 1, 1).toLocaleDateString('pt-BR', { month: 'short', year: '2-digit' })
}
function lastMonths(count: number) {
  const now = new Date()
  const keys: string[] = []
  for (let i = count - 1; i >= 0; i -= 1) keys.push(monthKey(new Date(now.getFullYear(), now.getMonth() - i, 1)))
  return keys
}

export function CouponsClient() {
  const { gate, adminName, token, signOut } = usePlatformSession()
  const [tab, setTab] = useState<Tab>('cupons')
  const [feedback, setFeedback] = useState<Feedback>(null)

  const [coupons, setCoupons] = useState<Coupon[]>([])
  const [redemptions, setRedemptions] = useState<CouponRedemption[]>([])
  const [loadingCoupons, setLoadingCoupons] = useState(false)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [newCouponOpen, setNewCouponOpen] = useState(false)
  const [redeemCoupon, setRedeemCoupon] = useState<Coupon | null>(null)

  const [courtesyTenants, setCourtesyTenants] = useState<TenantRow[]>([])
  const [loadingCourtesies, setLoadingCourtesies] = useState(false)
  const [grantOpen, setGrantOpen] = useState(false)

  const authHeaders = useMemo(() => ({ Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' }), [token])

  const loadCoupons = useCallback(async () => {
    setLoadingCoupons(true)
    try {
      const params = new URLSearchParams()
      if (search.trim()) params.set('search', search.trim())
      if (statusFilter) params.set('status', statusFilter)
      const [couponsRes, redemptionsRes] = await Promise.all([
        fetch(`/api/admin/coupons?${params}`, { headers: authHeaders }),
        fetch('/api/admin/coupons/redemptions', { headers: authHeaders }),
      ])
      const couponsData = await couponsRes.json()
      const redemptionsData = await redemptionsRes.json()
      if (couponsRes.ok) setCoupons(couponsData.items ?? [])
      if (redemptionsRes.ok) setRedemptions(redemptionsData.items ?? [])
    } finally {
      setLoadingCoupons(false)
    }
  }, [authHeaders, search, statusFilter])

  const loadCourtesies = useCallback(async () => {
    setLoadingCourtesies(true)
    try {
      const res = await fetch('/api/admin/tenants?billing=complimentary&pageSize=100', { headers: authHeaders })
      const data = await res.json()
      if (res.ok) setCourtesyTenants(data.items ?? [])
    } finally {
      setLoadingCourtesies(false)
    }
  }, [authHeaders])

  useEffect(() => {
    if (gate === 'anon') { window.location.replace('/login'); return }
    if (gate !== 'granted') return
    const timer = window.setTimeout(() => { void loadCoupons() }, 250)
    return () => window.clearTimeout(timer)
  }, [gate, loadCoupons])

  useEffect(() => {
    if (gate !== 'granted') return
    void loadCourtesies()
  }, [gate, loadCourtesies])

  const redemptionChart = useMemo(() => {
    const months = lastMonths(6)
    return months.map((key) => ({
      label: monthLabel(key),
      total: redemptions.filter((r) => r.redeemed_at.startsWith(key)).length,
    }))
  }, [redemptions])

  const insights = useMemo(() => {
    const activeCoupons = coupons.filter((c) => c.status === 'active').length
    const thisMonthKey = monthKey(new Date())
    const redeemedThisMonth = redemptions.filter((r) => r.redeemed_at.startsWith(thisMonthKey)).length
    return [
      { label: 'Cupons ativos', value: String(activeCoupons), tone: 'success' as const },
      { label: 'Resgates no mês', value: String(redeemedThisMonth), tone: 'gold' as const },
      { label: 'Cortesias ativas', value: String(courtesyTenants.length), tone: 'default' as const },
      { label: 'Total de cupons', value: String(coupons.length), tone: 'default' as const },
    ]
  }, [coupons, redemptions, courtesyTenants])

  if (gate !== 'granted') {
    return <div className="flex min-h-screen items-center justify-center text-sm text-muted-foreground">Verificando acesso…</div>
  }

  return (
    <PlatformShell
      adminName={adminName ?? ''}
      title="Cupons e cortesias"
      description="Crie e gerencie cupons de desconto e cortesias concedidas às barbearias."
      onSignOut={() => void signOut()}
      showGlobalSearch={false}
      showPeriod={false}
      showNewMessage={false}
    >
      <div className="mx-auto max-w-[1400px] space-y-5">
        <SectionHeader title="Cupons e cortesias" description="Gestão manual de benefícios — não altera cobranças no Asaas." insights={insights} icon={Ticket} />

        {feedback ? <FeedbackBanner type={feedback.type} text={feedback.text} onDismiss={() => setFeedback(null)} /> : null}

        <Tabs
          value={tab}
          onValueChange={(v) => setTab(v as Tab)}
          items={[{ value: 'cupons', label: 'Cupons' }, { value: 'cortesias', label: 'Cortesias' }]}
        />

        {tab === 'cupons' ? (
          <div className="space-y-5">
            <div className="flex flex-wrap items-center gap-2">
              <div className="relative min-w-[200px] flex-1 sm:max-w-xs">
                <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                <Input className="h-9 rounded-xl pl-9 text-sm" placeholder="Buscar código…" value={search} onChange={(e) => setSearch(e.target.value)} />
              </div>
              <Select className="h-9 w-[150px] rounded-xl text-sm" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
                <option value="">Todos os status</option>
                <option value="active">Ativos</option>
                <option value="expired">Expirados</option>
                <option value="disabled">Desativados</option>
              </Select>
              <Button size="sm" className="ml-auto rounded-xl" onClick={() => setNewCouponOpen(true)}>
                <Plus className="size-4" /><span className="ml-2">Novo cupom</span>
              </Button>
            </div>

            <Card className="pf-card-lift rounded-2xl border-border/70 p-5">
              <div className="mb-4">
                <h3 className="font-semibold text-foreground">Resgates de cupons</h3>
                <p className="text-sm text-muted-foreground">Volume de resgates registrados por mês</p>
              </div>
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={redemptionChart}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--color-border)" />
                  <XAxis dataKey="label" tickLine={false} axisLine={false} tick={{ fontSize: 12, fill: 'var(--color-muted-foreground)' }} />
                  <YAxis allowDecimals={false} tickLine={false} axisLine={false} tick={{ fontSize: 11, fill: 'var(--color-muted-foreground)' }} />
                  <Tooltip contentStyle={{ borderRadius: 12, border: '1px solid var(--color-border)' }} />
                  <Bar dataKey="total" fill="#C9A227" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </Card>

            <Card className="pf-card-lift overflow-hidden rounded-2xl border-border/70">
              <div className="border-b border-border/70 p-4">
                <h3 className="font-semibold text-foreground">Quem usou cada cupom</h3>
                <p className="text-sm text-muted-foreground">Resgates automáticos (checkout com cupom) e manuais (registrados pela equipe)</p>
              </div>
              {redemptions.length === 0 ? (
                <EmptyState icon={Check} title="Nenhum resgate ainda" description="Assim que um cliente usar um cupom no checkout, ou a equipe registrar um resgate manual, ele aparece aqui." className="border-none" />
              ) : (
                <div className="max-h-72 overflow-y-auto">
                  <table className="w-full text-sm">
                    <thead className="sticky top-0 bg-muted/50 text-left text-xs uppercase text-muted-foreground">
                      <tr>
                        <th className="px-4 py-2">Cupom</th>
                        <th className="px-4 py-2">Barbearia</th>
                        <th className="px-4 py-2">Desconto</th>
                        <th className="px-4 py-2">Quando</th>
                        <th className="px-4 py-2">Registrado por</th>
                      </tr>
                    </thead>
                    <tbody>
                      {redemptions.map((r) => (
                        <tr key={r.id} className="border-t border-border/70">
                          <td className="px-4 py-2 font-mono text-xs font-semibold">{r.coupon_code}</td>
                          <td className="px-4 py-2">{r.barbershop_name}</td>
                          <td className="px-4 py-2">{r.discount_applied != null ? money(r.discount_applied) : '—'}</td>
                          <td className="px-4 py-2 text-muted-foreground">{formatDate(r.redeemed_at)}</td>
                          <td className="px-4 py-2 text-muted-foreground">{r.redeemed_by_email ?? 'Automático (checkout)'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </Card>

            <Card className="pf-card-lift overflow-hidden rounded-2xl border-border/70">
              {loadingCoupons ? (
                <div className="p-10 text-center text-sm text-muted-foreground"><Loader2 className="mx-auto size-5 animate-spin" /></div>
              ) : coupons.length === 0 ? (
                <EmptyState icon={Ticket} title="Nenhum cupom cadastrado" description="Crie o primeiro cupom de desconto para começar a acompanhar resgates." action={{ label: 'Novo cupom', onClick: () => setNewCouponOpen(true) }} className="border-none" />
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-muted/50 text-left text-xs uppercase text-muted-foreground">
                      <tr>
                        <th className="px-4 py-3">Código</th>
                        <th className="px-4 py-3">Desconto</th>
                        <th className="px-4 py-3">Planos</th>
                        <th className="px-4 py-3">Validade</th>
                        <th className="px-4 py-3">Usos</th>
                        <th className="px-4 py-3">Status</th>
                        <th className="px-4 py-3 text-right">Ações</th>
                      </tr>
                    </thead>
                    <tbody>
                      {coupons.map((coupon) => (
                        <CouponRow
                          key={coupon.id}
                          coupon={coupon}
                          onRedeem={() => setRedeemCoupon(coupon)}
                          onToggleStatus={async () => {
                            const nextStatus = coupon.status === 'disabled' ? 'active' : 'disabled'
                            const res = await fetch(`/api/admin/coupons/${coupon.id}`, { method: 'PATCH', headers: authHeaders, body: JSON.stringify({ status: nextStatus }) })
                            if (res.ok) { setFeedback({ type: 'ok', text: nextStatus === 'active' ? 'Cupom reativado.' : 'Cupom desativado.' }); void loadCoupons() }
                            else setFeedback({ type: 'error', text: 'Não foi possível atualizar o cupom.' })
                          }}
                        />
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </Card>
          </div>
        ) : (
          <div className="space-y-5">
            <div className="flex justify-end">
              <Button size="sm" className="rounded-xl" onClick={() => setGrantOpen(true)}>
                <Gift className="size-4" /><span className="ml-2">Conceder cortesia</span>
              </Button>
            </div>

            <Card className="pf-card-lift overflow-hidden rounded-2xl border-border/70">
              {loadingCourtesies ? (
                <div className="p-10 text-center text-sm text-muted-foreground"><Loader2 className="mx-auto size-5 animate-spin" /></div>
              ) : courtesyTenants.length === 0 ? (
                <EmptyState icon={Gift} title="Nenhuma cortesia ativa" description="Conceda dias grátis ou um upgrade temporário para uma barbearia." action={{ label: 'Conceder cortesia', onClick: () => setGrantOpen(true) }} className="border-none" />
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-muted/50 text-left text-xs uppercase text-muted-foreground">
                      <tr>
                        <th className="px-4 py-3">Barbearia</th>
                        <th className="px-4 py-3">Plano</th>
                        <th className="px-4 py-3">Motivo</th>
                        <th className="px-4 py-3">Cortesia até</th>
                        <th className="px-4 py-3">Valor estimado</th>
                      </tr>
                    </thead>
                    <tbody>
                      {courtesyTenants.map((tenant) => (
                        <tr key={tenant.id} className="border-t border-border/70">
                          <td className="px-4 py-3 font-medium">{tenant.name}</td>
                          <td className="px-4 py-3 capitalize">{tenant.plan}</td>
                          <td className="px-4 py-3 text-muted-foreground">{tenant.complimentary_reason ?? '—'}</td>
                          <td className="px-4 py-3">{formatDate(tenant.complimentary_until)}</td>
                          <td className="px-4 py-3">{money(tenant.complimentary_value ?? 0)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </Card>
          </div>
        )}
      </div>

      <NewCouponDialog
        open={newCouponOpen}
        onClose={() => setNewCouponOpen(false)}
        authHeaders={authHeaders}
        onCreated={() => { setNewCouponOpen(false); setFeedback({ type: 'ok', text: 'Cupom criado com sucesso.' }); void loadCoupons() }}
        onError={(text) => setFeedback({ type: 'error', text })}
      />

      <RedeemCouponDialog
        coupon={redeemCoupon}
        onClose={() => setRedeemCoupon(null)}
        authHeaders={authHeaders}
        onRedeemed={() => { setRedeemCoupon(null); setFeedback({ type: 'ok', text: 'Resgate registrado.' }); void loadCoupons() }}
        onError={(text) => setFeedback({ type: 'error', text })}
      />

      <GrantCourtesyDialog
        open={grantOpen}
        onClose={() => setGrantOpen(false)}
        authHeaders={authHeaders}
        onGranted={() => { setGrantOpen(false); setFeedback({ type: 'ok', text: 'Cortesia concedida.' }); void loadCourtesies() }}
        onError={(text) => setFeedback({ type: 'error', text })}
      />
    </PlatformShell>
  )
}

function CouponRow({ coupon, onRedeem, onToggleStatus }: { coupon: Coupon; onRedeem: () => void; onToggleStatus: () => void }) {
  const [copied, setCopied] = useState(false)

  return (
    <tr className="border-t border-border/70 align-middle transition-colors hover:bg-muted/30">
      <td className="px-4 py-3">
        <button
          type="button"
          className="flex items-center gap-1.5 font-mono text-xs font-semibold text-foreground hover:text-primary"
          onClick={() => { void navigator.clipboard.writeText(coupon.code); setCopied(true); setTimeout(() => setCopied(false), 1500) }}
          title="Copiar código"
        >
          {coupon.code}
          {copied ? <Check className="size-3.5 text-emerald-600" /> : <Copy className="size-3.5 text-muted-foreground" />}
        </button>
        {coupon.description ? <p className="mt-0.5 text-xs text-muted-foreground">{coupon.description}</p> : null}
      </td>
      <td className="px-4 py-3">{formatDiscount(coupon)}</td>
      <td className="px-4 py-3">{coupon.applicable_plans.length ? coupon.applicable_plans.map((p) => PLAN_LABEL[p] ?? p).join(', ') : 'Todos'}</td>
      <td className="px-4 py-3 text-muted-foreground">
        {coupon.starts_at ? `${formatDate(coupon.starts_at)} – ` : ''}{coupon.expires_at ? formatDate(coupon.expires_at) : 'Sem validade'}
      </td>
      <td className="px-4 py-3">{coupon.redemptions_count}{coupon.max_redemptions ? ` / ${coupon.max_redemptions}` : ''}</td>
      <td className="px-4 py-3">
        <span className={cn('rounded-full px-2 py-1 text-xs font-medium', COUPON_STATUS_STYLE[coupon.status])}>{COUPON_STATUS_LABEL[coupon.status]}</span>
      </td>
      <td className="px-4 py-3 text-right">
        <div className="flex justify-end gap-1.5">
          <Button variant="outline" size="sm" className="rounded-xl" disabled={coupon.status !== 'active'} onClick={onRedeem}>
            Registrar resgate
          </Button>
          <Button variant="ghost" size="icon-sm" title={coupon.status === 'disabled' ? 'Reativar' : 'Desativar'} onClick={onToggleStatus}>
            {coupon.status === 'disabled' ? <Sparkles className="size-4" /> : <Ban className="size-4 text-destructive" />}
          </Button>
        </div>
      </td>
    </tr>
  )
}

function NewCouponDialog({ open, onClose, authHeaders, onCreated, onError }: {
  open: boolean; onClose: () => void; authHeaders: Record<string, string>; onCreated: () => void; onError: (text: string) => void
}) {
  const [code, setCode] = useState('')
  const [description, setDescription] = useState('')
  const [discountType, setDiscountType] = useState<'percentage' | 'fixed'>('percentage')
  const [discountValue, setDiscountValue] = useState('')
  const [applicablePlans, setApplicablePlans] = useState<string[]>([])
  const [maxRedemptions, setMaxRedemptions] = useState('')
  const [startsAt, setStartsAt] = useState('')
  const [expiresAt, setExpiresAt] = useState('')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (!open) {
      setCode(''); setDescription(''); setDiscountType('percentage'); setDiscountValue('')
      setApplicablePlans([]); setMaxRedemptions(''); setStartsAt(''); setExpiresAt('')
    }
  }, [open])

  async function submit() {
    setSaving(true)
    try {
      const res = await fetch('/api/admin/coupons', {
        method: 'POST', headers: authHeaders,
        body: JSON.stringify({
          code: code.trim() || undefined,
          description: description.trim() || undefined,
          discountType, discountValue: Number(discountValue),
          applicablePlans, maxRedemptions: maxRedemptions ? Number(maxRedemptions) : null,
          startsAt: startsAt || null, expiresAt: expiresAt || null,
        }),
      })
      const data = await res.json()
      if (!res.ok) { onError(data.error ?? 'Não foi possível criar o cupom.'); return }
      onCreated()
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog open={open} onClose={onClose} className="sm:max-w-xl">
      <DialogHeader title="Novo cupom" description="Cupons são um controle interno — o resgate é registrado manualmente pela equipe." />
      <div className="space-y-4">
        <div>
          <label className="mb-1 block text-sm font-medium">Código</label>
          <div className="flex gap-2">
            <Input value={code} onChange={(e) => setCode(e.target.value.toUpperCase())} placeholder="Deixe em branco para gerar automático" className="font-mono" />
            <Button type="button" variant="outline" className="shrink-0 rounded-xl" onClick={() => setCode(generateCouponCode())}>Gerar</Button>
          </div>
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium">Descrição (opcional)</label>
          <Input value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Ex.: Campanha de indicação" />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="mb-1 block text-sm font-medium">Tipo de desconto</label>
            <Select value={discountType} onChange={(e) => setDiscountType(e.target.value as 'percentage' | 'fixed')}>
              <option value="percentage">Percentual (%)</option>
              <option value="fixed">Valor fixo (R$)</option>
            </Select>
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium">Valor</label>
            <Input type="number" min="0" step="0.01" value={discountValue} onChange={(e) => setDiscountValue(e.target.value)} placeholder={discountType === 'percentage' ? 'Ex.: 20' : 'Ex.: 50.00'} />
          </div>
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium">Planos aplicáveis</label>
          <div className="flex flex-wrap gap-2">
            {PLANS.map((plan) => (
              <label key={plan} className={cn('flex cursor-pointer items-center gap-1.5 rounded-lg border px-3 py-1.5 text-sm', applicablePlans.includes(plan) ? 'border-primary bg-primary/10 text-primary' : 'border-border')}>
                <input
                  type="checkbox"
                  className="size-3.5"
                  checked={applicablePlans.includes(plan)}
                  onChange={(e) => setApplicablePlans((prev) => e.target.checked ? [...prev, plan] : prev.filter((p) => p !== plan))}
                />
                {PLAN_LABEL[plan]}
              </label>
            ))}
          </div>
          <p className="mt-1 text-xs text-muted-foreground">Nenhum selecionado = válido para todos os planos.</p>
        </div>

        <div className="grid grid-cols-3 gap-3">
          <div>
            <label className="mb-1 block text-sm font-medium">Início</label>
            <Input type="date" value={startsAt} onChange={(e) => setStartsAt(e.target.value)} />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium">Validade</label>
            <Input type="date" value={expiresAt} onChange={(e) => setExpiresAt(e.target.value)} />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium">Limite de usos</label>
            <Input type="number" min="1" value={maxRedemptions} onChange={(e) => setMaxRedemptions(e.target.value)} placeholder="Ilimitado" />
          </div>
        </div>

        <div className="flex justify-end gap-2 pt-2">
          <Button variant="outline" className="rounded-xl" onClick={onClose}>Cancelar</Button>
          <Button className="rounded-xl" disabled={saving || !discountValue} onClick={() => void submit()}>
            {saving ? <Loader2 className="size-4 animate-spin" /> : null}
            <span className={saving ? 'ml-2' : ''}>Criar cupom</span>
          </Button>
        </div>
      </div>
    </Dialog>
  )
}

function RedeemCouponDialog({ coupon, onClose, authHeaders, onRedeemed, onError }: {
  coupon: Coupon | null; onClose: () => void; authHeaders: Record<string, string>; onRedeemed: () => void; onError: (text: string) => void
}) {
  const [picked, setPicked] = useState<{ id: string; name: string } | null>(null)
  const [note, setNote] = useState('')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (!coupon) { setPicked(null); setNote('') }
  }, [coupon])

  async function submit() {
    if (!coupon || !picked) return
    setSaving(true)
    try {
      const res = await fetch(`/api/admin/coupons/${coupon.id}/redeem`, {
        method: 'POST', headers: authHeaders,
        body: JSON.stringify({ barbershopId: picked.id, note: note.trim() || undefined }),
      })
      const data = await res.json()
      if (!res.ok) { onError(data.error ?? 'Não foi possível registrar o resgate.'); return }
      onRedeemed()
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog open={Boolean(coupon)} onClose={onClose} className="sm:max-w-md">
      <DialogHeader title={`Registrar resgate — ${coupon?.code ?? ''}`} description="Selecione a barbearia que recebeu este cupom." />
      <div className="space-y-4">
        <BarbershopPicker authHeaders={authHeaders} value={picked} onChange={setPicked} />
        <div>
          <label className="mb-1 block text-sm font-medium">Observação (opcional)</label>
          <Input value={note} onChange={(e) => setNote(e.target.value)} placeholder="Ex.: aplicado via WhatsApp" />
        </div>
        <div className="flex justify-end gap-2 pt-2">
          <Button variant="outline" className="rounded-xl" onClick={onClose}>Cancelar</Button>
          <Button className="rounded-xl" disabled={saving || !picked} onClick={() => void submit()}>
            {saving ? <Loader2 className="size-4 animate-spin" /> : null}
            <span className={saving ? 'ml-2' : ''}>Confirmar resgate</span>
          </Button>
        </div>
      </div>
    </Dialog>
  )
}

function GrantCourtesyDialog({ open, onClose, authHeaders, onGranted, onError }: {
  open: boolean; onClose: () => void; authHeaders: Record<string, string>; onGranted: () => void; onError: (text: string) => void
}) {
  const [picked, setPicked] = useState<{ id: string; name: string } | null>(null)
  const [mode, setMode] = useState<'days' | 'upgrade'>('days')
  const [days, setDays] = useState('7')
  const [months, setMonths] = useState('')
  const [upgradePlan, setUpgradePlan] = useState<'starter' | 'pro' | 'premium'>('pro')
  const [reason, setReason] = useState('')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (!open) { setPicked(null); setMode('days'); setDays('7'); setMonths(''); setUpgradePlan('pro'); setReason('') }
  }, [open])

  async function submit() {
    if (!picked) return
    if (reason.trim().length < 3) { onError('Informe o motivo da cortesia.'); return }
    setSaving(true)
    try {
      const body: Record<string, unknown> = { reason: reason.trim() }
      if (months) body.complimentaryMonths = Number(months)
      else body.complimentaryDays = Number(days || 7)
      if (mode === 'upgrade') body.plan = upgradePlan

      const res = await fetch(`/api/admin/tenants/${picked.id}`, { method: 'PATCH', headers: authHeaders, body: JSON.stringify(body) })
      const data = await res.json()
      if (!res.ok) { onError(data.error ?? 'Não foi possível conceder a cortesia.'); return }
      onGranted()
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog open={open} onClose={onClose} className="sm:max-w-md">
      <DialogHeader title="Conceder cortesia" description="Dias grátis ou upgrade temporário de plano." />
      <div className="space-y-4">
        <BarbershopPicker authHeaders={authHeaders} value={picked} onChange={setPicked} />

        <div className="flex gap-2">
          <button type="button" onClick={() => setMode('days')} className={cn('flex-1 rounded-lg border px-3 py-2 text-sm', mode === 'days' ? 'border-primary bg-primary/10 text-primary' : 'border-border text-muted-foreground')}>
            <CalendarClock className="mx-auto mb-1 size-4" /> Dias grátis
          </button>
          <button type="button" onClick={() => setMode('upgrade')} className={cn('flex-1 rounded-lg border px-3 py-2 text-sm', mode === 'upgrade' ? 'border-primary bg-primary/10 text-primary' : 'border-border text-muted-foreground')}>
            <Sparkles className="mx-auto mb-1 size-4" /> Upgrade temporário
          </button>
        </div>

        {mode === 'upgrade' ? (
          <div>
            <label className="mb-1 block text-sm font-medium">Plano temporário</label>
            <Select value={upgradePlan} onChange={(e) => setUpgradePlan(e.target.value as typeof upgradePlan)}>
              {PLANS.map((p) => <option key={p} value={p}>{PLAN_LABEL[p]}</option>)}
            </Select>
            <p className="mt-1 text-xs text-amber-700">Não há reversão automática — revogue o plano manualmente após o período de cortesia.</p>
          </div>
        ) : null}

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="mb-1 block text-sm font-medium">Dias</label>
            <Input type="number" min="1" value={days} onChange={(e) => { setDays(e.target.value); setMonths('') }} />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium">Ou meses</label>
            <Input type="number" min="1" value={months} onChange={(e) => { setMonths(e.target.value); setDays('') }} placeholder="Opcional" />
          </div>
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium">Motivo</label>
          <Input value={reason} onChange={(e) => setReason(e.target.value)} placeholder="Ex.: compensação por instabilidade" />
        </div>

        <div className="flex justify-end gap-2 pt-2">
          <Button variant="outline" className="rounded-xl" onClick={onClose}>Cancelar</Button>
          <Button className="rounded-xl" disabled={saving || !picked} onClick={() => void submit()}>
            {saving ? <Loader2 className="size-4 animate-spin" /> : null}
            <span className={saving ? 'ml-2' : ''}>Conceder cortesia</span>
          </Button>
        </div>
      </div>
    </Dialog>
  )
}

function BarbershopPicker({ authHeaders, value, onChange }: {
  authHeaders: Record<string, string>
  value: { id: string; name: string } | null
  onChange: (v: { id: string; name: string } | null) => void
}) {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<TenantRow[]>([])
  const [searching, setSearching] = useState(false)

  useEffect(() => {
    if (value || query.trim().length < 2) { setResults([]); return }
    setSearching(true)
    const timer = window.setTimeout(async () => {
      const res = await fetch(`/api/admin/tenants?search=${encodeURIComponent(query.trim())}&pageSize=8`, { headers: authHeaders })
      const data = await res.json()
      if (res.ok) setResults(data.items ?? [])
      setSearching(false)
    }, 300)
    return () => window.clearTimeout(timer)
  }, [query, value, authHeaders])

  if (value) {
    return (
      <div>
        <label className="mb-1 block text-sm font-medium">Barbearia</label>
        <div className="flex items-center justify-between rounded-lg border border-primary/40 bg-primary/5 px-3 py-2 text-sm">
          <span className="font-medium">{value.name}</span>
          <button type="button" onClick={() => onChange(null)} className="text-muted-foreground hover:text-foreground"><X className="size-4" /></button>
        </div>
      </div>
    )
  }

  return (
    <div>
      <label className="mb-1 block text-sm font-medium">Barbearia</label>
      <div className="relative">
        <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input className="pl-9" value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Buscar por nome…" />
        {searching ? <Loader2 className="absolute right-3 top-1/2 size-4 -translate-y-1/2 animate-spin text-muted-foreground" /> : null}
      </div>
      {results.length > 0 ? (
        <div className="mt-1 max-h-48 overflow-y-auto rounded-lg border border-border">
          {results.map((r) => (
            <button
              key={r.id}
              type="button"
              className="flex w-full items-center justify-between px-3 py-2 text-left text-sm hover:bg-muted"
              onClick={() => { onChange({ id: r.id, name: r.name }); setQuery('') }}
            >
              <span>{r.name}</span>
              <span className="text-xs capitalize text-muted-foreground">{r.plan}</span>
            </button>
          ))}
        </div>
      ) : null}
    </div>
  )
}
