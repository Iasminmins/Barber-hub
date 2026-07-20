"use client"

import Link from "next/link"
import { useMemo, useState } from "react"
import { AlertTriangle, Clock, Package, Plus, Scissors, Search, Trash2 } from "lucide-react"
import type { CatalogItem, CatalogType } from "@/lib/types"
import { useAppData } from '@/components/data/app-data-provider'
import { formatCurrency, formatPercent } from "@/lib/format"
import { Input } from "@/components/ui/input"
import { Button, buttonVariants } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
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

export function CatalogoClient({ items }: { items: CatalogItem[] }) {
  const { deleteRecord } = useAppData()
  const [records, setRecords] = useState(items)
  const [tab, setTab] = useState<CatalogType>("servico")
  const [query, setQuery] = useState("")

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
                    <Button variant="ghost" size="icon-sm" aria-label="Excluir item" onClick={() => deleteItem(i.id)}>
                      <Trash2 className="size-4" />
                    </Button>
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
    </div>
  )
}
