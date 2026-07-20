'use client'

import { Bell, Building2, CheckCircle2, LogOut, Palette, Save, ShieldCheck } from 'lucide-react'
import { useState } from 'react'
import { PageHeader } from '@/components/page-header'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select } from '@/components/ui/select'
import { useAppData } from '@/components/data/app-data-provider'
import { getSaasPlan, saasPlans } from '@/lib/saas-plans'
import { createBrowserSupabaseClient } from '@/lib/supabase/client'
import { BillingCard } from '@/components/billing/billing-card'
import { formatBillingDocument, onlyDigits } from '@/lib/billing-document'

export default function ConfiguracoesPage() {
  const [saved, setSaved] = useState(false)
  const { barbershop, updateRecord } = useAppData()
  const [shop, setShop] = useState({ name: barbershop.name, slug: barbershop.slug, city: barbershop.city, color: barbershop.color, billingDocument: formatBillingDocument(barbershop.billingDocument) })
  const currentPlan = getSaasPlan(barbershop.plan)
  async function saveSettings() {
    setSaved(false)
    const result = await updateRecord('barbershops', barbershop.id, {
      name: shop.name,
      slug: shop.slug,
      city: shop.city,
      color: shop.color,
      billing_document: onlyDigits(shop.billingDocument) || null,
    })
    if (result.error) { window.alert(result.error); return }
    setSaved(true)
  }
  async function signOut() { await createBrowserSupabaseClient().auth.signOut(); window.location.replace('/login') }

  return (
    <div>
      <PageHeader
        title="Configurações"
        description="Dados da unidade, preferências operacionais, plano contratado e parâmetros de segurança."
      >
        {saved ? <span className="text-sm font-medium text-success">Alterações salvas</span> : null}
        <Button variant="gold" size="sm" onClick={saveSettings}>
          <Save className="size-4" />
          Salvar alterações
        </Button>
      </PageHeader>

      <div className="grid gap-4 lg:grid-cols-[1fr_360px]">
        <div className="space-y-4">
          <BillingCard planId={barbershop.plan} />
          <Card className="p-5">
            <h3 className="mb-4 flex items-center gap-2 font-semibold text-foreground">
              <Building2 className="size-4 text-muted-foreground" />
              Dados da barbearia
            </h3>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="name">Nome da unidade</Label>
                <Input id="name" value={shop.name} onChange={(e)=>setShop(c=>({...c,name:e.target.value}))} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="slug">Slug público</Label>
                <Input id="slug" value={shop.slug} onChange={(e)=>setShop(c=>({...c,slug:e.target.value}))} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="city">Cidade</Label>
                <Input id="city" value={shop.city} onChange={(e)=>setShop(c=>({...c,city:e.target.value}))} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="billingDocument">CPF/CNPJ da cobranca</Label>
                <Input
                  id="billingDocument"
                  inputMode="numeric"
                  value={shop.billingDocument}
                  onChange={(e)=>setShop(c=>({...c,billingDocument:formatBillingDocument(e.target.value)}))}
                  placeholder="CPF ou CNPJ"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="plan">Plano da conta</Label>
                <Select id="plan" value={barbershop.plan} disabled>
                  {saasPlans.map((plan) => (
                    <option key={plan.id} value={plan.id}>
                      {plan.name} - {plan.price}/mês
                    </option>
                  ))}
                </Select>
              </div>
            </div>
          </Card>

          <Card className="p-5">
            <h3 className="mb-4 flex items-center gap-2 font-semibold text-foreground">
              <Palette className="size-4 text-muted-foreground" />
              Identidade
            </h3>
            <div className="grid gap-4 sm:grid-cols-[160px_1fr]">
              <div className="space-y-2">
                <Label htmlFor="color">Cor principal</Label>
                <div className="flex items-center gap-2">
                  <span className="size-9 rounded-md border border-border" style={{ background: barbershop.color }} />
                  <Input id="color" value={shop.color} onChange={(e)=>setShop(c=>({...c,color:e.target.value}))} />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="booking">Intervalo padrão da agenda</Label>
                <Select id="booking" defaultValue="30">
                  <option value="15">15 minutos</option>
                  <option value="30">30 minutos</option>
                  <option value="45">45 minutos</option>
                  <option value="60">60 minutos</option>
                </Select>
              </div>
            </div>
          </Card>
        </div>

        <div className="space-y-4">
          <Card className="p-5">
            <div className="mb-4 flex items-start justify-between gap-3">
              <div>
                <p className="text-sm text-muted-foreground">Plano ativo</p>
                <h3 className="text-2xl font-bold text-foreground">{currentPlan.name}</h3>
              </div>
              <Badge variant={currentPlan.id === 'starter' ? 'secondary' : currentPlan.id === 'pro' ? 'gold' : 'default'}>
                {currentPlan.price}/mês
              </Badge>
            </div>
            <p className="text-sm leading-6 text-muted-foreground">{currentPlan.description}</p>
            <div className="mt-4 grid gap-2 text-sm">
              <div className="flex items-center justify-between gap-3">
                <span className="text-muted-foreground">Usuários</span>
                <span className="font-medium text-foreground">{currentPlan.users}</span>
              </div>
              <div className="flex items-center justify-between gap-3">
                <span className="text-muted-foreground">Unidades</span>
                <span className="font-medium text-foreground">{currentPlan.units}</span>
              </div>
              <div className="flex items-center justify-between gap-3">
                <span className="text-muted-foreground">Relatórios</span>
                <span className="font-medium text-foreground">{currentPlan.reports}</span>
              </div>
            </div>
            <div className="mt-4 space-y-2">
              {currentPlan.items.map((item) => (
                <div key={item} className="flex items-center gap-2 text-sm">
                  <CheckCircle2 className="size-4 text-success" />
                  <span className="text-foreground">{item}</span>
                </div>
              ))}
            </div>
          </Card>

          <Card className="p-5">
            <h3 className="mb-4 flex items-center gap-2 font-semibold text-foreground">
              <ShieldCheck className="size-4 text-muted-foreground" />
              Segurança
            </h3>
            <div className="space-y-3">
              {[
                ['Isolamento por barbearia', 'Ativo'],
                ['Permissões por função', 'Configurado'],
                ['Auditoria de importação', currentPlan.features.importExport ? 'Ativo' : 'Plano Pro'],
              ].map(([label, status]) => (
                <div key={label} className="flex items-center justify-between gap-3">
                  <span className="text-sm text-muted-foreground">{label}</span>
                  <Badge variant={status === 'Plano Pro' ? 'secondary' : 'success'}>{status}</Badge>
                </div>
              ))}
            </div>
          </Card>

          <Card className="p-5">
            <h3 className="mb-4 flex items-center gap-2 font-semibold text-foreground">
              <Bell className="size-4 text-muted-foreground" />
              Notificações
            </h3>
            <div className="space-y-3">
              {[
                'Lembrar cliente antes do horário',
                'Avisar estoque abaixo do mínimo',
                'Alertar assinatura vencendo',
                'Enviar resumo financeiro diário',
              ].map((label, index) => (
                <label key={label} className="flex items-center justify-between gap-3 text-sm">
                  <span className="text-muted-foreground">{label}</span>
                  <input
                    type="checkbox"
                    defaultChecked={index < 3 || currentPlan.features.advancedReports}
                    className="size-4 accent-[var(--primary)]"
                  />
                </label>
              ))}
            </div>
          </Card>

          <Card className="p-5">
            <h3 className="mb-2 flex items-center gap-2 font-semibold text-foreground">
              <LogOut className="size-4 text-muted-foreground" />
              Sessão
            </h3>
            <p className="mb-4 text-sm text-muted-foreground">
              Encerre o acesso desta conta e volte para a tela de login.
            </p>
            <button
              type="button"
              onClick={signOut}
              className="inline-flex h-9 w-full items-center justify-center gap-2 rounded-md border border-border bg-card px-4 text-sm font-medium text-foreground shadow-sm transition-colors hover:bg-muted"
            >
              <LogOut className="size-4" />
              Sair da conta
            </button>
          </Card>
        </div>
      </div>
    </div>
  )
}
