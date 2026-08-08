'use client'

import Link from 'next/link'
import { CalendarDays, CreditCard, Crown, MessageCircle, Minus, Pencil, Plus, Printer, Receipt, Save, Trash2, Upload } from 'lucide-react'
import { useEffect, useMemo, useRef, useState } from 'react'
import { PageHeader } from '@/components/page-header'
import { StatusBadge } from '@/components/status-badge'
import { Badge } from '@/components/ui/badge'
import { Button, buttonVariants } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Dialog, DialogHeader } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
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
import { createBrowserSupabaseClient } from '@/lib/supabase/client'
import type { Order, OrderItem, OrderStatus, PaymentMethod } from '@/lib/types'
import { orderMessage, whatsappUrl } from '@/lib/whatsapp'
import { shouldCompleteLinkedAppointment } from '@/lib/order-appointment-sync'

type EditableOrder = Omit<Order, 'items'> & { items: OrderItem[] }

const METHOD_LABEL: Record<string, string> = {
  dinheiro: 'Dinheiro',
  pix: 'Pix',
  credito: 'Crédito',
  debito: 'Débito',
  outro: 'Outro',
}

const STATUS_LABEL: Record<OrderStatus, string> = {
  aberta: 'Aberta',
  pendente: 'Pendente',
  paga: 'Paga',
  cancelada: 'Cancelada',
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

function normalizeName(value: string | null | undefined) {
  return String(value ?? '')
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/\s+/g, ' ')
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

function sortOrdersByDate(orders: Order[]) {
  return [...orders].sort((a, b) => {
    const dateComparison = toDateKey(b.createdAt).localeCompare(toDateKey(a.createdAt))
    return dateComparison || b.number - a.number
  })
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

function toDateTimeLocal(value: string) {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return ''
  const offset = date.getTimezoneOffset() * 60000
  return new Date(date.getTime() - offset).toISOString().slice(0, 16)
}

export default function ComandasPage() {
  const { barbershop, catalog, clients, employees, orders: databaseOrders, subscriptions, deleteRecord, updateRecord } = useAppData()
  const [orders, setOrders] = useState(() => sortOrdersByDate(databaseOrders))
  const [selectedMonth, setSelectedMonth] = useState(() => getLatestOrderMonth(databaseOrders))
  const [editingOrder, setEditingOrder] = useState<EditableOrder | null>(null)
  const [editingDate, setEditingDate] = useState('')
  const [editError, setEditError] = useState('')
  const [savingOrder, setSavingOrder] = useState(false)
  const openedOrderId = useRef('')
  const [whatsAppDraft, setWhatsAppDraft] = useState<{
    orderNumber: number
    clientName: string
    phone: string
    message: string
  } | null>(null)

  useEffect(() => {
    const nextOrders = sortOrdersByDate(databaseOrders)
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
  const planClients = useMemo(() => {
    const names = new Set<string>()
    for (const client of clients) {
      if (client.tags.includes('recorrente')) names.add(normalizeName(client.name))
    }
    for (const subscription of subscriptions) {
      if (['ativo', 'vencendo'].includes(subscription.status)) {
        if (subscription.clientId) names.add(subscription.clientId)
        names.add(normalizeName(subscription.clientName))
      }
    }
    return names
  }, [clients, subscriptions])

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
    const order = orders.find((item) => item.id === id)
    if (order) {
      const supabase = createBrowserSupabaseClient()
      const financeResult = await supabase
        .from('financial_entries')
        .delete()
        .eq('barbershop_id', barbershop.id)
        .eq('category', 'Comandas')
        .eq('description', `Comanda #${order.number}`)
      if (financeResult.error) { window.alert(financeResult.error.message); return }
    }
    const result = await deleteRecord('orders', id)
    if (result.error) { window.alert(result.error); return }
    setOrders((current) => current.filter((order) => order.id !== id))
  }

  function openOrderEditor(order: Order) {
    setEditError('')
    setEditingDate(toDateTimeLocal(order.createdAt))
    setEditingOrder({ ...order, items: order.items.map((item) => ({ ...item })) })
  }

  useEffect(() => {
    const requestedOrderId = new URLSearchParams(window.location.search).get('order') ?? ''
    if (!requestedOrderId || openedOrderId.current === requestedOrderId) return
    const requestedOrder = orders.find((order) => order.id === requestedOrderId)
    if (!requestedOrder) return

    openedOrderId.current = requestedOrderId
    setSelectedMonth(toMonthKey(requestedOrder.createdAt))
    openOrderEditor(requestedOrder)
  }, [orders])

  function sendOrderByWhatsApp(order: Order) {
    const client = clients.find((item) => (
      item.id === order.clientId
      || normalizeName(item.name) === normalizeName(order.clientName)
    ))
    if (!client?.phone) {
      window.alert(`O cliente ${order.clientName} não possui telefone cadastrado.`)
      return
    }

    const message = orderMessage({
      clientName: order.clientName,
      orderNumber: order.number,
      items: order.items,
      discount: order.discount,
      surcharge: order.surcharge,
      total: order.total,
      payment: order.method ? METHOD_LABEL[order.method] : 'A definir',
      status: STATUS_LABEL[order.status],
      barbershopName: barbershop.name,
    })
    setWhatsAppDraft({
      orderNumber: order.number,
      clientName: order.clientName,
      phone: client.phone,
      message,
    })
  }

  function confirmWhatsAppSend() {
    if (!whatsAppDraft?.message.trim()) return
    const url = whatsappUrl(whatsAppDraft.phone, whatsAppDraft.message.trim())
    if (!url) {
      window.alert(`O telefone cadastrado para ${whatsAppDraft.clientName} é inválido.`)
      return
    }
    window.open(url, '_blank', 'noopener,noreferrer')
    setWhatsAppDraft(null)
  }

  function updateEditingItem(index: number, values: Partial<OrderItem>) {
    setEditingOrder((current) => current ? {
      ...current,
      items: current.items.map((item, itemIndex) => itemIndex === index ? { ...item, ...values } : item),
    } : current)
  }

  function addCatalogItem(refId: string) {
    const item = catalog.find((catalogItem) => catalogItem.id === refId)
    if (!item) return
    setEditingOrder((current) => {
      if (!current) return current
      const existingIndex = current.items.findIndex((orderItem) => orderItem.refId === item.id)
      if (existingIndex >= 0) {
        return {
          ...current,
          items: current.items.map((orderItem, index) => index === existingIndex
            ? { ...orderItem, quantity: orderItem.quantity + 1 }
            : orderItem),
        }
      }
      return {
        ...current,
        items: [...current.items, {
          id: `new-${crypto.randomUUID()}`,
          refId: item.id,
          type: item.type,
          name: item.name,
          quantity: 1,
          unitPrice: item.price,
        }],
      }
    })
  }

  async function saveEditedOrder() {
    if (!editingOrder) return
    const employee = employees.find((item) => item.id === editingOrder.employeeId)
    const client = clients.find((item) => item.id === editingOrder.clientId)
    const validItems = editingOrder.items.filter((item) => item.name.trim() && item.quantity > 0 && item.unitPrice >= 0)
    if (!employee) { setEditError('Selecione o responsável.'); return }
    if (!editingDate) { setEditError('Informe a data e o horário.'); return }
    if (validItems.length === 0) { setEditError('A comanda precisa ter pelo menos um item válido.'); return }
    if (editingOrder.status === 'paga' && !editingOrder.method) { setEditError('Selecione o pagamento da comanda paga.'); return }

    const total = validItems.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0)
      - editingOrder.discount + editingOrder.surcharge
    if (total < 0) { setEditError('O total da comanda não pode ser negativo.'); return }

    setSavingOrder(true)
    setEditError('')
    const supabase = createBrowserSupabaseClient()
    const oldOrder = orders.find((item) => item.id === editingOrder.id)
    const oldItems = oldOrder?.items ?? []

    const deleteItemsResult = await supabase.from('order_items').delete().eq('order_id', editingOrder.id)
    if (deleteItemsResult.error) { setSavingOrder(false); setEditError(deleteItemsResult.error.message); return }

    const insertItemsResult = await supabase.from('order_items').insert(validItems.map((item) => ({
      order_id: editingOrder.id,
      barbershop_id: barbershop.id,
      ref_id: item.refId || null,
      type: item.type,
      name: item.name.trim(),
      quantity: item.quantity,
      unit_price: item.unitPrice,
    }))).select()

    if (insertItemsResult.error) {
      if (oldItems.length > 0) {
        await supabase.from('order_items').insert(oldItems.map((item) => ({
          order_id: editingOrder.id,
          barbershop_id: barbershop.id,
          ref_id: item.refId || null,
          type: item.type,
          name: item.name,
          quantity: item.quantity,
          unit_price: item.unitPrice,
        })))
      }
      setSavingOrder(false)
      setEditError(insertItemsResult.error.message)
      return
    }

    const createdAt = new Date(editingDate).toISOString()
    const orderResult = await updateRecord('orders', editingOrder.id, {
      client_id: client?.id ?? null,
      client_name: client?.name ?? (editingOrder.clientName.trim() || 'Cliente avulso'),
      employee_id: employee.id,
      employee_name: employee.name,
      discount: editingOrder.discount,
      surcharge: editingOrder.surcharge,
      status: editingOrder.status,
      method: editingOrder.status === 'paga' ? editingOrder.method : null,
      total,
      created_at: createdAt,
    })
    if (orderResult.error) { setSavingOrder(false); setEditError(orderResult.error); return }

    const description = `Comanda #${editingOrder.number}`
    const { data: linkedFinanceEntry, error: linkedFinanceLookupError } = await supabase
      .from('financial_entries')
      .select('id, category, description')
      .eq('barbershop_id', barbershop.id)
      .eq('order_id', editingOrder.id)
      .maybeSingle()
    if (linkedFinanceLookupError) { setSavingOrder(false); setEditError(`Comanda salva, mas o financeiro falhou: ${linkedFinanceLookupError.message}`); return }
    let financeEntry = linkedFinanceEntry
    if (!financeEntry) {
      const legacyLookup = await supabase
        .from('financial_entries')
        .select('id, category, description')
        .eq('barbershop_id', barbershop.id)
        .eq('category', 'Comandas')
        .eq('description', description)
        .maybeSingle()
      if (legacyLookup.error) { setSavingOrder(false); setEditError(`Comanda salva, mas o financeiro falhou: ${legacyLookup.error.message}`); return }
      financeEntry = legacyLookup.data
    }

    if (editingOrder.status === 'paga') {
      const financeValues = {
        amount: total,
        method: editingOrder.method,
        date: editingDate.slice(0, 10),
      }
      const financeResult = financeEntry
        ? await supabase.from('financial_entries').update(financeValues).eq('id', financeEntry.id)
        : await supabase.from('financial_entries').insert({
            barbershop_id: barbershop.id,
            order_id: editingOrder.id,
            type: 'entrada',
            category: 'Comandas',
            description,
            ...financeValues,
          })
      if (financeResult.error) { setSavingOrder(false); setEditError(`Comanda salva, mas o financeiro falhou: ${financeResult.error.message}`); return }
    } else if (financeEntry) {
      const financeResult = await supabase.from('financial_entries').delete().eq('id', financeEntry.id)
      if (financeResult.error) { setSavingOrder(false); setEditError(`Comanda salva, mas o financeiro falhou: ${financeResult.error.message}`); return }
    }

    if (shouldCompleteLinkedAppointment(oldOrder?.status ?? editingOrder.status, editingOrder.status, editingOrder.appointmentId)) {
      const appointmentResult = await updateRecord('appointments', editingOrder.appointmentId!, {
        status: 'concluido',
      })
      if (appointmentResult.error) {
        setSavingOrder(false)
        setEditError(`Pagamento salvo, mas não foi possível concluir o agendamento: ${appointmentResult.error}`)
        return
      }
    }

    const savedItems = (insertItemsResult.data ?? []).map((item) => ({
      id: item.id,
      refId: item.ref_id ?? '',
      type: item.type,
      name: item.name,
      quantity: Number(item.quantity),
      unitPrice: Number(item.unit_price),
    }))
    const savedOrder: Order = {
      ...editingOrder,
      clientId: client?.id,
      clientName: client?.name ?? (editingOrder.clientName.trim() || 'Cliente avulso'),
      employeeId: employee.id,
      employeeName: employee.name,
      items: savedItems,
      status: editingOrder.status,
      method: editingOrder.status === 'paga' ? editingOrder.method : undefined,
      total,
      createdAt,
    }
    setOrders((current) => sortOrdersByDate(current.map((item) => item.id === savedOrder.id ? savedOrder : item)))
    setSavingOrder(false)
    setEditingOrder(null)
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
                <TableCell className="font-medium text-foreground">
                  <div className="flex flex-wrap items-center gap-2">
                    <span>{order.clientName}</span>
                    {planClients.has(order.clientId ?? '') || planClients.has(normalizeName(order.clientName)) ? (
                      <Badge className="border-blue-200 bg-blue-100 text-blue-700">
                        <Crown className="size-3" />
                        Plano
                      </Badge>
                    ) : null}
                  </div>
                </TableCell>
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
                  <div className="flex justify-end gap-1">
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      className="text-emerald-600 hover:bg-emerald-50 hover:text-emerald-700"
                      aria-label={`Enviar comanda #${order.number} pelo WhatsApp`}
                      title="Enviar pelo WhatsApp"
                      onClick={() => sendOrderByWhatsApp(order)}
                    >
                      <MessageCircle className="size-4" />
                    </Button>
                    <Button variant="ghost" size="icon-sm" aria-label="Editar comanda" onClick={() => openOrderEditor(order)}>
                      <Pencil className="size-4" />
                    </Button>
                    <Button variant="ghost" size="icon-sm" aria-label="Excluir comanda" onClick={() => deleteOrder(order.id)}>
                      <Trash2 className="size-4" />
                    </Button>
                  </div>
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

      <Dialog open={Boolean(whatsAppDraft)} onClose={() => setWhatsAppDraft(null)} className="sm:max-w-xl">
        {whatsAppDraft ? (
          <>
            <DialogHeader
              title={`Enviar comanda #${whatsAppDraft.orderNumber}`}
              description={`Revise a mensagem para ${whatsAppDraft.clientName} antes de abrir o WhatsApp.`}
            />
            <div className="space-y-2">
              <Label htmlFor="whatsapp-order-message">Mensagem</Label>
              <Textarea
                id="whatsapp-order-message"
                value={whatsAppDraft.message}
                onChange={(event) => setWhatsAppDraft({
                  ...whatsAppDraft,
                  message: event.target.value,
                })}
                className="min-h-72 resize-y"
                autoFocus
              />
              <p className="text-xs text-muted-foreground">
                Você ainda poderá revisar a mensagem novamente dentro do WhatsApp.
              </p>
            </div>
            <div className="mt-5 flex justify-end gap-2">
              <Button variant="outline" onClick={() => setWhatsAppDraft(null)}>
                Cancelar
              </Button>
              <Button
                className="bg-emerald-600 text-white hover:bg-emerald-700"
                disabled={!whatsAppDraft.message.trim()}
                onClick={confirmWhatsAppSend}
              >
                <MessageCircle className="size-4" />
                Enviar pelo WhatsApp
              </Button>
            </div>
          </>
        ) : null}
      </Dialog>

      <Dialog open={Boolean(editingOrder)} onClose={() => !savingOrder && setEditingOrder(null)} className="sm:max-w-3xl">
        {editingOrder ? (
          <>
            <DialogHeader title={`Editar comanda #${editingOrder.number}`} description="Corrija os dados, itens e pagamento da comanda." />
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="edit-order-client">Cliente</Label>
                <Select id="edit-order-client" value={editingOrder.clientId ?? ''} onChange={(event) => {
                  const client = clients.find((item) => item.id === event.target.value)
                  setEditingOrder({ ...editingOrder, clientId: client?.id, clientName: client?.name ?? 'Cliente avulso' })
                }}>
                  <option value="">Cliente avulso</option>
                  {clients.map((client) => <option key={client.id} value={client.id}>{client.name}</option>)}
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-order-employee">Responsável</Label>
                <Select id="edit-order-employee" value={editingOrder.employeeId} onChange={(event) => setEditingOrder({ ...editingOrder, employeeId: event.target.value })}>
                  <option value="">Selecione</option>
                  {employees.filter((employee) => employee.active || employee.id === editingOrder.employeeId).map((employee) => <option key={employee.id} value={employee.id}>{employee.name}</option>)}
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-order-date">Data e horário</Label>
                <Input id="edit-order-date" type="datetime-local" value={editingDate} onChange={(event) => setEditingDate(event.target.value)} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-order-status">Status</Label>
                <Select id="edit-order-status" value={editingOrder.status} onChange={(event) => setEditingOrder({ ...editingOrder, status: event.target.value as OrderStatus })}>
                  <option value="aberta">Aberta</option>
                  <option value="pendente">Pendente</option>
                  <option value="paga">Paga</option>
                  <option value="cancelada">Cancelada</option>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-order-method">Pagamento</Label>
                <Select id="edit-order-method" value={editingOrder.method ?? ''} onChange={(event) => {
                  const method = event.target.value as PaymentMethod | ''
                  setEditingOrder({
                    ...editingOrder,
                    method: method || undefined,
                    status: method && editingOrder.status !== 'paga' ? 'paga' : editingOrder.status,
                  })
                }}>
                  <option value="">Selecione</option>
                  <option value="dinheiro">Dinheiro</option>
                  <option value="pix">Pix</option>
                  <option value="credito">Crédito</option>
                  <option value="debito">Débito</option>
                  <option value="outro">Outro</option>
                </Select>
                {editingOrder.status !== 'paga' ? (
                  <p className="text-xs text-muted-foreground">Ao escolher o pagamento, a comanda é marcada como paga.</p>
                ) : null}
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label htmlFor="edit-order-discount">Desconto</Label>
                  <Input id="edit-order-discount" type="number" min="0" step="0.01" value={editingOrder.discount} onChange={(event) => setEditingOrder({ ...editingOrder, discount: Number(event.target.value) })} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-order-surcharge">Acréscimo</Label>
                  <Input id="edit-order-surcharge" type="number" min="0" step="0.01" value={editingOrder.surcharge} onChange={(event) => setEditingOrder({ ...editingOrder, surcharge: Number(event.target.value) })} />
                </div>
              </div>
            </div>

            <div className="mt-5 space-y-3">
              <div className="flex items-end gap-2">
                <div className="flex-1 space-y-2">
                  <Label htmlFor="edit-order-add-item">Adicionar produto ou serviço</Label>
                  <Select id="edit-order-add-item" defaultValue="" onChange={(event) => { addCatalogItem(event.target.value); event.target.value = '' }}>
                    <option value="">Selecione um item</option>
                    {catalog.filter((item) => item.active).map((item) => <option key={item.id} value={item.id}>{item.name} — {formatCurrency(item.price)}</option>)}
                  </Select>
                </div>
              </div>
              {editingOrder.items.map((item, index) => (
                <div key={item.id} className="grid grid-cols-[1fr_80px_120px_36px] items-end gap-2 rounded-lg border border-border p-3">
                  <div className="space-y-1">
                    <Label>Item</Label>
                    <Input value={item.name} onChange={(event) => updateEditingItem(index, { name: event.target.value })} />
                  </div>
                  <div className="space-y-1">
                    <Label>Qtd.</Label>
                    <Input type="number" min="1" value={item.quantity} onChange={(event) => updateEditingItem(index, { quantity: Number(event.target.value) })} />
                  </div>
                  <div className="space-y-1">
                    <Label>Valor unitário</Label>
                    <Input type="number" min="0" step="0.01" value={item.unitPrice} onChange={(event) => updateEditingItem(index, { unitPrice: Number(event.target.value) })} />
                  </div>
                  <Button variant="ghost" size="icon-sm" aria-label={`Remover ${item.name}`} onClick={() => setEditingOrder({ ...editingOrder, items: editingOrder.items.filter((_, itemIndex) => itemIndex !== index) })}>
                    <Minus className="size-4" />
                  </Button>
                </div>
              ))}
            </div>

            <div className="mt-5 flex items-center justify-between border-t border-border pt-4">
              <div>
                {editError ? <p className="text-sm text-destructive">{editError}</p> : null}
                <p className="font-semibold">Total: {formatCurrency(editingOrder.items.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0) - editingOrder.discount + editingOrder.surcharge)}</p>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" disabled={savingOrder} onClick={() => setEditingOrder(null)}>Cancelar</Button>
                <Button variant="gold" disabled={savingOrder} onClick={saveEditedOrder}>
                  <Save className="size-4" />
                  {savingOrder ? 'Salvando...' : 'Salvar alterações'}
                </Button>
              </div>
            </div>
          </>
        ) : null}
      </Dialog>
    </div>
  )
}
