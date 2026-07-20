"use client"

import Link from "next/link"
import { useMemo, useState } from "react"
import { AlertTriangle, Clock, Package, Pencil, Plus, Save, Scissors, Search, Trash2 } from "lucide-react"
import type { CatalogItem, CatalogType } from "@/lib/types"
import { useAppData } from '@/components/data/app-data-provider'
import { formatCurrency, formatPercent } from "@/lib/format"
import { Input } from "@/components/ui/input"
import { Button, buttonVariants } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogHeader } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Select } from "@/components/ui/select"
import { PageHeader } from "@/components/page-header"
import { Tabs } from "@/components/ui/tabs"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"

function margin(item: CatalogItem) {
  if (item.price <= 0) return 0
  return ((item.price - item.cost) / item.price) * 100
}

type CatalogDraft = {
  id: string
  type: CatalogType
  name: string
  category: string
  price: string
  cost: string
  durationMin: string
  stock: string
  minStock: string
  commission: string
  active: boolean
}

function createDraft(item: CatalogItem): CatalogDraft {
  return {
    id: item.id,
    type: item.type,
    name: item.name,
    category: item.category,
    price: String(item.price),
    cost: String(item.cost),
    durationMin: String(item.durationMin ?? ""),
    stock: String(item.stock ?? ""),
    minStock: String(item.minStock ?? ""),
    commission: String(item.commission),
    active: item.active,
  }
}

function parseDecimal(value: string) {
  const cleaned = value.trim().replace(/\s/g, "")
  const normalized = cleaned.includes(",")
    ? cleaned.replace(/\./g, "").replace(",", ".")
    : cleaned
  return Number(normalized)
}

export function CatalogoClient({ items }: { items: CatalogItem[] }) {
  const { deleteRecord, updateRecord } = useAppData()
  const [records, setRecords] = useState(items)
  const [tab, setTab] = useState<CatalogType>("servico")
  const [query, setQuery] = useState("")
  const [editing, setEditing] = useState<CatalogDraft | null>(null)
  const [editStatus, setEditStatus] = useState("")
  const [saving, setSaving] = useState(false)

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    return records
      .filter((i) => i.type === tab)
      .filter((i) => !q || i.name.toLowerCase().includes(q) || i.category.toLowerCase().includes(q))
  }, [records, tab, query])

  const services = records.filter((i) => i.type === "servico")
  const products = records.filter((i) => i.type === "produto")
  const lowStock = products.filter((p) => (p.stock ?? 0) <= (p.minStock ?? 0)).length
  const inventoryValue = products.reduce((s, p) => s + (p.stock ?? 0) * p.cost, 0)

  async function deleteItem(id: string) {
    if (!window.confirm('Excluir este item?')) return
    const result = await deleteRecord('catalog_items', id)
    if (result.error) { window.alert(result.error); return }
    setRecords((current) => current.filter((item) => item.id !== id))
  }

  function setDraft<K extends keyof CatalogDraft>(key: K, value: CatalogDraft[K]) {
    setEditing((current) => current ? { ...current, [key]: value } : current)
  }

  async function saveEdit() {
    if (!editing) return

    const price = parseDecimal(editing.price)
    const cost = parseDecimal(editing.cost)
    const commission = parseDecimal(editing.commission)
    const durationMin = parseDecimal(editing.durationMin)
    const stock = parseDecimal(editing.stock)
    const minStock = parseDecimal(editing.minStock)

    if (!editing.name.trim()) { setEditStatus("Informe o nome do item."); return }
    if (!Number.isFinite(price) || price < 0) { setEditStatus("Informe um preço válido."); return }
    if (!Number.isFinite(cost) || cost < 0) { setEditStatus("Informe um custo válido."); return }
    if (!Number.isFinite(commission) || commission < 0 || commission > 100) { setEditStatus("A comissão deve estar entre 0% e 100%."); return }
    if (editing.type === "servico" && (!Number.isFinite(durationMin) || durationMin <= 0)) { setEditStatus("Informe uma duração maior que zero."); return }
    if (editing.type === "produto" && (!Number.isFinite(stock) || stock < 0 || !Number.isFinite(minStock) || minStock < 0)) { setEditStatus("Informe valores de estoque válidos."); return }

    setSaving(true)
    setEditStatus("")
    const values = {
      type: editing.type,
      name: editing.name.trim(),
      category: editing.category.trim() || null,
      price,
      cost,
      commission,
      duration_min: editing.type === "servico" ? durationMin : null,
      stock: editing.type === "produto" ? stock : null,
      min_stock: editing.type === "produto" ? minStock : null,
      active: editing.active,
    }
    const result = await updateRecord("catalog_items", editing.id, values)
    setSaving(false)
    if (result.error) { setEditStatus(result.error); return }

    setRecords((current) => current.map((item) => item.id === editing.id ? {
      ...item,
      type: editing.type,
      name: editing.name.trim(),
      category: editing.category.trim(),
      price,
      cost,
      commission,
      durationMin: editing.type === "servico" ? durationMin : undefined,
      stock: editing.type === "produto" ? stock : undefined,
      minStock: editing.type === "produto" ? minStock : undefined,
      active: editing.active,
    } : item))
    setEditing(null)
  }

  return (
    <div>
      <PageHeader title="Produtos & Serviços" description="Catálogo, preços, comissões e controle de estoque.">
        <Link href="/catalogo/novo" className={buttonVariants({ variant: "gold" })}>
          <Plus className="size-4" />
          {tab === "servico" ? "Novo serviço" : "Novo produto"}
        </Link>
      </PageHeader>

      <div className="mb-4 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Card className="p-4">
          <p className="text-sm text-muted-foreground">Serviços ativos</p>
          <p className="mt-1 text-2xl font-bold text-foreground">{services.filter((s) => s.active).length}</p>
        </Card>
        <Card className="p-4">
          <p className="text-sm text-muted-foreground">Produtos ativos</p>
          <p className="mt-1 text-2xl font-bold text-foreground">{products.filter((p) => p.active).length}</p>
        </Card>
        <Card className="p-4">
          <p className="text-sm text-muted-foreground">Valor em estoque</p>
          <p className="mt-1 text-2xl font-bold text-foreground">{formatCurrency(inventoryValue)}</p>
        </Card>
        <Card className="p-4">
          <p className="text-sm text-muted-foreground">Estoque baixo</p>
          <p className="mt-1 flex items-center gap-1.5 text-2xl font-bold text-foreground">
            {lowStock}
            {lowStock > 0 && <AlertTriangle className="size-4 text-warning-foreground" />}
          </p>
        </Card>
      </div>

      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <Tabs
          items={[
            { value: "servico", label: "Serviços" },
            { value: "produto", label: "Produtos" },
          ]}
          value={tab}
          onValueChange={(v) => setTab(v as CatalogType)}
        />
        <div className="relative sm:w-72">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Buscar no catálogo" className="pl-9" />
        </div>
      </div>

      <Card className="overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{tab === "servico" ? "Serviço" : "Produto"}</TableHead>
              <TableHead>Categoria</TableHead>
              <TableHead className="text-right">Preço</TableHead>
              <TableHead className="text-right">Custo</TableHead>
              <TableHead className="text-right">Margem</TableHead>
              {tab === "servico" ? <TableHead className="text-right">Duração</TableHead> : <TableHead className="text-right">Estoque</TableHead>}
              <TableHead className="text-right">Comissão</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.map((i) => {
              const low = i.type === "produto" && (i.stock ?? 0) <= (i.minStock ?? 0)
              return (
                <TableRow key={i.id}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <span className="flex size-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
                        {i.type === "servico" ? <Scissors className="size-4" /> : <Package className="size-4" />}
                      </span>
                      <span className="font-medium text-foreground">{i.name}</span>
                    </div>
                  </TableCell>
                  <TableCell className="text-muted-foreground">{i.category}</TableCell>
                  <TableCell className="text-right font-medium tabular-nums">{formatCurrency(i.price)}</TableCell>
                  <TableCell className="text-right tabular-nums text-muted-foreground">{formatCurrency(i.cost)}</TableCell>
                  <TableCell className="text-right tabular-nums">{formatPercent(margin(i))}</TableCell>
                  {i.type === "servico" ? (
                    <TableCell className="text-right tabular-nums text-muted-foreground">
                      <span className="inline-flex items-center gap-1"><Clock className="size-3.5" />{i.durationMin} min</span>
                    </TableCell>
                  ) : (
                    <TableCell className="text-right tabular-nums">
                      <span className={low ? "font-semibold text-destructive" : "text-foreground"}>{i.stock} un.</span>
                      <span className="text-muted-foreground"> / mín {i.minStock}</span>
                    </TableCell>
                  )}
                  <TableCell className="text-right tabular-nums text-muted-foreground">{formatPercent(i.commission)}</TableCell>
                  <TableCell>{i.active ? <Badge variant="success">Ativo</Badge> : <Badge variant="secondary">Inativo</Badge>}</TableCell>
                  <TableCell className="text-right">
                    <div className="inline-flex items-center gap-1">
                      <Button variant="ghost" size="icon-sm" aria-label={`Editar ${i.name}`} onClick={() => { setEditStatus(""); setEditing(createDraft(i)) }}>
                        <Pencil className="size-4" />
                      </Button>
                      <Button variant="ghost" size="icon-sm" aria-label={`Excluir ${i.name}`} onClick={() => deleteItem(i.id)}>
                        <Trash2 className="size-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              )
            })}
            {filtered.length === 0 && (
              <TableRow>
                <TableCell colSpan={9} className="py-10 text-center text-muted-foreground">Nenhum item encontrado.</TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </Card>

      <Dialog open={Boolean(editing)} onClose={() => { if (!saving) setEditing(null) }} className="sm:max-w-2xl">
        {editing ? (
          <>
            <DialogHeader title="Editar item" description="Corrija as informações e salve para atualizar o catálogo." />
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Tipo">
                <Select value={editing.type} onChange={(event) => setDraft("type", event.target.value as CatalogType)} disabled={saving}>
                  <option value="servico">Serviço</option>
                  <option value="produto">Produto</option>
                </Select>
              </Field>
              <Field label="Categoria"><Input value={editing.category} onChange={(event) => setDraft("category", event.target.value)} disabled={saving} /></Field>
              <Field label="Nome"><Input value={editing.name} onChange={(event) => setDraft("name", event.target.value)} disabled={saving} autoFocus /></Field>
              <Field label="Preço"><Input inputMode="decimal" value={editing.price} onChange={(event) => setDraft("price", event.target.value)} disabled={saving} /></Field>
              <Field label="Custo"><Input inputMode="decimal" value={editing.cost} onChange={(event) => setDraft("cost", event.target.value)} disabled={saving} /></Field>
              <Field label="Comissão (%)"><Input type="number" min="0" max="100" value={editing.commission} onChange={(event) => setDraft("commission", event.target.value)} disabled={saving} /></Field>
              {editing.type === "servico" ? (
                <Field label="Duração (minutos)"><Input type="number" min="1" value={editing.durationMin} onChange={(event) => setDraft("durationMin", event.target.value)} disabled={saving} /></Field>
              ) : (
                <>
                  <Field label="Estoque"><Input type="number" min="0" value={editing.stock} onChange={(event) => setDraft("stock", event.target.value)} disabled={saving} /></Field>
                  <Field label="Estoque mínimo"><Input type="number" min="0" value={editing.minStock} onChange={(event) => setDraft("minStock", event.target.value)} disabled={saving} /></Field>
                </>
              )}
              <Field label="Status">
                <Select value={editing.active ? "ativo" : "inativo"} onChange={(event) => setDraft("active", event.target.value === "ativo")} disabled={saving}>
                  <option value="ativo">Ativo</option>
                  <option value="inativo">Inativo</option>
                </Select>
              </Field>
            </div>
            {editStatus ? <p role="alert" className="mt-4 text-sm text-destructive">{editStatus}</p> : null}
            <div className="mt-6 flex justify-end gap-2">
              <Button variant="outline" onClick={() => setEditing(null)} disabled={saving}>Cancelar</Button>
              <Button variant="gold" onClick={saveEdit} disabled={saving}>
                <Save className="size-4" />
                {saving ? "Salvando..." : "Salvar alterações"}
              </Button>
            </div>
          </>
        ) : null}
      </Dialog>
    </div>
  )
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <div className="space-y-2"><Label>{label}</Label>{children}</div>
}
