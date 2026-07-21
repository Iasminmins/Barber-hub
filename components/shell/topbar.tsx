'use client'

import * as React from 'react'
import {
  Bell,
  Cake,
  Check,
  CheckCheck,
  ChevronDown,
  Clock3,
  Crown,
  LogOut,
  Menu,
  MessageSquare,
  Package,
  Search,
  ShoppingCart,
  X,
} from 'lucide-react'
import { BrandMark } from '@/components/brand-mark'
import { Avatar } from '@/components/ui/avatar'
import { createBrowserSupabaseClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { useAppData } from '@/components/data/app-data-provider'
import { daysUntil, formatCurrency } from '@/lib/format'
import { cn } from '@/lib/utils'

type NotificationTab = 'aniversarios' | 'estoque' | 'comandas' | 'planos'

interface NotificationItem {
  id: string
  title: string
  description: string
  tone: 'purple' | 'red' | 'green' | 'gold'
}

const tabConfig: Record<
  NotificationTab,
  { label: string; shortLabel: string; icon: React.ComponentType<{ className?: string }> }
> = {
  aniversarios: { label: 'Aniversários', shortLabel: 'Anivers.', icon: Cake },
  estoque: { label: 'Estoque', shortLabel: 'Estoque', icon: Package },
  comandas: { label: 'Comandas', shortLabel: 'Comandas', icon: ShoppingCart },
  planos: { label: 'Planos', shortLabel: 'Planos', icon: Crown },
}

const toneClass = {
  purple: 'bg-violet-100 text-violet-700',
  red: 'bg-red-100 text-red-700',
  green: 'bg-emerald-100 text-emerald-700',
  gold: 'bg-gold/20 text-gold-foreground',
}

function buildNotifications(clients: ReturnType<typeof useAppData>['clients'], catalog: ReturnType<typeof useAppData>['catalog'], orders: ReturnType<typeof useAppData>['orders'], subscriptions: ReturnType<typeof useAppData>['subscriptions']): Record<NotificationTab, NotificationItem[]> {
  const lowStock = catalog.filter((item) => item.type === 'produto' && (item.stock ?? 0) <= (item.minStock ?? 0))
  const expiringSubscriptions = subscriptions.filter((item) => daysUntil(item.dueDate) <= 7)

  return {
    aniversarios: clients
      .filter((client) => client.tags.includes('aniversariante'))
      .map((client) => ({
        id: `birthday-${client.id}`,
        title: client.name,
        description: `Aniversário em ${new Intl.DateTimeFormat('pt-BR', {
          day: '2-digit',
          month: 'long',
        }).format(new Date(`${client.birthDate}T00:00:00`))}`,
        tone: 'purple',
      })),
    estoque: lowStock.map((item) => ({
      id: `stock-${item.id}`,
      title: item.name,
      description: `Estoque ${item.stock ?? 0}/${item.minStock ?? 0} un. - reposição recomendada`,
      tone: 'red',
    })),
    comandas: orders
      .filter((order) => order.status === 'aberta' || order.status === 'pendente')
      .map((order) => ({
        id: `order-${order.id}`,
        title: `Comanda #${order.number}`,
        description: `${order.clientName} - ${formatCurrency(order.total)} - ${order.status}`,
        tone: order.status === 'pendente' ? 'gold' : 'green',
      })),
    planos: expiringSubscriptions.map((subscription) => {
      const due = daysUntil(subscription.dueDate)
      return {
        id: `plan-${subscription.id}`,
        title: subscription.clientName,
        description: `${subscription.planName} - ${
          due < 0 ? `venceu há ${Math.abs(due)}d` : `vence em ${due}d`
        }`,
        tone: due < 0 ? 'red' : 'purple',
      }
    }),
  }
}

export function Topbar({ onMenu }: { onMenu: () => void }) {
  const { barbershop, catalog, clients, orders, subscriptions } = useAppData()
  const barbershops = [barbershop]
  const notifications = React.useMemo(() => buildNotifications(clients, catalog, orders, subscriptions), [catalog, clients, orders, subscriptions])
  const [active, setActive] = React.useState(barbershop)
  const [open, setOpen] = React.useState(false)
  const [notificationsOpen, setNotificationsOpen] = React.useState(false)
  const [activeTab, setActiveTab] = React.useState<NotificationTab>('planos')
  const barbershopRef = React.useRef<HTMLDivElement>(null)
  const notificationRef = React.useRef<HTMLDivElement>(null)

  React.useEffect(() => {
    setActive(barbershop)
  }, [barbershop])

  React.useEffect(() => {
    const onClick = (e: MouseEvent) => {
      const target = e.target as Node
      if (barbershopRef.current && !barbershopRef.current.contains(target)) setOpen(false)
      if (notificationRef.current && !notificationRef.current.contains(target)) {
        setNotificationsOpen(false)
      }
    }
    document.addEventListener('mousedown', onClick)
    return () => document.removeEventListener('mousedown', onClick)
  }, [])

  const today = new Intl.DateTimeFormat('pt-BR', {
    weekday: 'long',
    day: '2-digit',
    month: 'long',
  }).format(new Date())

  const totalNotifications = Object.values(notifications).reduce((sum, items) => sum + items.length, 0)
  const activeNotifications = notifications[activeTab]

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center gap-3 border-b border-border bg-card/80 px-4 backdrop-blur-md lg:px-6">
      <Button variant="ghost" size="icon" className="lg:hidden" onClick={onMenu} aria-label="Abrir menu">
        <Menu className="size-5" />
      </Button>

      <div className="relative" ref={barbershopRef}>
        <button
          onClick={() => setOpen((value) => !value)}
          className="flex cursor-pointer items-center gap-2.5 rounded-lg border border-border bg-background px-3 py-1.5 text-left transition-colors hover:bg-muted"
        >
          <BrandMark name={active.name} color={active.color} logoUrl={active.logoUrl} className="size-8 rounded-md text-xs" />
          <span className="hidden leading-tight sm:block">
            <span className="block text-sm font-semibold text-foreground">{active.name}</span>
            <span className="block text-[11px] text-muted-foreground">{active.city}</span>
          </span>
          <ChevronDown className="size-4 text-muted-foreground" />
        </button>

        {open ? (
          <div className="absolute left-0 top-full z-50 mt-2 w-72 rounded-lg border border-border bg-popover p-1.5 shadow-lg">
            <p className="px-2.5 py-1.5 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
              Suas barbearias
            </p>
            {barbershops.map((barbershop) => (
              <button
                key={barbershop.id}
                onClick={() => {
                  setActive(barbershop)
                  setOpen(false)
                }}
                className="flex w-full cursor-pointer items-center gap-2.5 rounded-md px-2.5 py-2 text-left transition-colors hover:bg-muted"
              >
                <BrandMark name={barbershop.name} color={barbershop.color} logoUrl={barbershop.logoUrl} className="size-8 rounded-md text-xs" />
                <span className="flex-1 leading-tight">
                  <span className="block text-sm font-medium text-foreground">{barbershop.name}</span>
                  <span className="block text-[11px] text-muted-foreground capitalize">
                    Plano {barbershop.plan} · {barbershop.city}
                  </span>
                </span>
                {barbershop.id === active.id ? <Check className="size-4 text-primary" /> : null}
              </button>
            ))}
          </div>
        ) : null}
      </div>

      <div className="relative ml-1 hidden max-w-sm flex-1 md:block">
        <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        <input
          type="search"
          placeholder="Buscar clientes, comandas, produtos..."
          className="h-9 w-full rounded-lg border border-border bg-background pl-9 pr-3 text-sm outline-none transition-colors placeholder:text-muted-foreground focus:border-ring focus:ring-2 focus:ring-ring/30"
        />
      </div>

      <div className="ml-auto flex items-center gap-2">
        <span className="hidden text-sm capitalize text-muted-foreground lg:block">{today}</span>

        <div className="relative" ref={notificationRef}>
          <Button
            variant="ghost"
            size="icon"
            aria-label="Notificações"
            className="relative"
            onClick={() => setNotificationsOpen((value) => !value)}
          >
            <Bell className="size-5" />
            {totalNotifications > 0 ? (
              <span className="absolute -right-0.5 -top-0.5 flex size-5 items-center justify-center rounded-full bg-destructive text-[10px] font-bold text-destructive-foreground">
                {totalNotifications}
              </span>
            ) : null}
          </Button>

          {notificationsOpen ? (
            <div className="absolute right-0 top-full z-50 mt-3 w-[min(560px,calc(100vw-2rem))] overflow-hidden rounded-lg border border-border bg-popover shadow-xl">
              <div className="flex items-center justify-between gap-3 border-b border-border px-5 py-4">
                <div>
                  <h2 className="text-base font-bold text-popover-foreground">Notificações</h2>
                  <p className="text-xs text-muted-foreground">Alertas importantes da operação</p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="rounded-md bg-muted px-2.5 py-1 text-xs font-semibold text-foreground">
                    {totalNotifications} novas
                  </span>
                  <Button variant="ghost" size="icon-sm" aria-label="Marcar como lidas">
                    <CheckCheck className="size-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    aria-label="Fechar notificações"
                    onClick={() => setNotificationsOpen(false)}
                  >
                    <X className="size-4" />
                  </Button>
                </div>
              </div>

              <div className="flex gap-1 overflow-x-auto border-b border-border bg-muted/30 px-3 py-2 no-scrollbar">
                {(Object.keys(tabConfig) as NotificationTab[]).map((tab) => {
                  const Icon = tabConfig[tab].icon
                  const activeItem = tab === activeTab
                  const count = notifications[tab].length
                  return (
                    <button
                      key={tab}
                      onClick={() => setActiveTab(tab)}
                      className={cn(
                        'flex shrink-0 items-center gap-2 rounded-md px-3 py-2 text-sm font-semibold transition-colors',
                        activeItem
                          ? 'bg-background text-foreground shadow-sm ring-1 ring-border'
                          : 'text-muted-foreground hover:bg-background hover:text-foreground',
                      )}
                    >
                      <Icon className="size-4" />
                      {tabConfig[tab].shortLabel}
                      {count > 0 ? (
                        <span className="flex size-5 items-center justify-center rounded-full bg-destructive text-[10px] font-bold text-destructive-foreground">
                          {count}
                        </span>
                      ) : null}
                    </button>
                  )
                })}
              </div>

              <div className="max-h-[420px] space-y-3 overflow-y-auto p-5">
                {activeNotifications.length > 0 ? (
                  activeNotifications.map((item) => (
                    <div
                      key={item.id}
                      className="flex items-center gap-3 rounded-lg border border-border bg-background p-3 transition-colors hover:bg-muted/50"
                    >
                      <span className={cn('flex size-10 shrink-0 items-center justify-center rounded-md', toneClass[item.tone])}>
                        {activeTab === 'planos' ? (
                          <Clock3 className="size-5" />
                        ) : activeTab === 'comandas' ? (
                          <ShoppingCart className="size-5" />
                        ) : activeTab === 'estoque' ? (
                          <Package className="size-5" />
                        ) : (
                          <Cake className="size-5" />
                        )}
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="truncate font-semibold text-foreground">{item.title}</p>
                        <p className="truncate text-sm text-muted-foreground">{item.description}</p>
                      </div>
                      <Button variant="ghost" size="icon-sm" aria-label="Abrir conversa">
                        <MessageSquare className="size-4 text-success" />
                      </Button>
                    </div>
                  ))
                ) : (
                  <div className="rounded-lg border border-dashed border-border p-8 text-center text-sm text-muted-foreground">
                    Nenhuma notificação em {tabConfig[activeTab].label.toLowerCase()}.
                  </div>
                )}
              </div>
            </div>
          ) : null}
        </div>

        <div className="flex items-center gap-2 rounded-lg border border-border bg-background py-1 pl-1 pr-2.5">
          <Avatar name="Conta" className="size-7" />
          <span className="hidden leading-tight sm:block">
            <span className="block text-xs font-semibold text-foreground">Minha conta</span>
            <span className="block text-[11px] text-muted-foreground">Proprietário</span>
          </span>
        </div>

        <button
          type="button"
          onClick={signOut}
          className="inline-flex h-9 items-center justify-center gap-2 rounded-md border border-border bg-background px-3 text-sm font-medium text-foreground shadow-sm transition-colors hover:bg-muted"
        >
          <LogOut className="size-4" />
          <span className="hidden sm:inline">Sair</span>
        </button>
      </div>
    </header>
  )
}
  async function signOut() {
    await createBrowserSupabaseClient().auth.signOut()
    window.location.replace('/login')
  }
