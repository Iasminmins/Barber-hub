'use client'

import * as React from 'react'
import Link from 'next/link'
import { Menu, Bell, RefreshCw, Loader2, MessageSquarePlus, Search } from 'lucide-react'
import { Button, buttonVariants } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select } from '@/components/ui/select'
import { PlatformSidebar } from './platform-sidebar'
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
  const [mobileOpen, setMobileOpen] = React.useState(false)

  return (
    <div className="flex min-h-screen bg-background">
      <div className="hidden lg:flex">
        <PlatformSidebar
          collapsed={collapsed}
          onToggle={() => setCollapsed((v) => !v)}
          adminName={adminName}
          unreadMessages={unreadMessages}
          onSignOut={onSignOut}
        />
      </div>

      {mobileOpen ? (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-foreground/40 backdrop-blur-sm" onClick={() => setMobileOpen(false)} aria-hidden="true" />
          <div className="relative h-full w-64 shadow-xl">
            <PlatformSidebar
              collapsed={false}
              onToggle={() => setMobileOpen(false)}
              adminName={adminName}
              unreadMessages={unreadMessages}
              onSignOut={onSignOut}
              onNavigate={() => setMobileOpen(false)}
            />
          </div>
        </div>
      ) : null}

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-30 border-b border-border/80 bg-card/90 backdrop-blur-md">
          <div className="flex flex-wrap items-center gap-3 px-4 py-4 lg:px-6">
            <Button
              variant="ghost"
              size="icon-sm"
              className="lg:hidden"
              onClick={() => setMobileOpen(true)}
              aria-label="Abrir menu"
            >
              <Menu className="size-5" />
            </Button>

            <div className="min-w-0 flex-1">
              <h1 className="text-xl font-semibold tracking-tight text-foreground">{title}</h1>
              {description ? (
                <p className="mt-0.5 text-sm text-muted-foreground">{description}</p>
              ) : null}
            </div>

            <div className="flex w-full flex-wrap items-center gap-2 sm:w-auto">
              {showGlobalSearch && onGlobalSearchChange ? (
                <form
                  className="relative min-w-[200px] flex-1 sm:w-64 sm:flex-none"
                  onSubmit={(e) => {
                    e.preventDefault()
                    onGlobalSearchSubmit?.()
                  }}
                >
                  <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    className="h-9 rounded-xl border-border/80 bg-background pl-9 text-sm shadow-sm"
                    placeholder="Buscar barbearia, responsável, e-mail…"
                    value={globalSearch}
                    onChange={(e) => onGlobalSearchChange(e.target.value)}
                  />
                </form>
              ) : null}

              {showPeriod && onPeriodChange ? (
                <Select
                  className="h-9 w-[130px] rounded-xl text-sm"
                  value={String(period)}
                  onChange={(e) => onPeriodChange(Number(e.target.value))}
                >
                  <option value="7">7 dias</option>
                  <option value="30">30 dias</option>
                  <option value="90">90 dias</option>
                  <option value="365">12 meses</option>
                </Select>
              ) : null}

              {onRefresh ? (
                <Button variant="outline" size="sm" className="rounded-xl" disabled={loading} onClick={onRefresh}>
                  {loading ? <Loader2 className="size-4 animate-spin" /> : <RefreshCw className="size-4" />}
                  <span className="ml-2 hidden sm:inline">Atualizar</span>
                </Button>
              ) : null}

              <Link
                href="/plataforma/mensagens?tab=inbox"
                className={buttonVariants({ variant: 'outline', size: 'icon-sm', className: 'relative rounded-xl' })}
                aria-label="Notificações"
              >
                <Bell className="size-4" />
                {unreadMessages > 0 ? (
                  <span className="absolute -right-0.5 -top-0.5 flex size-4 items-center justify-center rounded-full bg-gold text-[9px] font-bold text-gold-foreground">
                    {unreadMessages > 9 ? '9+' : unreadMessages}
                  </span>
                ) : null}
              </Link>

              {showNewMessage ? (
                <Link href="/plataforma/mensagens?compose=1" className={buttonVariants({ size: 'sm', className: 'rounded-xl bg-primary shadow-sm' })}>
                  <MessageSquarePlus className="size-4" />
                  <span className="ml-2 hidden sm:inline">Nova mensagem</span>
                </Link>
              ) : null}
            </div>
          </div>
        </header>

        <main className={cn('flex-1 px-4 py-6 lg:px-6', 'animate-in fade-in slide-in-from-bottom-1 duration-300')}>
          {children}
        </main>
      </div>
    </div>
  )
}
