'use client'

import { useCallback, useEffect, useState } from 'react'
import Link from 'next/link'
import { Mail, MessageSquarePlus } from 'lucide-react'
import { buttonVariants } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { PlatformShell } from '@/components/platform/platform-shell'
import { usePlatformSession } from '../use-platform-session'
import type { TenantRow } from '../types'

const statusLabel: Record<string, string> = { trialing: 'Em teste', active: 'Ativa', past_due: 'Em atraso', canceled: 'Cancelada' }

export function ClientesClient() {
  const { gate, adminName, token, signOut } = usePlatformSession()
  const [rows, setRows] = useState<TenantRow[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [search, setSearch] = useState('')

  const load = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const params = new URLSearchParams()
      if (search.trim()) params.set('search', search.trim())
      params.set('pageSize', '100')
      const res = await fetch(`/api/admin/tenants?${params}`, { headers: { Authorization: `Bearer ${token}` } })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Falha ao carregar responsáveis.')
      setRows(data.items ?? [])
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Falha ao carregar responsáveis.')
    } finally {
      setLoading(false)
    }
  }, [token, search])

  useEffect(() => {
    if (gate === 'anon') { window.location.replace('/login'); return }
    if (gate !== 'granted') return
    const timer = window.setTimeout(() => { void load() }, 250)
    return () => window.clearTimeout(timer)
  }, [gate, load])

  if (gate !== 'granted') {
    return <div className="flex min-h-screen items-center justify-center text-sm text-muted-foreground">Verificando acesso…</div>
  }

  return (
    <PlatformShell
      adminName={adminName ?? ''}
      title="Clientes"
      description="Responsáveis pelas barbearias cadastradas na plataforma."
      loading={loading}
      onRefresh={() => void load()}
      onSignOut={() => void signOut()}
      globalSearch={search}
      onGlobalSearchChange={setSearch}
      onGlobalSearchSubmit={() => void load()}
      showPeriod={false}
      showNewMessage={false}
    >
      <div className="mx-auto max-w-[1600px] space-y-5">
        {error ? (
          <div className="rounded-xl border border-destructive/40 bg-destructive/10 p-3 text-sm text-destructive">{error}</div>
        ) : null}

        <Card className="overflow-hidden rounded-2xl border-border/70 shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-muted/50 text-left text-xs uppercase text-muted-foreground">
                <tr>
                  <th className="px-4 py-3">Responsável</th>
                  <th className="px-4 py-3">Barbearia</th>
                  <th className="px-4 py-3">Contato</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3 text-right">Ações</th>
                </tr>
              </thead>
              <tbody>
                {rows.length === 0 && !loading ? (
                  <tr><td colSpan={5} className="px-4 py-10 text-center text-muted-foreground">Nenhum responsável encontrado.</td></tr>
                ) : null}
                {rows.map((row) => (
                  <tr key={row.id} className="border-t border-border/70 transition-colors hover:bg-muted/30">
                    <td className="px-4 py-3">
                      <p className="font-medium">{row.owner?.name ?? 'Responsável não informado'}</p>
                      <p className="text-xs text-muted-foreground">{row.owner?.email ?? 'Sem e-mail cadastrado'}</p>
                    </td>
                    <td className="px-4 py-3">
                      <Link href={`/plataforma/contas/${row.id}`} className="font-medium hover:underline">{row.name}</Link>
                      <p className="text-xs text-muted-foreground">/{row.slug}</p>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1">
                        {row.owner?.email ? (
                          <a className={buttonVariants({ variant: 'ghost', size: 'icon' })} href={`mailto:${row.owner.email}`} aria-label={`Enviar e-mail para ${row.owner.name}`}>
                            <Mail className="size-4" />
                          </a>
                        ) : null}
                        <Link className={buttonVariants({ variant: 'ghost', size: 'icon' })} href={`/plataforma/mensagens?barbershopId=${row.id}`} aria-label={`Criar mensagem para ${row.name}`}>
                          <MessageSquarePlus className="size-4" />
                        </Link>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className="rounded-full bg-muted px-2 py-1 text-xs font-medium">{statusLabel[row.billing_status] ?? row.billing_status}</span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <Link className={buttonVariants({ variant: 'outline', size: 'sm', className: 'rounded-xl' })} href={`/plataforma/contas/${row.id}`}>Gerenciar</Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      </div>
    </PlatformShell>
  )
}
