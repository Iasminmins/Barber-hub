'use client'

import { useCallback, useEffect, useState } from 'react'
import {
  UserCircle,
  Globe,
  Plug,
  ShieldAlert,
  LogOut,
  CreditCard,
  MessageCircle,
  Mail,
  Smartphone,
  type LucideIcon,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { PlatformShell } from '@/components/platform/platform-shell'
import { StatusBadge } from '@/components/platform/status-badge'
import { usePlatformSession } from '../use-platform-session'

type Integration = {
  key: string
  label: string
  category: string
  configured: boolean
  detail: string | null
  hint: string
}

type SettingsPayload = {
  admin: { name: string; email: string }
  platform: { name: string; baseUrl: string | null; environment: string; supabaseUrl: string | null }
  integrations: Integration[]
}

const integrationIcons: Record<string, LucideIcon> = {
  asaas: CreditCard,
  whatsapp: MessageCircle,
  email: Mail,
  sms: Smartphone,
}

function SectionCard({
  icon: Icon,
  title,
  description,
  children,
}: {
  icon: LucideIcon
  title: string
  description: string
  children: React.ReactNode
}) {
  return (
    <Card className="pf-card-lift overflow-hidden rounded-xl border-border/60 p-0">
      <div className="flex items-start gap-3 border-b border-border/60 px-5 py-4">
        <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-muted/60 text-muted-foreground">
          <Icon className="size-4" />
        </div>
        <div className="min-w-0">
          <p className="text-sm font-medium text-foreground">{title}</p>
          <p className="mt-0.5 text-[13px] text-muted-foreground">{description}</p>
        </div>
      </div>
      {children}
    </Card>
  )
}

function DataRow({ label, value }: { label: string; value: string | null }) {
  return (
    <div className="flex flex-col gap-0.5 px-5 py-3.5 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
      <span className="text-[11px] uppercase tracking-wide text-muted-foreground">{label}</span>
      <span className="truncate text-sm text-foreground">{value || '—'}</span>
    </div>
  )
}

export function ConfiguracoesClient() {
  const { gate, adminName, signOut } = usePlatformSession()
  const [data, setData] = useState<SettingsPayload | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const load = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const res = await fetch('/api/admin/settings', { cache: 'no-store' })
      const payload = await res.json()
      if (!res.ok) throw new Error(payload.error ?? 'Falha ao carregar as configurações.')
      setData(payload)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Falha ao carregar as configurações.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    if (gate === 'anon') { window.location.replace('/login'); return }
    if (gate !== 'granted') return
    void load()
  }, [gate, load])

  if (gate !== 'granted') {
    return <div className="flex min-h-screen items-center justify-center text-sm text-muted-foreground">Verificando acesso…</div>
  }

  const showSkeleton = loading && !data

  return (
    <PlatformShell
      adminName={adminName ?? ''}
      title="Configurações"
      description="Sessão administrativa, dados da plataforma e status das integrações."
      loading={loading}
      onRefresh={() => void load()}
      onSignOut={() => void signOut()}
      showGlobalSearch={false}
      showPeriod={false}
      showNewMessage={false}
    >
      <div className="mx-auto max-w-3xl space-y-5">
        {error ? (
          <div className="rounded-xl border border-destructive/30 bg-destructive/[0.07] px-3.5 py-2.5 text-[13px] text-destructive">
            {error}
          </div>
        ) : null}

        <SectionCard
          icon={UserCircle}
          title="Sessão administrativa"
          description="Conta conectada ao painel da plataforma."
        >
          {showSkeleton ? (
            <div className="space-y-3 p-5">
              <div className="pf-skeleton h-4 w-48 rounded-md" />
              <div className="pf-skeleton h-4 w-64 rounded-md" />
            </div>
          ) : (
            <>
              <div className="divide-y divide-border/60">
                <DataRow label="Administrador" value={data?.admin.name ?? adminName} />
                <DataRow label="E-mail" value={data?.admin.email ?? null} />
              </div>
              <div className="border-t border-border/60 px-5 py-4">
                <Button
                  variant="outline"
                  size="sm"
                  className="rounded-xl transition-colors duration-150"
                  onClick={() => void signOut()}
                >
                  <LogOut className="size-4" />
                  <span className="ml-2">Encerrar sessão</span>
                </Button>
              </div>
            </>
          )}
        </SectionCard>

        <SectionCard icon={Globe} title="Plataforma" description="Informações gerais do SaaS.">
          {showSkeleton ? (
            <div className="space-y-3 p-5">
              <div className="pf-skeleton h-4 w-40 rounded-md" />
              <div className="pf-skeleton h-4 w-56 rounded-md" />
              <div className="pf-skeleton h-4 w-32 rounded-md" />
            </div>
          ) : (
            <div className="divide-y divide-border/60">
              <DataRow label="Nome" value={data?.platform.name ?? 'Barber Hub'} />
              <DataRow label="URL base" value={data?.platform.baseUrl ?? null} />
              <DataRow label="Ambiente" value={data?.platform.environment ?? null} />
              <DataRow label="Supabase" value={data?.platform.supabaseUrl ?? null} />
            </div>
          )}
        </SectionCard>

        <SectionCard
          icon={Plug}
          title="Integrações"
          description="Status de cada provedor conectado à plataforma."
        >
          {showSkeleton ? (
            <div className="space-y-4 p-5">
              {[0, 1, 2, 3].map((i) => (
                <div key={i} className="pf-skeleton h-10 rounded-lg" />
              ))}
            </div>
          ) : (
            <div className="divide-y divide-border/60">
              {(data?.integrations ?? []).map((integration) => {
                const Icon = integrationIcons[integration.key] ?? Plug
                return (
                  <div
                    key={integration.key}
                    className="flex items-start gap-3 px-5 py-4 transition-colors duration-150 hover:bg-muted/40"
                  >
                    <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-muted/60 text-muted-foreground">
                      <Icon className="size-4" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="text-sm text-foreground">{integration.label}</p>
                        <span className="text-[11px] uppercase tracking-wide text-muted-foreground">
                          {integration.category}
                        </span>
                      </div>
                      <p className="mt-1 text-[13px] text-muted-foreground">
                        {integration.configured && integration.detail ? `${integration.detail} · ` : ''}
                        {integration.hint}
                      </p>
                    </div>
                    <StatusBadge
                      tone={integration.configured ? 'success' : 'neutral'}
                      label={integration.configured ? 'Configurado' : 'Não configurado'}
                      className="mt-0.5"
                    />
                  </div>
                )
              })}
              {!showSkeleton && (data?.integrations.length ?? 0) === 0 ? (
                <p className="px-5 py-6 text-center text-[13px] text-muted-foreground">
                  Nenhuma integração disponível.
                </p>
              ) : null}
            </div>
          )}
        </SectionCard>

        <Card className="overflow-hidden rounded-xl border-destructive/30 p-0">
          <div className="flex items-start gap-3 border-b border-destructive/20 px-5 py-4">
            <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-destructive/[0.07] text-destructive">
              <ShieldAlert className="size-4" />
            </div>
            <div className="min-w-0">
              <p className="text-sm font-medium text-foreground">Zona de perigo</p>
              <p className="mt-0.5 text-[13px] text-muted-foreground">
                Ações irreversíveis sobre a plataforma e as contas dos clientes.
              </p>
            </div>
          </div>
          <div className="px-5 py-4">
            <p className="text-[13px] text-muted-foreground">
              Nenhuma ação destrutiva está habilitada neste painel. Cancelamentos e exclusões de contas continuam
              disponíveis individualmente na página de cada barbearia, com confirmação obrigatória.
            </p>
          </div>
        </Card>
      </div>
    </PlatformShell>
  )
}
