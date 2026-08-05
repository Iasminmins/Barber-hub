'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import {
  Send, FileText, Inbox, MessageSquare, Loader2, Save, Calendar, Eye, X, Check,
  AlertTriangle, Mail, MessageCircle, Smartphone, Bell, MailOpen, Users, Ban,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Select } from '@/components/ui/select'
import { PlatformShell } from '@/components/platform/platform-shell'
import { usePlatformSession } from '../use-platform-session'
import type { MessageTemplate, PlatformMessage } from '../types'
import { formatDate } from '@/lib/format'
import { cn } from '@/lib/utils'

type Channel = 'whatsapp' | 'email' | 'sms' | 'in_app'
type Tab = 'compose' | 'templates' | 'history' | 'inbox'

type RecipientPreview = { count: number; estimatedCost: number | null; sample: { id: string; name: string; owner: string | null }[] }
type SendPreview = { recipientCount: number; channel: Channel; estimatedCost: number | null; message: string }
type InboxItem = {
  id: string; barbershop_id: string; channel: string; direction: string
  sender_name: string | null; sender_email: string | null; subject: string | null
  body: string; read_at: string | null; created_at: string
}

const CHANNELS = [
  { value: 'whatsapp', label: 'WhatsApp', icon: MessageCircle },
  { value: 'email', label: 'E-mail', icon: Mail },
  { value: 'sms', label: 'SMS', icon: Smartphone },
  { value: 'in_app', label: 'Notificação no app', icon: Bell },
] as const

const VARIABLES = ['nome_responsavel', 'nome_barbearia', 'plano', 'dias_restantes', 'data_vencimento', 'link_pagamento']

const STATUS_LABEL: Record<string, string> = {
  draft: 'Rascunho', scheduled: 'Agendada', queued: 'Na fila', sent: 'Enviada',
  delivered: 'Entregue', read: 'Lida', replied: 'Respondida', failed: 'Com erro', cancelled: 'Cancelada',
}
const STATUS_STYLE: Record<string, string> = {
  draft: 'bg-muted text-muted-foreground', scheduled: 'bg-amber-100 text-amber-800',
  queued: 'bg-sky-100 text-sky-800', sent: 'bg-emerald-100 text-emerald-800',
  delivered: 'bg-emerald-100 text-emerald-800', read: 'bg-emerald-100 text-emerald-800',
  replied: 'bg-emerald-100 text-emerald-800', failed: 'bg-red-100 text-red-800',
  cancelled: 'bg-muted text-muted-foreground line-through',
}

function money(v: number | null) {
  return v === null ? '—' : v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

export function MessagesClient() {
  const { gate, adminName, token, signOut } = usePlatformSession()
  const params = useSearchParams()

  const [tab, setTab] = useState<Tab>('compose')
  const [templates, setTemplates] = useState<MessageTemplate[]>([])
  const [history, setHistory] = useState<PlatformMessage[]>([])
  const [inbox, setInbox] = useState<InboxItem[]>([])
  const [loading, setLoading] = useState(false)
  const [feedback, setFeedback] = useState<{ type: 'ok' | 'error'; text: string } | null>(null)

  // compose state
  const [channel, setChannel] = useState<Channel>('whatsapp')
  const [subject, setSubject] = useState('')
  const [msgBody, setMsgBody] = useState('')
  const [scheduledAt, setScheduledAt] = useState('')
  const [templateId, setTemplateId] = useState<string | null>(null)
  const [filters, setFilters] = useState({ status: '', plan: '', city: '', trialExpiring: false, pastDue: false, inactive: false })
  const [recipients, setRecipients] = useState<RecipientPreview | null>(null)
  const [countingRecipients, setCountingRecipients] = useState(false)
  const [sendPreview, setSendPreview] = useState<SendPreview | null>(null)
  const [sending, setSending] = useState(false)
  const bodyRef = useRef<HTMLTextAreaElement | null>(null)

  useEffect(() => {
    const t = params.get('tab')
    if (t === 'inbox' || t === 'history' || t === 'templates' || t === 'compose') setTab(t)
  }, [params])

  const authHeaders = useMemo(() => ({ Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' }), [token])

  const loadTemplates = useCallback(async () => {
    const res = await fetch('/api/admin/messages/templates', { headers: authHeaders })
    const data = await res.json()
    if (res.ok) setTemplates(data.items ?? [])
  }, [authHeaders])

  const loadHistory = useCallback(async () => {
    setLoading(true)
    const res = await fetch('/api/admin/messages?limit=100', { headers: authHeaders })
    const data = await res.json()
    if (res.ok) setHistory(data.items ?? [])
    setLoading(false)
  }, [authHeaders])

  const loadInbox = useCallback(async () => {
    setLoading(true)
    const res = await fetch('/api/admin/messages/inbox', { headers: authHeaders })
    const data = await res.json()
    if (res.ok) setInbox(data.items ?? [])
    setLoading(false)
  }, [authHeaders])

  useEffect(() => {
    if (gate === 'anon') { window.location.replace('/login'); return }
    if (gate !== 'granted') return
    void loadTemplates()
  }, [gate, loadTemplates])

  useEffect(() => {
    if (gate !== 'granted') return
    if (tab === 'history') void loadHistory()
    if (tab === 'inbox') void loadInbox()
  }, [gate, tab, loadHistory, loadInbox])

  // live recipient count (debounced) when composing
  useEffect(() => {
    if (gate !== 'granted' || tab !== 'compose') return
    setCountingRecipients(true)
    const timer = window.setTimeout(async () => {
      try {
        const res = await fetch('/api/admin/messages/recipients', {
          method: 'POST', headers: authHeaders,
          body: JSON.stringify({ ...filters, channel }),
        })
        const data = await res.json()
        if (res.ok) setRecipients(data)
      } finally {
        setCountingRecipients(false)
      }
    }, 400)
    return () => window.clearTimeout(timer)
  }, [gate, tab, filters, channel, authHeaders])

  function insertVariable(v: string) {
    const el = bodyRef.current
    const snippet = `{{${v}}}`
    if (!el) { setMsgBody((b) => b + snippet); return }
    const start = el.selectionStart ?? msgBody.length
    const end = el.selectionEnd ?? msgBody.length
    setMsgBody(msgBody.slice(0, start) + snippet + msgBody.slice(end))
    requestAnimationFrame(() => { el.focus(); el.selectionStart = el.selectionEnd = start + snippet.length })
  }

  function applyTemplate(t: MessageTemplate) {
    setChannel(t.channel)
    setSubject(t.subject ?? '')
    setMsgBody(t.body)
    setTemplateId(t.id)
    setTab('compose')
    setFeedback({ type: 'ok', text: `Modelo "${t.name}" carregado no editor.` })
  }

  async function submit(saveAsDraft: boolean, confirmed = false) {
    setSending(true)
    setFeedback(null)
    try {
      const res = await fetch('/api/admin/messages', {
        method: 'POST', headers: authHeaders,
        body: JSON.stringify({
          channel, subject: channel === 'email' ? subject : null, body: msgBody,
          filter: filters, scheduledAt: scheduledAt || null, saveAsDraft, templateId, confirmed,
        }),
      })
      const data = await res.json()
      if (!res.ok) { setFeedback({ type: 'error', text: data.error ?? 'Falha ao processar.' }); return }
      if (data.preview) { setSendPreview(data); return }
      setSendPreview(null)
      setFeedback({ type: 'ok', text: saveAsDraft ? 'Rascunho salvo.' : `Mensagem registrada (${STATUS_LABEL[data.status] ?? data.status}) para ${data.recipientCount} destinatário(s).` })
      if (!saveAsDraft) { setMsgBody(''); setSubject(''); setScheduledAt(''); setTemplateId(null) }
    } finally {
      setSending(false)
    }
  }

  async function cancelMessage(id: string) {
    const res = await fetch(`/api/admin/messages/${id}`, { method: 'PATCH', headers: authHeaders, body: JSON.stringify({ cancel: true }) })
    if (res.ok) setHistory((list) => list.map((m) => (m.id === id ? { ...m, status: 'cancelled' } : m)))
  }

  async function toggleRead(item: InboxItem) {
    const read = !item.read_at
    const res = await fetch('/api/admin/messages/inbox', { method: 'PATCH', headers: authHeaders, body: JSON.stringify({ id: item.id, read }) })
    if (res.ok) setInbox((list) => list.map((m) => (m.id === item.id ? { ...m, read_at: read ? new Date().toISOString() : null } : m)))
  }

  const unreadCount = useMemo(() => inbox.filter((m) => m.direction === 'inbound' && !m.read_at).length, [inbox])

  if (gate !== 'granted') {
    return <div className="flex min-h-screen items-center justify-center text-sm text-muted-foreground">Verificando acesso…</div>
  }

  const tabs = [
    { key: 'compose' as const, label: 'Enviar', icon: Send },
    { key: 'templates' as const, label: 'Modelos', icon: FileText },
    { key: 'history' as const, label: 'Histórico', icon: MessageSquare },
    { key: 'inbox' as const, label: 'Caixa de entrada', icon: Inbox, badge: unreadCount },
  ]

  return (
    <PlatformShell
      adminName={adminName ?? ''}
      title="Central de mensagens"
      description="Envie mensagens individuais ou em massa, gerencie modelos e responda clientes."
      onSignOut={() => void signOut()}
      showGlobalSearch={false}
      showPeriod={false}
      showNewMessage={false}
      unreadMessages={unreadCount}
    >
      <div className="mx-auto max-w-5xl space-y-5">
        <div className="flex flex-wrap gap-1 rounded-xl border border-border/70 bg-card p-1">
          {tabs.map((t) => (
            <button
              key={t.key}
              type="button"
              onClick={() => setTab(t.key)}
              className={cn(
                'flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                tab === t.key ? 'bg-primary text-primary-foreground shadow-sm' : 'text-muted-foreground hover:bg-muted',
              )}
            >
              <t.icon className="size-4" />
              {t.label}
              {t.badge && t.badge > 0 ? (
                <span className="rounded-full bg-gold px-1.5 py-0.5 text-[10px] font-bold text-gold-foreground">{t.badge}</span>
              ) : null}
            </button>
          ))}
        </div>

        {feedback ? (
          <div className={cn(
            'flex items-center gap-2 rounded-xl border p-3 text-sm',
            feedback.type === 'ok' ? 'border-emerald-300 bg-emerald-50 text-emerald-800' : 'border-destructive/40 bg-destructive/10 text-destructive',
          )}>
            {feedback.type === 'ok' ? <Check className="size-4" /> : <AlertTriangle className="size-4" />}
            {feedback.text}
          </div>
        ) : null}

        {tab === 'compose' ? (
          <div className="grid gap-5 lg:grid-cols-[1fr_320px]">
            <Card className="space-y-4 rounded-2xl border-border/70 p-5 shadow-sm">
              <div>
                <label className="mb-2 block text-sm font-medium">Canal</label>
                <div className="flex flex-wrap gap-2">
                  {CHANNELS.map((c) => (
                    <button
                      key={c.value}
                      type="button"
                      onClick={() => setChannel(c.value)}
                      className={cn(
                        'flex items-center gap-2 rounded-xl border px-3 py-2 text-sm transition-colors',
                        channel === c.value ? 'border-primary bg-primary/10 text-primary' : 'border-border/70 hover:bg-muted',
                      )}
                    >
                      <c.icon className="size-4" />
                      {c.label}
                    </button>
                  ))}
                </div>
                {(channel === 'whatsapp' || channel === 'sms' || channel === 'in_app') ? (
                  <p className="mt-2 text-xs text-amber-700">Provedor de {CHANNELS.find((c) => c.value === channel)?.label} ainda não configurado — a mensagem será registrada e ficará pronta para envio quando o provedor for ligado.</p>
                ) : null}
              </div>

              {channel === 'email' ? (
                <div>
                  <label className="mb-2 block text-sm font-medium">Assunto</label>
                  <Input value={subject} onChange={(e) => setSubject(e.target.value)} placeholder="Assunto do e-mail" />
                </div>
              ) : null}

              <div>
                <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
                  <label className="text-sm font-medium">Mensagem</label>
                  <div className="flex flex-wrap gap-1">
                    {VARIABLES.map((v) => (
                      <button key={v} type="button" onClick={() => insertVariable(v)}
                        className="rounded-md bg-muted px-2 py-0.5 text-[11px] font-medium text-muted-foreground hover:bg-primary/10 hover:text-primary">
                        {`{{${v}}}`}
                      </button>
                    ))}
                  </div>
                </div>
                <Textarea ref={bodyRef} value={msgBody} onChange={(e) => setMsgBody(e.target.value)} rows={9}
                  placeholder="Escreva a mensagem. Use as variáveis acima para personalizar." className="resize-y" />
                <p className="mt-1 text-xs text-muted-foreground">{msgBody.length} caractere(s)</p>
              </div>
            </Card>

            <div className="space-y-5">
              <Card className="space-y-3 rounded-2xl border-border/70 p-5 shadow-sm">
                <p className="flex items-center gap-2 text-sm font-semibold"><Users className="size-4" /> Destinatários</p>
                <Select value={filters.status} onChange={(e) => setFilters((f) => ({ ...f, status: e.target.value }))} className="text-sm">
                  <option value="">Todos os status</option>
                  <option value="trialing">Em teste</option>
                  <option value="active">Ativas</option>
                  <option value="past_due">Em atraso</option>
                  <option value="canceled">Canceladas</option>
                </Select>
                <Select value={filters.plan} onChange={(e) => setFilters((f) => ({ ...f, plan: e.target.value }))} className="text-sm">
                  <option value="">Todos os planos</option>
                  <option value="starter">Starter</option>
                  <option value="pro">Pro</option>
                  <option value="premium">Premium</option>
                </Select>
                <Input value={filters.city} onChange={(e) => setFilters((f) => ({ ...f, city: e.target.value }))} placeholder="Cidade (opcional)" className="text-sm" />
                <div className="space-y-2 pt-1">
                  {([['trialExpiring', 'Teste vencendo (7 dias)'], ['pastDue', 'Inadimplentes'], ['inactive', 'Inativos (30+ dias)']] as const).map(([key, label]) => (
                    <label key={key} className="flex items-center gap-2 text-sm">
                      <input type="checkbox" checked={filters[key]} onChange={(e) => setFilters((f) => ({ ...f, [key]: e.target.checked }))} className="size-4 rounded border-border" />
                      {label}
                    </label>
                  ))}
                </div>
              </Card>

              <Card className="space-y-3 rounded-2xl border-border/70 p-5 shadow-sm">
                <div className="flex items-baseline justify-between">
                  <span className="text-sm text-muted-foreground">Alcançará</span>
                  <span className="text-2xl font-bold tabular-nums">
                    {countingRecipients ? <Loader2 className="size-5 animate-spin" /> : (recipients?.count ?? 0)}
                  </span>
                </div>
                {recipients?.estimatedCost != null ? (
                  <p className="text-xs text-muted-foreground">Custo estimado: <strong>{money(recipients.estimatedCost)}</strong></p>
                ) : null}
                {recipients?.sample?.length ? (
                  <p className="text-xs text-muted-foreground">Ex.: {recipients.sample.map((s) => s.name).join(', ')}{recipients.count > recipients.sample.length ? '…' : ''}</p>
                ) : null}

                <div>
                  <label className="mb-1 flex items-center gap-1.5 text-xs font-medium text-muted-foreground"><Calendar className="size-3.5" /> Agendar (opcional)</label>
                  <Input type="datetime-local" value={scheduledAt} onChange={(e) => setScheduledAt(e.target.value)} className="text-sm" />
                </div>

                <Button className="w-full rounded-xl" disabled={sending || msgBody.trim().length < 3} onClick={() => void submit(false, false)}>
                  {sending ? <Loader2 className="size-4 animate-spin" /> : <Eye className="size-4" />}
                  <span className="ml-2">Pré-visualizar e enviar</span>
                </Button>
                <Button variant="outline" className="w-full rounded-xl" disabled={sending || msgBody.trim().length < 3} onClick={() => void submit(true)}>
                  <Save className="size-4" /><span className="ml-2">Salvar rascunho</span>
                </Button>
              </Card>
            </div>
          </div>
        ) : null}

        {tab === 'templates' ? (
          <div className="grid gap-4 sm:grid-cols-2">
            {templates.length === 0 ? (
              <Card className="col-span-full rounded-2xl border-border/70 p-10 text-center text-sm text-muted-foreground shadow-sm">
                Nenhum modelo cadastrado ainda.
              </Card>
            ) : templates.map((t) => (
              <Card key={t.id} className="flex flex-col gap-3 rounded-2xl border-border/70 p-5 shadow-sm">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="font-semibold">{t.name}</p>
                    <p className="text-xs uppercase tracking-wide text-muted-foreground">{CHANNELS.find((c) => c.value === t.channel)?.label ?? t.channel}</p>
                  </div>
                  <FileText className="size-4 text-muted-foreground" />
                </div>
                {t.subject ? <p className="text-sm font-medium">{t.subject}</p> : null}
                <p className="line-clamp-4 whitespace-pre-wrap text-sm text-muted-foreground">{t.body}</p>
                <Button variant="outline" size="sm" className="mt-auto w-fit rounded-xl" onClick={() => applyTemplate(t)}>
                  Usar modelo
                </Button>
              </Card>
            ))}
          </div>
        ) : null}

        {tab === 'history' ? (
          <Card className="overflow-hidden rounded-2xl border-border/70 shadow-sm">
            {loading ? (
              <div className="p-10 text-center text-sm text-muted-foreground"><Loader2 className="mx-auto size-5 animate-spin" /></div>
            ) : history.length === 0 ? (
              <div className="p-10 text-center text-sm text-muted-foreground">Nenhuma mensagem registrada ainda.</div>
            ) : (
              <div className="divide-y divide-border/60">
                {history.map((m) => (
                  <div key={m.id} className="flex flex-wrap items-center gap-3 px-5 py-4">
                    <span className={cn('rounded-full px-2 py-0.5 text-xs font-medium', STATUS_STYLE[m.status] ?? 'bg-muted')}>{STATUS_LABEL[m.status] ?? m.status}</span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm">{m.subject || m.body.slice(0, 80)}</p>
                      <p className="text-xs text-muted-foreground">
                        {CHANNELS.find((c) => c.value === m.channel)?.label ?? m.channel} · {m.recipient_count} destinatário(s)
                        {m.scheduled_at ? ` · agendada p/ ${formatDate(m.scheduled_at)}` : ''} · {formatDate(m.created_at)}
                      </p>
                    </div>
                    {['draft', 'scheduled', 'queued'].includes(m.status) ? (
                      <Button variant="ghost" size="sm" className="text-destructive" onClick={() => void cancelMessage(m.id)}>
                        <Ban className="size-4" /><span className="ml-1">Cancelar</span>
                      </Button>
                    ) : null}
                  </div>
                ))}
              </div>
            )}
          </Card>
        ) : null}

        {tab === 'inbox' ? (
          <Card className="overflow-hidden rounded-2xl border-border/70 shadow-sm">
            {loading ? (
              <div className="p-10 text-center text-sm text-muted-foreground"><Loader2 className="mx-auto size-5 animate-spin" /></div>
            ) : inbox.length === 0 ? (
              <div className="p-10 text-center text-sm text-muted-foreground">Nenhuma mensagem recebida. Respostas dos clientes aparecerão aqui quando os canais estiverem integrados.</div>
            ) : (
              <div className="divide-y divide-border/60">
                {inbox.map((m) => (
                  <div key={m.id} className={cn('flex items-start gap-3 px-5 py-4', !m.read_at && m.direction === 'inbound' && 'bg-gold/5')}>
                    <div className="mt-0.5">{m.read_at ? <MailOpen className="size-4 text-muted-foreground" /> : <Mail className="size-4 text-gold" />}</div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <p className="truncate text-sm font-medium">{m.sender_name || m.sender_email || 'Cliente'}</p>
                        <span className="text-[11px] uppercase text-muted-foreground">{m.direction === 'inbound' ? 'Recebida' : 'Enviada'} · {m.channel}</span>
                      </div>
                      {m.subject ? <p className="text-sm font-medium">{m.subject}</p> : null}
                      <p className="whitespace-pre-wrap text-sm text-muted-foreground">{m.body}</p>
                      <p className="mt-1 text-xs text-muted-foreground">{formatDate(m.created_at)}</p>
                    </div>
                    {m.direction === 'inbound' ? (
                      <Button variant="ghost" size="sm" onClick={() => void toggleRead(m)}>
                        {m.read_at ? 'Marcar não lida' : 'Marcar lida'}
                      </Button>
                    ) : null}
                  </div>
                ))}
              </div>
            )}
          </Card>
        ) : null}
      </div>

      {sendPreview ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-foreground/50 backdrop-blur-sm" onClick={() => setSendPreview(null)} aria-hidden="true" />
          <Card className="relative w-full max-w-lg space-y-4 rounded-2xl border-border/70 p-6 shadow-xl">
            <div className="flex items-center justify-between">
              <h2 className="flex items-center gap-2 text-lg font-semibold"><AlertTriangle className="size-5 text-gold" /> Confirmar envio</h2>
              <button type="button" onClick={() => setSendPreview(null)} className="text-muted-foreground hover:text-foreground"><X className="size-5" /></button>
            </div>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div className="rounded-xl bg-muted/50 p-3"><p className="text-xs text-muted-foreground">Destinatários</p><p className="text-xl font-bold">{sendPreview.recipientCount}</p></div>
              <div className="rounded-xl bg-muted/50 p-3"><p className="text-xs text-muted-foreground">Canal</p><p className="text-xl font-bold">{CHANNELS.find((c) => c.value === sendPreview.channel)?.label}</p></div>
            </div>
            {sendPreview.estimatedCost != null ? <p className="text-sm">Custo estimado: <strong>{money(sendPreview.estimatedCost)}</strong></p> : null}
            <div>
              <p className="mb-1 text-xs font-medium text-muted-foreground">Prévia da mensagem</p>
              <div className="max-h-48 overflow-y-auto whitespace-pre-wrap rounded-xl border border-border/70 bg-background p-3 text-sm">{sendPreview.message}</div>
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" className="rounded-xl" onClick={() => setSendPreview(null)}>Voltar</Button>
              <Button className="rounded-xl" disabled={sending} onClick={() => void submit(false, true)}>
                {sending ? <Loader2 className="size-4 animate-spin" /> : <Send className="size-4" />}
                <span className="ml-2">{scheduledAt ? 'Agendar' : 'Confirmar e enviar'}</span>
              </Button>
            </div>
          </Card>
        </div>
      ) : null}
    </PlatformShell>
  )
}
