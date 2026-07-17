'use client'

import { ArrowDownCircle, ArrowUpCircle, Download, Wallet } from 'lucide-react'
import * as React from 'react'
import { PageHeader } from '@/components/page-header'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { useAppData } from '@/components/data/app-data-provider'
import { formatCurrency, formatDate } from '@/lib/format'
import { getStoredOrders } from '@/lib/orders-storage'
import type { FinancialEntry } from '@/lib/types'

const METHOD_LABEL: Record<string, string> = {
  dinheiro: 'Dinheiro',
  pix: 'Pix',
  credito: 'Crédito',
  debito: 'Débito',
  outro: 'Outro',
}

export default function FinanceiroPage() {
  const { financialEntries } = useAppData()
  const [localEntries, setLocalEntries] = React.useState<FinancialEntry[]>([])
  const entries = [...localEntries, ...financialEntries].sort((a, b) => b.date.localeCompare(a.date))
  const byMethod = Object.entries(METHOD_LABEL).map(([method, label]) => ({
    method: label,
    value: entries
      .filter((entry) => entry.type === 'entrada' && entry.method === method)
      .reduce((sum, entry) => sum + entry.amount, 0),
  }))
  const income = entries.filter((e) => e.type === 'entrada').reduce((sum, entry) => sum + entry.amount, 0)
  const outcome = entries.filter((e) => e.type === 'saida').reduce((sum, entry) => sum + entry.amount, 0)
  const balance = income - outcome

  React.useEffect(() => {
    const entriesFromOrders = getStoredOrders()
      .filter((order) => order.status === 'paga')
      .map<FinancialEntry>((order) => ({
        id: `fin_${order.id}`,
        barbershopId: order.barbershopId,
        type: 'entrada',
        category: 'Comandas',
        description: `Comanda #${order.number}`,
        amount: order.total,
        method: order.method,
        date: order.createdAt,
      }))
    setLocalEntries(entriesFromOrders)
  }, [])

  return (
    <div>
      <PageHeader
        title="Financeiro"
        description="Fluxo de caixa, entradas, saídas e distribuição por método de pagamento."
      >
        <Button variant="outline" size="sm">
          <Download className="size-4" />
          Exportar
        </Button>
      </PageHeader>

      <div className="mb-4 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Card className="p-4">
          <p className="text-sm text-muted-foreground">Entradas</p>
          <p className="mt-1 text-2xl font-bold text-success">{formatCurrency(income)}</p>
        </Card>
        <Card className="p-4">
          <p className="text-sm text-muted-foreground">Saídas</p>
          <p className="mt-1 text-2xl font-bold text-destructive">{formatCurrency(outcome)}</p>
        </Card>
        <Card className="p-4">
          <p className="text-sm text-muted-foreground">Saldo</p>
          <p className="mt-1 text-2xl font-bold text-foreground">{formatCurrency(balance)}</p>
        </Card>
        <Card className="p-4">
          <p className="text-sm text-muted-foreground">Lançamentos</p>
          <p className="mt-1 text-2xl font-bold text-foreground">{entries.length}</p>
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-[1fr_320px]">
        <Card className="overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Data</TableHead>
                <TableHead>Descrição</TableHead>
                <TableHead>Categoria</TableHead>
                <TableHead>Método</TableHead>
                <TableHead>Tipo</TableHead>
                <TableHead className="text-right">Valor</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {entries.map((entry) => (
                <TableRow key={entry.id}>
                  <TableCell className="text-muted-foreground">{formatDate(entry.date)}</TableCell>
                  <TableCell className="font-medium text-foreground">{entry.description}</TableCell>
                  <TableCell>{entry.category}</TableCell>
                  <TableCell className="text-muted-foreground">
                    {entry.method ? METHOD_LABEL[entry.method] : 'A definir'}
                  </TableCell>
                  <TableCell>
                    <Badge variant={entry.type === 'entrada' ? 'success' : 'destructive'}>
                      {entry.type === 'entrada' ? 'Entrada' : 'Saída'}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right font-semibold tabular-nums">
                    {entry.type === 'entrada' ? '+' : '-'}
                    {formatCurrency(entry.amount)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>

        <Card className="p-5">
          <h3 className="mb-4 flex items-center gap-2 font-semibold text-foreground">
            <Wallet className="size-4 text-muted-foreground" />
            Métodos de pagamento
          </h3>
          <div className="space-y-4">
            {byMethod.map((item) => {
              const total = byMethod.reduce((sum, current) => sum + current.value, 0)
              const width = total > 0 ? (item.value / total) * 100 : 0
              return (
                <div key={item.method}>
                  <div className="mb-1 flex justify-between gap-3 text-sm">
                    <span className="font-medium text-foreground">{item.method}</span>
                    <span className="tabular-nums text-muted-foreground">{formatCurrency(item.value)}</span>
                  </div>
                  <div className="h-2 overflow-hidden rounded-full bg-muted">
                    <div className="h-full rounded-full bg-primary" style={{ width: `${width}%` }} />
                  </div>
                </div>
              )
            })}
          </div>
          <div className="mt-5 grid grid-cols-2 gap-3 border-t border-border pt-4">
            <div className="flex items-center gap-2">
              <ArrowUpCircle className="size-4 text-success" />
              <span className="text-sm text-muted-foreground">Entradas</span>
            </div>
            <div className="flex items-center gap-2">
              <ArrowDownCircle className="size-4 text-destructive" />
              <span className="text-sm text-muted-foreground">Saídas</span>
            </div>
          </div>
        </Card>
      </div>
    </div>
  )
}
