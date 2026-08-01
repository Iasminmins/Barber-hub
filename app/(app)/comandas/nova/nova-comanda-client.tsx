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
import { useAppData } from '@/components/data/app-data-provider'
import type { CatalogItem, CatalogType, Client, Employee, PaymentMethod } from '@/lib/types'
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

const initialPrices = (items: CatalogItem[]) =>
  items.reduce<Record<string, string>>((prices, item) => {
    prices[item.id] = item.price.toFixed(2).replace('.', ',')
    return prices
  }, {})

function parseMoney(value: string) {
  const cleaned = value.replace(/[^\d.,]/g, '')
  const normalized = cleaned.includes(',')
    ? cleaned.replace(/\./g, '').replace(',', '.')
    : cleaned
  return Math.max(0, Number(normalized || 0))
}

function todayKey() {
  const today = new Date()
  const year = today.getFullYear()
  const month = String(today.getMonth() + 1).padStart(2, '0')
  const day = String(today.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

export function NovaComandaClient({
  barbershopId,
  clients,
  employees,
  items,
  nextOrderNumber,
}: NovaComandaClientProps) {
  const router = useRouter()
  const { insertRecord, deleteRecord } = useAppData()
  const [quantities, setQuantities] = useState(() => initialQuantities(items))
  const [prices, setPrices] = useState(() => initialPrices(items))
  const [query, setQuery] = useState('')
  const [filter, setFilter] = useState<CatalogFilter>('todos')
  const [clientId, setClientId] = useState('')
  const [clientQuery, setClientQuery] = useState('')
  const [isClientSearchOpen, setIsClientSearchOpen] = useState(false)
  const [employeeId, setEmployeeId] = useState('')
  const [payment, setPayment] = useState<PaymentChoice | ''>('')
  const [manualTotal, setManualTotal] = useState<string | null>(null)
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

  const filteredClients = useMemo(() => {
    const normalizedQuery = clientQuery
      .trim()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase()

    if (!normalizedQuery) return clients.slice(0, 10)

    return clients
      .filter((client) =>
        client.name
          .normalize('NFD')
          .replace(/[\u0300-\u036f]/g, '')
          .toLowerCase()
          .includes(normalizedQuery),
      )
      .slice(0, 10)
  }, [clientQuery, clients])

  const selectedItems = useMemo(
    () => items.filter((item) => (quantities[item.id] ?? 0) > 0),
    [items, quantities],
  )

  const subtotal = selectedItems.reduce(
    (sum, item) => sum + parseMoney(prices[item.id] ?? '') * (quantities[item.id] ?? 0),
    0,
  )
  const total = manualTotal === null ? subtotal : parseMoney(manualTotal)
  const discount = Math.max(0, subtotal - total)
  const surcharge = Math.max(0, total - subtotal)
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

  function setItemPrice(itemId: string, price: string) {
    setPrices((current) => ({ ...current, [itemId]: price }))
  }

  async function saveOrder() {
    setSaveError('')

    const employee = employees.find((item) => item.id === employeeId)
    if (!employee) {
      setSaveError('Selecione um responsável para salvar.')
      return
    }

    if (total > 0 && !payment) {
      setSaveError('Selecione a forma de pagamento.')
      return
    }

    if (selectedItems.some((item) => parseMoney(prices[item.id] ?? '') <= 0)) {
      setSaveError('Informe um valor válido para todos os itens selecionados.')
      return
    }

    const client = clients.find((item) => item.id === clientId)
    const orderStatus = total === 0 ? 'aberta' : payment === 'pendente' ? 'pendente' : 'paga'
    const paymentMethod = total === 0 || payment === 'pendente' ? null : payment
    const orderResult = await insertRecord('orders', { barbershop_id: barbershopId, number: nextOrderNumber, client_id: client?.id ?? null, client_name: client?.name ?? 'Cliente avulso', employee_id: employee.id, employee_name: employee.name, discount, surcharge, status: orderStatus, method: paymentMethod, total })
    if (orderResult.error || !orderResult.data) { setSaveError(orderResult.error ?? 'Não foi possível criar a comanda.'); return }
    for (const item of selectedItems) {
      const itemResult = await insertRecord('order_items', { order_id: orderResult.data.id, barbershop_id: barbershopId, ref_id: item.id, type: item.type, name: item.name, quantity: quantities[item.id] ?? 1, unit_price: parseMoney(prices[item.id] ?? '') })
      if (itemResult.error) { await deleteRecord('orders', orderResult.data.id); setSaveError(itemResult.error); return }
    }
    if (total > 0 && payment && payment !== 'pendente') {
      const financialResult = await insertRecord('financial_entries', { barbershop_id: barbershopId, order_id:orderResult.data.id, type:'entrada', category:'Comandas', description:`Comanda #${nextOrderNumber}`, amount:total, method:payment, date:todayKey() })
      if (financialResult.error) { setSaveError(`Comanda salva, mas o financeiro falhou: ${financialResult.error}`); return }
    }
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
                <Label htmlFor="client-search">Cliente</Label>
                <div
                  className="relative"
                  onBlur={(event) => {
                    if (!event.currentTarget.contains(event.relatedTarget)) {
                      setIsClientSearchOpen(false)
                      if (!clientId) setClientQuery('')
                    }
                  }}
                >
                  <Search className="pointer-events-none absolute left-3 top-1/2 z-10 size-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    id="client-search"
                    value={clientQuery}
                    placeholder={
                      clients.find((client) => client.id === clientId)?.name ?? 'Cliente avulso'
                    }
                    autoComplete="off"
                    role="combobox"
                    aria-expanded={isClientSearchOpen}
                    aria-controls="client-search-results"
                    className="pl-9"
                    onFocus={() => setIsClientSearchOpen(true)}
                    onChange={(event) => {
                      setClientQuery(event.target.value)
                      setClientId('')
                      setIsClientSearchOpen(true)
                    }}
                    onKeyDown={(event) => {
                      if (event.key === 'Escape') setIsClientSearchOpen(false)
                    }}
                  />
                  {isClientSearchOpen ? (
                    <div
                      id="client-search-results"
                      role="listbox"
                      className="absolute z-30 mt-1 max-h-64 w-full overflow-y-auto rounded-md border border-border bg-card p-1 shadow-lg"
                    >
                      <button
                        type="button"
                        role="option"
                        aria-selected={!clientId}
                        className="w-full rounded-sm px-3 py-2 text-left text-sm hover:bg-muted focus:bg-muted focus:outline-none"
                        onClick={() => {
                          setClientId('')
                          setClientQuery('')
                          setIsClientSearchOpen(false)
                        }}
                      >
                        Cliente avulso
                      </button>
                      {filteredClients.map((client) => (
                        <button
                          key={client.id}
                          type="button"
                          role="option"
                          aria-selected={client.id === clientId}
                          className="w-full rounded-sm px-3 py-2 text-left text-sm hover:bg-muted focus:bg-muted focus:outline-none"
                          onClick={() => {
                            setClientId(client.id)
                            setClientQuery('')
                            setIsClientSearchOpen(false)
                          }}
                        >
                          {client.name}
                        </button>
                      ))}
                      {filteredClients.length === 0 ? (
                        <p className="px-3 py-2 text-sm text-muted-foreground">
                          Nenhum cliente encontrado.
                        </p>
                      ) : null}
                    </div>
                  ) : null}
                </div>
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
                const unitPrice = parseMoney(prices[item.id] ?? '')
                const lineTotal = unitPrice * quantity
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
                      <p className="text-xs text-muted-foreground">Valor unitário</p>
                      <div className="relative mt-1">
                        <span className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">R$</span>
                        <Input
                          value={prices[item.id] ?? ''}
                          onChange={(event) => setItemPrice(item.id, event.target.value)}
                          onFocus={(event) => event.currentTarget.select()}
                          inputMode="decimal"
                          aria-label={`Valor unitário de ${item.name}`}
                          className="h-8 pl-8 text-right font-semibold tabular-nums"
                        />
                      </div>
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
                <span className="font-medium text-foreground">{formatCurrency(discount)}</span>
              </div>
              {surcharge > 0 ? (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Acréscimo</span>
                  <span className="font-medium text-foreground">{formatCurrency(surcharge)}</span>
                </div>
              ) : null}
              <div className="flex items-center justify-between gap-3 border-t border-border pt-3 text-base">
                <span className="font-semibold text-foreground">Total</span>
                <div className="w-32">
                  <div className="relative">
                    <span className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">R$</span>
                    <Input
                      value={manualTotal ?? subtotal.toFixed(2).replace('.', ',')}
                      onChange={(event) => setManualTotal(event.target.value)}
                      onFocus={(event) => event.currentTarget.select()}
                      inputMode="decimal"
                      aria-label="Total da comanda"
                      className="h-9 pl-8 text-right font-bold tabular-nums"
                    />
                  </div>
                  {manualTotal !== null ? (
                    <button
                      type="button"
                      onClick={() => setManualTotal(null)}
                      className="mt-1 w-full text-right text-xs text-muted-foreground hover:text-foreground"
                    >
                      Usar subtotal
                    </button>
                  ) : null}
                </div>
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
                      {quantities[item.id]} x {formatCurrency(parseMoney(prices[item.id] ?? ''))}
                    </p>
                  </div>
                  <span className="font-semibold tabular-nums text-foreground">
                    {formatCurrency(parseMoney(prices[item.id] ?? '') * (quantities[item.id] ?? 0))}
                  </span>
                </div>
              ))}
              {selectedItems.length === 0 && (
                <p className="text-sm text-muted-foreground">Nenhum item adicionado ainda.</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="method">Pagamento {total === 0 ? '(opcional)' : ''}</Label>
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
