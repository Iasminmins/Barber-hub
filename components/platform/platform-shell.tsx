'use client'

import * as React from 'react'
import Link from 'next/link'
import { Bell, RefreshCw, Loader2, MessageSquarePlus, Search, Scissors } from 'lucide-react'
import { Button, buttonVariants } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select } from '@/components/ui/select'
import { PlatformSidebar } from './platform-sidebar'
import { PlatformBottomNav } from './platform-bottom-nav'
import { cn } from '@/lib/utils'

type PlatformShellProps = {
  children: React.ReactNode
  adminName: string
  title: string
  description?: string
  unreadMessages?: number
  loading?: boolean
  period?: number
  onPeriodChange?: (days: number) => void
  onRefresh?: () => void
  onSignOut: () => void
  globalSearch?: string
  onGlobalSearchChange?: (value: string) => void
  onGlobalSearchSubmit?: () => void
  showGlobalSearch?: boolean
  showPeriod?: boolean
  showNewMessage?: boolean
}

export function PlatformShell({
  children,
  adminName,
  title,
  description,
  unreadMessages = 0,
  loading = false,
  period = 30,
  onPeriodChange,
  onRefresh,
  onSignOut,
  globalSearch = '',
  onGlobalSearchChange,
  onGlobalSearchSubmit,
  showGlobalSearch = true,
  showPeriod = true,
  showNewMessage = true,
}: PlatformShellProps) {
  const [collapsed, setCollapsed] = React.useState(false)
  const [searchFocused, setSearchFocused] = React.useState(false)

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <div className="hidden h-full lg:flex">
        <PlatformSidebar
          collapsed={collapsed}
          onToggle={() => setCollapsed((v) => !v)}
          adminName={adminName}
          unreadMessages={unreadMessages}
          onSignOut={onSignOut}
        />
      </div>

      <div className="flex min-w-0 flex-1 flex-col overflow-y-auto transition-[margin-left] duration-200 ease-out">
        <header className="sticky top-0 z-30 border-b border-border/60 bg-card/90 backdrop-blur-md">
          <div className="flex h-16 items-center gap-3 px-4 lg:px-6">
            <div className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-primary text-primary-foreground lg:hidden">
              <Scissors className="size-4" />
            </div>

            <div className="min-w-0 flex-1">
              <h1 className="truncate text-[20px] font-medium leading-tight tracking-tight text-foreground">{title}</h1>
              {description ? (
                <p className="hidden truncate text-[13px] leading-tight text-muted-foreground sm:block">{description}</p>
              ) : null}
            </div>

            <div className="flex shrink-0 items-center gap-2">
              {showGlobalSearch && onGlobalSearchChange ? (
                <form
                  className="relative hidden lg:block"
                  onSubmit={(e) => {
                    e.preventDefault()
                    onGlobalSearchSubmit?.()
                  }}
                >
                  <Search className="pointer-events-none absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    className={cn(
                      'h-9 rounded-xl border-border/60 bg-background pl-9 text-sm transition-[width] duration-150 ease-out',
                      searchFocused || globalSearch ? 'w-64' : 'w-9 xl:w-64',
                    )}
                    placeholder="Buscar barbearia, responsável…"
                    aria-label="Buscar"
                    value={globalSearch}
                    onFocus={() => setSearchFocused(true)}
                    onBlur={() => setSearchFocused(false)}
                    onChange={(e) => onGlobalSearchChange(e.target.value)}
                  />
                </form>
              ) : null}

              {showPeriod && onPeriodChange ? (
                // O Select renderiza um wrapper próprio (com o ícone absoluto), então a
                // visibilidade responsiva precisa ficar aqui fora — não na className dele.
                <div className="hidden lg:block">
                  <Select
                    className="h-9 w-[124px] rounded-xl text-sm"
                    value={String(period)}
                    onChange={(e) => onPeriodChange(Number(e.target.value))}
                    aria-label="Período"
                  >
                    <option value="7">7 dias</option>
                    <option value="30">30 dias</option>
                    <option value="90">90 dias</option>
                    <option value="365">12 meses</option>
                  </Select>
                </div>
              ) : null}

              {onRefresh ? (
                <Button
                  variant="outline"
                  size="sm"
                  className="hidden rounded-xl lg:inline-flex"
                  disabled={loading}
                  onClick={onRefresh}
                  title="Atualizar"
                >
                  {loading ? <Loader2 className="size-4 animate-spin" /> : <RefreshCw className="size-4" />}
                  <span className="ml-2 hidden xl:inline">Atualizar</span>
                </Button>
              ) : null}

              <Link
                href="/plataforma/mensagens?tab=inbox"
                className={buttonVariants({ variant: 'outline', size: 'icon-sm', className: 'relative rounded-xl' })}
                aria-label="Notificações"
              >
                <Bell className="size-4" />
                {unreadMessages > 0 ? (
                  <span className="absolute -right-0.5 -top-0.5 flex size-4 items-center justify-center rounded-full bg-gold text-[9px] font-medium text-gold-foreground">
                    {unreadMessages > 9 ? '9+' : unreadMessages}
                  </span>
                ) : null}
              </Link>

              {showNewMessage ? (
                <Link
                  href="/plataforma/mensagens?compose=1"
                  className={cn(buttonVariants({ size: 'sm' }), 'hidden rounded-xl bg-primary xl:inline-flex')}
                >
                  <MessageSquarePlus className="size-4" />
                  <span className="ml-2">Nova mensagem</span>
                </Link>
              ) : null}
            </div>
          </div>
        </header>

        <main
          className={cn(
            'flex-1 px-4 pb-24 pt-6 lg:px-6 lg:pb-8',
            'animate-in fade-in slide-in-from-bottom-1 duration-300',
          )}
        >
          {children}
        </main>
      </div>

      <PlatformBottomNav unreadMessages={unreadMessages} onSignOut={onSignOut} adminName={adminName} />
    </div>
  )
}
