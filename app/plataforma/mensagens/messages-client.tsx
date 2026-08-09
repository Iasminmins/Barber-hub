'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import {
  Send, FileText, Inbox, MessageSquare, Loader2, Save, Calendar, Eye, X, Check,
  AlertTriangle, Mail, MessageCircle, Smartphone, Bell, MailOpen, Users, Ban,
  Phone, Pencil, ExternalLink, Search, Info, PlugZap,
} from 'lucide-react'
import { Button, buttonVariants } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Select } from '@/components/ui/select'
import { PlatformShell } from '@/components/platform/platform-shell'
import { EmptyState } from '@/components/platform/empty-state'
import { FeedbackBanner } from '@/components/platform/feedback-banner'
import { StatusBadge, billingLabel, billingTone } from '@/components/platform/status-badge'
import { PlanPill } from '@/components/platform/plan-pill'
import { usePlatformSession } from '../use-platform-session'
import type { MessageTemplate, PlatformMessage, MessageContact } from '../types'
import { formatDate } from '@/lib/format'
import { cn } from '@/lib/utils'
import { buildRecipientContext, personalizeMessage } from '@/lib/platform-messaging'
import { situationalWhatsAppMessage, QUICK_TEMPLATES } from '@/lib/platform-whatsapp-templates'
import { whatsappUrl } from '@/lib/whatsapp'

type Channel = 'whatsapp' | 'email' | 'sms' | 'in_app'
type Tab = 'contacts' | 'history' | 'bulk' | 'templates' | 'inbox'

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

/** Só entram no histórico os envios que realmente saíram — filas de provedores stub poluem a lista. */
const HISTORY_STATUSES = ['sent', 'delivered', 'read', 'replied']

const STATUS_LABEL: Record<string, string> = {
  draft: 'Rascunho', scheduled: 'Agendada', queued: 'Na fila', sent: 'Enviada',
  delivered: 'Entregue', read: 'Lida', replied: 'Respondida', failed: 'Com erro', cancelled: 'Cancelada',
}
const HISTORY_TONE: Record<string, 'success' | 'warning' | 'neutral'> = {
  sent: 'success', delivered: 'success', read: 'success', replied: 'warning',
}

const STATUS_FILTERS: { key: string; label: string }[] = [
  { key: '', label: 'Todos' },
  { key: 'active', label: 'Ativos' },
  { key: 'trialing', label: 'Em teste' },
  { key: 'past_due', label: 'Em atraso' },
  { key: 'canceled', label: 'Cancelados' },
]

const PLAN_FILTERS: { key: string; label: string }[] = [
  { key: '', label: 'Todos os planos' },
  { key: 'starter', label: 'Starter' },
  { key: 'pro', label: 'Pro' },
  { key: 'premium', label: 'Premium' },
]

function money(v: number | null) {
  return v === null ? '—' : v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

function FilterChip({ active, label, onClick }: { active: boolean; label: string; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'shrink-0 rounded-full border px-3 py-1.5 text-[13px] transition-colors duration-150',
        active ? 'border-primary/30 bg-primary/[0.08] text-primary' : 'border-border/60 text-muted-foreground hover:bg-muted/40',
      )}
    >
      {label}
    </button>
  )
}

export function MessagesClient() {
  const { gate, adminName, signOut } = usePlatformSession()
  const params = useSearchParams()

  const [tab, setTab] = useState<Tab>('contacts')
  const [templates, setTemplates] = useState<MessageTemplate[]>([])
  const [history, setHistory] = useState<PlatformMessage[]>([])
  const [inbox, setInbox] = useState<InboxItem[]>([])
  const [loading, setLoading] = useState(false)
  const [feedback, setFeedback] = useState<{ type: 'ok' | 'error'; text: string } | null>(null)
  const [configuredChannels, setConfiguredChannels] = useState<string[]>([])

  // composição (compartilhada entre envio manual e disparo em massa)
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
  const [showBlockedForm, setShowBlockedForm] = useState(false)
  const bodyRef = useRef<HTMLTextAreaElement | null>(null)
  const bulkBodyRef = useRef<HTMLTextAreaElement | null>(null)

  // contatos (envio manual via WhatsApp)
  const [contacts, setContacts] = useState<MessageContact[]>([])
  const [loadingContacts, setLoadingContacts] = useState(false)
  const [contactSearch, setContactSearch] = useState('')
  const [selectedContacts, setSelectedContacts] = useState<Set<string>>(new Set())
  const [phoneEdit, setPhoneEdit] = useState<{ barbershopId: string; value: string } | null>(null)
  const [savingPhone, setSavingPhone] = useState(false)

  useEffect(() => {
    const t = params.get('tab')
    if (t === 'inbox' || t === 'history' || t === 'templates' || t === 'contacts') setTab(t)
    else if (t === 'compose' || t === 'bulk') setTab('bulk')
    else if (params.get('compose') === '1') setTab('contacts')
  }, [params])

  const authHeaders = useMemo(() => ({ 'Content-Type': 'application/json' }), [])

  const loadTemplates = useCallback(async () => {
    const res = await fetch('/api/admin/messages/templates', { headers: authHeaders })
    const data = await res.json()
    if (res.ok) setTemplates(data.items ?? [])
  }, [authHeaders])

  const loadIntegrations = useCallback(async () => {
    const res = await fetch('/api/admin/settings', { cache: 'no-store' })
    const data = await res.json()
    if (res.ok) {
      setConfiguredChannels(
        (data.integrations ?? [])
          .filter((i: { configured: boolean }) => i.configured)
          .map((i: { key: string }) => i.key),
      )
    }
  }, [])

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
    void loadIntegrations()
  }, [gate, loadTemplates, loadIntegrations])

  useEffect(() => {
    if (gate !== 'granted') return
    if (tab === 'history') void loadHistory()
    if (tab === 'inbox') void loadInbox()
  }, [gate, tab, loadHistory, loadInbox])

  // contagem de destinatários (debounce) no disparo em massa
  useEffect(() => {
    if (gate !== 'granted' || tab !== 'bulk') return
    setCountingRecipients(true)
    const timer = window.setTimeout(async () => {
      try {
        const barbershopIds = selectedContacts.size > 0 ? Array.from(selectedContacts) : undefined
        const res = await fetch('/api/admin/messages/recipients', {
          method: 'POST', headers: authHeaders,
          body: JSON.stringify({ ...filters, channel, barbershopIds }),
        })
        const data = await res.json()
        if (res.ok) setRecipients(data)
      } finally {
        setCountingRecipients(false)
      }
    }, 400)
    return () => window.clearTimeout(timer)
  }, [gate, tab, filters, channel, authHeaders, selectedContacts])

  // lista de contatos, respeitando os mesmos filtros
  useEffect(() => {
    if (gate !== 'granted' || tab !== 'contacts') return
    setLoadingContacts(true)
    const timer = window.setTimeout(async () => {
      try {
        const qs = new URLSearchParams()
        if (filters.status) qs.set('status', filters.status)
        if (filters.plan) qs.set('plan', filters.plan)
        if (filters.city) qs.set('city', filters.city)
        if (filters.trialExpiring) qs.set('trialExpiring', 'true')
        if (filters.pastDue) qs.set('pastDue', 'true')
        if (filters.inactive) qs.set('inactive', 'true')
        const res = await fetch(`/api/admin/messages/contacts?${qs}`, { headers: authHeaders })
        const data = await res.json()
        if (res.ok) setContacts(data.items ?? [])
      } finally {
        setLoadingContacts(false)
      }
    }, 400)
    return () => window.clearTimeout(timer)
  }, [gate, tab, filters, authHeaders])

  function insertVariable(v: string, target: 'contacts' | 'bulk') {
    const el = target === 'bulk' ? bulkBodyRef.current : bodyRef.current
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
    setTab(t.channel === 'whatsapp' ? 'contacts' : 'bulk')
    setFeedback({ type: 'ok', text: `Modelo "${t.name}" carregado no editor.` })
  }

  /** Mensagem personalizada do contato — usa o texto digitado ou o modelo situacional do status. */
  function buildWaLink(contact: MessageContact) {
    if (!contact.ownerPhone) return null
    const text = msgBody.trim()
      ? personalizeMessage(
          msgBody,
          buildRecipientContext(
            { name: contact.barbershopName, plan: contact.plan, trial_ends_at: contact.trialEndsAt, next_billing_date: contact.nextBillingDate, slug: contact.barbershopSlug },
            { name: contact.ownerName, email: contact.ownerEmail ?? '' },
          ),
        )
      : situationalWhatsAppMessage({
          ownerName: contact.ownerName,
          barbershopName: contact.barbershopName,
          plan: contact.plan,
          billingStatus: contact.billingStatus,
          trialEndsAt: contact.trialEndsAt,
          nextBillingDate: contact.nextBillingDate,
        })
    return whatsappUrl(contact.ownerPhone, text) || null
  }

  const visibleContacts = useMemo(() => {
    const q = contactSearch.trim().toLowerCase()
    if (!q) return contacts
    return contacts.filter((c) => (
      [c.ownerName, c.barbershopName, c.barbershopCity ?? '', c.ownerEmail ?? ''].join(' ').toLowerCase().includes(q)
    ))
  }, [contacts, contactSearch])

  const selectableContacts = useMemo(() => visibleContacts.filter((c) => c.ownerPhone), [visibleContacts])

  function toggleContact(id: string) {
    setSelectedContacts((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  function toggleAllContacts() {
    setSelectedContacts((prev) => (
      prev.size === selectableContacts.length ? new Set() : new Set(selectableContacts.map((c) => c.barbershopId))
    ))
  }

  /** Abre as conversas selecionadas em sequência — o navegador pode pedir permissão para pop-ups. */
  function openSelectedConversations() {
    const targets = selectableContacts.filter((c) => selectedContacts.has(c.barbershopId))
    if (targets.length === 0) return
    targets.forEach((contact, index) => {
      const link = buildWaLink(contact)
      if (!link) return
      window.setTimeout(() => window.open(link, '_blank', 'noopener,noreferrer'), index * 600)
    })
    setFeedback({
      type: 'ok',
      text: `Abrindo ${targets.length} conversa(s) no WhatsApp. Se nada aparecer, autorize pop-ups para este site.`,
    })
  }

  async function savePhone(contact: MessageContact) {
    if (!contact.ownerId || !phoneEdit) return
    setSavingPhone(true)
    try {
      const res = await fetch(`/api/admin/members/${contact.ownerId}`, {
        method: 'PATCH', headers: authHeaders, body: JSON.stringify({ phone: phoneEdit.value.trim() || null }),
      })
      const data = await res.json()
      if (!res.ok) { setFeedback({ type: 'error', text: data.error ?? 'Não foi possível salvar o telefone.' }); return }
      setContacts((list) => list.map((c) => (c.barbershopId === contact.barbershopId ? { ...c, ownerPhone: data.member.phone } : c)))
      setPhoneEdit(null)
    } finally {
      setSavingPhone(false)
    }
  }

  async function submit(saveAsDraft: boolean, confirmed = false) {
    setSending(true)
    setFeedback(null)
    try {
      const barbershopIds = selectedContacts.size > 0 ? Array.from(selectedContacts) : undefined
      const res = await fetch('/api/admin/messages', {
        method: 'POST', headers: authHeaders,
        body: JSON.stringify({
          channel, subject: channel === 'email' ? subject : null, body: msgBody,
          filter: filters, barbershopIds, scheduledAt: scheduledAt || null, saveAsDraft, templateId, confirmed,
        }),
      })
      const data = await res.json()
      if (!res.ok) { setFeedback({ type: 'error', text: data.error ?? 'Falha ao processar.' }); return }
      if (data.preview) { setSendPreview(data); return }
      setSendPreview(null)
      setFeedback({ type: 'ok', text: saveAsDraft ? 'Rascunho salvo.' : `Mensagem registrada (${STATUS_LABEL[data.status] ?? data.status}) para ${data.recipientCount} destinatário(s).` })
      if (!saveAsDraft) { setMsgBody(''); setSubject(''); setScheduledAt(''); setTemplateId(null); setSelectedContacts(new Set()) }
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

  /** Modelo rápido em uso: casa pelo texto, então editar a mensagem já desmarca o chip. */
  const activeQuickTemplate = useMemo(() => {
    if (!msgBody.trim()) return 'auto'
    return QUICK_TEMPLATES.find((t) => t.body === msgBody)?.id ?? 'custom'
  }, [msgBody])

  const unreadCount = useMemo(() => inbox.filter((m) => m.direction === 'inbound' && !m.read_at).length, [inbox])
  const sentHistory = useMemo(() => history.filter((m) => HISTORY_STATUSES.includes(m.status)), [history])
  const channelBlocked = channel === 'in_app' || !configuredChannels.includes(channel)
  const channelLabel = CHANNELS.find((c) => c.value === channel)?.label ?? channel

  if (gate !== 'granted') {
    return <div className="flex min-h-screen items-center justify-center text-sm text-muted-foreground">Verificando acesso…</div>
  }

  const tabs = [
    { key: 'contacts' as const, label: 'Contatos', icon: Phone },
    { key: 'history' as const, label: 'Histórico', icon: MessageSquare },
    { key: 'bulk' as const, label: 'Disparos em massa', icon: Send },
    { key: 'templates' as const, label: 'Modelos', icon: FileText },
    { key: 'inbox' as const, label: 'Caixa de entrada', icon: Inbox, badge: unreadCount },
  ]

  return (
    <PlatformShell
      adminName={adminName ?? ''}
      title="Central de mensagens"
      description="Contato manual pelo WhatsApp, modelos reutilizáveis e histórico de envios."
      onSignOut={() => void signOut()}
      showGlobalSearch={false}
      showPeriod={false}
      showNewMessage={false}
      unreadMessages={unreadCount}
    >
      <div className="mx-auto max-w-6xl space-y-5">
        <div className="-mx-1 flex gap-1 overflow-x-auto px-1 no-scrollbar">
          {tabs.map((t) => (
            <button
              key={t.key}
              type="button"
              onClick={() => setTab(t.key)}
              className={cn(
                'flex shrink-0 items-center gap-2 rounded-xl border px-3 py-2 text-[13px] transition-colors duration-150',
                tab === t.key
                  ? 'border-primary/30 bg-primary/[0.08] font-medium text-primary'
                  : 'border-border/60 text-muted-foreground hover:bg-muted/40',
              )}
            >
              <t.icon className="size-4" />
              {t.label}
              {t.badge && t.badge > 0 ? (
                <span className="rounded-full bg-gold px-1.5 py-0.5 text-[10px] font-medium text-gold-foreground">{t.badge}</span>
              ) : null}
            </button>
          ))}
        </div>

        {feedback ? <FeedbackBanner type={feedback.type} text={feedback.text} onDismiss={() => setFeedback(null)} /> : null}

        {/* ---------------------------------------------------------------- Contatos */}
        {tab === 'contacts' ? (
          <div className="space-y-4">
            <Card className="pf-card-lift rounded-xl border-border/60 p-4">
              <p className="text-[11px] uppercase tracking-wide text-muted-foreground">Modelo</p>
              <div className="mt-2 flex flex-wrap gap-1.5">
                <button
                  type="button"
                  onClick={() => setMsgBody('')}
                  title="Cada contato recebe o texto adequado ao status da conta"
                  className={cn(
                    'rounded-full border px-3 py-1.5 text-[13px] transition-colors duration-150',
                    activeQuickTemplate === 'auto'
                      ? 'border-primary/30 bg-primary/[0.08] text-primary'
                      : 'border-border/60 text-muted-foreground hover:bg-muted/40',
                  )}
                >
                  Automático por status
                </button>
                {QUICK_TEMPLATES.map((t) => (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => setMsgBody(activeQuickTemplate === t.id ? '' : t.body)}
                    className={cn(
                      'rounded-full border px-3 py-1.5 text-[13px] transition-colors duration-150',
                      activeQuickTemplate === t.id
                        ? 'border-primary/30 bg-primary/[0.08] text-primary'
                        : 'border-border/60 text-muted-foreground hover:bg-muted/40',
                    )}
                  >
                    {t.label}
                  </button>
                ))}
              </div>

              <div className="mb-2 mt-4 flex flex-wrap items-center justify-between gap-2">
                <label htmlFor="mensagem-manual" className="text-sm font-medium text-foreground">
                  Mensagem
                  {activeQuickTemplate === 'custom' ? (
                    <span className="ml-2 text-[11px] font-normal text-muted-foreground">texto personalizado</span>
                  ) : null}
                </label>
                <div className="flex flex-wrap gap-1">
                  {VARIABLES.map((v) => (
                    <button
                      key={v}
                      type="button"
                      onClick={() => insertVariable(v, 'contacts')}
                      className="rounded-md bg-muted/60 px-2 py-0.5 text-[11px] text-muted-foreground transition-colors duration-150 hover:bg-primary/10 hover:text-primary"
                    >
                      {`{{${v}}}`}
                    </button>
                  ))}
                </div>
              </div>
              <Textarea
                id="mensagem-manual"
                ref={bodyRef}
                value={msgBody}
                onChange={(e) => setMsgBody(e.target.value)}
                rows={4}
                placeholder="Escreva a mensagem que será aberta no WhatsApp. Use as variáveis acima para personalizar."
                className="resize-y"
              />
              <p className="mt-1.5 flex items-start gap-1.5 text-[11px] text-muted-foreground">
                <Info className="mt-px size-3.5 shrink-0" />
                Em branco, cada contato recebe automaticamente o texto adequado ao status da conta (teste, cobrança ou relacionamento).
              </p>
            </Card>

            <div className="flex flex-col gap-3">
              <div className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-1 no-scrollbar">
                {STATUS_FILTERS.map((f) => (
                  <FilterChip
                    key={f.key || 'all'}
                    label={f.label}
                    active={filters.status === f.key}
                    onClick={() => setFilters((prev) => ({ ...prev, status: f.key }))}
                  />
                ))}
              </div>
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                <div className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-1 no-scrollbar">
                  {PLAN_FILTERS.map((f) => (
                    <FilterChip
                      key={f.key || 'all-plans'}
                      label={f.label}
                      active={filters.plan === f.key}
                      onClick={() => setFilters((prev) => ({ ...prev, plan: f.key }))}
                    />
                  ))}
                </div>
                <div className="relative sm:ml-auto sm:w-64">
                  <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    className="h-9 rounded-xl pl-9 text-sm"
                    placeholder="Buscar por nome ou cidade"
                    value={contactSearch}
                    onChange={(e) => setContactSearch(e.target.value)}
                  />
                </div>
              </div>
            </div>

            {selectedContacts.size > 0 ? (
              <div className="flex flex-wrap items-center gap-3 rounded-xl border border-primary/25 bg-primary/[0.06] px-3.5 py-2.5">
                <span className="text-[13px] text-primary">{selectedContacts.size} contato(s) selecionado(s)</span>
                <button
                  type="button"
                  className="text-[11px] text-muted-foreground underline-offset-2 hover:underline"
                  onClick={() => setSelectedContacts(new Set())}
                >
                  Limpar seleção
                </button>
                <Button size="sm" className="ml-auto rounded-xl" onClick={openSelectedConversations}>
                  <ExternalLink className="size-4" />
                  <span className="ml-2">Abrir conversas</span>
                </Button>
              </div>
            ) : null}

            {loadingContacts && contacts.length === 0 ? (
              <Card className="rounded-xl border-border/60 p-4">
                <div className="space-y-3">
                  {[0, 1, 2, 3, 4].map((i) => <div key={i} className="pf-skeleton h-12 rounded-lg" />)}
                </div>
              </Card>
            ) : visibleContacts.length === 0 ? (
              <Card className="rounded-xl border-border/60 p-2">
                <EmptyState
                  icon={Phone}
                  title="Nenhum contato encontrado"
                  description="Ajuste os filtros ou a busca para ver os responsáveis cadastrados."
                  className="border-none"
                />
              </Card>
            ) : (
              <>
                {/* Desktop */}
                <Card className="hidden overflow-hidden rounded-xl border-border/60 p-0 lg:block">
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead className="border-b border-border/60 bg-muted/30 text-left">
                        <tr className="text-[11px] uppercase tracking-wide text-muted-foreground">
                          <th className="w-10 px-4 py-3 font-normal">
                            <input
                              type="checkbox"
                              className="size-4 rounded border-border"
                              aria-label="Selecionar todos"
                              checked={selectableContacts.length > 0 && selectedContacts.size === selectableContacts.length}
                              onChange={toggleAllContacts}
                            />
                          </th>
                          <th className="px-4 py-3 font-normal">Responsável</th>
                          <th className="px-4 py-3 font-normal">Telefone</th>
                          <th className="px-4 py-3 font-normal">Status</th>
                          <th className="px-4 py-3 text-right font-normal">Ação</th>
                        </tr>
                      </thead>
                      <tbody>
                        {visibleContacts.map((contact) => {
                          const waLink = buildWaLink(contact)
                          const editing = phoneEdit?.barbershopId === contact.barbershopId
                          return (
                            <tr
                              key={contact.barbershopId}
                              className="border-b border-border/60 align-middle transition-colors duration-150 last:border-b-0 hover:bg-muted/40"
                            >
                              <td className="px-4 py-3">
                                <input
                                  type="checkbox"
                                  className="size-4 rounded border-border disabled:opacity-40"
                                  disabled={!contact.ownerPhone}
                                  aria-label={`Selecionar ${contact.ownerName}`}
                                  checked={selectedContacts.has(contact.barbershopId)}
                                  onChange={() => toggleContact(contact.barbershopId)}
                                />
                              </td>
                              <td className="px-4 py-3">
                                <p className="font-medium text-foreground">{contact.ownerName}</p>
                                <p className="truncate text-[11px] text-muted-foreground">
                                  {contact.barbershopName}{contact.barbershopCity ? ` · ${contact.barbershopCity}` : ''}
                                </p>
                              </td>
                              <td className="px-4 py-3">
                                {editing ? (
                                  <div className="flex items-center gap-1.5">
                                    <Input
                                      autoFocus
                                      value={phoneEdit.value}
                                      onChange={(e) => setPhoneEdit({ barbershopId: contact.barbershopId, value: e.target.value })}
                                      placeholder="(11) 91234-5678"
                                      className="h-8 w-36 text-xs"
                                    />
                                    <Button size="icon-sm" className="rounded-lg" disabled={savingPhone} onClick={() => void savePhone(contact)}>
                                      {savingPhone ? <Loader2 className="size-3.5 animate-spin" /> : <Check className="size-3.5" />}
                                    </Button>
                                    <Button size="icon-sm" variant="ghost" onClick={() => setPhoneEdit(null)} aria-label="Cancelar">
                                      <X className="size-3.5" />
                                    </Button>
                                  </div>
                                ) : contact.ownerPhone ? (
                                  <button
                                    type="button"
                                    className="flex items-center gap-1.5 text-[13px] text-foreground transition-colors duration-150 hover:text-primary"
                                    onClick={() => contact.ownerId && setPhoneEdit({ barbershopId: contact.barbershopId, value: contact.ownerPhone ?? '' })}
                                    disabled={!contact.ownerId}
                                  >
                                    <MessageCircle className="size-3.5 text-emerald-600" />
                                    {contact.ownerPhone}
                                    {contact.ownerId ? <Pencil className="size-3 text-muted-foreground" /> : null}
                                  </button>
                                ) : contact.ownerId ? (
                                  <button
                                    type="button"
                                    className="flex items-center gap-1.5 text-[11px] text-primary underline-offset-2 hover:underline"
                                    onClick={() => setPhoneEdit({ barbershopId: contact.barbershopId, value: '' })}
                                  >
                                    <AlertTriangle className="size-3.5 text-amber-500" />
                                    Cadastrar telefone
                                  </button>
                                ) : (
                                  <span className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
                                    <AlertTriangle className="size-3.5 text-amber-500" />
                                    Sem responsável ativo
                                  </span>
                                )}
                              </td>
                              <td className="px-4 py-3">
                                <div className="flex flex-wrap items-center gap-1.5">
                                  <StatusBadge
                                    tone={billingTone[contact.billingStatus] ?? 'neutral'}
                                    label={billingLabel[contact.billingStatus] ?? contact.billingStatus}
                                  />
                                  <PlanPill plan={contact.plan} />
                                </div>
                              </td>
                              <td className="px-4 py-3 text-right">
                                {waLink ? (
                                  <a
                                    href={waLink}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="inline-flex items-center gap-1.5 rounded-xl border border-emerald-600/30 bg-emerald-600/[0.08] px-3 py-1.5 text-[13px] text-emerald-700 transition-colors duration-150 hover:bg-emerald-600/[0.14] dark:text-emerald-400"
                                  >
                                    <MessageCircle className="size-3.5" /> Enviar pelo WhatsApp
                                  </a>
                                ) : (
                                  <span className="text-[11px] text-muted-foreground">—</span>
                                )}
                              </td>
                            </tr>
                          )
                        })}
                      </tbody>
                    </table>
                  </div>
                </Card>

                {/* Mobile */}
                <div className="space-y-3 lg:hidden">
                  {visibleContacts.map((contact) => {
                    const waLink = buildWaLink(contact)
                    const editing = phoneEdit?.barbershopId === contact.barbershopId
                    return (
                      <Card key={contact.barbershopId} className="rounded-xl border-border/60 p-4">
                        <div className="flex items-start gap-3">
                          <input
                            type="checkbox"
                            className="mt-1 size-4 rounded border-border disabled:opacity-40"
                            disabled={!contact.ownerPhone}
                            aria-label={`Selecionar ${contact.ownerName}`}
                            checked={selectedContacts.has(contact.barbershopId)}
                            onChange={() => toggleContact(contact.barbershopId)}
                          />
                          <div className="min-w-0 flex-1">
                            <p className="truncate font-medium text-foreground">{contact.ownerName}</p>
                            <p className="truncate text-[11px] text-muted-foreground">
                              {contact.barbershopName}{contact.barbershopCity ? ` · ${contact.barbershopCity}` : ''}
                            </p>
                          </div>
                          <StatusBadge
                            tone={billingTone[contact.billingStatus] ?? 'neutral'}
                            label={billingLabel[contact.billingStatus] ?? contact.billingStatus}
                          />
                        </div>

                        <div className="mt-3 flex items-center gap-2">
                          {editing ? (
                            <>
                              <Input
                                autoFocus
                                value={phoneEdit.value}
                                onChange={(e) => setPhoneEdit({ barbershopId: contact.barbershopId, value: e.target.value })}
                                placeholder="(11) 91234-5678"
                                className="h-9 flex-1 text-xs"
                              />
                              <Button size="icon-sm" className="rounded-lg" disabled={savingPhone} onClick={() => void savePhone(contact)}>
                                {savingPhone ? <Loader2 className="size-3.5 animate-spin" /> : <Check className="size-3.5" />}
                              </Button>
                              <Button size="icon-sm" variant="ghost" onClick={() => setPhoneEdit(null)} aria-label="Cancelar">
                                <X className="size-3.5" />
                              </Button>
                            </>
                          ) : waLink ? (
                            <a
                              href={waLink}
                              target="_blank"
                              rel="noreferrer"
                              className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-xl border border-emerald-600/30 bg-emerald-600/[0.08] px-3 py-2 text-[13px] text-emerald-700 dark:text-emerald-400"
                            >
                              <MessageCircle className="size-4" /> Enviar pelo WhatsApp
                            </a>
                          ) : contact.ownerId ? (
                            <Button
                              variant="outline"
                              size="sm"
                              className="flex-1 rounded-xl"
                              onClick={() => setPhoneEdit({ barbershopId: contact.barbershopId, value: '' })}
                            >
                              <AlertTriangle className="size-4 text-amber-500" />
                              <span className="ml-2">Cadastrar telefone</span>
                            </Button>
                          ) : (
                            <p className="text-[11px] text-muted-foreground">Sem responsável ativo</p>
                          )}
                        </div>
                      </Card>
                    )
                  })}
                </div>
              </>
            )}
          </div>
        ) : null}

        {/* ---------------------------------------------------------------- Histórico */}
        {tab === 'history' ? (
          <Card className="pf-card-lift overflow-hidden rounded-xl border-border/60 p-0">
            {loading ? (
              <div className="space-y-3 p-4">
                {[0, 1, 2].map((i) => <div key={i} className="pf-skeleton h-12 rounded-lg" />)}
              </div>
            ) : sentHistory.length === 0 ? (
              <EmptyState
                icon={MessageSquare}
                title="Nenhuma mensagem enviada"
                description="Somente envios concluídos aparecem aqui. Rascunhos e filas de canais não configurados ficam fora da lista."
                className="border-none"
              />
            ) : (
              <div className="divide-y divide-border/60">
                {sentHistory.map((m) => (
                  <div key={m.id} className="flex flex-wrap items-center gap-3 px-5 py-4 transition-colors duration-150 hover:bg-muted/40">
                    <StatusBadge tone={HISTORY_TONE[m.status] ?? 'neutral'} label={STATUS_LABEL[m.status] ?? m.status} />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-[13px] text-foreground">{m.subject || m.body.slice(0, 80)}</p>
                      <p className="text-[11px] text-muted-foreground">
                        {formatDate(m.sent_at ?? m.created_at)} · {CHANNELS.find((c) => c.value === m.channel)?.label ?? m.channel} · {m.recipient_count} destinatário(s)
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

        {/* ---------------------------------------------------------------- Disparos em massa */}
        {tab === 'bulk' ? (
          <div className="space-y-4">
            <Card className="rounded-xl border-border/60 p-5">
              <p className="mb-3 text-sm font-medium text-foreground">Canal</p>
              <div className="flex flex-wrap gap-2">
                {CHANNELS.map((c) => {
                  const blocked = c.value === 'in_app' || !configuredChannels.includes(c.value)
                  return (
                    <button
                      key={c.value}
                      type="button"
                      onClick={() => setChannel(c.value)}
                      className={cn(
                        'flex items-center gap-2 rounded-xl border px-3 py-2 text-[13px] transition-colors duration-150',
                        channel === c.value ? 'border-primary/30 bg-primary/[0.08] text-primary' : 'border-border/60 text-muted-foreground hover:bg-muted/40',
                      )}
                    >
                      <c.icon className="size-4" />
                      {c.label}
                      <span className={cn('size-1.5 rounded-full', blocked ? 'bg-amber-500' : 'bg-primary')} aria-hidden="true" />
                      <span className="text-[11px] opacity-70">{blocked ? 'não configurado' : 'ativo'}</span>
                    </button>
                  )
                })}
              </div>
            </Card>

            {channelBlocked ? (
              <Card className="rounded-xl border-amber-500/30 bg-amber-500/[0.05] p-5">
                <div className="flex items-start gap-3">
                  <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-amber-500/15 text-amber-600 dark:text-amber-400">
                    <PlugZap className="size-4" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-foreground">
                      Envio automático por {channelLabel} indisponível
                    </p>
                    <p className="mt-1 max-w-xl text-[13px] text-muted-foreground">
                      Nenhum provedor está conectado a este canal, então a plataforma não entrega, não agenda e não cobra
                      nada por aqui. Nada é enviado ao cliente por esta tela.
                    </p>

                    <div className="mt-4 flex flex-wrap items-center gap-2">
                      <Button size="sm" className="rounded-xl" onClick={() => setTab('contacts')}>
                        <Phone className="size-4" />
                        <span className="ml-2">Ir para envio manual</span>
                      </Button>
                      <Link
                        href="/plataforma/configuracoes"
                        className={buttonVariants({ variant: 'outline', size: 'sm', className: 'rounded-xl' })}
                      >
                        Ver integrações
                      </Link>
                      <button
                        type="button"
                        onClick={() => setShowBlockedForm((v) => !v)}
                        className="ml-1 text-[11px] text-muted-foreground underline-offset-2 transition-colors duration-150 hover:text-foreground hover:underline"
                      >
                        {showBlockedForm ? 'Ocultar rascunho' : 'Escrever um rascunho mesmo assim'}
                      </button>
                    </div>
                  </div>
                </div>
              </Card>
            ) : null}

            <div className={cn('grid gap-4 lg:grid-cols-[1fr_320px]', channelBlocked && !showBlockedForm && 'hidden')}>
              <Card className="pf-card-lift space-y-4 rounded-xl border-border/60 p-5">
                {channelBlocked ? (
                  <p className="flex items-start gap-1.5 rounded-lg bg-muted/50 px-3 py-2 text-[11px] text-muted-foreground">
                    <Info className="mt-px size-3.5 shrink-0" />
                    Modo rascunho — o texto fica salvo na plataforma e não sai para ninguém.
                  </p>
                ) : null}

                {channel === 'email' ? (
                  <div>
                    <label htmlFor="assunto" className="mb-2 block text-sm font-medium text-foreground">Assunto</label>
                    <Input id="assunto" value={subject} onChange={(e) => setSubject(e.target.value)} placeholder="Assunto do e-mail" />
                  </div>
                ) : null}

                <div>
                  <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
                    <label htmlFor="mensagem-massa" className="text-sm font-medium text-foreground">Mensagem</label>
                    <div className="flex flex-wrap gap-1">
                      {VARIABLES.map((v) => (
                        <button
                          key={v}
                          type="button"
                          onClick={() => insertVariable(v, 'bulk')}
                          className="rounded-md bg-muted/60 px-2 py-0.5 text-[11px] text-muted-foreground transition-colors duration-150 hover:bg-primary/10 hover:text-primary"
                        >
                          {`{{${v}}}`}
                        </button>
                      ))}
                    </div>
                  </div>
                  <Textarea
                    id="mensagem-massa"
                    ref={bulkBodyRef}
                    value={msgBody}
                    onChange={(e) => setMsgBody(e.target.value)}
                    rows={9}
                    placeholder="Escreva a mensagem. Use as variáveis acima para personalizar."
                    className="resize-y"
                  />
                  <p className="mt-1 text-[11px] text-muted-foreground">{msgBody.length} caractere(s)</p>
                </div>
              </Card>

              <div className="space-y-4">
                <Card className="pf-card-lift space-y-3 rounded-xl border-border/60 p-5">
                  <p className="flex items-center gap-2 text-sm font-medium text-foreground"><Users className="size-4" /> Destinatários</p>
                  <Select value={filters.status} onChange={(e) => setFilters((f) => ({ ...f, status: e.target.value }))} className="text-sm" aria-label="Status">
                    <option value="">Todos os status</option>
                    <option value="trialing">Em teste</option>
                    <option value="active">Ativas</option>
                    <option value="past_due">Em atraso</option>
                    <option value="canceled">Canceladas</option>
                  </Select>
                  <Select value={filters.plan} onChange={(e) => setFilters((f) => ({ ...f, plan: e.target.value }))} className="text-sm" aria-label="Plano">
                    <option value="">Todos os planos</option>
                    <option value="starter">Starter</option>
                    <option value="pro">Pro</option>
                    <option value="premium">Premium</option>
                  </Select>
                  <Input value={filters.city} onChange={(e) => setFilters((f) => ({ ...f, city: e.target.value }))} placeholder="Cidade (opcional)" className="text-sm" />
                  <div className="space-y-2 pt-1">
                    {([['trialExpiring', 'Teste vencendo (7 dias)'], ['pastDue', 'Inadimplentes'], ['inactive', 'Inativos (30+ dias)']] as const).map(([key, label]) => (
                      <label key={key} className="flex items-center gap-2 text-[13px] text-foreground">
                        <input type="checkbox" checked={filters[key]} onChange={(e) => setFilters((f) => ({ ...f, [key]: e.target.checked }))} className="size-4 rounded border-border" />
                        {label}
                      </label>
                    ))}
                  </div>
                </Card>

                <Card className="pf-card-lift space-y-3 rounded-xl border-border/60 p-5">
                  <div className="flex items-baseline justify-between">
                    <span className="text-[11px] uppercase tracking-wide text-muted-foreground">
                      {selectedContacts.size > 0 ? 'Selecionados' : channelBlocked ? 'Contatos no filtro' : 'Alcançará'}
                    </span>
                    <span className="text-2xl font-medium tabular-nums text-foreground">
                      {countingRecipients ? <Loader2 className="size-5 animate-spin" /> : (recipients?.count ?? 0)}
                    </span>
                  </div>
                  {selectedContacts.size > 0 ? (
                    <p className="text-[11px] text-primary">
                      {selectedContacts.size} contato(s) selecionado(s) na aba Contatos — o envio será restrito a eles.{' '}
                      <button type="button" className="underline" onClick={() => setSelectedContacts(new Set())}>Limpar seleção</button>
                    </p>
                  ) : null}
                  {!channelBlocked && recipients?.estimatedCost != null ? (
                    <p className="text-[11px] text-muted-foreground">Custo estimado: {money(recipients.estimatedCost)}</p>
                  ) : null}
                  {recipients?.sample?.length ? (
                    <p className="text-[11px] text-muted-foreground">Ex.: {recipients.sample.map((s) => s.name).join(', ')}{recipients.count > recipients.sample.length ? '…' : ''}</p>
                  ) : null}

                  {channelBlocked ? (
                    <>
                      <p className="text-[11px] text-muted-foreground">
                        Este número é só o resultado do filtro. Sem provedor configurado, nada é entregue nem agendado.
                      </p>
                      <Button variant="outline" className="w-full rounded-xl" disabled={sending || msgBody.trim().length < 3} onClick={() => void submit(true)}>
                        <Save className="size-4" /><span className="ml-2">Salvar rascunho</span>
                      </Button>
                    </>
                  ) : (
                    <>
                      <div>
                        <label htmlFor="agendar" className="mb-1 flex items-center gap-1.5 text-[11px] uppercase tracking-wide text-muted-foreground">
                          <Calendar className="size-3.5" /> Agendar (opcional)
                        </label>
                        <Input id="agendar" type="datetime-local" value={scheduledAt} onChange={(e) => setScheduledAt(e.target.value)} className="text-sm" />
                      </div>

                      <Button
                        className="w-full rounded-xl"
                        disabled={sending || msgBody.trim().length < 3}
                        onClick={() => void submit(false, false)}
                      >
                        {sending ? <Loader2 className="size-4 animate-spin" /> : <Eye className="size-4" />}
                        <span className="ml-2">Pré-visualizar e enviar</span>
                      </Button>
                      <Button variant="outline" className="w-full rounded-xl" disabled={sending || msgBody.trim().length < 3} onClick={() => void submit(true)}>
                        <Save className="size-4" /><span className="ml-2">Salvar rascunho</span>
                      </Button>
                    </>
                  )}
                </Card>
              </div>
            </div>
          </div>
        ) : null}

        {/* ---------------------------------------------------------------- Modelos */}
        {tab === 'templates' ? (
          <div className="grid gap-4 sm:grid-cols-2">
            {templates.length === 0 ? (
              <Card className="col-span-full rounded-xl border-border/60 p-2">
                <EmptyState icon={FileText} title="Nenhum modelo cadastrado" description="Modelos com variáveis agilizam o envio de mensagens personalizadas." className="border-none" />
              </Card>
            ) : templates.map((t) => (
              <Card key={t.id} className="pf-card-lift flex flex-col gap-3 rounded-xl border-border/60 p-5">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="truncate font-medium text-foreground">{t.name}</p>
                    <p className="text-[11px] uppercase tracking-wide text-muted-foreground">
                      {CHANNELS.find((c) => c.value === t.channel)?.label ?? t.channel}
                    </p>
                  </div>
                  <FileText className="size-4 shrink-0 text-muted-foreground" />
                </div>
                {t.subject ? <p className="text-[13px] font-medium text-foreground">{t.subject}</p> : null}
                <p className="line-clamp-4 whitespace-pre-wrap text-[13px] text-muted-foreground">{t.body}</p>
                <Button variant="outline" size="sm" className="mt-auto w-fit rounded-xl" onClick={() => applyTemplate(t)}>
                  Usar modelo
                </Button>
              </Card>
            ))}
          </div>
        ) : null}

        {/* ---------------------------------------------------------------- Caixa de entrada */}
        {tab === 'inbox' ? (
          <Card className="pf-card-lift overflow-hidden rounded-xl border-border/60 p-0">
            {loading ? (
              <div className="space-y-3 p-4">
                {[0, 1, 2].map((i) => <div key={i} className="pf-skeleton h-16 rounded-lg" />)}
              </div>
            ) : inbox.length === 0 ? (
              <EmptyState icon={Inbox} title="Nenhuma mensagem recebida" description="Respostas dos clientes aparecerão aqui quando os canais estiverem integrados." className="border-none" />
            ) : (
              <div className="divide-y divide-border/60">
                {inbox.map((m) => (
                  <div key={m.id} className={cn('flex items-start gap-3 px-5 py-4', !m.read_at && m.direction === 'inbound' && 'bg-gold/5')}>
                    <div className="mt-0.5">{m.read_at ? <MailOpen className="size-4 text-muted-foreground" /> : <Mail className="size-4 text-gold" />}</div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <p className="truncate text-[13px] font-medium text-foreground">{m.sender_name || m.sender_email || 'Cliente'}</p>
                        <span className="text-[11px] uppercase tracking-wide text-muted-foreground">{m.direction === 'inbound' ? 'Recebida' : 'Enviada'} · {m.channel}</span>
                      </div>
                      {m.subject ? <p className="text-[13px] font-medium text-foreground">{m.subject}</p> : null}
                      <p className="whitespace-pre-wrap text-[13px] text-muted-foreground">{m.body}</p>
                      <p className="mt-1 text-[11px] text-muted-foreground">{formatDate(m.created_at)}</p>
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
          <Card className="relative w-full max-w-lg space-y-4 rounded-xl border-border/60 p-6 shadow-xl">
            <div className="flex items-center justify-between">
              <h2 className="flex items-center gap-2 text-base font-medium text-foreground">
                <AlertTriangle className="size-5 text-gold" /> Confirmar envio
              </h2>
              <button type="button" onClick={() => setSendPreview(null)} className="text-muted-foreground hover:text-foreground" aria-label="Fechar">
                <X className="size-5" />
              </button>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-xl bg-muted/40 p-3">
                <p className="text-[11px] uppercase tracking-wide text-muted-foreground">Destinatários</p>
                <p className="mt-1 text-xl font-medium tabular-nums">{sendPreview.recipientCount}</p>
              </div>
              <div className="rounded-xl bg-muted/40 p-3">
                <p className="text-[11px] uppercase tracking-wide text-muted-foreground">Canal</p>
                <p className="mt-1 text-xl font-medium">{CHANNELS.find((c) => c.value === sendPreview.channel)?.label}</p>
              </div>
            </div>
            {sendPreview.estimatedCost != null ? <p className="text-[13px] text-muted-foreground">Custo estimado: {money(sendPreview.estimatedCost)}</p> : null}
            <div>
              <p className="mb-1 text-[11px] uppercase tracking-wide text-muted-foreground">Prévia da mensagem</p>
              <div className="max-h-48 overflow-y-auto whitespace-pre-wrap rounded-xl border border-border/60 bg-background p-3 text-[13px]">{sendPreview.message}</div>
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
