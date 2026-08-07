'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  LayoutDashboard,
  Building2,
  Users,
  MessageSquare,
  CreditCard,
  Receipt,
  Timer,
  Gift,
  BarChart3,
  Settings,
  PanelLeftClose,
  PanelLeft,
  LogOut,
  Scissors,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'

const navItems = [
  { href: '/plataforma', label: 'Visão geral', icon: LayoutDashboard, exact: true },
  { href: '/plataforma/barbearias', label: 'Barbearias', icon: Building2 },
  { href: '/plataforma/clientes', label: 'Clientes / Responsáveis', icon: Users },
  { href: '/plataforma/mensagens', label: 'Mensagens', icon: MessageSquare, badgeKey: 'messages' as const },
  { href: '/plataforma/assinaturas', label: 'Assinaturas', icon: CreditCard },
  { href: '/plataforma/cobrancas', label: 'Cobranças', icon: Receipt },
  { href: '/plataforma/testes', label: 'Testes gratuitos', icon: Timer },
  { href: '/plataforma/cortesias', label: 'Cupons e cortesias', icon: Gift },
  { href: '/plataforma/relatorios', label: 'Relatórios', icon: BarChart3 },
  { href: '/plataforma/configuracoes', label: 'Configurações', icon: Settings },
]

type PlatformSidebarProps = {
  collapsed: boolean
  onToggle: () => void
  adminName: string
  unreadMessages?: number
  onSignOut: () => void
  onNavigate?: () => void
}

export function PlatformSidebar({
  collapsed,
  onToggle,
  adminName,
  unreadMessages = 0,
  onSignOut,
  onNavigate,
}: PlatformSidebarProps) {
  const pathname = usePathname()

  return (
    <aside
      className={cn(
        'flex h-full flex-col border-r border-sidebar-border bg-sidebar transition-[width] duration-200',
        collapsed ? 'w-[72px]' : 'w-64',
      )}
    >
      <div className={cn('flex h-16 items-center border-b border-sidebar-border px-4', collapsed ? 'justify-center' : 'gap-3')}>
        <div className="flex size-9 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-sm">
          <Scissors className="size-4" />
        </div>
        {!collapsed ? (
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-1.5">
              <p className="truncate text-sm font-bold text-sidebar-foreground">Barber Hub</p>
              <span className="pf-premium-badge shrink-0 rounded-full px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wide">Premium</span>
            </div>
            <p className="truncate text-[11px] text-muted-foreground">Administração SaaS</p>
          </div>
        ) : null}
        {!collapsed ? (
          <button
            type="button"
            onClick={onToggle}
            className="hidden size-8 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-sidebar-accent lg:flex"
            aria-label="Recolher menu"
          >
            <PanelLeftClose className="size-4" />
          </button>
        ) : (
          <button
            type="button"
            onClick={onToggle}
            className="sr-only"
            aria-label="Expandir menu"
          >
            Expandir
          </button>
        )}
      </div>

      <nav className="flex-1 overflow-y-auto px-2 py-4 no-scrollbar">
        <ul className="flex flex-col gap-0.5">
          {navItems.map((item) => {
            const active = item.exact ? pathname === item.href : pathname.startsWith(item.href)
            const Icon = item.icon
            const badge = item.badgeKey === 'messages' ? unreadMessages : 0
            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  onClick={onNavigate}
                  title={collapsed ? item.label : undefined}
                  className={cn(
                    'group flex items-center rounded-xl text-sm font-medium transition-all',
                    collapsed ? 'justify-center px-0 py-2.5' : 'gap-3 px-3 py-2.5',
                    active
                      ? 'bg-sidebar-primary text-sidebar-primary-foreground shadow-sm'
                      : 'text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground',
                  )}
                >
                  <Icon className="size-[18px] shrink-0" />
                  {!collapsed ? (
                    <>
                      <span className="flex-1 truncate">{item.label}</span>
                      {badge > 0 ? (
                        <span className="rounded-full bg-gold px-1.5 py-0.5 text-[10px] font-bold text-gold-foreground">
                          {badge > 99 ? '99+' : badge}
                        </span>
                      ) : null}
                    </>
                  ) : badge > 0 ? (
                    <span className="absolute ml-5 mt-[-14px] size-2 rounded-full bg-gold" />
                  ) : null}
                </Link>
              </li>
            )
          })}
        </ul>
      </nav>

      <div className={cn('border-t border-sidebar-border p-3', collapsed && 'flex flex-col items-center')}>
        {collapsed ? (
          <button
            type="button"
            onClick={onToggle}
            className="mb-2 flex size-9 items-center justify-center rounded-lg text-muted-foreground hover:bg-sidebar-accent"
            aria-label="Expandir menu"
          >
            <PanelLeft className="size-4" />
          </button>
        ) : (
          <div className="mb-3 rounded-xl bg-sidebar-accent/60 px-3 py-2.5">
            <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">Conectado</p>
            <p className="truncate text-sm font-medium text-sidebar-foreground">{adminName || 'Administrador'}</p>
          </div>
        )}
        <Button
          variant="ghost"
          size={collapsed ? 'icon-sm' : 'sm'}
          className={cn('w-full text-muted-foreground', collapsed && 'size-9')}
          onClick={() => void onSignOut()}
        >
          <LogOut className="size-4" />
          {!collapsed ? <span className="ml-2">Sair</span> : null}
        </Button>
      </div>
    </aside>
  )
}

export { navItems }
