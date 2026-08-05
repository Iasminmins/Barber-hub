'use client'

import { useCallback, useEffect, useState } from 'react'
import Link from 'next/link'
import { ArrowLeft, Loader2, RefreshCw, UserCheck, UserX, ExternalLink, Gift, Save, CreditCard, ShieldCheck } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { usePlatformSession } from '../../use-platform-session'
import { PlatformShell } from '@/components/platform/platform-shell'
import { formatDate } from '@/lib/format'

type Barbershop = {
  id: string
  name: string
  slug: string
  city: string | null
  plan: string
  billing_status: string
  trial_ends_at: string | null
  next_billing_date: string | null
  last_payment_at: string | null
  created_at: string
  asaas_customer_id: string | null
  asaas_subscription_id: string | null
  billing_document?: string | null
  complimentary_until: string | null
  complimentary_reason: string | null
  complimentary_value: number
  complimentary_granted_at: string | null
}

type Member = {
  id: string
  user_id: string
  name: string
  email: string
  role: string
  active: boolean
  created_at: string
}

type Payment = {
  id: string
  value: number
  status: string
  billingType: string
  dueDate: string | null
  paymentDate: string | null
  description: string | null
  invoiceUrl: string | null
}

type AuditEntry = {
  id: string
  admin_email: string | null
  action: string
  details: Record<string, unknown>
  created_at: string
}

function formatMoney(value: number) {
  return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

function auditDescription(entry: AuditEntry) {
  if (entry.action === 'tenant.complimentary_grant') {
    return `Cortesia concedida até ${formatDate(String(entry.details.complimentary_until ?? ''))}${entry.details.complimentary_reason ? ` · ${entry.details.complimentary_reason}` : ''}`
  }
  if (entry.action === 'tenant.billing_update') return 'Assinatura atualizada pelo administrador'
  if (entry.action === 'tenant.delete') return 'Conta removida'
  return entry.action
}

function billingStatusLabel(shop: Barbershop) {
  if (shop.billing_status === 'past_due' && shop.next_billing_date && shop.next_billing_date >= new Date().toISOString().slice(0, 10)) return 'Cobrança agendada'
  return ({ trialing: 'Em teste', active: 'Ativa', past_due: 'Em atraso', canceled: 'Cancelada' } as Record<string, string>)[shop.billing_status] ?? shop.billing_status
}

export function ContaClient({ tenantId }: { tenantId: string }) {
  const { gate, token, adminName, signOut } = usePlatformSession()
  const [shop, setShop] = useState<Barbershop | null>(null)
  const [members, setMembers] = useState<Member[]>([])
  const [payments, setPayments] = useState<Payment[]>([])
  const [audit, setAudit] = useState<AuditEntry[]>([])
  const [paymentsNote, setPaymentsNote] = useState('')
  const [loading, setLoading] = useState(false)
  const [busyMember, setBusyMember] = useState('')
  const [billingBusy, setBillingBusy] = useState(false)
  const [billingMessage, setBillingMessage] = useState('')
  const [billingForm, setBillingForm] = useState({ plan: 'starter', status: 'trialing', nextBillingDate: '', complimentaryUntil: '', reason: '' })
  const [error, setError] = useState('')

  const load = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const headers = { Authorization: `Bearer ${token}` }
      const [detailResponse, paymentsResponse] = await Promise.all([
        fetch(`/api/admin/tenants/${tenantId}`, { headers }),
        fetch(`/api/admin/tenants/${tenantId}/payments`, { headers }),
      ])
      const detail = await detailResponse.json()
      const paymentData = await paymentsResponse.json()
      if (!detailResponse.ok) throw new Error(detail.error ?? 'Falha ao carregar a conta.')
      setShop(detail.barbershop)
      setBillingForm((current) => ({
        ...current,
        plan: detail.barbershop.plan,
        status: detail.barbershop.billing_status,
        nextBillingDate: detail.barbershop.next_billing_date?.slice(0, 10) ?? '',
        complimentaryUntil: detail.barbershop.complimentary_until?.slice(0, 10) ?? '',
      }))
      setMembers(detail.members ?? [])
      setAudit(detail.audit ?? [])
      setPayments(paymentData.payments ?? [])
      setPaymentsNote(paymentData.note ?? paymentData.error ?? '')
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : 'Falha ao carregar a conta.')
    } finally {
      setLoading(false)
    }
  }, [token, tenantId])

  useEffect(() => {
    if (gate === 'anon') { window.location.replace('/login'); return }
    if (gate === 'granted') void load()
  }, [gate, load])

  async function toggleMember(member: Member) {
    setBusyMember(member.id)
    setError('')
    try {
      const response = await fetch(`/api/admin/members/${member.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ active: !member.active }),
      })
      const data = await response.json()
      if (!response.ok) throw new Error(data.error ?? 'Falha ao atualizar o acesso.')
      await load()
    } catch (toggleError) {
      setError(toggleError instanceof Error ? toggleError.message : 'Falha ao atualizar o acesso.')
    } finally {
      setBusyMember('')
    }
  }

  async function updateBilling(body: Record<string, unknown>, successMessage: string) {
    setBillingBusy(true)
    setBillingMessage('')
    setError('')
    try {
      const response = await fetch(`/api/admin/tenants/${tenantId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(body),
      })
      const data = await response.json()
      if (!response.ok) throw new Error(data.error ?? 'Falha ao atualizar a assinatura.')
      setBillingMessage(successMessage)
      await load()
    } catch (billingError) {
      setError(billingError instanceof Error ? billingError.message : 'Falha ao atualizar a assinatura.')
    } finally {
      setBillingBusy(false)
    }
  }

  function grantComplimentary(period: { complimentaryDays?: number; complimentaryMonths?: number; complimentaryUntil?: string }, label: string) {
    void updateBilling({ ...period, reason: billingForm.reason }, `${label} de cortesia concedido com sucesso.`)
  }

  if (gate !== 'granted') return <div className="flex min-h-screen items-center justify-center">Verificando acesso...</div>

  return (
    <PlatformShell
      adminName={adminName ?? ''}
      title={shop?.name ?? 'Carregando…'}
      description={shop ? `/${shop.slug}${shop.city ? ` · ${shop.city}` : ''} · criada em ${formatDate(shop.created_at)}` : 'Perfil da barbearia'}
      loading={loading}
      onRefresh={() => void load()}
      onSignOut={() => void signOut()}
      showGlobalSearch={false}
      showPeriod={false}
      showNewMessage={false}
    >
      <div className="mx-auto max-w-6xl space-y-6">
        <Link href="/plataforma" className="inline-flex items-center text-sm text-muted-foreground hover:underline">
          <ArrowLeft className="mr-1 size-4" /> Voltar ao painel
        </Link>

        {error ? (
          <div className="rounded-md border border-destructive/40 bg-destructive/10 p-3 text-sm text-destructive">
            {error}
          </div>
        ) : null}

        {shop ? (
          <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {[
              { label: 'Plano', value: shop.plan },
              { label: 'Status', value: billingStatusLabel(shop) },
              { label: 'Fim do teste', value: formatDate(shop.trial_ends_at) },
              { label: 'Próxima cobrança', value: formatDate(shop.next_billing_date) },
            ].map((item) => (
              <Card key={item.label} className="p-4">
                <p className="text-xs text-muted-foreground">{item.label}</p>
                <p className="mt-1 text-lg font-semibold capitalize">{item.value}</p>
              </Card>
            ))}
          </section>
        ) : null}

        {shop ? (
          <Card className="overflow-hidden">
            <div className="flex flex-wrap items-start justify-between gap-3 border-b border-border p-5">
              <div>
                <h2 className="flex items-center gap-2 font-semibold"><CreditCard className="size-4" /> Gestão da assinatura</h2>
                <p className="mt-1 text-sm text-muted-foreground">Plano, cobrança, cortesia e sincronização com o Asaas.</p>
              </div>
              <Button variant="outline" size="sm" disabled={billingBusy || !shop.asaas_subscription_id} onClick={() => void updateBilling({ syncAsaas: true }, 'Dados sincronizados com o Asaas.')}>
                {billingBusy ? <Loader2 className="size-4 animate-spin" /> : <RefreshCw className="size-4" />} Sincronizar Asaas
              </Button>
            </div>

            <div className="grid gap-6 p-5 lg:grid-cols-[1.1fr_0.9fr]">
              <div className="space-y-4">
                <div className="grid gap-3 sm:grid-cols-3">
                  <label className="text-sm font-medium">Plano
                    <select className="mt-1 h-10 w-full rounded-md border border-border bg-background px-3 font-normal" value={billingForm.plan} onChange={(event) => setBillingForm({ ...billingForm, plan: event.target.value })}>
                      <option value="starter">Starter · R$ 89</option><option value="pro">Pro · R$ 149</option><option value="premium">Premium · R$ 249</option>
                    </select>
                  </label>
                  <label className="text-sm font-medium">Status
                    <select className="mt-1 h-10 w-full rounded-md border border-border bg-background px-3 font-normal" value={billingForm.status} onChange={(event) => setBillingForm({ ...billingForm, status: event.target.value })}>
                      <option value="trialing">Em teste</option><option value="active">Ativa</option><option value="past_due">Em atraso</option><option value="canceled">Cancelada</option>
                    </select>
                  </label>
                  <label className="text-sm font-medium">Próxima cobrança
                    <Input className="mt-1" type="date" value={billingForm.nextBillingDate} onChange={(event) => setBillingForm({ ...billingForm, nextBillingDate: event.target.value })} />
                  </label>
                </div>

                <label className="block text-sm font-medium">Motivo da alteração
                  <Input className="mt-1" value={billingForm.reason} placeholder="Ex.: cortesia comercial para renovação" onChange={(event) => setBillingForm({ ...billingForm, reason: event.target.value })} />
                </label>

                <div className="flex flex-wrap gap-2">
                  <Button disabled={billingBusy || billingForm.reason.trim().length < 3} onClick={() => void updateBilling({ plan: billingForm.plan, billing_status: billingForm.status, nextBillingDate: billingForm.nextBillingDate, reason: billingForm.reason }, 'Assinatura atualizada com sucesso.')}>
                    <Save className="size-4" /> Salvar assinatura
                  </Button>
                  {billingMessage ? <span className="self-center text-sm font-medium text-emerald-700">{billingMessage}</span> : null}
                </div>

                <div className="rounded-xl border border-border bg-muted/30 p-4 text-sm">
                  <div className="flex items-center gap-2 font-medium"><ShieldCheck className="size-4 text-emerald-600" /> Integração e auditoria</div>
                  <dl className="mt-3 grid gap-2 sm:grid-cols-2">
                    <div><dt className="text-xs text-muted-foreground">Cliente Asaas</dt><dd className="break-all font-mono text-xs">{shop.asaas_customer_id ?? 'Não vinculado'}</dd></div>
                    <div><dt className="text-xs text-muted-foreground">Assinatura Asaas</dt><dd className="break-all font-mono text-xs">{shop.asaas_subscription_id ?? 'Não vinculada'}</dd></div>
                    <div><dt className="text-xs text-muted-foreground">Último pagamento</dt><dd>{formatDate(shop.last_payment_at)}</dd></div>
                    <div><dt className="text-xs text-muted-foreground">Documento</dt><dd>{shop.billing_document || 'Não informado'}</dd></div>
                  </dl>
                </div>
              </div>

              <div className="rounded-xl border border-amber-200 bg-amber-50/60 p-4">
                <h3 className="flex items-center gap-2 font-semibold text-amber-950"><Gift className="size-4" /> Conceder cortesia</h3>
                <p className="mt-1 text-sm text-amber-900/70">A próxima cobrança será prorrogada no BarberHub e no Asaas.</p>
                <div className="mt-4 grid grid-cols-3 gap-2">
                  {[7, 15, 30].map((days) => <Button key={days} variant="outline" size="sm" disabled={billingBusy || billingForm.reason.trim().length < 3} onClick={() => grantComplimentary({ complimentaryDays: days }, `${days} dias`)}>+{days} dias</Button>)}
                  {[1, 2, 3].map((months) => <Button key={months} variant="outline" size="sm" disabled={billingBusy || billingForm.reason.trim().length < 3} onClick={() => grantComplimentary({ complimentaryMonths: months }, `${months} ${months === 1 ? 'mês' : 'meses'}`)}>+{months} {months === 1 ? 'mês' : 'meses'}</Button>)}
                </div>
                <div className="mt-4 flex gap-2">
                  <Input type="date" value={billingForm.complimentaryUntil} onChange={(event) => setBillingForm({ ...billingForm, complimentaryUntil: event.target.value })} />
                  <Button variant="outline" disabled={billingBusy || billingForm.reason.trim().length < 3 || !billingForm.complimentaryUntil} onClick={() => grantComplimentary({ complimentaryUntil: billingForm.complimentaryUntil }, 'Período personalizado')}>Aplicar</Button>
                </div>
                {shop.complimentary_until ? (
                  <div className="mt-4 rounded-lg bg-white/70 p-3 text-sm text-amber-950">
                    <p className="font-medium">Cortesia até {formatDate(shop.complimentary_until)}</p>
                    <p className="mt-1 text-xs">Valor estimado: {formatMoney(Number(shop.complimentary_value ?? 0))}</p>
                    {shop.complimentary_reason ? <p className="mt-1 text-xs">Motivo: {shop.complimentary_reason}</p> : null}
                  </div>
                ) : null}
              </div>
            </div>
          </Card>
        ) : null}

        <Card className="overflow-hidden">
          <div className="border-b border-border p-4">
            <h2 className="font-semibold">Usuários da conta</h2>
            <p className="text-sm text-muted-foreground">
              Suspender remove o acesso ao sistema sem apagar os dados.
            </p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-muted/50 text-left text-xs uppercase text-muted-foreground">
                <tr>
                  <th className="px-4 py-3">Nome</th>
                  <th className="px-4 py-3">E-mail</th>
                  <th className="px-4 py-3">Função</th>
                  <th className="px-4 py-3">Situação</th>
                  <th className="px-4 py-3">Entrou em</th>
                  <th className="px-4 py-3 text-right">Ação</th>
                </tr>
              </thead>
              <tbody>
                {members.length === 0 && !loading ? (
                  <tr>
                    <td colSpan={6} className="px-4 py-8 text-center text-muted-foreground">
                      Nenhum usuário vinculado.
                    </td>
                  </tr>
                ) : null}
                {members.map((member) => (
                  <tr key={member.id} className="border-t border-border">
                    <td className="px-4 py-3 font-medium">{member.name}</td>
                    <td className="px-4 py-3 text-muted-foreground">{member.email}</td>
                    <td className="px-4 py-3 capitalize">{member.role}</td>
                    <td className="px-4 py-3">
                      <span
                        className={`rounded-full px-2 py-1 text-xs font-medium ${
                          member.active ? 'bg-emerald-100 text-emerald-800' : 'bg-muted text-muted-foreground'
                        }`}
                      >
                        {member.active ? 'Ativo' : 'Suspenso'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">{formatDate(member.created_at)}</td>
                    <td className="px-4 py-3 text-right">
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={busyMember === member.id}
                        onClick={() => void toggleMember(member)}
                      >
                        {busyMember === member.id ? (
                          <Loader2 className="size-3.5 animate-spin" />
                        ) : member.active ? (
                          <UserX className="size-3.5" />
                        ) : (
                          <UserCheck className="size-3.5" />
                        )}
                        <span className="ml-1.5 text-xs">{member.active ? 'Suspender' : 'Reativar'}</span>
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>

        <Card className="overflow-hidden">
          <div className="border-b border-border p-4">
            <h2 className="font-semibold">Histórico de pagamentos</h2>
            <p className="text-sm text-muted-foreground">
              Últimas 20 cobranças registradas no Asaas para esta conta.
            </p>
          </div>
          {paymentsNote ? (
            <p className="border-b border-border bg-muted/40 px-4 py-3 text-sm text-muted-foreground">
              {paymentsNote}
            </p>
          ) : null}
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-muted/50 text-left text-xs uppercase text-muted-foreground">
                <tr>
                  <th className="px-4 py-3">Vencimento</th>
                  <th className="px-4 py-3">Pagamento</th>
                  <th className="px-4 py-3">Valor</th>
                  <th className="px-4 py-3">Forma</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3 text-right">Fatura</th>
                </tr>
              </thead>
              <tbody>
                {payments.length === 0 && !paymentsNote && !loading ? (
                  <tr>
                    <td colSpan={6} className="px-4 py-8 text-center text-muted-foreground">
                      Nenhuma cobrança encontrada.
                    </td>
                  </tr>
                ) : null}
                {payments.map((payment) => (
                  <tr key={payment.id} className="border-t border-border">
                    <td className="px-4 py-3">{formatDate(payment.dueDate)}</td>
                    <td className="px-4 py-3 text-muted-foreground">{formatDate(payment.paymentDate)}</td>
                    <td className="px-4 py-3 font-medium">{formatMoney(payment.value)}</td>
                    <td className="px-4 py-3 text-muted-foreground">{payment.billingType}</td>
                    <td className="px-4 py-3">
                      <span className="rounded-full bg-muted px-2 py-1 text-xs">{payment.status}</span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      {payment.invoiceUrl ? (
                        <a
                          href={payment.invoiceUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center text-xs text-primary hover:underline"
                        >
                          Abrir <ExternalLink className="ml-1 size-3" />
                        </a>
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>

        <Card className="overflow-hidden">
          <div className="border-b border-border p-4">
            <h2 className="font-semibold">Histórico administrativo</h2>
            <p className="text-sm text-muted-foreground">Últimas alterações de plano, cobrança, cortesia e acesso.</p>
          </div>
          <div className="divide-y divide-border">
            {audit.length ? audit.map((entry) => (
              <div key={entry.id} className="flex flex-wrap items-center justify-between gap-2 px-4 py-3 text-sm">
                <div><p className="font-medium">{auditDescription(entry)}</p><p className="text-xs text-muted-foreground">{entry.admin_email ?? 'Administrador da plataforma'}</p></div>
                <time className="text-xs text-muted-foreground">{new Date(entry.created_at).toLocaleString('pt-BR')}</time>
              </div>
            )) : <p className="px-4 py-8 text-center text-sm text-muted-foreground">Nenhuma alteração administrativa registrada.</p>}
          </div>
        </Card>
      </div>
    </PlatformShell>
  )
}
