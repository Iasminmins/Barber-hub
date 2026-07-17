'use client'

import * as React from 'react'
import Link from 'next/link'
import { CreditCard, Edit3, Plus, Repeat, Save, Users } from 'lucide-react'
import { PageHeader } from '@/components/page-header'
import { StatusBadge } from '@/components/status-badge'
import { Badge } from '@/components/ui/badge'
import { Button, buttonVariants } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Progress } from '@/components/ui/progress'
import { Select } from '@/components/ui/select'
import { Tabs } from '@/components/ui/tabs'
import { Textarea } from '@/components/ui/textarea'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { daysUntil, formatCurrency, formatDate } from '@/lib/format'
import type { Plan, Subscription } from '@/lib/types'

type View = 'assinaturas' | 'planos'

type PlanDraft = {
  id?: string
  name: string
  price: string
  type: Plan['type']
  credits: string
  description: string
  active: boolean
}

const emptyDraft: PlanDraft = {
  name: '',
  price: '',
  type: 'mensal',
  credits: '',
  description: '',
  active: true,
}

function parseMoney(value: string) {
  const normalized = value.replace(/\./g, '').replace(',', '.').replace(/[^\d.]/g, '')
  return Number(normalized || 0)
}

function toDraft(plan: Plan): PlanDraft {
  return {
    id: plan.id,
    name: plan.name,
    price: String(plan.price).replace('.', ','),
    type: plan.type,
    credits: plan.credits ? String(plan.credits) : '',
    description: plan.description,
    active: plan.active,
  }
}

export function AssinaturasClient({
  plans: initialPlans,
  subscriptions,
}: {
  plans: Plan[]
  subscriptions: Subscription[]
}) {
  const [view, setView] = React.useState<View>('assinaturas')
  const [plans, setPlans] = React.useState(initialPlans)
  const [draft, setDraft] = React.useState<PlanDraft>(emptyDraft)
  const active = subscriptions.filter((s) => s.status === 'ativo' || s.status === 'vencendo')
  const overdue = subscriptions.filter((s) => s.status === 'vencido')
  const mrr = active.reduce((sum, sub) => sum + sub.price, 0)
  const editing = Boolean(draft.id)

  React.useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    if (params.get('tab') === 'planos' || window.location.hash === '#planos') {
      setView('planos')
      window.setTimeout(() => document.getElementById('planos')?.scrollIntoView({ block: 'start' }), 0)
    }
  }, [])

  function resetDraft() {
    setDraft(emptyDraft)
  }

  function savePlan() {
    const price = parseMoney(draft.price)
    const credits = Number(draft.credits || 0) || undefined

    if (!draft.name.trim()) return

    if (draft.id) {
      setPlans((current) =>
        current.map((plan) =>
          plan.id === draft.id
            ? {
                ...plan,
                name: draft.name.trim(),
                price,
                type: draft.type,
                credits: draft.type === 'mensal' ? undefined : credits,
                description: draft.description.trim(),
                active: draft.active,
              }
            : plan,
        ),
      )
    } else {
      const next: Plan = {
        id: `pln_local_${Date.now()}`,
        barbershopId: 'bsp_1',
        name: draft.name.trim(),
        price,
        type: draft.type,
        credits: draft.type === 'mensal' ? undefined : credits,
        description: draft.description.trim(),
        active: draft.active,
      }
      setPlans((current) => [next, ...current])
    }

    resetDraft()
    setView('planos')
  }

  return (
    <div>
      <PageHeader
        title="Assinaturas"
        description="Planos recorrentes, pacotes, créditos e clientes com vencimento próximo."
      >
        <Button variant="outline" size="sm">
          <Repeat className="size-4" />
          Renovar vencidas
        </Button>
        <Link href="/assinaturas/nova" className={buttonVariants({ variant: 'gold', size: 'sm' })}>
          <Plus className="size-4" />
          Nova assinatura
        </Link>
      </PageHeader>

      <div id="planos" className="mb-4 flex flex-wrap items-center justify-between gap-3 scroll-mt-24">
        <Tabs
          items={[
            { value: 'assinaturas', label: 'Assinaturas' },
            { value: 'planos', label: 'Planos' },
          ]}
          value={view}
          onValueChange={(value) => setView(value as View)}
        />
        {view === 'planos' && (
          <Button variant="outline" size="sm" onClick={resetDraft}>
            <Plus className="size-4" />
            Escrever novo plano
          </Button>
        )}
      </div>

      <div className="mb-4 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Card className="p-4">
          <p className="text-sm text-muted-foreground">Receita recorrente</p>
          <p className="mt-1 text-2xl font-bold text-foreground">{formatCurrency(mrr)}</p>
        </Card>
        <Card className="p-4">
          <p className="text-sm text-muted-foreground">Assinaturas ativas</p>
          <p className="mt-1 text-2xl font-bold text-foreground">{active.length}</p>
        </Card>
        <Card className="p-4">
          <p className="text-sm text-muted-foreground">Vencidas</p>
          <p className="mt-1 text-2xl font-bold text-foreground">{overdue.length}</p>
        </Card>
        <Card className="p-4">
          <p className="text-sm text-muted-foreground">Planos ativos</p>
          <p className="mt-1 text-2xl font-bold text-foreground">{plans.filter((p) => p.active).length}</p>
        </Card>
      </div>

      {view === 'assinaturas' ? (
        <Card className="overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Cliente</TableHead>
                <TableHead>Plano</TableHead>
                <TableHead>Vencimento</TableHead>
                <TableHead className="text-right">Valor</TableHead>
                <TableHead>Uso</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {subscriptions.map((sub) => {
                const due = daysUntil(sub.dueDate)
                const hasCredits = sub.creditsTotal && sub.creditsTotal > 0
                return (
                  <TableRow key={sub.id}>
                    <TableCell className="font-medium text-foreground">{sub.clientName}</TableCell>
                    <TableCell className="text-muted-foreground">{sub.planName}</TableCell>
                    <TableCell>
                      <div>
                        <p className="text-sm text-foreground">{formatDate(sub.dueDate)}</p>
                        <p className="text-xs text-muted-foreground">
                          {due < 0 ? `${Math.abs(due)} dias atrás` : `em ${due} dias`}
                        </p>
                      </div>
                    </TableCell>
                    <TableCell className="text-right font-medium tabular-nums">
                      {formatCurrency(sub.price)}
                    </TableCell>
                    <TableCell>
                      {hasCredits ? (
                        <div className="min-w-28">
                          <div className="mb-1 flex justify-between text-xs text-muted-foreground">
                            <span>{sub.creditsUsed} usados</span>
                            <span>{sub.creditsTotal}</span>
                          </div>
                          <Progress value={((sub.creditsUsed ?? 0) / sub.creditsTotal!) * 100} />
                        </div>
                      ) : (
                        <Badge variant="secondary">Recorrente</Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      <StatusBadge status={sub.status} />
                    </TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
        </Card>
      ) : (
        <div className="grid gap-4 lg:grid-cols-[1fr_420px]">
          <div className="grid gap-4 xl:grid-cols-2">
            {plans.map((plan) => (
              <Card key={plan.id} className="p-4">
                <div className="mb-3 flex items-start justify-between gap-3">
                  <div>
                    <h3 className="font-semibold text-foreground">{plan.name}</h3>
                    <p className="text-sm text-muted-foreground">{plan.description}</p>
                  </div>
                  <StatusBadge status={plan.active ? 'ativo' : 'cancelado'} />
                </div>
                <div className="mb-4 flex items-center justify-between">
                  <span className="flex items-center gap-2 text-sm capitalize text-muted-foreground">
                    {plan.type === 'mensal' ? <CreditCard className="size-4" /> : <Users className="size-4" />}
                    {plan.type}
                    {plan.credits ? ` · ${plan.credits} créditos` : ''}
                  </span>
                  <span className="text-lg font-bold text-foreground">{formatCurrency(plan.price)}</span>
                </div>
                <Button variant="outline" size="sm" className="w-full" onClick={() => setDraft(toDraft(plan))}>
                  <Edit3 className="size-4" />
                  Editar plano
                </Button>
              </Card>
            ))}
          </div>

          <Card className="h-fit p-5">
            <h2 className="mb-1 font-semibold text-foreground">
              {editing ? 'Editar plano' : 'Escrever novo plano'}
            </h2>
            <p className="mb-4 text-sm text-muted-foreground">
              Preencha os dados do plano aqui. Depois ele aparece no seletor da tela Nova assinatura.
            </p>
            <div className="grid gap-4">
              <div className="space-y-2">
                <Label htmlFor="planName">Nome do plano</Label>
                <Input
                  id="planName"
                  value={draft.name}
                  onChange={(event) => setDraft((current) => ({ ...current, name: event.target.value }))}
                  placeholder="Ex.: Clube Barba Premium"
                />
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="planType">Tipo</Label>
                  <Select
                    id="planType"
                    value={draft.type}
                    onChange={(event) => setDraft((current) => ({ ...current, type: event.target.value as Plan['type'] }))}
                  >
                    <option value="mensal">Mensal</option>
                    <option value="pacote">Pacote</option>
                    <option value="creditos">Créditos</option>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="planPrice">Valor</Label>
                  <Input
                    id="planPrice"
                    value={draft.price}
                    onChange={(event) => setDraft((current) => ({ ...current, price: event.target.value }))}
                    placeholder="149,90"
                  />
                </div>
              </div>
              {draft.type !== 'mensal' && (
                <div className="space-y-2">
                  <Label htmlFor="planCredits">Quantidade de créditos</Label>
                  <Input
                    id="planCredits"
                    type="number"
                    value={draft.credits}
                    onChange={(event) => setDraft((current) => ({ ...current, credits: event.target.value }))}
                    placeholder="4"
                  />
                </div>
              )}
              <div className="space-y-2">
                <Label htmlFor="planDescription">Descrição</Label>
                <Textarea
                  id="planDescription"
                  value={draft.description}
                  onChange={(event) => setDraft((current) => ({ ...current, description: event.target.value }))}
                  placeholder="Explique o que está incluso no plano..."
                  className="min-h-28"
                />
              </div>
              <label className="flex items-center justify-between gap-3 rounded-md border border-border bg-muted/40 px-3 py-2 text-sm">
                <span className="font-medium text-foreground">Plano ativo</span>
                <input
                  type="checkbox"
                  checked={draft.active}
                  onChange={(event) => setDraft((current) => ({ ...current, active: event.target.checked }))}
                  className="size-4 accent-[var(--primary)]"
                />
              </label>
              <div className="flex gap-2">
                <Button variant="gold" className="flex-1" type="button" onClick={savePlan}>
                  <Save className="size-4" />
                  {editing ? 'Salvar edição' : 'Salvar plano'}
                </Button>
                {editing && (
                  <Button variant="outline" type="button" onClick={resetDraft}>
                    Cancelar
                  </Button>
                )}
              </div>
            </div>
          </Card>
        </div>
      )}
    </div>
  )
}
