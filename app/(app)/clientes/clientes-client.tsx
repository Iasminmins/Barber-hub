"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import { useMemo, useState } from "react"
import { AlertTriangle, Cake, CalendarDays, Mail, MessageCircle, Pencil, Phone, Plus, Save, Scissors, Search, Star, Trash2, X } from "lucide-react"
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

type Filter = "todos" | "vip" | "recorrente" | "aniversariante" | "inadimplente" | "inativo" | "sem_telefone" | "duplicados" | "suspeitos"
type ClientDraft = { id:string; name:string; phone:string; email:string; birthDate:string; preferredBarber:string; address:string; notes:string; tags:ClientTag[] }

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

function whatsappUrl(phone: string, name: string) {
  const digits = normalizePhone(phone)
  if (!digits) return ""
  const brNumber = digits.length <= 11 ? `55${digits}` : digits
  const text = encodeURIComponent(`Olá, ${name}! Tudo bem? Aqui é da Duke Barber.`)
  return `https://wa.me/${brNumber}?text=${text}`
}

export function ClientesClient({ clients }: { clients: Client[] }) {
  const router = useRouter()
  const { appointments, catalog, employees, orders, deleteRecord, updateRecord } = useAppData()
  const [records, setRecords] = useState(clients)
  const [query, setQuery] = useState("")
  const [filter, setFilter] = useState<Filter>("todos")
  const [selectedId, setSelectedId] = useState<string | null>(clients[0]?.id ?? null)
  const [historyOpen, setHistoryOpen] = useState(false)
  const [editing, setEditing] = useState<ClientDraft | null>(null)
  const [editStatus, setEditStatus] = useState("")

  const duplicateKeys = useMemo(() => {
    const keys = records.map((client) => normalizePhone(client.phone) || normalizeName(client.name)).filter(Boolean)
    const counts = new Map<string, number>()
    for (const key of keys) counts.set(key, (counts.get(key) ?? 0) + 1)
    return new Set([...counts.entries()].filter(([, count]) => count > 1).map(([key]) => key))
  }, [records])
  const productNames = useMemo(() => new Set(catalog.map((item) => normalizeName(item.name))), [catalog])
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
        (filter === "aniversariante" ? c.tags.includes("aniversariante") || isBirthdayThisMonth(c.birthDate) : c.tags.includes(filter as ClientTag)) ||
        (filter === "sem_telefone" && !normalizePhone(c.phone)) ||
        (filter === "duplicados" && duplicateKeys.has(normalizePhone(c.phone) || normalizeName(c.name))) ||
        (filter === "suspeitos" && productNames.has(normalizeName(c.name)))
      return matchesQuery && matchesFilter
    })
  }, [records, query, filter, duplicateKeys, productNames])

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
    const values = { name:editing.name.trim(), phone:editing.phone.trim()||null, email:editing.email.trim()||null, birth_date:editing.birthDate||null, preferred_barber:editing.preferredBarber||null, address:editing.address.trim()||null, notes:editing.notes.trim()||null, tags:editing.tags }
    const result = await updateRecord("clients", editing.id, values)
    if (result.error) { setEditStatus(result.error); return }
    setRecords((current) => current.map((client) => client.id === editing.id ? { ...client, name:editing.name.trim(), phone:editing.phone.trim(), email:editing.email.trim(), birthDate:editing.birthDate, preferredBarber:editing.preferredBarber, address:editing.address.trim(), notes:editing.notes.trim(), tags:editing.tags } : client))
    setEditing(null)
  }

  const filters: { key: Filter; label: string }[] = [
    { key: "todos", label: "Todos" },
    { key: "vip", label: "VIP" },
    { key: "recorrente", label: "Recorrentes" },
    { key: "aniversariante", label: "Aniversariantes" },
    { key: "inadimplente", label: "Inadimplentes" },
    { key: "inativo", label: "Inativos" },
    { key: "sem_telefone", label: "Sem telefone" },
    { key: "duplicados", label: "Duplicados" },
    { key: "suspeitos", label: "Suspeitos" },
  ]

  return (
    <div>
      <PageHeader title="Clientes" description="Base de clientes, histórico e relacionamento.">
        <Link href="/clientes/novo" className={buttonVariants({ variant: "gold" })}>
          <Plus className="size-4" />
          Novo cliente
        </Link>
      </PageHeader>

      <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
        <div>
          <Card className="mb-4 p-3">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
              <div className="relative flex-1">
                <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                <Input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Buscar por nome, telefone ou e-mail" className="pl-9" />
              </div>
              <div className="flex flex-wrap gap-1.5">
                {filters.map((f) => (
                  <button
                    key={f.key}
                    onClick={() => setFilter(f.key)}
                    className={`rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
                      filter === f.key ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    {f.label}
                  </button>
                ))}
              </div>
            </div>
          </Card>

          <Card className="overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Cliente</TableHead>
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
                    <TableCell onClick={() => setSelectedId(c.id)} className="cursor-pointer">
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
                    <TableCell className="text-muted-foreground">{c.phone}</TableCell>
                    <TableCell className="text-right tabular-nums">{stats.visits}</TableCell>
                    <TableCell className="text-right font-medium tabular-nums">{formatCurrency(stats.totalSpent)}</TableCell>
                    <TableCell className="text-muted-foreground">{stats.lastVisit ? formatDate(stats.lastVisit) : "-"}</TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="icon-sm" aria-label="Excluir cliente" onClick={() => deleteClient(c.id)}>
                        <Trash2 className="size-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                  )
                })}
                {filtered.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={6} className="py-10 text-center text-muted-foreground">
                      Nenhum cliente encontrado.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </Card>
        </div>

        <div className="lg:sticky lg:top-6 lg:self-start">
          {selected ? (
            <Card className="p-5">
              <div className="mb-4 flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <Avatar name={selected.name} className="size-12 text-base" />
                  <div>
                    <h3 className="font-semibold text-foreground">{selected.name}</h3>
                    <p className="text-sm text-muted-foreground">Cliente desde {formatDate(selected.createdAt)}</p>
                  </div>
                </div>
                <button onClick={() => setSelectedId(null)} className="rounded-md p-1 text-muted-foreground hover:bg-muted hover:text-foreground lg:hidden" aria-label="Fechar">
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
                <div className="flex items-center gap-2 text-muted-foreground"><Phone className="size-4" />{selected.phone}</div>
                {selected.email && <div className="flex items-center gap-2 text-muted-foreground"><Mail className="size-4" />{selected.email}</div>}
                <div className="flex items-center gap-2 text-muted-foreground"><Cake className="size-4" />{formatDate(selected.birthDate)}</div>
                <div className="flex items-center gap-2 text-muted-foreground"><Scissors className="size-4" />Prefere {selected.preferredBarber}</div>
              </div>

              <div className="my-4 grid grid-cols-2 gap-3">
                <div className="rounded-lg bg-muted p-3"><div className="text-xs text-muted-foreground">Visitas</div><div className="text-lg font-semibold text-foreground tabular-nums">{selectedStats?.visits ?? selected.visits}</div></div>
                <div className="rounded-lg bg-muted p-3"><div className="text-xs text-muted-foreground">Total gasto</div><div className="text-lg font-semibold text-foreground tabular-nums">{formatCurrency(selectedStats?.totalSpent ?? selected.totalSpent)}</div></div>
              </div>

              <div className="mb-2 text-sm font-medium text-foreground">Observações</div>
              <p className="mb-4 text-sm text-muted-foreground">{selected.notes || "Sem observações registradas."}</p>

              <div className="flex gap-2">
                <Button variant="outline" size="icon" aria-label={`Editar ${selected.name}`} onClick={() => { setEditStatus(""); setEditing({ id:selected.id, name:selected.name, phone:selected.phone, email:selected.email, birthDate:selected.birthDate, preferredBarber:selected.preferredBarber, address:selected.address, notes:selected.notes, tags:[...selected.tags] }) }}><Pencil className="size-4" /></Button>
                <Button variant="outline" className="flex-1" onClick={() => setHistoryOpen(true)}>Histórico</Button>
                {normalizePhone(selected.phone) ? <a className={buttonVariants({ variant: "outline", size: "icon" })} aria-label={`WhatsApp ${selected.name}`} href={whatsappUrl(selected.phone, selected.name)} target="_blank" rel="noreferrer"><MessageCircle className="size-4" /></a> : null}
                <Button variant="gold" className="flex-1" onClick={() => router.push(`/agenda/novo?cliente=${encodeURIComponent(selected.id)}`)}>Agendar</Button>
                <Button variant="destructive" size="icon" aria-label="Excluir cliente" onClick={() => deleteClient(selected.id)}>
                  <Trash2 className="size-4" />
                </Button>
              </div>
            </Card>
          ) : (
            <Card className="flex h-full min-h-48 items-center justify-center p-6 text-center text-sm text-muted-foreground">
              Selecione um cliente para ver os detalhes.
            </Card>
          )}
        </div>
      </div>

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
          <Field label="Endereço"><Input value={editing.address} onChange={e=>setEditing({...editing,address:e.target.value})}/></Field>
          <div className="space-y-2 sm:col-span-2"><Label>Observações</Label><Textarea value={editing.notes} onChange={e=>setEditing({...editing,notes:e.target.value})}/></div>
          <div className="space-y-2 sm:col-span-2"><Label>Classificação</Label><div className="grid grid-cols-2 gap-2">{([['vip','VIP'],['recorrente','Recorrente'],['aniversariante','Aniversariante'],['inadimplente','Inadimplente'],['inativo','Inativo']] as const).map(([tag,label])=><label key={tag} className="flex items-center justify-between rounded-md border p-2 text-sm"><span>{label}</span><input type="checkbox" checked={editing.tags.includes(tag)} onChange={e=>setEditing({...editing,tags:e.target.checked?[...editing.tags,tag]:editing.tags.filter(item=>item!==tag)})}/></label>)}</div></div>
        </div>{editStatus?<p className="mt-4 text-sm text-destructive">{editStatus}</p>:null}<div className="mt-5 flex justify-end gap-2"><Button variant="outline" onClick={()=>setEditing(null)}>Cancelar</Button><Button variant="gold" onClick={saveClient}><Save className="size-4"/>Salvar alterações</Button></div></>:null}
      </Dialog>
    </div>
  )
}

function Field({label,children}:{label:string;children:React.ReactNode}) { return <div className="space-y-2"><Label>{label}</Label>{children}</div> }
