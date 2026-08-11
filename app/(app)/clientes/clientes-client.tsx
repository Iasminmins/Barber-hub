"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import { useEffect, useMemo, useState } from "react"
import { AlertTriangle, Cake, CalendarDays, Mail, MessageCircle, Pencil, Phone, Plus, Save, Scissors, Search, Send, Star, Trash2, X } from "lucide-react"
import type { Client, ClientTag } from "@/lib/types"
import { formatCurrency, formatDate } from "@/lib/format"
import { Input } from "@/components/ui/input"
import { Button, buttonVariants } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Avatar } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogHeader } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Select } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { PageHeader } from "@/components/page-header"
import { StatusBadge } from "@/components/status-badge"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { useAppData } from '@/components/data/app-data-provider'
import { buildFirstClientActivity, getEffectiveClientStartDate } from '@/lib/client-start'
import { getClientsWithoutReturn, type ReturnFilter } from '@/lib/dashboard-retention'

type Filter = "todos" | "novos" | "vip" | "recorrente" | "aniversariante" | "inadimplente" | "inativo" | "sem_telefone" | "duplicados" | "suspeitos" | "sem_retorno"
type ClientDraft = {
  id:string; name:string; phone:string; email:string; birthDate:string; postalCode:string;
  address:string; addressNumber:string; addressComplement:string; neighborhood:string;
  city:string; state:string; preferredDay:string; preferredBarber:string; notes:string; tags:ClientTag[]
}

const TAG_LABEL: Record<ClientTag, string> = {
  vip: "VIP",
  recorrente: "Recorrente",
  inativo: "Inativo",
  inadimplente: "Inadimplente",
  aniversariante: "Aniversariante",
}

function isBirthdayThisMonth(birthDate: string) {
  if (!birthDate) return false
  const date = new Date(`${birthDate}T00:00:00`)
  if (Number.isNaN(date.getTime())) return false
  return date.getMonth() === new Date().getMonth()
}

function normalizeName(value: string | null | undefined) {
  return String(value ?? "")
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\s+/g, " ")
}

function normalizePhone(value: string | null | undefined) {
  return String(value ?? "").replace(/\D/g, "")
}

function orderDateKey(value: string) {
  return value.slice(0, 10)
}

function currentMonthRange() {
  const today = new Date()
  const year = today.getFullYear()
  const month = String(today.getMonth() + 1).padStart(2, "0")
  const lastDay = new Date(year, today.getMonth() + 1, 0).getDate()
  return {
    start: `${year}-${month}-01`,
    end: `${year}-${month}-${String(lastDay).padStart(2, "0")}`,
  }
}

function whatsappUrl(phone: string, message: string) {
  const digits = normalizePhone(phone)
  const brNumber = digits.length <= 11 ? `55${digits}` : digits
  return `https://wa.me/${brNumber}?text=${encodeURIComponent(message)}`
}

function toClientDraft(client: Client): ClientDraft {
  return {
    id:client.id, name:client.name, phone:client.phone, email:client.email,
    birthDate:client.birthDate, postalCode:client.postalCode, address:client.address,
    addressNumber:client.addressNumber, addressComplement:client.addressComplement,
    neighborhood:client.neighborhood, city:client.city, state:client.state,
    preferredDay:client.preferredDay, preferredBarber:client.preferredBarber,
    notes:client.notes, tags:[...client.tags],
  }
}

export function ClientesClient({ clients }: { clients: Client[] }) {
  const router = useRouter()
  const { appointments, barbershop, catalog, employees, imports, orders, deleteRecord, updateRecord } = useAppData()
  const [records, setRecords] = useState(clients)
  const [query, setQuery] = useState("")
  const [filter, setFilter] = useState<Filter>("todos")
  const [returnFilter, setReturnFilter] = useState<ReturnFilter>(60)
  const [newClientsRange, setNewClientsRange] = useState<{ start: string; end: string } | null>(null)
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [historyOpen, setHistoryOpen] = useState(false)
  const [mobileDetailsOpen, setMobileDetailsOpen] = useState(false)
  const [whatsappClient, setWhatsappClient] = useState<Client | null>(null)
  const [whatsappMessage, setWhatsappMessage] = useState("")
  const [editing, setEditing] = useState<ClientDraft | null>(null)
  const [editStatus, setEditStatus] = useState("")

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    if (params.get("filtro") === "sem_retorno") {
      const period = Number(params.get("periodo"))
      if (period === 30 || period === 60 || period === 90) setReturnFilter(period)
      setFilter("sem_retorno")
      return
    }
    if (params.get("filtro") !== "novos") return
    const start = params.get("inicio") ?? ""
    const end = params.get("fim") ?? ""
    setFilter("novos")
    setNewClientsRange(
      /^\d{4}-\d{2}-\d{2}$/.test(start) && /^\d{4}-\d{2}-\d{2}$/.test(end)
        ? { start, end }
        : null,
    )
  }, [])

  const duplicateKeys = useMemo(() => {
    const keys = records.map((client) => normalizePhone(client.phone) || normalizeName(client.name)).filter(Boolean)
    const counts = new Map<string, number>()
    for (const key of keys) counts.set(key, (counts.get(key) ?? 0) + 1)
    return new Set([...counts.entries()].filter(([, count]) => count > 1).map(([key]) => key))
  }, [records])
  const productNames = useMemo(() => new Set(catalog.map((item) => normalizeName(item.name))), [catalog])
  const firstClientActivity = useMemo(
    () => buildFirstClientActivity(orders, appointments),
    [appointments, orders],
  )
  const clientStartDates = useMemo(
    () => new Map(records.map((client) => [
      client.id,
      getEffectiveClientStartDate(client, firstClientActivity, imports),
    ])),
    [firstClientActivity, imports, records],
  )
  const clientStats = useMemo(() => {
    const stats = new Map<string, { visits: number; totalSpent: number; lastVisit: string }>()
    for (const order of orders) {
      if (order.status !== "paga") continue
      const keys = [order.clientId, normalizeName(order.clientName)].filter(Boolean) as string[]
      for (const key of keys) {
        const current = stats.get(key) ?? { visits: 0, totalSpent: 0, lastVisit: "" }
        current.visits += 1
        current.totalSpent += order.total
        const date = orderDateKey(order.createdAt)
        if (date > current.lastVisit) current.lastVisit = date
        stats.set(key, current)
      }
    }
    return stats
  }, [orders])
  const clientsWithoutReturnIds = useMemo(
    () => new Set(getClientsWithoutReturn(records, orders, returnFilter, new Date().toISOString().slice(0, 10)).map((client) => client.id)),
    [records, orders, returnFilter],
  )
  const getClientStats = (client: Client) => {
    const byId = clientStats.get(client.id)
    const byName = clientStats.get(normalizeName(client.name))
    return {
      visits: Math.max(client.visits, byId?.visits ?? 0, byName?.visits ?? 0),
      totalSpent: Math.max(client.totalSpent, byId?.totalSpent ?? 0, byName?.totalSpent ?? 0),
      lastVisit: [client.lastVisit, byId?.lastVisit, byName?.lastVisit].filter(Boolean).sort().at(-1) ?? "",
    }
  }
  const isDuplicateClient = (client: Client) => duplicateKeys.has(normalizePhone(client.phone) || normalizeName(client.name))
  const isSuspiciousClient = (client: Client) => productNames.has(normalizeName(client.name))

  function openClientDetails(id: string) {
    setSelectedId(id)
    if (window.matchMedia("(max-width: 1279px)").matches) setMobileDetailsOpen(true)
  }

  function openWhatsappComposer(client: Client) {
    setWhatsappClient(client)
    setWhatsappMessage(
      `Olá, ${client.name}! Tudo bem? Passando para lembrar que aqui na ${barbershop.name || "Duke Barber"} temos horários disponíveis hoje e nos próximos dias. Será um prazer receber você novamente!`,
    )
  }

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    return records.filter((c) => {
      const matchesQuery =
        !q ||
        c.name.toLowerCase().includes(q) ||
        c.phone.toLowerCase().includes(q) ||
        c.email.toLowerCase().includes(q)
      const matchesFilter =
        filter === "todos" ||
        (filter === "novos" && (
          newClientsRange
            ? Boolean(
                clientStartDates.get(c.id)
                && clientStartDates.get(c.id)! >= newClientsRange.start
                && clientStartDates.get(c.id)! <= newClientsRange.end,
              )
            : true
        )) ||
        (filter === "aniversariante" ? c.tags.includes("aniversariante") || isBirthdayThisMonth(c.birthDate) : c.tags.includes(filter as ClientTag)) ||
        (filter === "sem_telefone" && !normalizePhone(c.phone)) ||
        (filter === "sem_retorno" && clientsWithoutReturnIds.has(c.id)) ||
        (filter === "duplicados" && duplicateKeys.has(normalizePhone(c.phone) || normalizeName(c.name))) ||
        (filter === "suspeitos" && productNames.has(normalizeName(c.name)))
      return matchesQuery && matchesFilter
    })
  }, [records, query, filter, duplicateKeys, productNames, newClientsRange, clientStartDates, clientsWithoutReturnIds])

  const selected = records.find((c) => c.id === selectedId) ?? null
  const selectedStats = selected ? getClientStats(selected) : null
  const selectedHistory = useMemo(
    () => [
      ...orders
        .filter((order) => selectedId ? order.clientId === selectedId || (selected && normalizeName(order.clientName) === normalizeName(selected.name)) : false)
        .map((order) => ({ id: order.id, date: orderDateKey(order.createdAt), time: String(order.createdAt).slice(11, 16), title: `Comanda #${order.number}`, subtitle: order.employeeName, amount: order.total, status: order.status })),
      ...appointments
      .filter((appointment) => appointment.clientId === selectedId)
        .map((appointment) => ({ id: appointment.id, date: appointment.date, time: appointment.start, title: appointment.serviceName, subtitle: appointment.employeeName, amount: appointment.price, status: appointment.status })),
    ].sort((a, b) => `${b.date} ${b.time}`.localeCompare(`${a.date} ${a.time}`)),
    [appointments, orders, selected, selectedId],
  )

  async function deleteClient(id: string) {
    if (!window.confirm('Excluir este cliente?')) return
    const result = await deleteRecord('clients', id)
    if (result.error) { window.alert(result.error); return }
    setRecords((current) => current.filter((client) => client.id !== id))
    if (selectedId === id) setSelectedId(null)
  }

  async function saveClient() {
    if (!editing) return
    if (!editing.name.trim()) { setEditStatus("Informe o nome do cliente."); return }
    const values = { name:editing.name.trim(), phone:editing.phone.trim()||null, email:editing.email.trim()||null, birth_date:editing.birthDate||null, postal_code:editing.postalCode.replace(/\D/g,'')||null, address:editing.address.trim()||null, address_number:editing.addressNumber.trim()||null, address_complement:editing.addressComplement.trim()||null, neighborhood:editing.neighborhood.trim()||null, city:editing.city.trim()||null, state:editing.state.trim().toUpperCase()||null, preferred_day:editing.preferredDay||null, preferred_barber:editing.preferredBarber||null, notes:editing.notes.trim()||null, tags:editing.tags }
    const result = await updateRecord("clients", editing.id, values)
    if (result.error) { setEditStatus(result.error); return }
    setRecords((current) => current.map((client) => client.id === editing.id ? { ...client, name:editing.name.trim(), phone:editing.phone.trim(), email:editing.email.trim(), birthDate:editing.birthDate, postalCode:editing.postalCode, address:editing.address.trim(), addressNumber:editing.addressNumber.trim(), addressComplement:editing.addressComplement.trim(), neighborhood:editing.neighborhood.trim(), city:editing.city.trim(), state:editing.state.trim().toUpperCase(), preferredDay:editing.preferredDay, preferredBarber:editing.preferredBarber, notes:editing.notes.trim(), tags:editing.tags } : client))
    setEditing(null)
  }

  const filters: { key: Filter; label: string }[] = [
    { key: "todos", label: "Todos" },
    { key: "novos", label: "Novos" },
    { key: "vip", label: "VIP" },
    { key: "recorrente", label: "Recorrentes" },
    { key: "aniversariante", label: "Aniversariantes" },
    { key: "inadimplente", label: "Inadimplentes" },
    { key: "inativo", label: "Inativos" },
    { key: "sem_telefone", label: "Sem telefone" },
    { key: "duplicados", label: "Duplicados" },
    { key: "suspeitos", label: "Suspeitos" },
    { key: "sem_retorno", label: "Sem retorno" },
  ]

  return (
    <div>
      <PageHeader title="Clientes" description="Base de clientes, histórico e relacionamento.">
        <Link href="/clientes/novo" className={buttonVariants({ variant: "gold" })}>
          <Plus className="size-4" />
          Novo cliente
        </Link>
      </PageHeader>

      {filter === "novos" ? (
        <div className="mb-4 flex flex-col gap-3 rounded-lg border border-primary/20 bg-primary/5 px-4 py-3 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-sm font-semibold text-foreground">Clientes novos</p>
            <p className="text-sm text-muted-foreground">
              {newClientsRange
                ? `Primeiro registro de ${formatDate(newClientsRange.start)} até ${formatDate(newClientsRange.end)}`
                : "Clientes novos no período selecionado"}
              {" · "}{filtered.length} cliente(s)
            </p>
          </div>
          <div className="grid grid-cols-1 items-end gap-2 sm:grid-cols-[1fr_1fr_auto]">
            <label className="space-y-1 text-xs font-medium text-muted-foreground">
              Data inicial
              <Input
                type="date"
                value={newClientsRange?.start ?? ""}
                max={newClientsRange?.end}
                onChange={(event) => {
                  const start = event.target.value
                  if (!start) return
                  setNewClientsRange((current) => ({
                    start,
                    end: current && start <= current.end ? current.end : start,
                  }))
                }}
                className="h-9 bg-card"
              />
            </label>
            <label className="space-y-1 text-xs font-medium text-muted-foreground">
              Data final
              <Input
                type="date"
                value={newClientsRange?.end ?? ""}
                min={newClientsRange?.start}
                onChange={(event) => {
                  const end = event.target.value
                  if (!end) return
                  setNewClientsRange((current) => ({
                    start: current && current.start <= end ? current.start : end,
                    end,
                  }))
                }}
                className="h-9 bg-card"
              />
            </label>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="h-9 bg-card"
              onClick={() => {
                setNewClientsRange(null)
                setFilter("todos")
                router.replace("/clientes")
              }}
            >
              <X className="size-4" />
              Limpar filtro
            </Button>
          </div>
        </div>
      ) : null}

      <div className={`grid gap-5 ${selected ? 'xl:grid-cols-[minmax(0,1fr)_340px] 2xl:grid-cols-[minmax(0,1fr)_380px]' : 'grid-cols-1'}`}>
        <div className="min-w-0">
          <Card className="mb-4 p-3">
            <div className="grid gap-3">
              <div className="relative min-w-0">
                <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                <Input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Buscar por nome, telefone ou e-mail" className="pl-9" />
              </div>
              <div className="flex flex-wrap gap-1.5">
                {filters.map((f) => (
                  <button
                    key={f.key}
                    onClick={() => {
                      setFilter(f.key)
                      if (f.key === "novos" && !newClientsRange) setNewClientsRange(currentMonthRange())
                    }}
                    className={`rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
                      filter === f.key ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    {f.label}
                  </button>
                ))}
                {filter === "sem_retorno" ? (
                  <Select aria-label="Período sem retorno" value={returnFilter} onChange={(event) => setReturnFilter(Number(event.target.value) as ReturnFilter)} className="h-8 w-auto text-xs">
                    <option value="30">30 dias</option>
                    <option value="60">60 dias</option>
                    <option value="90">90 dias</option>
                  </Select>
                ) : null}
              </div>
            </div>
          </Card>

          <Card className="overflow-hidden">
            <Table className="min-w-[820px]">
              <TableHeader>
                <TableRow>
                  <TableHead>Cliente</TableHead>
                  {filter === "novos" ? <TableHead>Cliente desde</TableHead> : null}
                  <TableHead>Contato</TableHead>
                  <TableHead className="text-right">Visitas</TableHead>
                  <TableHead className="text-right">Total gasto</TableHead>
                  <TableHead>Última visita</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((c) => {
                  const stats = getClientStats(c)
                  return (
                  <TableRow key={c.id} className={selectedId === c.id ? "bg-accent/40" : ""}>
                    <TableCell onClick={() => openClientDetails(c.id)} className="cursor-pointer">
                      <div className="flex items-center gap-3">
                        <Avatar name={c.name} />
                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5 font-medium text-foreground">
                            <span className="truncate">{c.name}</span>
                            {c.tags.includes("vip") && <Star className="size-3.5 shrink-0 fill-[var(--gold)] text-[var(--gold)]" />}
                            {isDuplicateClient(c) || isSuspiciousClient(c) || !normalizePhone(c.phone) ? <AlertTriangle className="size-3.5 shrink-0 text-warning-foreground" /> : null}
                          </div>
                          <div className="text-xs text-muted-foreground">{c.favoriteService}</div>
                        </div>
                      </div>
                    </TableCell>
                    {filter === "novos" ? (
                      <TableCell className="whitespace-nowrap text-muted-foreground">
                        {clientStartDates.get(c.id) ? formatDate(clientStartDates.get(c.id)!) : "-"}
                      </TableCell>
                    ) : null}
                    <TableCell className="text-muted-foreground">{c.phone || "-"}</TableCell>
                    <TableCell className="text-right tabular-nums">{stats.visits}</TableCell>
                    <TableCell className="text-right font-medium tabular-nums">{formatCurrency(stats.totalSpent)}</TableCell>
                    <TableCell className="text-muted-foreground">{stats.lastVisit ? formatDate(stats.lastVisit) : "-"}</TableCell>
                    <TableCell className="text-right">
                      {filter === "sem_retorno" && normalizePhone(c.phone) ? (
                        <Button variant="ghost" size="icon-sm" aria-label={`Enviar WhatsApp para ${c.name}`} onClick={() => openWhatsappComposer(c)}>
                          <MessageCircle className="size-4 text-emerald-600" />
                        </Button>
                      ) : null}
                      <Button variant="ghost" size="icon-sm" aria-label="Excluir cliente" onClick={() => deleteClient(c.id)}>
                        <Trash2 className="size-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                  )
                })}
                {filtered.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={filter === "novos" ? 7 : 6} className="py-10 text-center text-muted-foreground">
                      Nenhum cliente encontrado.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </Card>
        </div>

        {selected ? (
          <div className="min-w-0 xl:sticky xl:top-6 xl:self-start">
            <Card className="p-5">
              <div className="mb-4 flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <Avatar name={selected.name} className="size-12 text-base" />
                  <div>
                    <h3 className="break-words font-semibold text-foreground">{selected.name}</h3>
                    <p className="text-sm text-muted-foreground">
                      Cliente desde {clientStartDates.get(selected.id) ? formatDate(clientStartDates.get(selected.id)!) : "-"}
                    </p>
                  </div>
                </div>
                <button onClick={() => setSelectedId(null)} className="rounded-md p-1 text-muted-foreground hover:bg-muted hover:text-foreground" aria-label="Fechar detalhes">
                  <X className="size-4" />
                </button>
              </div>

              <div className="mb-4 flex flex-wrap gap-1.5">
                {selected.tags.map((t) => (
                  <Badge key={t} variant={t === "vip" ? "gold" : "secondary"}>{TAG_LABEL[t]}</Badge>
                ))}
                {!normalizePhone(selected.phone) ? <Badge variant="warning">Sem telefone</Badge> : null}
                {isDuplicateClient(selected) ? <Badge variant="warning">Possível duplicado</Badge> : null}
                {isSuspiciousClient(selected) ? <Badge variant="destructive">Nome parece produto</Badge> : null}
              </div>

              <div className="space-y-2 text-sm">
                <div className="flex items-center gap-2 text-muted-foreground"><Phone className="size-4 shrink-0" />{selected.phone || "Sem telefone"}</div>
                {selected.email && <div className="flex items-center gap-2 text-muted-foreground"><Mail className="size-4" />{selected.email}</div>}
                <div className="flex items-center gap-2 text-muted-foreground"><Cake className="size-4 shrink-0" />{selected.birthDate ? formatDate(selected.birthDate) : "-"}</div>
                <div className="flex items-center gap-2 text-muted-foreground"><Scissors className="size-4 shrink-0" />{selected.preferredBarber ? `Prefere ${selected.preferredBarber}` : "Sem preferência"}</div>
                {selected.address || selected.city ? (
                  <div className="flex items-start gap-2 text-muted-foreground">
                    <CalendarDays className="mt-0.5 size-4 shrink-0" />
                    <span>{[
                      [selected.address, selected.addressNumber].filter(Boolean).join(', '),
                      selected.addressComplement,
                      selected.neighborhood,
                      [selected.city, selected.state].filter(Boolean).join(' - '),
                      selected.postalCode ? `CEP ${selected.postalCode.replace(/^(\d{5})(\d{3})$/, '$1-$2')}` : '',
                    ].filter(Boolean).join(' · ')}</span>
                  </div>
                ) : null}
              </div>

              <div className="my-4 grid grid-cols-2 gap-3">
                <div className="rounded-lg bg-muted p-3"><div className="text-xs text-muted-foreground">Visitas</div><div className="text-lg font-semibold text-foreground tabular-nums">{selectedStats?.visits ?? selected.visits}</div></div>
                <div className="rounded-lg bg-muted p-3"><div className="text-xs text-muted-foreground">Total gasto</div><div className="text-lg font-semibold text-foreground tabular-nums">{formatCurrency(selectedStats?.totalSpent ?? selected.totalSpent)}</div></div>
              </div>

              <div className="mb-2 text-sm font-medium text-foreground">Observações</div>
              <p className="mb-4 text-sm text-muted-foreground">{selected.notes || "Sem observações registradas."}</p>

              <div className="flex flex-wrap gap-2">
                <Button variant="outline" size="icon" aria-label={`Editar ${selected.name}`} onClick={() => { setEditStatus(""); setEditing(toClientDraft(selected)) }}><Pencil className="size-4" /></Button>
                <Button variant="outline" className="min-w-24 flex-1" onClick={() => setHistoryOpen(true)}>Histórico</Button>
                {normalizePhone(selected.phone) ? <Button variant="outline" size="icon" aria-label={`WhatsApp ${selected.name}`} onClick={() => openWhatsappComposer(selected)}><MessageCircle className="size-4" /></Button> : null}
                <Button variant="gold" className="min-w-24 flex-1" onClick={() => router.push(`/agenda/novo?cliente=${encodeURIComponent(selected.id)}`)}>Agendar</Button>
                <Button variant="destructive" size="icon" aria-label="Excluir cliente" onClick={() => deleteClient(selected.id)}>
                  <Trash2 className="size-4" />
                </Button>
              </div>
            </Card>
          </div>
        ) : null}
      </div>

      <Dialog open={mobileDetailsOpen && Boolean(selected)} onClose={() => setMobileDetailsOpen(false)} className="max-h-[92dvh] overflow-y-auto sm:max-w-lg">
        {selected ? (
          <>
            <DialogHeader title={selected.name} description="Ficha completa do cliente" />
            <div className="space-y-4">
              <div className="flex items-center gap-3 rounded-lg bg-muted/50 p-3">
                <Avatar name={selected.name} className="size-12 text-base" />
                <div className="min-w-0">
                  <p className="font-semibold text-foreground">{selected.name}</p>
                  <p className="text-sm text-muted-foreground">
                    Cliente desde {clientStartDates.get(selected.id) ? formatDate(clientStartDates.get(selected.id)!) : "-"}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-lg bg-muted p-3"><p className="text-xs text-muted-foreground">Visitas</p><p className="text-lg font-semibold">{selectedStats?.visits ?? selected.visits}</p></div>
                <div className="rounded-lg bg-muted p-3"><p className="text-xs text-muted-foreground">Total gasto</p><p className="text-lg font-semibold">{formatCurrency(selectedStats?.totalSpent ?? selected.totalSpent)}</p></div>
              </div>

              <div className="space-y-2 rounded-lg border border-border p-3 text-sm">
                <p className="flex items-center gap-2"><Phone className="size-4 text-muted-foreground" />{selected.phone || "Sem telefone"}</p>
                {selected.email ? <p className="flex items-center gap-2"><Mail className="size-4 text-muted-foreground" />{selected.email}</p> : null}
                <p className="flex items-center gap-2"><Cake className="size-4 text-muted-foreground" />{selected.birthDate ? formatDate(selected.birthDate) : "Nascimento não informado"}</p>
                <p className="flex items-center gap-2"><Scissors className="size-4 text-muted-foreground" />{selected.preferredBarber ? `Prefere ${selected.preferredBarber}` : "Barbeiro não informado"}</p>
                {selected.address || selected.city ? <p className="flex items-start gap-2"><CalendarDays className="mt-0.5 size-4 shrink-0 text-muted-foreground" /><span>{[[selected.address,selected.addressNumber].filter(Boolean).join(", "),selected.addressComplement,selected.neighborhood,[selected.city,selected.state].filter(Boolean).join(" - ")].filter(Boolean).join(" · ")}</span></p> : null}
              </div>

              {selected.notes ? <div><p className="mb-1 text-sm font-medium">Observações</p><p className="text-sm text-muted-foreground">{selected.notes}</p></div> : null}

              <div className="grid grid-cols-2 gap-2">
                {normalizePhone(selected.phone) ? <Button variant="gold" className="col-span-2" onClick={() => openWhatsappComposer(selected)}><MessageCircle className="size-4" />Conversar no WhatsApp</Button> : null}
                <Button variant="outline" onClick={() => { setMobileDetailsOpen(false); setHistoryOpen(true) }}>Histórico</Button>
                <Button variant="outline" onClick={() => { setMobileDetailsOpen(false); setEditStatus(""); setEditing(toClientDraft(selected)) }}><Pencil className="size-4" />Editar</Button>
                <Button variant="gold" className="col-span-2" onClick={() => router.push(`/agenda/novo?cliente=${encodeURIComponent(selected.id)}`)}>Agendar horário</Button>
              </div>
            </div>
          </>
        ) : null}
      </Dialog>

      <Dialog open={Boolean(whatsappClient)} onClose={() => setWhatsappClient(null)} className="sm:max-w-sm">
        {whatsappClient ? (
          <>
            <DialogHeader title="Enviar mensagem WhatsApp" description={`Enviar para ${whatsappClient.name} · ${whatsappClient.phone}`} />
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="whatsappMessage">Mensagem</Label>
                <Textarea
                  id="whatsappMessage"
                  autoFocus
                  value={whatsappMessage}
                  onChange={(event) => setWhatsappMessage(event.target.value)}
                  placeholder="Digite a mensagem para o cliente..."
                  className="min-h-32"
                />
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setWhatsappClient(null)}>Cancelar</Button>
                <a
                  href={whatsappUrl(whatsappClient.phone, whatsappMessage)}
                  target="_blank"
                  rel="noreferrer"
                  className={buttonVariants({ variant: "gold" })}
                  onClick={() => setWhatsappClient(null)}
                >
                  <Send className="size-4" />Enviar WhatsApp
                </a>
              </div>
            </div>
          </>
        ) : null}
      </Dialog>

      <Dialog open={historyOpen} onClose={() => setHistoryOpen(false)} className="sm:max-w-2xl">
        <DialogHeader
          title={`Histórico de ${selected?.name ?? "cliente"}`}
          description="Agendamentos e atendimentos registrados para este cliente."
        />
        {selectedHistory.length > 0 ? (
          <div className="max-h-[60vh] space-y-2 overflow-y-auto pr-1">
            {selectedHistory.map((appointment) => (
              <div key={appointment.id} className="flex flex-col gap-3 rounded-lg border border-border p-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-start gap-3">
                  <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                    <CalendarDays className="size-4" />
                  </span>
                  <div>
                    <p className="font-medium text-foreground">{appointment.title}</p>
                    <p className="text-sm text-muted-foreground">
                      {formatDate(appointment.date)} às {appointment.time || "--:--"} · {appointment.subtitle}
                    </p>
                  </div>
                </div>
                <div className="flex items-center justify-between gap-3 sm:justify-end">
                  <span className="font-medium tabular-nums text-foreground">{formatCurrency(appointment.amount)}</span>
                  <StatusBadge status={appointment.status} />
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="rounded-lg border border-dashed border-border py-10 text-center text-sm text-muted-foreground">
            Este cliente ainda não possui agendamentos registrados.
          </div>
        )}
        <div className="mt-5 flex justify-end">
          <Button variant="outline" onClick={() => setHistoryOpen(false)}>Fechar</Button>
        </div>
      </Dialog>
      <Dialog open={Boolean(editing)} onClose={() => setEditing(null)} className="sm:max-w-2xl">
        {editing ? <><DialogHeader title="Editar cliente" description="Corrija os dados pessoais, preferências e classificação."/><div className="grid gap-4 sm:grid-cols-2">
          <Field label="Nome completo"><Input value={editing.name} onChange={e=>setEditing({...editing,name:e.target.value})}/></Field>
          <Field label="Telefone / WhatsApp"><Input value={editing.phone} onChange={e=>setEditing({...editing,phone:e.target.value})}/></Field>
          <Field label="E-mail"><Input type="email" value={editing.email} onChange={e=>setEditing({...editing,email:e.target.value})}/></Field>
          <Field label="Data de nascimento"><Input type="date" value={editing.birthDate} onChange={e=>setEditing({...editing,birthDate:e.target.value})}/></Field>
          <Field label="Barbeiro preferido"><Select value={editing.preferredBarber} onChange={e=>setEditing({...editing,preferredBarber:e.target.value})}><option value="">Selecionar</option>{employees.filter(e=>e.active).map(e=><option key={e.id} value={e.name}>{e.name}</option>)}</Select></Field>
          <Field label="CEP"><Input value={editing.postalCode} onChange={e=>setEditing({...editing,postalCode:e.target.value})}/></Field>
          <Field label="Rua / Logradouro"><Input value={editing.address} onChange={e=>setEditing({...editing,address:e.target.value})}/></Field>
          <Field label="Número"><Input value={editing.addressNumber} onChange={e=>setEditing({...editing,addressNumber:e.target.value})}/></Field>
          <Field label="Complemento"><Input value={editing.addressComplement} onChange={e=>setEditing({...editing,addressComplement:e.target.value})}/></Field>
          <Field label="Bairro"><Input value={editing.neighborhood} onChange={e=>setEditing({...editing,neighborhood:e.target.value})}/></Field>
          <Field label="Cidade"><Input value={editing.city} onChange={e=>setEditing({...editing,city:e.target.value})}/></Field>
          <Field label="Estado (UF)"><Input maxLength={2} value={editing.state} onChange={e=>setEditing({...editing,state:e.target.value.toUpperCase()})}/></Field>
          <Field label="Dia preferido"><Select value={editing.preferredDay} onChange={e=>setEditing({...editing,preferredDay:e.target.value})}><option value="">Selecionar</option>{['Segunda-feira','Terça-feira','Quarta-feira','Quinta-feira','Sexta-feira','Sábado','Domingo'].map(day=><option key={day} value={day}>{day}</option>)}</Select></Field>
          <div className="space-y-2 sm:col-span-2"><Label>Observações</Label><Textarea value={editing.notes} onChange={e=>setEditing({...editing,notes:e.target.value})}/></div>
          <div className="space-y-2 sm:col-span-2"><Label>Classificação</Label><div className="grid grid-cols-2 gap-2">{([['vip','VIP'],['recorrente','Recorrente'],['aniversariante','Aniversariante'],['inadimplente','Inadimplente'],['inativo','Inativo']] as const).map(([tag,label])=><label key={tag} className="flex items-center justify-between rounded-md border p-2 text-sm"><span>{label}</span><input type="checkbox" checked={editing.tags.includes(tag)} onChange={e=>setEditing({...editing,tags:e.target.checked?[...editing.tags,tag]:editing.tags.filter(item=>item!==tag)})}/></label>)}</div></div>
        </div>{editStatus?<p className="mt-4 text-sm text-destructive">{editStatus}</p>:null}<div className="mt-5 flex justify-end gap-2"><Button variant="outline" onClick={()=>setEditing(null)}>Cancelar</Button><Button variant="gold" onClick={saveClient}><Save className="size-4"/>Salvar alterações</Button></div></>:null}
      </Dialog>
    </div>
  )
}

function Field({label,children}:{label:string;children:React.ReactNode}) { return <div className="space-y-2"><Label>{label}</Label>{children}</div> }
