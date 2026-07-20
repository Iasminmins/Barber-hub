'use client'

import * as React from 'react'
import { CalendarClock, CreditCard, ExternalLink, LoaderCircle } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { createBrowserSupabaseClient } from '@/lib/supabase/client'
import { formatCurrency } from '@/lib/format'
import { getSaasPlan, type SaasPlanId } from '@/lib/saas-plans'

type BillingStatus = {
  status: 'trialing' | 'active' | 'past_due' | 'canceled'
  trialEndsAt: string
  nextBillingDate?: string
  hasSubscription: boolean
}

const labels = { trialing: 'Teste grátis', active: 'Ativa', past_due: 'Pagamento pendente', canceled: 'Cancelada' }

export function BillingCard({ planId }: { planId: SaasPlanId }) {
  const plan = getSaasPlan(planId)
  const [billing, setBilling] = React.useState<BillingStatus | null>(null)
  const [message, setMessage] = React.useState('')
  const [loading, setLoading] = React.useState(false)
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
      })
      .catch((error) => {
        if (error instanceof DOMException && error.name === 'AbortError') return
        setMessage(error instanceof Error ? error.message : 'Cobrança indisponível.')
      })
    return () => controller.abort()
  }, [authenticatedFetch])

  async function openPayment() {
    setLoading(true)
    setMessage('')
    try {
      const response = await authenticatedFetch('/api/billing/checkout', { method: 'POST' })
      const body = await response.json()
      if (!response.ok) throw new Error(body.error)
      window.location.assign(body.url)
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Não foi possível abrir o pagamento.')
      setLoading(false)
    }
  }

  const trialDays = billing?.trialEndsAt
    ? Math.max(0, Math.ceil((new Date(billing.trialEndsAt).getTime() - loadedAt) / 86_400_000))
    : 0
  const dateLabel = billing?.status === 'trialing' ? billing.trialEndsAt : billing?.nextBillingDate

  return (
    <Card className="p-5">
      <div className="mb-4 flex items-start justify-between gap-3">
        <div>
          <p className="flex items-center gap-2 text-sm font-semibold text-foreground"><CreditCard className="size-4" /> Pagamento e assinatura</p>
          <p className="mt-1 text-sm text-muted-foreground">Cobrança mensal segura processada pelo Asaas.</p>
        </div>
        {billing ? <Badge variant={billing.status === 'active' ? 'success' : billing.status === 'past_due' ? 'destructive' : 'gold'}>{labels[billing.status]}</Badge> : null}
      </div>
      <div className="rounded-lg border bg-muted/30 p-4">
        <div className="flex items-end justify-between gap-3">
          <div><p className="text-sm text-muted-foreground">Plano {plan.name}</p><p className="text-2xl font-bold">{formatCurrency(plan.monthlyPrice)}<span className="text-sm font-normal text-muted-foreground">/mês</span></p></div>
          {billing?.status === 'trialing' ? <p className="text-sm font-semibold text-success">{trialDays} dias grátis restantes</p> : null}
        </div>
        {dateLabel ? <p className="mt-3 flex items-center gap-2 text-sm text-muted-foreground"><CalendarClock className="size-4" /> {billing?.status === 'trialing' ? 'Teste termina' : 'Próxima cobrança'} em {new Intl.DateTimeFormat('pt-BR').format(new Date(`${dateLabel.slice(0, 10)}T12:00:00`))}</p> : null}
      </div>
      {message ? <p className="mt-3 text-sm text-destructive">{message}</p> : null}
      <Button className="mt-4 w-full" variant="gold" onClick={openPayment} disabled={loading || !billing}>
        {loading ? <LoaderCircle className="size-4 animate-spin" /> : <ExternalLink className="size-4" />}
        {billing?.hasSubscription ? 'Abrir cobrança' : billing?.status === 'trialing' ? 'Cadastrar pagamento' : 'Pagar assinatura'}
      </Button>
      <p className="mt-2 text-center text-xs text-muted-foreground">Nenhuma cobrança é feita durante os 30 dias gratuitos.</p>
    </Card>
  )
}
