'use client'

import * as React from 'react'
import posthog from 'posthog-js'
import { CalendarClock, CreditCard, ExternalLink, LoaderCircle } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { createBrowserSupabaseClient } from '@/lib/supabase/client'
import { formatCurrency } from '@/lib/format'
import { getSaasPlan, type SaasPlanId } from '@/lib/saas-plans'
import { getBillingStatusLabel } from '@/components/billing/billing-notice'
import { trackMetaEvent } from '@/lib/meta-pixel'

type BillingStatus = {
  status: 'trialing' | 'active' | 'past_due' | 'canceled'
  trialEndsAt: string
  nextBillingDate?: string
  hasSubscription: boolean
  subscriptionId?: string
}

function trackPurchaseOnce(subscriptionId: string, value: number) {
  const key = `meta_purchase_tracked_${subscriptionId}`
  if (window.localStorage.getItem(key)) return
  trackMetaEvent('Purchase', { value, currency: 'BRL' }, subscriptionId)
  window.localStorage.setItem(key, '1')
}

export function BillingCard({ planId }: { planId: SaasPlanId }) {
  const plan = getSaasPlan(planId)
  const [billing, setBilling] = React.useState<BillingStatus | null>(null)
  const [message, setMessage] = React.useState('')
  const [loading, setLoading] = React.useState(false)
  const [couponCode, setCouponCode] = React.useState('')
  const [canceling, setCanceling] = React.useState(false)
  const [confirmingCancel, setConfirmingCancel] = React.useState(false)
  const [loadedAt] = React.useState(() => Date.now())

  const authenticatedFetch = React.useCallback(async (url: string, init?: RequestInit) => {
    const { data } = await createBrowserSupabaseClient().auth.getSession()
    const token = data.session?.access_token
    if (!token) throw new Error('Sua sessão expirou. Entre novamente.')
    return fetch(url, { ...init, headers: { ...init?.headers, Authorization: `Bearer ${token}` } })
  }, [])

  React.useEffect(() => {
    const controller = new AbortController()
    void authenticatedFetch('/api/billing/status', { signal: controller.signal })
      .then(async (response) => {
        const body = await response.json()
        if (!response.ok) throw new Error(body.error)
        setBilling(body)
        if (body.status === 'active' && body.subscriptionId) {
          trackPurchaseOnce(body.subscriptionId, plan.monthlyPrice)
        }
      })
      .catch((error) => {
        if (error instanceof DOMException && error.name === 'AbortError') return
        setMessage(error instanceof Error ? error.message : 'Cobrança indisponível.')
      })
    return () => controller.abort()
  }, [authenticatedFetch, plan.monthlyPrice])

  async function openPayment() {
    setLoading(true)
    setMessage('')
    try {
      const response = await authenticatedFetch('/api/billing/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ couponCode: couponCode.trim() || undefined }),
      })
      const body = await response.json()
      if (!response.ok) throw new Error(body.error)
      posthog.capture('billing_checkout_started', {
        billing_status: billing?.status,
        has_subscription: billing?.hasSubscription ?? false,
      })
      trackMetaEvent('InitiateCheckout', { value: plan.monthlyPrice, currency: 'BRL' })
      window.location.assign(body.url)
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Não foi possível abrir o pagamento.')
      setLoading(false)
    }
  }

  /**
   * Cancela a assinatura. Não apaga nenhum dado da barbearia: a rota altera
   * apenas o status de cobrança, e o acesso segue até o fim do período pago.
   */
  async function cancelSubscription() {
    setCanceling(true)
    setMessage('')
    try {
      const response = await authenticatedFetch('/api/billing/subscription', { method: 'DELETE' })
      const body = await response.json()
      if (!response.ok) throw new Error(body.error)
      posthog.capture('billing_subscription_canceled', {
        previous_status: billing?.status,
        had_subscription: billing?.hasSubscription ?? false,
      })
      setBilling((current) => (current ? { ...current, status: 'canceled' } : current))
      setConfirmingCancel(false)
      setMessage(body.message ?? 'Assinatura cancelada.')
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Não foi possível cancelar a assinatura.')
    } finally {
      setCanceling(false)
    }
  }

  const trialDays = billing?.trialEndsAt
    ? Math.max(0, Math.ceil((new Date(billing.trialEndsAt).getTime() - loadedAt) / 86_400_000))
    : 0
  const dateLabel = billing?.status === 'trialing' ? billing.trialEndsAt : billing?.nextBillingDate
  const billingLabel = billing ? getBillingStatusLabel(billing.status, billing.nextBillingDate) : ''

  return (
    <Card className="p-5">
      <div className="mb-4 flex items-start justify-between gap-3">
        <div>
          <p className="flex items-center gap-2 text-sm font-semibold text-foreground"><CreditCard className="size-4" /> Pagamento e assinatura</p>
          <p className="mt-1 text-sm text-muted-foreground">Cobrança mensal segura processada pelo Asaas.</p>
        </div>
        {billing ? <Badge variant={billingLabel === 'Ativa' ? 'success' : billingLabel === 'Pagamento pendente' ? 'destructive' : 'gold'}>{billingLabel}</Badge> : null}
      </div>
      <div className="rounded-lg border bg-muted/30 p-4">
        <div className="flex items-end justify-between gap-3">
          <div><p className="text-sm text-muted-foreground">Plano {plan.name}</p><p className="text-2xl font-bold">{formatCurrency(plan.monthlyPrice)}<span className="text-sm font-normal text-muted-foreground">/mês</span></p></div>
          {billing?.status === 'trialing' ? <p className="text-sm font-semibold text-success">{trialDays} dias grátis restantes</p> : null}
        </div>
        {dateLabel ? <p className="mt-3 flex items-center gap-2 text-sm text-muted-foreground"><CalendarClock className="size-4" /> {billing?.status === 'trialing' ? 'Teste termina' : 'Próxima cobrança'} em {new Intl.DateTimeFormat('pt-BR').format(new Date(`${dateLabel.slice(0, 10)}T12:00:00`))}</p> : null}
      </div>
      {billing && !billing.hasSubscription ? (
        <div className="mt-3">
          <label className="mb-1 block text-xs font-medium text-muted-foreground">Cupom de desconto (opcional)</label>
          <Input
            value={couponCode}
            onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
            placeholder="Ex.: BARBER-4F9K2X"
            className="text-sm"
          />
          <p className="mt-1 text-xs text-muted-foreground">O desconto vale só na primeira cobrança.</p>
        </div>
      ) : null}
      {message ? <p className="mt-3 text-sm text-destructive">{message}</p> : null}
      <Button className="mt-4 w-full" variant="gold" onClick={openPayment} disabled={loading || !billing}>
        {loading ? <LoaderCircle className="size-4 animate-spin" /> : <ExternalLink className="size-4" />}
        {billing?.hasSubscription ? 'Abrir cobrança' : billing?.status === 'trialing' ? 'Cadastrar pagamento' : 'Pagar assinatura'}
      </Button>
      {billing?.status === 'trialing' ? (
        <p className="mt-2 text-center text-xs text-muted-foreground">
          Os 30 dias são grátis; cadastrar pagamento só prepara a cobrança para depois do teste.
        </p>
      ) : null}

      {/* Cancelamento — discreto, separado da ação principal e com confirmação. */}
      {billing && billing.status !== 'canceled' ? (
        <div className="mt-5 border-t pt-4">
          {confirmingCancel ? (
            <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-3">
              <p className="text-sm font-semibold text-foreground">Cancelar a assinatura?</p>
              <ul className="mt-2 space-y-1 text-xs text-muted-foreground">
                <li>• Não haverá novas cobranças.</li>
                <li>
                  •{' '}
                  {dateLabel
                    ? `Você continua com acesso até ${new Intl.DateTimeFormat('pt-BR').format(new Date(`${dateLabel.slice(0, 10)}T12:00:00`))}.`
                    : 'Você continua com acesso até o fim do período contratado.'}
                </li>
                <li>• Nenhum dado é apagado: agenda, clientes, comandas e financeiro continuam salvos.</li>
                <li>• Você pode reativar quando quiser.</li>
              </ul>
              <div className="mt-3 flex flex-col gap-2 sm:flex-row">
                <Button variant="destructive" size="sm" onClick={cancelSubscription} disabled={canceling}>
                  {canceling ? <LoaderCircle className="size-4 animate-spin" /> : null}
                  Confirmar cancelamento
                </Button>
                <Button variant="outline" size="sm" onClick={() => setConfirmingCancel(false)} disabled={canceling}>
                  Manter assinatura
                </Button>
              </div>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => setConfirmingCancel(true)}
              className="text-xs text-muted-foreground underline underline-offset-4 transition-colors hover:text-destructive focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              Cancelar assinatura
            </button>
          )}
        </div>
      ) : null}
    </Card>
  )
}
