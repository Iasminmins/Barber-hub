'use client'

import { useState } from 'react'
import { Trash2, CalendarPlus, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import type { TenantRow } from './types'

const PLANS = ['solo', 'starter', 'pro', 'premium'] as const
const STATUSES = ['trialing', 'active', 'past_due', 'canceled'] as const

const selectClass =
  'h-8 rounded-md border border-border bg-background px-2 text-xs outline-none focus:ring-2 focus:ring-ring disabled:opacity-50'

type Props = {
  tenant: TenantRow
  token: string
  onChanged: () => void
  onError: (message: string) => void
}

export function TenantActions({ tenant, token, onChanged, onError }: Props) {
  const [busy, setBusy] = useState(false)
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [confirmText, setConfirmText] = useState('')
  const [alsoDeleteUsers, setAlsoDeleteUsers] = useState(false)

  async function patch(body: Record<string, unknown>) {
    setBusy(true)
    try {
      const response = await fetch(`/api/admin/tenants/${tenant.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(body),
      })
      const data = await response.json()
      if (!response.ok) throw new Error(data.error ?? 'Falha ao atualizar.')
      onChanged()
    } catch (error) {
      onError(error instanceof Error ? error.message : 'Falha ao atualizar.')
    } finally {
      setBusy(false)
    }
  }

  async function removeTenant() {
    setBusy(true)
    try {
      const params = new URLSearchParams({
        confirm: confirmText.trim(),
        deleteUsers: String(alsoDeleteUsers),
      })
      const response = await fetch(`/api/admin/tenants/${tenant.id}?${params}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      })
      const data = await response.json()
      if (!response.ok) throw new Error(data.error ?? 'Falha ao remover.')
      setConfirmOpen(false)
      setConfirmText('')
      setAlsoDeleteUsers(false)
      onChanged()
    } catch (error) {
      onError(error instanceof Error ? error.message : 'Falha ao remover.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="flex flex-wrap items-center justify-end gap-1.5">
      <select
        className={selectClass}
        value={tenant.plan}
        disabled={busy}
        onChange={(event) => patch({ plan: event.target.value })}
      >
        {PLANS.map((plan) => (
          <option key={plan} value={plan}>{plan}</option>
        ))}
      </select>

      <select
        className={selectClass}
        value={tenant.billing_status}
        disabled={busy}
        onChange={(event) => patch({ billing_status: event.target.value })}
      >
        {STATUSES.map((status) => (
          <option key={status} value={status}>{status}</option>
        ))}
      </select>

      <Button
        variant="outline"
        size="sm"
        disabled={busy}
        title="Estender teste por mais 7 dias"
        onClick={() => patch({ trialDays: 7 })}
      >
        {busy ? <Loader2 className="size-3.5 animate-spin" /> : <CalendarPlus className="size-3.5" />}
        <span className="ml-1 text-xs">+7d</span>
      </Button>

      <Button variant="outline" size="sm" disabled={busy} onClick={() => setConfirmOpen(true)}>
        <Trash2 className="size-3.5 text-destructive" />
      </Button>

      {confirmOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md rounded-xl border border-border bg-card p-5 shadow-lg">
            <h3 className="font-semibold text-destructive">Remover “{tenant.name}”</h3>
            <p className="mt-2 text-sm text-muted-foreground">
              Esta ação apaga <strong>todos</strong> os dados da conta (agendamentos, clientes,
              financeiro) e não pode ser desfeita.
            </p>
            <p className="mt-3 text-xs text-muted-foreground">
              Para confirmar, digite o slug: <code className="font-mono text-foreground">{tenant.slug}</code>
            </p>
            <Input
              className="mt-2"
              value={confirmText}
              placeholder={tenant.slug}
              onChange={(event) => setConfirmText(event.target.value)}
            />
            <label className="mt-3 flex items-center gap-2 text-xs text-muted-foreground">
              <input
                type="checkbox"
                checked={alsoDeleteUsers}
                onChange={(event) => setAlsoDeleteUsers(event.target.checked)}
              />
              Também excluir os logins que ficarem sem nenhuma barbearia
            </label>

            <div className="mt-4 flex justify-end gap-2">
              <Button variant="outline" size="sm" disabled={busy} onClick={() => setConfirmOpen(false)}>
                Cancelar
              </Button>
              <Button
                size="sm"
                disabled={busy || confirmText.trim() !== tenant.slug}
                onClick={removeTenant}
              >
                {busy ? <Loader2 className="size-3.5 animate-spin" /> : null}
                Remover definitivamente
              </Button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  )
}
