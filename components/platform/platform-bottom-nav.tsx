'use client'

import * as React from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  LayoutDashboard,
  Users,
  MessageSquare,
  MoreHorizontal,
  Building2,
  CreditCard,
  Receipt,
  Timer,
  Gift,
  BarChart3,
  Settings,
  LogOut,
  X,
  type LucideIcon,
} from 'lucide-react'
import { cn } from '@/lib/utils'

type BottomNavItem = { href: string; label: string; icon: LucideIcon; exact?: boolean; badge?: boolean }

const primaryItems: BottomNavItem[] = [
  { href: '/plataforma', label: 'Início', icon: LayoutDashboard, exact: true },
  { href: '/plataforma/clientes', label: 'Clientes', icon: Users },
  { href: '/plataforma/mensagens', label: 'Mensagens', icon: MessageSquare, badge: true },
]

const secondaryItems = [
  { href: '/plataforma/barbearias', label: 'Barbearias', icon: Building2 },
  { href: '/plataforma/assinaturas', label: 'Assinaturas', icon: CreditCard },
  { href: '/plataforma/cobrancas', label: 'Cobranças', icon: Receipt },
  { href: '/plataforma/testes', label: 'Testes gratuitos', icon: Timer },
  { href: '/plataforma/cortesias', label: 'Cupons e cortesias', icon: Gift },
  { href: '/plataforma/relatorios', label: 'Relatórios', icon: BarChart3 },
  { href: '/plataforma/configuracoes', label: 'Configurações', icon: Settings },
] as const

type PlatformBottomNavProps = {
  unreadMessages?: number
  adminName?: string
  onSignOut: () => void
}

export function PlatformBottomNav({ unreadMessages = 0, adminName, onSignOut }: PlatformBottomNavProps) {
  const pathname = usePathname()
  const [sheetOpen, setSheetOpen] = React.useState(false)

  const secondaryActive = secondaryItems.some((item) => pathname.startsWith(item.href))

  React.useEffect(() => {
    if (!sheetOpen) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setSheetOpen(false)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [sheetOpen])

  return (
    <>
      <nav className="fixed inset-x-0 bottom-0 z-40 h-16 border-t border-border/60 bg-card lg:hidden">
        <ul className="grid h-full grid-cols-4">
          {primaryItems.map((item) => {
            const active = item.exact ? pathname === item.href : pathname.startsWith(item.href)
            const Icon = item.icon
            const badge = item.badge ? unreadMessages : 0
            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className={cn(
                    'flex h-full flex-col items-center justify-center gap-1 transition-colors duration-150',
                    active ? 'text-primary' : 'text-muted-foreground',
                  )}
                >
                  <span className="relative">
                    <Icon className="size-[20px]" />
                    {badge > 0 ? (
                      <span className="absolute -right-1.5 -top-1 flex min-w-4 items-center justify-center rounded-full bg-gold px-1 text-[9px] font-medium text-gold-foreground">
                        {badge > 9 ? '9+' : badge}
                      </span>
                    ) : null}
                  </span>
                  <span className={cn('text-[11px]', active ? 'font-medium' : 'font-normal')}>{item.label}</span>
                </Link>
              </li>
            )
          })}
          <li>
            <button
              type="button"
              onClick={() => setSheetOpen(true)}
              className={cn(
                'flex h-full w-full flex-col items-center justify-center gap-1 transition-colors duration-150',
                sheetOpen || secondaryActive ? 'text-primary' : 'text-muted-foreground',
              )}
              aria-label="Mais opções"
              aria-expanded={sheetOpen}
            >
              <MoreHorizontal className="size-[20px]" />
              <span className={cn('text-[11px]', sheetOpen || secondaryActive ? 'font-medium' : 'font-normal')}>Mais</span>
            </button>
          </li>
        </ul>
      </nav>

      {sheetOpen ? (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div
            className="absolute inset-0 bg-foreground/40 backdrop-blur-[2px] animate-in fade-in duration-150"
            onClick={() => setSheetOpen(false)}
            aria-hidden="true"
          />
          <div
            role="dialog"
            aria-label="Mais opções"
            className="absolute inset-x-0 bottom-0 max-h-[80vh] overflow-y-auto rounded-t-[20px] border-t border-border/60 bg-card pb-6 animate-in slide-in-from-bottom duration-200"
          >
            <div className="flex items-center justify-between px-5 pb-2 pt-4">
              <div className="min-w-0">
                <p className="text-[11px] uppercase tracking-wide text-muted-foreground">Navegação</p>
                <p className="truncate text-sm text-foreground">{adminName || 'Administrador'}</p>
              </div>
              <button
                type="button"
                onClick={() => setSheetOpen(false)}
                className="flex size-8 items-center justify-center rounded-lg text-muted-foreground transition-colors duration-150 hover:bg-muted/40"
                aria-label="Fechar"
              >
                <X className="size-4" />
              </button>
            </div>

            <ul className="px-3 pb-2">
              {secondaryItems.map((item) => {
                const active = pathname.startsWith(item.href)
                const Icon = item.icon
                return (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      onClick={() => setSheetOpen(false)}
                      className={cn(
                        'flex items-center gap-3 rounded-xl px-3 py-3 text-sm transition-colors duration-150',
                        active ? 'bg-muted/60 text-primary' : 'text-foreground hover:bg-muted/40',
                      )}
                    >
                      <Icon className="size-[18px] shrink-0" />
                      <span className="truncate">{item.label}</span>
                    </Link>
                  </li>
                )
              })}
            </ul>

            <div className="border-t border-border/60 px-3 pt-2">
              <button
                type="button"
                onClick={() => {
                  setSheetOpen(false)
                  void onSignOut()
                }}
                className="flex w-full items-center gap-3 rounded-xl px-3 py-3 text-sm text-muted-foreground transition-colors duration-150 hover:bg-muted/40"
              >
                <LogOut className="size-[18px] shrink-0" />
                Sair
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </>
  )
}
