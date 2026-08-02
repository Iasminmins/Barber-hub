'use client'

import * as React from 'react'
import { ArrowRight, Building2, CalendarDays, CheckCircle2, Crown, KeyRound, Mail, MapPin, Pencil, Plus, Store, UserRound, Wallet } from 'lucide-react'
import { useAppData } from '@/components/data/app-data-provider'
import { PageHeader } from '@/components/page-header'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Dialog, DialogHeader } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { createBrowserSupabaseClient } from '@/lib/supabase/client'
import { getSaasPlan } from '@/lib/saas-plans'

type UnitMetric = { revenue: number; appointments: number }

const money = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' })

export default function RedePage() {
  const { barbershop, barbershops, refresh, setActiveBarbershop } = useAppData()
  const plan = getSaasPlan(barbershop.plan)
  const premium = plan.features.multiUnit
  const [metrics, setMetrics] = React.useState<Record<string, UnitMetric>>({})
  const [primaryShopId, setPrimaryShopId] = React.useState('')
  const [dialogOpen, setDialogOpen] = React.useState(false)
  const [name, setName] = React.useState('')
  const [city, setCity] = React.useState('')
  const [responsibleName, setResponsibleName] = React.useState('')
  const [email, setEmail] = React.useState('')
  const [password, setPassword] = React.useState('')
  const [editingUnitId, setEditingUnitId] = React.useState('')
  const [editName, setEditName] = React.useState('')
  const [editCity, setEditCity] = React.useState('')
  const [saving, setSaving] = React.useState(false)
  const [message, setMessage] = React.useState('')

  React.useEffect(() => {
    if (!premium || !barbershops.length) return
    const supabase = createBrowserSupabaseClient()
    const shopIds = barbershops.map((shop) => shop.id)

    void Promise.all([
      supabase.from('financial_entries').select('barbershop_id, amount, type').in('barbershop_id', shopIds),
      supabase.from('appointments').select('barbershop_id').in('barbershop_id', shopIds),
      barbershop.networkId
        ? supabase.from('networks').select('primary_barbershop_id').eq('id', barbershop.networkId).maybeSingle()
        : Promise.resolve({ data: null, error: null }),
    ]).then(([financialResult, appointmentResult, networkResult]) => {
      const next: Record<string, UnitMetric> = Object.fromEntries(shopIds.map((id) => [id, { revenue: 0, appointments: 0 }]))
      for (const entry of financialResult.data ?? []) {
        const metric = next[entry.barbershop_id]
        if (metric) metric.revenue += entry.type === 'entrada' ? Number(entry.amount) : -Number(entry.amount)
      }
      for (const appointment of appointmentResult.data ?? []) {
        const metric = next[appointment.barbershop_id]
        if (metric) metric.appointments += 1
      }
      setMetrics(next)
      setPrimaryShopId(networkResult.data?.primary_barbershop_id ?? barbershops[0]?.id ?? '')
    })
  }, [barbershop.networkId, barbershops, premium])

  async function addUnit(event: React.FormEvent) {
    event.preventDefault()
    setSaving(true)
    setMessage('')
    try {
      const supabase = createBrowserSupabaseClient()
      const { data } = await supabase.auth.getSession()
      const token = data.session?.access_token
      if (!token) throw new Error('Sessão expirada. Entre novamente.')
      const response = await fetch('/api/network/units', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ name, city, responsibleName, email, password }),
      })
      const result = await response.json().catch(() => ({}))
      if (!response.ok) throw new Error(result.error ?? 'Não foi possível adicionar a unidade.')
      setName('')
      setCity('')
      setResponsibleName('')
      setEmail('')
      setPassword('')
      setDialogOpen(false)
      await refresh()
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Não foi possível adicionar a unidade.')
    } finally {
      setSaving(false)
    }
  }

  async function editUnit(event: React.FormEvent) {
    event.preventDefault()
    setSaving(true)
    setMessage('')
    try {
      const supabase = createBrowserSupabaseClient()
      const { data } = await supabase.auth.getSession()
      const token = data.session?.access_token
      if (!token) throw new Error('Sessão expirada. Entre novamente.')
      const response = await fetch('/api/network/units', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ unitId: editingUnitId, name: editName, city: editCity }),
      })
      const result = await response.json().catch(() => ({}))
      if (!response.ok) throw new Error(result.error ?? 'Não foi possível editar a unidade.')
      setEditingUnitId('')
      await refresh()
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Não foi possível editar a unidade.')
    } finally {
      setSaving(false)
    }
  }

  if (!premium) {
    return (
      <div>
        <PageHeader title="Minha rede" description="Gerencie todas as suas barbearias em um só lugar." />
        <Card className="mx-auto max-w-2xl p-7 text-center sm:p-10">
          <span className="mx-auto flex size-14 items-center justify-center rounded-2xl bg-gold/15 text-gold-foreground"><Crown className="size-7" /></span>
          <h2 className="mt-5 text-2xl font-bold text-foreground">Gestão multiunidade no Premium</h2>
          <p className="mx-auto mt-3 max-w-lg text-sm leading-6 text-muted-foreground">Adicione até três barbearias, alterne entre as unidades e acompanhe os resultados da rede em uma visão centralizada.</p>
          <Button className="mt-6" variant="gold" onClick={() => { window.location.href = '/configuracoes' }}>
            Conhecer o Premium <ArrowRight className="size-4" />
          </Button>
        </Card>
      </div>
    )
  }

  const totalRevenue = Object.values(metrics).reduce((sum, item) => sum + item.revenue, 0)
  const totalAppointments = Object.values(metrics).reduce((sum, item) => sum + item.appointments, 0)
  const unitLimit = 3

  return (
    <div>
      <PageHeader title="Minha rede" description="Visão consolidada e gerenciamento das unidades do seu plano Premium.">
        <Button variant="gold" size="sm" disabled={barbershops.length >= unitLimit} onClick={() => setDialogOpen(true)}>
          <Plus className="size-4" /> Adicionar unidade
        </Button>
      </PageHeader>

      <div className="grid gap-4 sm:grid-cols-3">
        <Card className="p-5"><div className="flex items-center justify-between"><span className="flex size-10 items-center justify-center rounded-lg bg-primary/10 text-primary"><Building2 className="size-5" /></span><Badge variant="gold">Premium</Badge></div><p className="mt-5 text-2xl font-bold text-foreground">{barbershops.length} de {unitLimit}</p><p className="mt-1 text-sm text-muted-foreground">unidades utilizadas</p></Card>
        <Card className="p-5"><span className="flex size-10 items-center justify-center rounded-lg bg-success/10 text-success"><Wallet className="size-5" /></span><p className="mt-5 text-2xl font-bold text-foreground">{money.format(totalRevenue)}</p><p className="mt-1 text-sm text-muted-foreground">saldo consolidado da rede</p></Card>
        <Card className="p-5"><span className="flex size-10 items-center justify-center rounded-lg bg-gold/15 text-gold-foreground"><CalendarDays className="size-5" /></span><p className="mt-5 text-2xl font-bold text-foreground">{totalAppointments}</p><p className="mt-1 text-sm text-muted-foreground">agendamentos em todas as unidades</p></Card>
      </div>

      <Card className="mt-4 overflow-hidden">
        <div className="flex flex-col gap-2 border-b border-border p-5 sm:flex-row sm:items-center sm:justify-between">
          <div><h2 className="font-semibold text-foreground">Unidades da rede</h2><p className="mt-1 text-sm text-muted-foreground">Escolha uma unidade para acessar sua operação.</p></div>
          <span className="text-xs text-muted-foreground">A assinatura é centralizada na unidade principal.</span>
        </div>
        <div className="divide-y divide-border">
          {barbershops.map((shop) => {
            const metric = metrics[shop.id] ?? { revenue: 0, appointments: 0 }
            const active = shop.id === barbershop.id
            return (
              <div key={shop.id} className="grid gap-4 p-5 lg:grid-cols-[1fr_180px_150px_auto] lg:items-center">
                <div className="flex items-start gap-3">
                  <span className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary"><Store className="size-5" /></span>
                  <div><div className="flex flex-wrap items-center gap-2"><h3 className="font-semibold text-foreground">{shop.name}</h3>{shop.id === primaryShopId ? <Badge variant="secondary">Principal</Badge> : null}{active ? <Badge variant="success">Em uso</Badge> : null}</div><p className="mt-1 flex items-center gap-1 text-sm text-muted-foreground"><MapPin className="size-3.5" />{shop.city || 'Cidade não informada'}</p></div>
                </div>
                <div><p className="text-sm font-semibold text-foreground">{money.format(metric.revenue)}</p><p className="text-xs text-muted-foreground">saldo da unidade</p></div>
                <div><p className="text-sm font-semibold text-foreground">{metric.appointments}</p><p className="text-xs text-muted-foreground">agendamentos</p></div>
                <div className="flex flex-wrap justify-end gap-2">
                  <Button variant="outline" size="icon" title="Editar unidade" aria-label={`Editar ${shop.name}`} onClick={() => { setEditingUnitId(shop.id); setEditName(shop.name); setEditCity(shop.city); setMessage('') }}><Pencil className="size-4" /></Button>
                  <Button variant={active ? 'secondary' : 'outline'} disabled={active} onClick={() => setActiveBarbershop(shop.id)}>{active ? <><CheckCircle2 className="size-4" /> Unidade atual</> : 'Acessar unidade'}</Button>
                </div>
              </div>
            )
          })}
        </div>
      </Card>

      <Dialog open={dialogOpen} onClose={() => !saving && setDialogOpen(false)}>
        <DialogHeader title="Adicionar unidade" description={`Seu Premium permite até ${unitLimit} unidades. Crie também o acesso do responsável pela nova barbearia.`} />
        <form onSubmit={addUnit} className="space-y-4">
          <div><Label htmlFor="unit-name">Nome da barbearia</Label><Input id="unit-name" className="mt-2" value={name} onChange={(event) => setName(event.target.value)} placeholder="Ex.: BarberHub Centro" minLength={2} maxLength={100} required /></div>
          <div><Label htmlFor="unit-city">Cidade</Label><Input id="unit-city" className="mt-2" value={city} onChange={(event) => setCity(event.target.value)} placeholder="Ex.: Volta Redonda" minLength={2} maxLength={100} required /></div>
          <div className="border-t border-border pt-4">
            <p className="mb-4 flex items-center gap-2 text-sm font-semibold text-foreground"><UserRound className="size-4 text-muted-foreground" />Acesso do responsável</p>
            <div className="space-y-4">
              <div><Label htmlFor="responsible-name">Nome do responsável</Label><Input id="responsible-name" className="mt-2" value={responsibleName} onChange={(event) => setResponsibleName(event.target.value)} placeholder="Ex.: João da Silva" minLength={2} maxLength={100} required /></div>
              <div><Label htmlFor="responsible-email">E-mail de acesso</Label><div className="relative mt-2"><Mail className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" /><Input id="responsible-email" type="email" className="pl-9" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="responsavel@barbearia.com" autoComplete="off" required /></div></div>
              <div><Label htmlFor="responsible-password">Senha inicial</Label><div className="relative mt-2"><KeyRound className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" /><Input id="responsible-password" type="password" className="pl-9" value={password} onChange={(event) => setPassword(event.target.value)} placeholder="Mínimo de 8 caracteres" minLength={8} maxLength={72} autoComplete="new-password" required /></div></div>
            </div>
          </div>
          <p className="rounded-md border border-border bg-muted/30 p-3 text-xs leading-5 text-muted-foreground">A conta principal continuará como proprietária e poderá acessar e editar esta unidade. A nova credencial será criada como gerente apenas desta barbearia.</p>
          {message ? <p className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">{message}</p> : null}
          <div className="flex flex-col-reverse gap-2 pt-2 sm:flex-row sm:justify-end"><Button type="button" variant="outline" disabled={saving} onClick={() => setDialogOpen(false)}>Cancelar</Button><Button type="submit" variant="gold" disabled={saving}>{saving ? 'Criando unidade...' : 'Criar unidade'}</Button></div>
        </form>
      </Dialog>

      <Dialog open={Boolean(editingUnitId)} onClose={() => !saving && setEditingUnitId('')}>
        <DialogHeader title="Editar unidade" description="A conta principal pode atualizar a identificação de qualquer barbearia da rede." />
        <form onSubmit={editUnit} className="space-y-4">
          <div><Label htmlFor="edit-unit-name">Nome da barbearia</Label><Input id="edit-unit-name" className="mt-2" value={editName} onChange={(event) => setEditName(event.target.value)} minLength={2} maxLength={100} required /></div>
          <div><Label htmlFor="edit-unit-city">Cidade</Label><Input id="edit-unit-city" className="mt-2" value={editCity} onChange={(event) => setEditCity(event.target.value)} minLength={2} maxLength={100} required /></div>
          {message ? <p className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">{message}</p> : null}
          <div className="flex flex-col-reverse gap-2 pt-2 sm:flex-row sm:justify-end"><Button type="button" variant="outline" disabled={saving} onClick={() => setEditingUnitId('')}>Cancelar</Button><Button type="submit" variant="gold" disabled={saving}>{saving ? 'Salvando...' : 'Salvar alterações'}</Button></div>
        </form>
      </Dialog>
    </div>
  )
}
