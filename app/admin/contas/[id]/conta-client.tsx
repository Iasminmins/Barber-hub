'use client'

import { useCallback, useEffect, useState } from 'react'
import Link from 'next/link'
import { ArrowLeft, Loader2, RefreshCw, UserCheck, UserX, ExternalLink } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { AccessGate } from '../../access-gate'
import { usePlatformSession } from '../../use-platform-session'

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

function formatDate(value: string | null) {
  if (!value) return '—'
  return new Date(value).toLocaleDateString('pt-BR')
}

function formatMoney(value: number) {
  return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

export function ContaClient({ tenantId }: { tenantId: string }) {
  const { gate, token, signIn } = usePlatformSession()
  const [shop, setShop] = useState<Barbershop | null>(null)
  const [members, setMembers] = useState<Member[]>([])
  const [payments, setPayments] = useState<Payment[]>([])
  const [paymentsNote, setPaymentsNote] = useState('')
  const [loading, setLoading] = useState(false)
  const [busyMember, setBusyMember] = useState('')
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
      setMembers(detail.members ?? [])
      setPayments(paymentData.payments ?? [])
      setPaymentsNote(paymentData.note ?? paymentData.error ?? '')
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : 'Falha ao carregar a conta.')
    } finally {
      setLoading(false)
    }
  }, [token, tenantId])

  useEffect(() => {
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

  if (gate !== 'granted') return <AccessGate gate={gate} onSignIn={signIn} />

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="mx-auto max-w-6xl space-y-6">
        <header className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <Link href="/admin" className="inline-flex items-center text-sm text-muted-foreground hover:underline">
              <ArrowLeft className="mr-1 size-4" /> Voltar ao painel
            </Link>
            <h1 className="mt-1 text-2xl font-semibold">{shop?.name ?? 'Carregando…'}</h1>
            {shop ? (
              <p className="text-sm text-muted-foreground">
                /{shop.slug}{shop.city ? ` · ${shop.city}` : ''} · criada em {formatDate(shop.created_at)}
              </p>
            ) : null}
          </div>
          <Button variant="outline" size="sm" disabled={loading} onClick={() => void load()}>
            {loading ? <Loader2 className="size-4 animate-spin" /> : <RefreshCw className="size-4" />}
            <span className="ml-2">Atualizar</span>
          </Button>
        </header>

        {error ? (
          <div className="rounded-md border border-destructive/40 bg-destructive/10 p-3 text-sm text-destructive">
            {error}
          </div>
        ) : null}

        {shop ? (
          <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {[
              { label: 'Plano', value: shop.plan },
              { label: 'Status', value: shop.billing_status },
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
      </div>
    </div>
  )
}
