'use client'

import { type ChangeEvent, useEffect, useMemo, useState } from 'react'
import { Bell, Building2, CheckCircle2, ImageUp, LogOut, Palette, Save, ShieldCheck, Trash2 } from 'lucide-react'
import { BrandMark } from '@/components/brand-mark'
import { PageHeader } from '@/components/page-header'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select } from '@/components/ui/select'
import { useAppData } from '@/components/data/app-data-provider'
import { getSaasPlan } from '@/lib/saas-plans'
import { createBrowserSupabaseClient } from '@/lib/supabase/client'
import { BillingCard } from '@/components/billing/billing-card'
import { formatBillingDocument, onlyDigits } from '@/lib/billing-document'

const brandColors = ['#1E3A32', '#0F766E', '#111827', '#7C2D12', '#B45309', '#4F46E5', '#7E22CE', '#BE123C']
const hexColorPattern = /^#[0-9a-f]{6}$/i

function normalizeHexColor(value: string) {
  const trimmed = value.trim()
  const prefixed = trimmed.startsWith('#') ? trimmed : `#${trimmed}`
  return prefixed.toUpperCase()
}

function getLogoFilePath(barbershopId: string, file: File) {
  const ext = file.name.split('.').pop()?.toLowerCase().replace(/[^a-z0-9]/g, '') || 'png'
  return `${barbershopId}/logo-${Date.now()}.${ext}`
}

export default function ConfiguracoesPage() {
  const [saved, setSaved] = useState(false)
  const [saving, setSaving] = useState(false)
  const [logoFile, setLogoFile] = useState<File | null>(null)
  const [logoPreview, setLogoPreview] = useState('')
  const [logoError, setLogoError] = useState('')
  const { barbershop, updateRecord } = useAppData()
  const [shop, setShop] = useState({
    name: barbershop.name,
    slug: barbershop.slug,
    city: barbershop.city,
    color: barbershop.color,
    logoUrl: barbershop.logoUrl ?? '',
    billingDocument: formatBillingDocument(barbershop.billingDocument),
  })
  const currentPlan = getSaasPlan(barbershop.plan)
  const effectiveLogoUrl = logoPreview || shop.logoUrl
  const effectiveColor = useMemo(() => (hexColorPattern.test(shop.color) ? shop.color : '#1E3A32'), [shop.color])

  useEffect(() => {
    setShop({
      name: barbershop.name,
      slug: barbershop.slug,
      city: barbershop.city,
      color: barbershop.color,
      logoUrl: barbershop.logoUrl ?? '',
      billingDocument: formatBillingDocument(barbershop.billingDocument),
    })
    setLogoFile(null)
    setLogoPreview('')
    setLogoError('')
  }, [barbershop])

  useEffect(() => {
    return () => {
      if (logoPreview) URL.revokeObjectURL(logoPreview)
    }
  }, [logoPreview])

  function handleLogoChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]
    if (!file) return

    if (!['image/png', 'image/jpeg', 'image/webp', 'image/svg+xml'].includes(file.type)) {
      setLogoError('Use PNG, JPG, WEBP ou SVG.')
      return
    }
    if (file.size > 2 * 1024 * 1024) {
      setLogoError('A logo precisa ter até 2 MB.')
      return
    }

    if (logoPreview) URL.revokeObjectURL(logoPreview)
    setLogoError('')
    setLogoFile(file)
    setLogoPreview(URL.createObjectURL(file))
    setSaved(false)
  }

  function removeLogo() {
    if (logoPreview) URL.revokeObjectURL(logoPreview)
    setLogoFile(null)
    setLogoPreview('')
    setLogoError('')
    setShop((current) => ({ ...current, logoUrl: '' }))
    setSaved(false)
  }

  async function saveSettings() {
    if (!hexColorPattern.test(shop.color)) {
      window.alert('Informe a cor principal no formato hexadecimal. Exemplo: #1E3A32')
      return
    }
    setSaved(false)
    setSaving(true)
    let logoUrl = shop.logoUrl

    if (logoFile) {
      const supabase = createBrowserSupabaseClient()
      const filePath = getLogoFilePath(barbershop.id, logoFile)
      const { error: uploadError } = await supabase.storage
        .from('barbershop-assets')
        .upload(filePath, logoFile, { contentType: logoFile.type, upsert: true })

      if (uploadError) {
        setSaving(false)
        window.alert(uploadError.message)
        return
      }

      const { data } = supabase.storage.from('barbershop-assets').getPublicUrl(filePath)
      logoUrl = data.publicUrl
    }

    const result = await updateRecord('barbershops', barbershop.id, {
      name: shop.name,
      slug: shop.slug,
      city: shop.city,
      color: shop.color,
      logo_url: logoUrl || null,
      billing_document: onlyDigits(shop.billingDocument) || null,
    })
    setSaving(false)
    if (result.error) { window.alert(result.error); return }
    setLogoFile(null)
    setLogoPreview('')
    setSaved(true)
  }

  async function signOut() {
    await createBrowserSupabaseClient().auth.signOut()
    window.location.replace('/login')
  }

  return (
    <div>
      <PageHeader
        title="Configurações"
        description="Dados da unidade, preferências operacionais, plano contratado e parâmetros de segurança."
      >
        {saved ? <span className="text-sm font-medium text-success">Alterações salvas</span> : null}
        <Button variant="gold" size="sm" onClick={saveSettings} disabled={saving}>
          <Save className="size-4" />
          {saving ? 'Salvando...' : 'Salvar alterações'}
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
                <Label htmlFor="billingDocument">CPF/CNPJ da cobrança</Label>
                <Input
                  id="billingDocument"
                  inputMode="numeric"
                  value={shop.billingDocument}
                  onChange={(e)=>setShop(c=>({...c,billingDocument:formatBillingDocument(e.target.value)}))}
                  placeholder="CPF ou CNPJ"
                />
              </div>
              <div className="space-y-2">
                <Label>Plano contratado</Label>
                <div className="rounded-md border border-border bg-muted/30 px-3 py-2">
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-sm font-medium text-foreground">{currentPlan.name}</span>
                    <span className="text-sm font-semibold text-foreground">{currentPlan.price}/mês</span>
                  </div>
                  <p className="mt-1 text-xs leading-5 text-muted-foreground">
                    O teste grátis dura 30 dias. Alteração de plano não é automática por aqui; se precisar mudar, ajuste antes de gerar a cobrança.
                  </p>
                </div>
              </div>
            </div>
          </Card>

          <Card className="p-5">
            <h3 className="mb-4 flex items-center gap-2 font-semibold text-foreground">
              <Palette className="size-4 text-muted-foreground" />
              Identidade
            </h3>
            <div className="grid gap-5 xl:grid-cols-[320px_1fr]">
              <div className="rounded-xl border border-border bg-muted/30 p-4">
                <p className="mb-3 text-sm font-medium text-foreground">Prévia da marca</p>
                <div className="rounded-lg border border-border bg-card p-4 shadow-sm">
                  <div className="flex items-center gap-3">
                    <BrandMark name={shop.name} color={effectiveColor} logoUrl={effectiveLogoUrl} className="size-14 text-base" />
                    <div className="min-w-0 leading-tight">
                      <p className="truncate text-base font-bold text-foreground">{shop.name || 'Nome da barbearia'}</p>
                      <p className="truncate text-sm text-muted-foreground">{shop.city || 'Cidade da unidade'}</p>
                    </div>
                  </div>
                  <div className="mt-4 rounded-md px-3 py-2 text-sm font-semibold text-white" style={{ backgroundColor: effectiveColor }}>
                    Botão e destaques usando a cor principal
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <div className="grid gap-4 md:grid-cols-[220px_1fr]">
                  <div className="space-y-2">
                    <Label>Logo da empresa</Label>
                    <div className="flex items-center gap-3">
                      <BrandMark name={shop.name} color={effectiveColor} logoUrl={effectiveLogoUrl} className="size-16 text-lg" />
                      <div className="min-w-0 space-y-2">
                        <label className="inline-flex h-9 cursor-pointer items-center justify-center gap-2 rounded-md border border-border bg-card px-3 text-sm font-medium text-foreground shadow-sm transition-colors hover:bg-muted">
                          <ImageUp className="size-4" />
                          Enviar logo
                          <input type="file" accept="image/png,image/jpeg,image/webp,image/svg+xml" className="sr-only" onChange={handleLogoChange} />
                        </label>
                        {effectiveLogoUrl ? (
                          <Button type="button" variant="ghost" size="sm" onClick={removeLogo} className="text-destructive hover:text-destructive">
                            <Trash2 className="size-4" />
                            Remover
                          </Button>
                        ) : null}
                      </div>
                    </div>
                    <p className="text-xs text-muted-foreground">PNG, JPG, WEBP ou SVG até 2 MB.</p>
                    {logoError ? <p className="text-xs text-destructive">{logoError}</p> : null}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="color">Cor principal</Label>
                    <div className="grid gap-2 sm:grid-cols-[48px_1fr]">
                      <Input
                        id="colorPicker"
                        type="color"
                        value={effectiveColor}
                        onChange={(e)=>setShop(c=>({...c,color:e.target.value.toUpperCase()}))}
                        className="h-10 cursor-pointer p-1"
                        aria-label="Selecionar cor principal"
                      />
                      <Input
                        id="color"
                        value={shop.color}
                        onChange={(e)=>setShop(c=>({...c,color:normalizeHexColor(e.target.value)}))}
                        placeholder="#1E3A32"
                      />
                    </div>
                    <div className="flex flex-wrap gap-2 pt-1">
                      {brandColors.map((color) => (
                        <button
                          key={color}
                          type="button"
                          onClick={() => setShop((current) => ({ ...current, color }))}
                          className="size-7 rounded-full border border-border shadow-sm transition-transform hover:scale-110"
                          style={{ backgroundColor: color }}
                          aria-label={`Usar cor ${color}`}
                          title={color}
                        />
                      ))}
                    </div>
                    {!hexColorPattern.test(shop.color) ? (
                      <p className="text-xs text-destructive">Use uma cor no formato #RRGGBB.</p>
                    ) : null}
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
