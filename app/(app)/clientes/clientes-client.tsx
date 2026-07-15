"use client"

import Link from "next/link"
import { useMemo, useState } from "react"
import { Cake, Mail, Phone, Plus, Save, Scissors, Search, Star, Trash2, X } from "lucide-react"
import type { Client, ClientTag } from "@/lib/types"
import { formatCurrency, formatDate } from "@/lib/format"
import { Input } from "@/components/ui/input"
import { Button, buttonVariants } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Avatar } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { PageHeader } from "@/components/page-header"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"

type Filter = "todos" | "vip" | "recorrente" | "inadimplente" | "inativo"

const TAG_LABEL: Record<ClientTag, string> = {
  vip: "VIP",
  recorrente: "Recorrente",
  inativo: "Inativo",
  inadimplente: "Inadimplente",
  aniversariante: "Aniversariante",
}

export function ClientesClient({ clients }: { clients: Client[] }) {
  const [records, setRecords] = useState(clients)
  const [query, setQuery] = useState("")
  const [filter, setFilter] = useState<Filter>("todos")
  const [selectedId, setSelectedId] = useState<string | null>(clients[0]?.id ?? null)
  const [saved, setSaved] = useState(false)

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    return records.filter((c) => {
      const matchesQuery =
        !q ||
        c.name.toLowerCase().includes(q) ||
        c.phone.toLowerCase().includes(q) ||
        c.email.toLowerCase().includes(q)
      const matchesFilter = filter === "todos" || c.tags.includes(filter as ClientTag)
      return matchesQuery && matchesFilter
    })
  }, [records, query, filter])

  const selected = records.find((c) => c.id === selectedId) ?? null

  function deleteClient(id: string) {
    setRecords((current) => current.filter((client) => client.id !== id))
    if (selectedId === id) setSelectedId(null)
    setSaved(false)
  }

  const filters: { key: Filter; label: string }[] = [
    { key: "todos", label: "Todos" },
    { key: "vip", label: "VIP" },
    { key: "recorrente", label: "Recorrentes" },
    { key: "inadimplente", label: "Inadimplentes" },
    { key: "inativo", label: "Inativos" },
  ]

  return (
    <div>
      <PageHeader title="Clientes" description="Base de clientes, histórico e relacionamento.">
        {saved ? <span className="text-sm font-medium text-success">Alterações salvas</span> : null}
        <Button variant="outline" onClick={() => setSaved(true)}>
          <Save className="size-4" />
          Salvar
        </Button>
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
                {filtered.map((c) => (
                  <TableRow key={c.id} className={selectedId === c.id ? "bg-accent/40" : ""}>
                    <TableCell onClick={() => setSelectedId(c.id)} className="cursor-pointer">
                      <div className="flex items-center gap-3">
                        <Avatar name={c.name} />
                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5 font-medium text-foreground">
                            <span className="truncate">{c.name}</span>
                            {c.tags.includes("vip") && <Star className="size-3.5 shrink-0 fill-[var(--gold)] text-[var(--gold)]" />}
                          </div>
                          <div className="text-xs text-muted-foreground">{c.favoriteService}</div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="text-muted-foreground">{c.phone}</TableCell>
                    <TableCell className="text-right tabular-nums">{c.visits}</TableCell>
                    <TableCell className="text-right font-medium tabular-nums">{formatCurrency(c.totalSpent)}</TableCell>
                    <TableCell className="text-muted-foreground">{c.lastVisit ? formatDate(c.lastVisit) : "-"}</TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="icon-sm" aria-label="Excluir cliente" onClick={() => deleteClient(c.id)}>
                        <Trash2 className="size-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
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
              </div>

              <div className="space-y-2 text-sm">
                <div className="flex items-center gap-2 text-muted-foreground"><Phone className="size-4" />{selected.phone}</div>
                {selected.email && <div className="flex items-center gap-2 text-muted-foreground"><Mail className="size-4" />{selected.email}</div>}
                <div className="flex items-center gap-2 text-muted-foreground"><Cake className="size-4" />{formatDate(selected.birthDate)}</div>
                <div className="flex items-center gap-2 text-muted-foreground"><Scissors className="size-4" />Prefere {selected.preferredBarber}</div>
              </div>

              <div className="my-4 grid grid-cols-2 gap-3">
                <div className="rounded-lg bg-muted p-3"><div className="text-xs text-muted-foreground">Visitas</div><div className="text-lg font-semibold text-foreground tabular-nums">{selected.visits}</div></div>
                <div className="rounded-lg bg-muted p-3"><div className="text-xs text-muted-foreground">Total gasto</div><div className="text-lg font-semibold text-foreground tabular-nums">{formatCurrency(selected.totalSpent)}</div></div>
              </div>

              <div className="mb-2 text-sm font-medium text-foreground">Observações</div>
              <p className="mb-4 text-sm text-muted-foreground">{selected.notes || "Sem observações registradas."}</p>

              <div className="flex gap-2">
                <Button variant="outline" className="flex-1">Histórico</Button>
                <Button variant="gold" className="flex-1">Agendar</Button>
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
    </div>
  )
}
