'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useMemo, useState } from 'react'
import {
  ArrowLeft,
  Minus,
  Package,
  Plus,
  Receipt,
  Save,
  Scissors,
  Search,
  Trash2,
} from 'lucide-react'
import { PageHeader } from '@/components/page-header'
import { Badge } from '@/components/ui/badge'
import { Button, buttonVariants } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select } from '@/components/ui/select'
import { formatCurrency } from '@/lib/format'
import { getNextOrderNumber, saveStoredOrder } from '@/lib/orders-storage'
import type { CatalogItem, CatalogType, Client, Employee, Order, PaymentMethod } from '@/lib/types'
import { cn } from '@/lib/utils'

type CatalogFilter = CatalogType | 'todos'
type PaymentChoice = PaymentMethod | 'pendente'

interface NovaComandaClientProps {
  barbershopId: string
  clients: Client[]
  employees: Employee[]
  items: CatalogItem[]
  nextOrderNumber: number
}

const initialQuantities = (items: CatalogItem[]) =>
  items.reduce<Record<string, number>>((quantities, item) => {
    quantities[item.id] = 0
    return quantities
  }, {})

export function NovaComandaClient({
  barbershopId,
  clients,
  employees,
  items,
  nextOrderNumber,
}: NovaComandaClientProps) {
  const router = useRouter()
  const [quantities, setQuantities] = useState(() => initialQuantities(items))
  const [query, setQuery] = useState('')
  const [filter, setFilter] = useState<CatalogFilter>('todos')
  const [clientId, setClientId] = useState('')
  const [employeeId, setEmployeeId] = useState('')
  const [payment, setPayment] = useState<PaymentChoice | ''>('')
  const [saveError, setSaveError] = useState('')

  const filteredItems = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase()

    return items
      .filter((item) => filter === 'todos' || item.type === filter)
      .filter((item) => {
        if (!normalizedQuery) return true

        return (
          item.name.toLowerCase().includes(normalizedQuery) ||
          item.category.toLowerCase().includes(normalizedQuery)
        )
      })
  }, [filter, items, query])

  const selectedItems = useMemo(
    () => items.filter((item) => (quantities[item.id] ?? 0) > 0),
    [items, quantities],
  )

  const subtotal = selectedItems.reduce(
    (sum, item) => sum + item.price * (quantities[item.id] ?? 0),
    0,
  )
  const selectedCount = selectedItems.reduce((sum, item) => sum + (quantities[item.id] ?? 0), 0)

  function setItemQuantity(itemId: string, quantity: number) {
    setQuantities((current) => ({
      ...current,
      [itemId]: Math.max(0, Math.min(99, quantity)),
    }))
  }

  function changeItemQuantity(itemId: string, amount: number) {
    setQuantities((current) => {
      const nextQuantity = Math.max(0, Math.min(99, (current[itemId] ?? 0) + amount))

      return {
        ...current,
        [itemId]: nextQuantity,
      }
    })
  }

  function removeItem(itemId: string) {
    setItemQuantity(itemId, 0)
  }

  function saveOrder() {
    setSaveError('')

    const employee = employees.find((item) => item.id === employeeId)
    if (!employee) {
      setSaveError('Selecione um responsável para salvar.')
      return
    }

    if (!payment) {
      setSaveError('Selecione a forma de pagamento.')
      return
    }

    if (selectedItems.length === 0 || subtotal <= 0) {
      setSaveError('Adicione pelo menos um item à comanda.')
      return
    }

    const client = clients.find((item) => item.id === clientId)
    const now = new Date()
    const timestamp = now.getTime()
    const orderItems = selectedItems.map((item, index) => ({
      id: `oi_local_${timestamp}_${index + 1}`,
      refId: item.id,
      type: item.type,
      name: item.name,
      quantity: quantities[item.id] ?? 0,
      unitPrice: item.price,
    }))

    const order: Order = {
      id: `ord_local_${timestamp}`,
      barbershopId,
      number: getNextOrderNumber(nextOrderNumber - 1),
      clientId: client?.id,
      clientName: client?.name ?? 'Cliente avulso',
      employeeId: employee.id,
      employeeName: employee.name,
      items: orderItems,
      discount: 0,
      surcharge: 0,
      status: payment === 'pendente' ? 'pendente' : 'paga',
      method: payment === 'pendente' ? undefined : payment,
      total: subtotal,
      createdAt: now.toISOString().slice(0, 10),
    }

    saveStoredOrder(order)
    router.push('/comandas')
  }

  return (
    <div>
      <PageHeader
        title="Nova comanda"
        description="Monte a venda do balcão com cliente, responsável, itens e forma de pagamento."
      >
        <Link href="/comandas" className={buttonVariants({ variant: 'outline', size: 'sm' })}>
          <ArrowLeft className="size-4" />
          Voltar
        </Link>
      </PageHeader>

      <form className="grid gap-4 xl:grid-cols-[1fr_360px]" onSubmit={(event) => event.preventDefault()}>
        <div className="space-y-4">
          <Card className="p-5">
            <h2 className="mb-4 flex items-center gap-2 font-semibold text-foreground">
              <Receipt className="size-4 text-muted-foreground" />
              Atendimento
            </h2>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="client">Cliente</Label>
                <Select id="client" value={clientId} onChange={(event) => setClientId(event.target.value)}>
                  <option value="">Cliente avulso</option>
                  {clients.map((client) => (
                    <option key={client.id} value={client.id}>
                      {client.name}
                    </option>
                  ))}
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="employee">Responsável</Label>
                <Select
                  id="employee"
                  value={employeeId}
                  onChange={(event) => setEmployeeId(event.target.value)}
                >
                  <option value="">Selecione um responsável</option>
                  {employees.map((employee) => (
                    <option key={employee.id} value={employee.id}>
                      {employee.name}
                    </option>
                  ))}
                </Select>
              </div>
            </div>
          </Card>

          <Card className="overflow-hidden">
            <div className="space-y-4 border-b border-border p-5">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h2 className="font-semibold text-foreground">Itens da comanda</h2>
                  <p className="text-sm text-muted-foreground">
                    Ajuste quantidades, remova itens e confira o subtotal em tempo real.
                  </p>
                </div>
                <Badge variant={selectedCount > 0 ? 'success' : 'secondary'}>
                  {selectedCount} {selectedCount === 1 ? 'item' : 'itens'}
                </Badge>
              </div>

              <div className="grid gap-3 lg:grid-cols-[1fr_auto]">
                <div className="relative">
                  <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    value={query}
                    onChange={(event) => setQuery(event.target.value)}
                    placeholder="Buscar serviço ou produto"
                    className="pl-9"
                  />
                </div>
                <div className="grid grid-cols-3 gap-1 rounded-lg border border-border bg-muted p-1">
                  {[
                    ['todos', 'Todos'],
                    ['servico', 'Serviços'],
                    ['produto', 'Produtos'],
                  ].map(([value, label]) => (
                    <button
                      key={value}
                      type="button"
                      onClick={() => setFilter(value as CatalogFilter)}
                      className={cn(
                        'h-8 rounded-md px-3 text-xs font-medium text-muted-foreground transition-colors hover:text-foreground',
                        filter === value && 'bg-card text-foreground shadow-sm',
                      )}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="max-h-[560px] divide-y divide-border overflow-y-auto">
              {filteredItems.map((item) => {
                const quantity = quantities[item.id] ?? 0
                const lineTotal = item.price * quantity
                const itemIcon =
                  item.type === 'servico' ? (
                    <Scissors className="size-4" />
                  ) : (
                    <Package className="size-4" />
                  )

                return (
                  <div
                    key={item.id}
                    className={cn(
                      'grid gap-3 p-4 transition-colors hover:bg-muted/40 lg:grid-cols-[auto_1fr_auto_auto]',
                      quantity > 0 && 'bg-primary/5',
                    )}
                  >
                    <span className="flex size-10 items-center justify-center rounded-lg bg-muted text-muted-foreground">
                      {itemIcon}
                    </span>
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="font-medium text-foreground">{item.name}</p>
                        <Badge variant={item.type === 'servico' ? 'default' : 'gold'}>
                          {item.type === 'servico' ? 'Serviço' : 'Produto'}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {item.category} · {formatCurrency(item.price)} un.
                      </p>
                    </div>
                    <div className="flex items-center gap-1">
                      <Button
                        type="button"
                        variant="outline"
                        size="icon-sm"
                        aria-label={`Diminuir ${item.name}`}
                        disabled={quantity === 0}
                        onClick={() => changeItemQuantity(item.id, -1)}
                      >
                        <Minus className="size-4" />
                      </Button>
                      <Input
                        className="h-8 w-14 text-center tabular-nums"
                        inputMode="numeric"
                        value={quantity}
                        onChange={(event) => {
                          const nextQuantity = Number(event.target.value.replace(/\D/g, ''))
                          setItemQuantity(item.id, Number.isNaN(nextQuantity) ? 0 : nextQuantity)
                        }}
                        aria-label={`Quantidade de ${item.name}`}
                      />
                      <Button
                        type="button"
                        variant="outline"
                        size="icon-sm"
                        aria-label={`Aumentar ${item.name}`}
                        onClick={() => changeItemQuantity(item.id, 1)}
                      >
                        <Plus className="size-4" />
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon-sm"
                        aria-label={`Excluir ${item.name} da comanda`}
                        disabled={quantity === 0}
                        onClick={() => removeItem(item.id)}
                      >
                        <Trash2 className="size-4" />
                      </Button>
                    </div>
                    <div className="text-right lg:w-32">
                      <p className="text-xs text-muted-foreground">Valor</p>
                      <p className="font-semibold tabular-nums text-foreground">
                        {formatCurrency(item.price)}
                      </p>
                      {quantity > 0 ? (
                        <p className="text-xs tabular-nums text-muted-foreground">
                          Subtotal {formatCurrency(lineTotal)}
                        </p>
                      ) : null}
                    </div>
                  </div>
                )
              })}

              {filteredItems.length === 0 && (
                <div className="p-8 text-center text-sm text-muted-foreground">
                  Nenhum serviço ou produto encontrado.
                </div>
              )}
            </div>
          </Card>
        </div>

        <aside className="space-y-4 xl:sticky xl:top-4 xl:self-start">
          <Card className="p-5">
            <h3 className="mb-4 font-semibold text-foreground">Resumo</h3>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Itens selecionados</span>
                <span className="font-medium text-foreground tabular-nums">{selectedCount}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Subtotal</span>
                <span className="font-medium text-foreground">{formatCurrency(subtotal)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Desconto</span>
                <span className="font-medium text-foreground">{formatCurrency(0)}</span>
              </div>
              <div className="flex justify-between border-t border-border pt-3 text-base">
                <span className="font-semibold text-foreground">Total</span>
                <span className="font-bold text-foreground">{formatCurrency(subtotal)}</span>
              </div>
            </div>
          </Card>

          <Card className="p-5">
            <h3 className="mb-4 font-semibold text-foreground">Itens selecionados</h3>
            <div className="mb-4 max-h-56 space-y-3 overflow-y-auto pr-1">
              {selectedItems.map((item) => (
                <div key={item.id} className="flex items-start justify-between gap-3 text-sm">
                  <div className="min-w-0">
                    <p className="truncate font-medium text-foreground">{item.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {quantities[item.id]} x {formatCurrency(item.price)}
                    </p>
                  </div>
                  <span className="font-semibold tabular-nums text-foreground">
                    {formatCurrency(item.price * (quantities[item.id] ?? 0))}
                  </span>
                </div>
              ))}
              {selectedItems.length === 0 && (
                <p className="text-sm text-muted-foreground">Nenhum item adicionado ainda.</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="method">Pagamento</Label>
              <Select
                id="method"
                value={payment}
                onChange={(event) => setPayment(event.target.value as PaymentChoice)}
              >
                <option value="">Selecione o pagamento</option>
                <option value="pix">Pix</option>
                <option value="credito">Crédito</option>
                <option value="debito">Débito</option>
                <option value="dinheiro">Dinheiro</option>
                <option value="pendente">Marcar como pendente</option>
              </Select>
            </div>
            {saveError ? <p className="mt-3 text-sm font-medium text-destructive">{saveError}</p> : null}
            <Button
              type="button"
              variant="gold"
              className="mt-4 w-full"
              disabled={subtotal <= 0}
              onClick={saveOrder}
            >
              <Save className="size-4" />
              Salvar comanda
            </Button>
          </Card>
        </aside>
      </form>
    </div>
  )
}
