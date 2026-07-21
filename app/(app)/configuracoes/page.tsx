'use client'

import { type ChangeEvent, type ComponentType, useEffect, useMemo, useState } from 'react'
import {
  Bell,
  Building2,
  CalendarDays,
  Clock3,
  CreditCard,
  Grid3X3,
  Home,
  ImageUp,
  LogOut,
  Palette,
  Receipt,
  Save,
  ShieldCheck,
  Trash2,
  Upload,
  Users,
} from 'lucide-react'
import { BrandMark } from '@/components/brand-mark'
import { BillingCard } from '@/components/billing/billing-card'
import { useAppData } from '@/components/data/app-data-provider'
import { PageHeader } from '@/components/page-header'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Dialog, DialogHeader } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select } from '@/components/ui/select'
import { businessDays, defaultAgendaSettings, makePaymentSlug, normalizeAgendaSettings, normalizePaymentMethods, type AgendaSettings, type BusinessDayKey, type PaymentMethodConfig } from '@/lib/barbershop-settings'
import { formatBillingDocument, onlyDigits } from '@/lib/billing-document'
import { getSaasPlan, saasPlans, type SaasPlanId } from '@/lib/saas-plans'
import { createBrowserSupabaseClient } from '@/lib/supabase/client'
import { cn } from '@/lib/utils'

type SettingsTab = 'aparencia' | 'inicio' | 'funcionarios' | 'agenda' | 'pagamentos' | 'assinatura' | 'modulos'

const brandColors = ['#1E3A32', '#0F766E', '#111827', '#7C2D12', '#B45309', '#4F46E5', '#7E22CE', '#BE123C']
const employeeColors = ['#1E3A32', '#22C55E', '#D0021B', '#22C55E', '#7C3AED', '#F59E0B', '#0EA5E9', '#64748B']
const hexColorPattern = /^#[0-9a-f]{6}$/i

const settingsTabs: Array<{ id: SettingsTab; label: string; icon: ComponentType<{ className?: string }> }> = [
  { id: 'aparencia', label: 'Aparência', icon: Palette },
  { id: 'inicio', label: 'Tela inicial', icon: Home },
  { id: 'funcionarios', label: 'Cores dos funcionários', icon: Users },
  { id: 'agenda', label: 'Agenda', icon: CalendarDays },
  { id: 'pagamentos', label: 'Pagamentos da barbearia', icon: CreditCard },
  { id: 'assinatura', label: 'Assinatura BarberHub', icon: Receipt },
  { id: 'modulos', label: 'Módulos', icon: Grid3X3 },
]

function normalizeHexColor(value: string) {
  const trimmed = value.trim()
  const prefixed = trimmed.startsWith('#') ? trimmed : `#${trimmed}`
  return prefixed.toUpperCase()
}

function getLogoFilePath(barbershopId: string, file: File) {
  const ext = file.name.split('.').pop()?.toLowerCase().replace(/[^a-z0-9]/g, '') || 'png'
  return `${barbershopId}/logo-${Date.now()}.${ext}`
}

function getInitials(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean)
  if (!parts.length) return 'BH'
  return parts.slice(0, 2).map((part) => part[0]).join('').toUpperCase()
}

export default function ConfiguracoesPage() {
  const { barbershop, employees, updateRecord, refresh } = useAppData()
  const currentPlan = getSaasPlan(barbershop.plan)

  const [activeTab, setActiveTab] = useState<SettingsTab>('aparencia')
  const [saved, setSaved] = useState(false)
  const [saving, setSaving] = useState(false)
  const [logoFile, setLogoFile] = useState<File | null>(null)
  const [logoPreview, setLogoPreview] = useState('')
  const [logoError, setLogoError] = useState('')
  const [planDialogOpen, setPlanDialogOpen] = useState(false)
  const [planDraft, setPlanDraft] = useState<SaasPlanId>(barbershop.plan)
  const [planSaving, setPlanSaving] = useState(false)
  const [planMessage, setPlanMessage] = useState('')
  const [employeeDrafts, setEmployeeDrafts] = useState<Record<string, string>>({})
  const [employeeSaving, setEmployeeSaving] = useState('')
  const [employeeMessage, setEmployeeMessage] = useState('')
  const [shop, setShop] = useState({
    name: barbershop.name,
    slug: barbershop.slug,
    city: barbershop.city,
    color: barbershop.color,
    logoUrl: barbershop.logoUrl ?? '',
    billingDocument: formatBillingDocument(barbershop.billingDocument),
  })
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethodConfig[]>(() => normalizePaymentMethods(barbershop.paymentMethods))
  const [agendaSettings, setAgendaSettings] = useState<AgendaSettings>(() => normalizeAgendaSettings(barbershop.agendaSettings))

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
    setPlanDraft(barbershop.plan)
    setPaymentMethods(normalizePaymentMethods(barbershop.paymentMethods))
    setAgendaSettings(normalizeAgendaSettings(barbershop.agendaSettings))
  }, [barbershop])

  useEffect(() => {
    setEmployeeDrafts(
      Object.fromEntries(
        employees.map((employee) => [employee.id, employee.avatarColor ?? '#64748B']),
      ),
    )
  }, [employees])

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

  function updatePaymentMethod(id: string, values: Partial<PaymentMethodConfig>) {
    setPaymentMethods((current) => current.map((method) => {
      if (method.id !== id) return method
      const name = values.name ?? method.name
      return {
        ...method,
        ...values,
        slug: values.slug ?? (values.name ? makePaymentSlug(name) : method.slug),
      }
    }))
    setSaved(false)
  }

  function addPaymentMethod() {
    if (paymentMethods.length >= 8) return
    const name = 'Novo método'
    setPaymentMethods((current) => [
      ...current,
      { id: `custom-${Date.now()}`, name, slug: makePaymentSlug(name), active: true },
    ])
    setSaved(false)
  }

  function removePaymentMethod(id: string) {
    setPaymentMethods((current) => current.filter((method) => method.id !== id))
    setSaved(false)
  }

  function updateBusinessHour(day: BusinessDayKey, values: Partial<AgendaSettings['businessHours'][BusinessDayKey]>) {
    setAgendaSettings((current) => ({
      ...current,
      businessHours: {
        ...current.businessHours,
        [day]: {
          ...current.businessHours[day],
          ...values,
        },
      },
    }))
    setSaved(false)
  }

  async function saveSettings() {
    if (!hexColorPattern.test(shop.color)) {
      window.alert('Informe a cor principal no formato hexadecimal. Exemplo: #1E3A32')
      return
    }
    const cleanPaymentMethods = normalizePaymentMethods(paymentMethods).map((method) => ({
      ...method,
      name: method.name.trim(),
      slug: makePaymentSlug(method.slug || method.name),
    }))
    if (cleanPaymentMethods.some((method) => !method.name || !method.slug)) {
      window.alert('Revise os métodos de pagamento. Nome e identificador são obrigatórios.')
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
      payment_methods: cleanPaymentMethods,
      agenda_settings: {
        ...agendaSettings,
        lowStockAlert: Math.max(0, Number(agendaSettings.lowStockAlert) || defaultAgendaSettings.lowStockAlert),
      },
    })
    setSaving(false)
    if (result.error) { window.alert(result.error); return }
    setLogoFile(null)
    setLogoPreview('')
    setSaved(true)
  }

  async function authenticatedFetch(url: string, init?: RequestInit) {
    const { data } = await createBrowserSupabaseClient().auth.getSession()
    const token = data.session?.access_token
    if (!token) throw new Error('Sua sessão expirou. Entre novamente.')
    return fetch(url, { ...init, headers: { ...init?.headers, Authorization: `Bearer ${token}` } })
  }

  async function changePlan() {
    setPlanSaving(true)
    setPlanMessage('')
    try {
      const response = await authenticatedFetch('/api/billing/plan', {
        method: 'PATCH',
        body: JSON.stringify({ plan: planDraft }),
      })
      const body = await response.json()
      if (!response.ok) throw new Error(body.error)
      await refresh()
      setPlanMessage(body.message ?? 'Plano atualizado.')
      setPlanDialogOpen(false)
      setSaved(true)
    } catch (error) {
      setPlanMessage(error instanceof Error ? error.message : 'Não foi possível alterar o plano.')
    } finally {
      setPlanSaving(false)
    }
  }

  async function saveEmployeeStyle(employeeId: string) {
    const color = employeeDrafts[employeeId] ?? '#64748B'
    if (!hexColorPattern.test(color)) {
      setEmployeeMessage('Use uma cor no formato #RRGGBB.')
      return
    }

    setEmployeeSaving(employeeId)
    setEmployeeMessage('')
    const result = await updateRecord('employees', employeeId, { avatar_color: color })
    setEmployeeSaving('')
    if (result.error) {
      setEmployeeMessage(result.error)
      return
    }
    setEmployeeMessage('Cor do funcionário salva.')
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

      <div className="space-y-4">
        <Card className="overflow-hidden border-border/70 bg-gradient-to-br from-card via-card to-gold/5">
          <div className="border-b border-border/70 p-5">
            <p className="text-sm font-semibold uppercase tracking-[0.16em] text-primary">Painel de personalização</p>
            <h2 className="mt-2 text-2xl font-bold text-foreground">Deixe o BarberHub com a cara da empresa</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Ajuste aparência, tela inicial, funcionários, agenda, pagamentos e módulos em áreas separadas.
            </p>
          </div>
          <div className="grid grid-cols-2 gap-1 p-2 sm:grid-cols-3 xl:grid-cols-7">
            {settingsTabs.map((tab) => {
              const Icon = tab.icon
              const active = activeTab === tab.id
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveTab(tab.id)}
                  className={cn(
                    'flex min-h-10 items-center justify-center gap-2 rounded-lg px-3 py-2 text-sm font-semibold transition-colors',
                    active ? 'bg-background text-foreground shadow-sm ring-1 ring-border' : 'text-muted-foreground hover:bg-background/70 hover:text-foreground',
                  )}
                >
                  <Icon className="size-4" />
                  <span className="truncate">{tab.label}</span>
                </button>
              )
            })}
          </div>
        </Card>

        {activeTab === 'aparencia' ? (
          <div className="grid gap-4 xl:grid-cols-[1fr_360px]">
            <Card className="p-5">
              <h3 className="mb-4 flex items-center gap-2 font-semibold text-foreground">
                <Palette className="size-4 text-muted-foreground" />
                Aparência da marca
              </h3>
              <div className="grid gap-5 lg:grid-cols-[320px_1fr]">
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
                  <div className="grid gap-4 md:grid-cols-[240px_1fr]">
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
                          onChange={(event)=>setShop(current=>({...current,color:event.target.value.toUpperCase()}))}
                          className="h-10 cursor-pointer p-1"
                          aria-label="Selecionar cor principal"
                        />
                        <Input
                          id="color"
                          value={shop.color}
                          onChange={(event)=>setShop(current=>({...current,color:normalizeHexColor(event.target.value)}))}
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
                </div>
              </div>
            </Card>

            <Card className="p-5">
              <h3 className="mb-4 flex items-center gap-2 font-semibold text-foreground">
                <Building2 className="size-4 text-muted-foreground" />
                Identificação
              </h3>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Nome da unidade</Label>
                  <Input id="name" value={shop.name} onChange={(event)=>setShop(current=>({...current,name:event.target.value}))} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="city">Cidade</Label>
                  <Input id="city" value={shop.city} onChange={(event)=>setShop(current=>({...current,city:event.target.value}))} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="billingDocument">CPF/CNPJ da cobrança</Label>
                  <Input
                    id="billingDocument"
                    inputMode="numeric"
                    value={shop.billingDocument}
                    onChange={(event)=>setShop(current=>({...current,billingDocument:formatBillingDocument(event.target.value)}))}
                    placeholder="CPF ou CNPJ"
                  />
                </div>
              </div>
            </Card>
          </div>
        ) : null}

        {activeTab === 'inicio' ? (
          <Card className="p-5">
            <h3 className="mb-1 flex items-center gap-2 font-semibold text-foreground">
              <Home className="size-4 text-muted-foreground" />
              Tela inicial e dados públicos
            </h3>
            <p className="mb-5 text-sm text-muted-foreground">Controle o nome público, endereço de acesso e chamada inicial da unidade.</p>
            <div className="grid gap-4 lg:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="slug">Slug público</Label>
                <Input id="slug" value={shop.slug} onChange={(event)=>setShop(current=>({...current,slug:event.target.value}))} />
                <p className="text-xs text-muted-foreground">Usado para identificar a unidade em links públicos e integrações futuras.</p>
              </div>
              <div className="space-y-2">
                <Label>Mensagem da tela inicial</Label>
                <div className="rounded-md border border-border bg-muted/30 p-3 text-sm leading-6 text-muted-foreground">
                  Bem-vindo ao {shop.name || 'BarberHub'} — organize agenda, comandas, clientes e pagamentos em um só lugar.
                </div>
              </div>
              <div className="rounded-xl border border-border bg-card p-4 lg:col-span-2">
                <p className="text-sm font-semibold text-foreground">Prévia rápida</p>
                <div className="mt-3 flex items-center gap-3 rounded-lg border border-border bg-muted/25 p-4">
                  <BrandMark name={shop.name} color={effectiveColor} logoUrl={effectiveLogoUrl} className="size-12" />
                  <div>
                    <p className="font-bold text-foreground">{shop.name || 'Nome da barbearia'}</p>
                    <p className="text-sm text-muted-foreground">{shop.city || 'Cidade'} · /{shop.slug || 'slug-publico'}</p>
                  </div>
                </div>
              </div>
            </div>
          </Card>
        ) : null}

        {activeTab === 'funcionarios' ? (
          <Card className="p-5">
            <h3 className="mb-1 flex items-center gap-2 font-semibold text-foreground">
              <Palette className="size-4 text-muted-foreground" />
              Cores dos funcionários
            </h3>
            <p className="mb-5 text-sm text-muted-foreground">Defina a cor de destaque que aparece no funcionário em agenda, rankings e listas.</p>
            {employeeMessage ? <p className="mb-4 text-sm text-muted-foreground">{employeeMessage}</p> : null}
            <div className="grid gap-4 xl:grid-cols-2">
              {employees.map((employee) => {
                const color = employeeDrafts[employee.id] ?? employee.avatarColor ?? '#64748B'
                const isDefault = !employee.avatarColor
                return (
                  <div key={employee.id} className="rounded-xl border border-border bg-card p-4 shadow-sm">
                    <div className="mb-4 flex items-center justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <span className="flex size-11 items-center justify-center rounded-full bg-muted text-sm font-semibold text-foreground">
                          {getInitials(employee.name)}
                        </span>
                        <span className="size-3 rounded-full" style={{ backgroundColor: hexColorPattern.test(color) ? color : '#64748B' }} />
                        <div>
                          <p className="font-semibold text-foreground">{employee.name}</p>
                          <p className="text-xs capitalize text-muted-foreground">{employee.role}</p>
                        </div>
                      </div>
                      <Badge variant={isDefault ? 'secondary' : 'outline'}>{isDefault ? 'padrão' : color}</Badge>
                    </div>
                    <div className="grid gap-3 md:grid-cols-[1fr_auto_auto]">
                      <Input
                        value={color}
                        onChange={(event) => setEmployeeDrafts((current) => ({ ...current, [employee.id]: normalizeHexColor(event.target.value) }))}
                        placeholder="#64748B"
                      />
                      <label className="inline-flex h-9 cursor-pointer items-center justify-center gap-2 rounded-md border border-border bg-card px-3 text-sm font-medium text-foreground shadow-sm transition-colors hover:bg-muted">
                        <input
                          type="color"
                          value={hexColorPattern.test(color) ? color : '#64748B'}
                          onChange={(event) => setEmployeeDrafts((current) => ({ ...current, [employee.id]: event.target.value.toUpperCase() }))}
                          className="sr-only"
                        />
                        Selecionar cor
                      </label>
                      <Button type="button" onClick={() => saveEmployeeStyle(employee.id)} disabled={employeeSaving === employee.id}>
                        {employeeSaving === employee.id ? 'Salvando...' : 'Salvar alterações'}
                      </Button>
                    </div>
                    <div className="mt-3 flex flex-wrap gap-2">
                      <Button type="button" variant="outline" size="sm" disabled title="Upload de foto por funcionário entra em uma próxima etapa.">
                        <Upload className="size-4" />
                        Foto de perfil
                      </Button>
                      {employeeColors.map((preset) => (
                        <button
                          key={preset}
                          type="button"
                          onClick={() => setEmployeeDrafts((current) => ({ ...current, [employee.id]: preset }))}
                          className="size-7 rounded-full border border-border shadow-sm transition-transform hover:scale-110"
                          style={{ backgroundColor: preset }}
                          aria-label={`Usar cor ${preset}`}
                        />
                      ))}
                    </div>
                  </div>
                )
              })}
            </div>
          </Card>
        ) : null}

        {activeTab === 'agenda' ? (
          <div className="space-y-4">
            <Card className="p-5">
              <h3 className="mb-1 flex items-center gap-2 font-semibold text-foreground">
                <CalendarDays className="size-4 text-muted-foreground" />
                Configuração da agenda e limite de estoque
              </h3>
              <p className="mb-5 text-sm text-muted-foreground">Defina funcionamento, estoque mínimo e regra de comissão da barbearia.</p>

              <div className="space-y-5">
                <div className="rounded-xl border border-border bg-card p-4">
                  <Label htmlFor="lowStockAlert">Alerta de estoque baixo (quantidade)</Label>
                  <Input
                    id="lowStockAlert"
                    type="number"
                    min={0}
                    className="mt-2"
                    value={agendaSettings.lowStockAlert}
                    onChange={(event) => {
                      setAgendaSettings((current) => ({ ...current, lowStockAlert: Number(event.target.value) }))
                      setSaved(false)
                    }}
                  />
                  <p className="mt-2 text-xs text-muted-foreground">Produtos com estoque igual ou menor a este valor aparecem nas notificações.</p>
                </div>

                <div className="rounded-xl border border-border bg-card p-4">
                  <Label htmlFor="planCommissionMode">Comissão em serviços cobertos por assinatura de cliente</Label>
                  <Select
                    id="planCommissionMode"
                    className="mt-2"
                    value={agendaSettings.planCommissionMode}
                    onChange={(event) => {
                      setAgendaSettings((current) => ({ ...current, planCommissionMode: event.target.value === 'servico' ? 'servico' : 'receita' }))
                      setSaved(false)
                    }}
                  >
                    <option value="receita">Por receita — serviço coberto pelo plano NÃO gera comissão</option>
                    <option value="servico">Por serviço — todo atendimento gera comissão</option>
                  </Select>
                  <p className="mt-2 text-xs text-muted-foreground">Define se o profissional ganha comissão quando o cliente usa um plano/assinatura já paga.</p>
                </div>

                <div className="space-y-3">
                  {businessDays.map((day) => {
                    const hours = agendaSettings.businessHours[day.key]
                    return (
                      <div key={day.key} className="grid gap-3 rounded-xl border border-border bg-card p-4 md:grid-cols-[130px_110px_150px_32px_150px] md:items-center">
                        <p className="text-base font-semibold text-foreground">{day.label}</p>
                        <label className="flex items-center gap-2 text-sm font-medium text-foreground">
                          <input
                            type="checkbox"
                            checked={hours.closed}
                            onChange={(event) => updateBusinessHour(day.key, { closed: event.target.checked })}
                            className="size-4 accent-[var(--primary)]"
                          />
                          Fechado
                        </label>
                        <div className="relative">
                          <Input type="time" value={hours.start} disabled={hours.closed} onChange={(event) => updateBusinessHour(day.key, { start: event.target.value })} />
                          <Clock3 className="pointer-events-none absolute right-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                        </div>
                        <span className="hidden text-center text-sm text-muted-foreground md:block">até</span>
                        <div className="relative">
                          <Input type="time" value={hours.end} disabled={hours.closed} onChange={(event) => updateBusinessHour(day.key, { end: event.target.value })} />
                          <Clock3 className="pointer-events-none absolute right-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            </Card>

            <div className="grid gap-4 lg:grid-cols-2">
              <Card className="p-5">
                <h3 className="mb-4 flex items-center gap-2 font-semibold text-foreground">
                  <CalendarDays className="size-4 text-muted-foreground" />
                  Preferências rápidas
                </h3>
                <div className="grid gap-3 sm:grid-cols-2">
                  {['Mostrar agenda por barbeiro', 'Permitir encaixes', 'Destacar horários livres', 'Avisar atraso no atendimento'].map((label, index) => (
                    <label key={label} className="flex items-center justify-between gap-3 rounded-lg border border-border bg-card p-3 text-sm">
                      <span className="text-muted-foreground">{label}</span>
                      <input type="checkbox" defaultChecked={index < 3} className="size-4 accent-[var(--primary)]" />
                    </label>
                  ))}
                </div>
              </Card>
              <Card className="p-5">
                <h3 className="mb-4 flex items-center gap-2 font-semibold text-foreground">
                  <Bell className="size-4 text-muted-foreground" />
                  Notificações operacionais
                </h3>
                <div className="space-y-3">
                  {[
                    'Lembrar cliente antes do horário',
                    'Avisar estoque abaixo do mínimo',
                    'Alertar assinatura de cliente vencendo',
                    'Enviar resumo financeiro diário',
                  ].map((label, index) => (
                    <label key={label} className="flex items-center justify-between gap-3 text-sm">
                      <span className="text-muted-foreground">{label}</span>
                      <input type="checkbox" defaultChecked={index < 3 || currentPlan.features.advancedReports} className="size-4 accent-[var(--primary)]" />
                    </label>
                  ))}
                </div>
              </Card>
            </div>
          </div>
        ) : null}

        {activeTab === 'pagamentos' ? (
          <Card className="p-5">
            <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <h3 className="mb-1 flex items-center gap-2 font-semibold text-foreground">
                  <CreditCard className="size-4 text-muted-foreground" />
                  Métodos de pagamento da barbearia
                </h3>
                <p className="text-sm text-muted-foreground">Gerencie as formas aceitas no fechamento de comandas, agendamentos e vendas da barbearia.</p>
              </div>
              <Button type="button" onClick={addPaymentMethod} disabled={paymentMethods.length >= 8}>
                + Adicionar método
              </Button>
            </div>

            <div className="overflow-hidden rounded-xl border border-border">
              <div className="hidden grid-cols-[1fr_1fr_110px_80px] gap-3 border-b border-border bg-muted/30 px-4 py-3 text-sm font-semibold text-foreground md:grid">
                <span>Nome</span>
                <span>Identificador (slug)</span>
                <span>Status</span>
                <span className="text-right">Ações</span>
              </div>
              <div className="divide-y divide-border">
                {paymentMethods.map((method) => (
                  <div key={method.id} className="grid gap-3 p-4 md:grid-cols-[1fr_1fr_110px_80px] md:items-center">
                    <div className="space-y-1">
                      <Label className="md:sr-only">Nome</Label>
                      <Input value={method.name} onChange={(event) => updatePaymentMethod(method.id, { name: event.target.value })} placeholder="Ex.: PIX" />
                    </div>
                    <div className="space-y-1">
                      <Label className="md:sr-only">Identificador</Label>
                      <Input value={method.slug} onChange={(event) => updatePaymentMethod(method.id, { slug: makePaymentSlug(event.target.value) })} placeholder="PIX" />
                    </div>
                    <label className="flex items-center gap-2 text-sm text-muted-foreground">
                      <input type="checkbox" checked={method.active} onChange={(event) => updatePaymentMethod(method.id, { active: event.target.checked })} className="size-4 accent-[var(--primary)]" />
                      Ativo
                    </label>
                    <div className="flex justify-end">
                      <Button type="button" variant="ghost" size="icon" className="text-destructive hover:text-destructive" onClick={() => removePaymentMethod(method.id)} disabled={paymentMethods.length <= 1} title="Remover método">
                        <Trash2 className="size-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <p className="mt-4 text-xs text-muted-foreground">Você pode cadastrar até 8 métodos. Esta aba é da operação da barbearia; a mensalidade do BarberHub fica em “Assinatura BarberHub”.</p>
          </Card>
        ) : null}

        {activeTab === 'assinatura' ? (
          <div className="grid gap-4 xl:grid-cols-[1fr_360px]">
            <BillingCard planId={barbershop.plan} />
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
              <Button
                type="button"
                variant="outline"
                className="mt-4 w-full"
                onClick={() => {
                  setPlanDraft(barbershop.plan)
                  setPlanMessage('')
                  setPlanDialogOpen(true)
                }}
              >
                Alterar plano
              </Button>
              {planMessage ? <p className="mt-2 text-xs text-muted-foreground">{planMessage}</p> : null}
              <div className="mt-4 rounded-md border border-border bg-muted/30 p-3 text-xs leading-5 text-muted-foreground">
                Esta é a assinatura que a empresa paga para usar o BarberHub. Ela não altera os métodos de pagamento usados no caixa da barbearia.
              </div>
            </Card>
          </div>
        ) : null}

        {activeTab === 'modulos' ? (
          <div className="grid gap-4 lg:grid-cols-3">
            <Card className="p-5 lg:col-span-2">
              <h3 className="mb-4 flex items-center gap-2 font-semibold text-foreground">
                <Grid3X3 className="size-4 text-muted-foreground" />
                Módulos liberados
              </h3>
              <div className="grid gap-3 sm:grid-cols-2">
                {[
                  ['Agenda e clientes', true],
                  ['Comandas / PDV', true],
                  ['Assinaturas de clientes', true],
                  ['Comissões', true],
                  ['Importação e exportação', currentPlan.features.importExport],
                  ['Relatórios avançados', currentPlan.features.advancedReports],
                  ['Multiunidade', currentPlan.features.multiUnit],
                  ['Implantação assistida', currentPlan.features.assistedOnboarding],
                ].map(([label, active]) => (
                  <div key={String(label)} className="flex items-center justify-between gap-3 rounded-lg border border-border bg-card p-3">
                    <span className="text-sm text-muted-foreground">{String(label)}</span>
                    <Badge variant={active ? 'success' : 'secondary'}>{active ? 'Ativo' : 'Upgrade'}</Badge>
                  </div>
                ))}
              </div>
            </Card>

            <div className="space-y-4">
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
        ) : null}
      </div>

      <Dialog open={planDialogOpen} onClose={() => setPlanDialogOpen(false)}>
        <DialogHeader
          title="Alterar plano"
          description="Escolha qual plano será usado na assinatura. Durante os 30 dias grátis, isso não gera cobrança imediata."
        />
        <div className="space-y-3">
          {saasPlans.map((plan) => {
            const selected = planDraft === plan.id
            return (
              <button
                key={plan.id}
                type="button"
                onClick={() => setPlanDraft(plan.id)}
                className={cn(
                  'w-full rounded-lg border p-4 text-left transition-colors',
                  selected ? 'border-primary bg-primary/10' : 'border-border bg-card hover:bg-muted/50',
                )}
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-semibold text-foreground">{plan.name}</p>
                    <p className="mt-1 text-sm leading-5 text-muted-foreground">{plan.description}</p>
                  </div>
                  <span className="shrink-0 text-sm font-bold text-foreground">{plan.price}/mês</span>
                </div>
                <p className="mt-3 text-xs text-muted-foreground">
                  {plan.users} · {plan.reports}
                </p>
              </button>
            )
          })}
        </div>
        <div className="mt-4 rounded-md border border-success/30 bg-success/10 p-3 text-xs leading-5 text-muted-foreground">
          Nenhuma cobrança é feita durante os 30 dias grátis. Se já existir uma cobrança pendente no Asaas, ela será ajustada para o novo plano.
        </div>
        {planMessage ? <p className="mt-3 text-sm text-destructive">{planMessage}</p> : null}
        <div className="mt-5 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <Button type="button" variant="outline" onClick={() => setPlanDialogOpen(false)} disabled={planSaving}>
            Cancelar
          </Button>
          <Button type="button" variant="gold" onClick={changePlan} disabled={planSaving}>
            {planSaving ? 'Salvando...' : 'Confirmar plano'}
          </Button>
        </div>
      </Dialog>
    </div>
  )
}
