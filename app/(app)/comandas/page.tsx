'use client'

import Link from 'next/link'
import { CalendarDays, CreditCard, Plus, Printer, Receipt, Trash2, Upload } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { PageHeader } from '@/components/page-header'
import { StatusBadge } from '@/components/status-badge'
import { Badge } from '@/components/ui/badge'
import { Button, buttonVariants } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
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

const METHOD_LABEL: Record<string, string> = {
  dinheiro: 'Dinheiro',
  pix: 'Pix',
  credito: 'Crédito',
  debito: 'Débito',
  outro: 'Outro',
}

function toDateKey(value: string | null | undefined) {
  if (!value) return ''
  const key = value.slice(0, 10)
  return /^\d{4}-\d{2}-\d{2}$/.test(key) ? key : ''
}

function toMonthKey(value: string | null | undefined) {
  const key = toDateKey(value)
  return key ? key.slice(0, 7) : ''
}

function todayKey() {
  const today = new Date()
  const year = today.getFullYear()
  const month = String(today.getMonth() + 1).padStart(2, '0')
  const day = String(today.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

function getLatestOrderMonth(orders: { createdAt: string }[]) {
  const latest = orders
    .map((order) => toDateKey(order.createdAt))
    .filter(Boolean)
    .sort()
    .at(-1)

  return latest ? latest.slice(0, 7) : todayKey().slice(0, 7)
}

function formatOrderDateTime(value: string) {
  if (!value) return '-'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return formatDate(value)
  return new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date)
}

export default function ComandasPage() {
  const { orders: databaseOrders, deleteRecord } = useAppData()
  const [orders, setOrders] = useState(() => [...databaseOrders].sort((a, b) => b.number - a.number))
  const [selectedMonth, setSelectedMonth] = useState(() => getLatestOrderMonth(databaseOrders))

  useEffect(() => {
    const nextOrders = [...databaseOrders].sort((a, b) => b.number - a.number)
    setOrders(nextOrders)
    setSelectedMonth((current) => {
      if (current && nextOrders.some((order) => toMonthKey(order.createdAt) === current)) return current
      return getLatestOrderMonth(nextOrders)
    })
  }, [databaseOrders])

  const monthOrders = useMemo(
    () => orders.filter((order) => toMonthKey(order.createdAt) === selectedMonth),
    [orders, selectedMonth],
  )

  const metrics = useMemo(() => {
    const paid = monthOrders.filter((o) => o.status === 'paga')
    const open = monthOrders.filter((o) => o.status === 'aberta')
    const pending = monthOrders.filter((o) => o.status === 'pendente')
    const revenue = paid
      .filter((order) => toDateKey(order.createdAt) === todayKey())
      .reduce((sum, order) => sum + order.total, 0)
    return { paid, open, pending, revenue }
  }, [monthOrders])

  async function deleteOrder(id: string) {
    if (!window.confirm('Excluir esta comanda?')) return
    const result = await deleteRecord('orders', id)
    if (result.error) { window.alert(result.error); return }
    setOrders((current) => current.filter((order) => order.id !== id))
  }

  return (
    <div>
      <PageHeader
        title="Comandas / PDV"
        description="Acompanhe comandas abertas, pagamentos, itens vendidos e pendências do balcão."
      >
        <Link href="/importacao" className={buttonVariants({ variant: 'outline', size: 'sm' })}>
          <Upload className="size-4" />
          Importar CSV
        </Link>
        <Button variant="outline" size="sm" onClick={() => window.print()}>
          <Printer className="size-4" />
          Imprimir resumo
        </Button>
        <Link href="/comandas/nova" className={buttonVariants({ variant: 'gold', size: 'sm' })}>
          <Plus className="size-4" />
          Nova comanda
        </Link>
      </PageHeader>

      <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-sm font-semibold text-foreground">Mês exibido</p>
          <p className="text-sm text-muted-foreground">A lista e os indicadores abaixo seguem este mês.</p>
        </div>
        <Input
          type="month"
          value={selectedMonth}
          onChange={(event) => setSelectedMonth(event.target.value)}
          className="h-10 w-full bg-card sm:w-44"
          aria-label="Mês das comandas"
        />
      </div>

      <div className="mb-4 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Card className="p-4">
          <p className="text-sm text-muted-foreground">Recebido hoje</p>
          <p className="mt-1 text-2xl font-bold text-foreground">{formatCurrency(metrics.revenue)}</p>
        </Card>
        <Card className="p-4">
          <p className="text-sm text-muted-foreground">Pagas no mês</p>
          <p className="mt-1 text-2xl font-bold text-foreground">{metrics.paid.length}</p>
        </Card>
        <Card className="p-4">
          <p className="text-sm text-muted-foreground">Abertas</p>
          <p className="mt-1 text-2xl font-bold text-foreground">{metrics.open.length}</p>
        </Card>
        <Card className="p-4">
          <p className="text-sm text-muted-foreground">Pendentes</p>
          <p className="mt-1 text-2xl font-bold text-foreground">{metrics.pending.length}</p>
        </Card>
      </div>

      <Card className="overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Comanda</TableHead>
              <TableHead>Data</TableHead>
              <TableHead>Cliente</TableHead>
              <TableHead>Itens</TableHead>
              <TableHead>Responsável</TableHead>
              <TableHead>Pagamento</TableHead>
              <TableHead className="text-right">Total</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {monthOrders.map((order) => (
              <TableRow key={order.id}>
                <TableCell>
                  <div className="flex items-center gap-3">
                    <span className="flex size-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
                      <Receipt className="size-4" />
                    </span>
                    <div>
                      <p className="font-medium text-foreground">#{order.number}</p>
                    </div>
                  </div>
                </TableCell>
                <TableCell className="text-muted-foreground">
                  <span className="inline-flex items-center gap-1.5 text-sm">
                    <CalendarDays className="size-4" />
                    {formatOrderDateTime(order.createdAt)}
                  </span>
                </TableCell>
                <TableCell className="font-medium text-foreground">{order.clientName}</TableCell>
                <TableCell>
                  <div className="flex max-w-72 flex-wrap gap-1">
                    {order.items.map((item) => (
                      <Badge key={item.id} variant={item.type === 'servico' ? 'default' : 'gold'}>
                        {item.quantity}x {item.name}
                      </Badge>
                    ))}
                  </div>
                </TableCell>
                <TableCell className="text-muted-foreground">{order.employeeName}</TableCell>
                <TableCell>
                  {order.method ? (
                    <span className="inline-flex items-center gap-1.5 text-sm text-foreground">
                      <CreditCard className="size-4 text-muted-foreground" />
                      {METHOD_LABEL[order.method]}
                    </span>
                  ) : (
                    <span className="text-sm text-muted-foreground">A definir</span>
                  )}
                </TableCell>
                <TableCell className="text-right font-semibold tabular-nums">
                  {formatCurrency(order.total)}
                </TableCell>
                <TableCell>
                  <StatusBadge status={order.status} />
                </TableCell>
                <TableCell className="text-right">
                  <Button variant="ghost" size="icon-sm" aria-label="Excluir comanda" onClick={() => deleteOrder(order.id)}>
                    <Trash2 className="size-4" />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
            {monthOrders.length === 0 ? (
              <TableRow>
                <TableCell colSpan={9} className="py-10 text-center text-muted-foreground">
                  Nenhuma comanda cadastrada.
                </TableCell>
              </TableRow>
            ) : null}
          </TableBody>
        </Table>
      </Card>
    </div>
  )
}
