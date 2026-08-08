'use client'

import * as React from 'react'
import { MessageCircle, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { formatPhone, isValidPhone, onlyPhoneDigits } from '@/lib/phone'
import { ownerPhoneReminderStorageKey, shouldShowOwnerPhoneReminder } from '@/lib/owner-phone-reminder'

type OwnerPhoneReminderProps = {
  memberId: string
  phone: string
  updateMemberPhone: (phone: string) => Promise<{ error?: string }>
}

export function OwnerPhoneReminder({ memberId, phone, updateMemberPhone }: OwnerPhoneReminderProps) {
  const [dismissed, setDismissed] = React.useState(true)
  const [draft, setDraft] = React.useState(() => formatPhone(phone))
  const [saving, setSaving] = React.useState(false)
  const [message, setMessage] = React.useState('')

  React.useEffect(() => {
    setDismissed(window.localStorage.getItem(ownerPhoneReminderStorageKey(memberId)) === 'true')
  }, [memberId])

  React.useEffect(() => {
    setDraft(formatPhone(phone))
  }, [phone])

  if (!shouldShowOwnerPhoneReminder(phone, dismissed)) return null

  function dismiss() {
    window.localStorage.setItem(ownerPhoneReminderStorageKey(memberId), 'true')
    setDismissed(true)
  }

  async function savePhone() {
    if (!isValidPhone(draft)) {
      setMessage('Informe um WhatsApp com DDD, como (24) 99836-9828.')
      return
    }

    setSaving(true)
    setMessage('')
    const result = await updateMemberPhone(onlyPhoneDigits(draft))
    setSaving(false)

    if (result.error) {
      setMessage(result.error)
      return
    }
    setMessage('WhatsApp cadastrado.')
  }

  return (
    <Card className="mb-5 border-gold/40 bg-gold/10 p-4">
      <div className="flex gap-3">
        <div className="mt-1 flex size-10 shrink-0 items-center justify-center rounded-full bg-gold text-primary">
          <MessageCircle className="size-5" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h2 className="text-base font-semibold text-foreground">Cadastre seu WhatsApp</h2>
              <p className="mt-1 text-sm leading-6 text-muted-foreground">
                Assim conseguimos te ajudar na configuração da plataforma se você precisar.
              </p>
            </div>
            <Button type="button" variant="ghost" size="icon-sm" onClick={dismiss} aria-label="Fechar aviso de WhatsApp">
              <X className="size-4" />
            </Button>
          </div>
          <div className="mt-4 grid gap-3 sm:grid-cols-[1fr_auto] sm:items-end">
            <div>
              <Label htmlFor="owner-phone-reminder">Telefone / WhatsApp</Label>
              <Input
                id="owner-phone-reminder"
                className="mt-2 bg-background"
                inputMode="tel"
                autoComplete="tel"
                placeholder="(00) 00000-0000"
                value={draft}
                onChange={(event) => {
                  setDraft(formatPhone(event.target.value))
                  setMessage('')
                }}
              />
            </div>
            <Button type="button" variant="gold" onClick={savePhone} disabled={saving}>
              {saving ? 'Salvando...' : 'Salvar WhatsApp'}
            </Button>
          </div>
          {message ? <p className="mt-2 text-sm text-muted-foreground">{message}</p> : null}
        </div>
      </div>
    </Card>
  )
}
