'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import * as React from 'react'
import { Mail, MessageCircle, PanelLeftClose, Send, Sparkles } from 'lucide-react'
import { BrandMark } from '@/components/brand-mark'
import { useAppData } from '@/components/data/app-data-provider'
import { Button } from '@/components/ui/button'
import { Dialog, DialogHeader } from '@/components/ui/dialog'
import { Textarea } from '@/components/ui/textarea'
import { navGroups } from '@/lib/nav'
import { getSaasPlan } from '@/lib/saas-plans'
import { cn } from '@/lib/utils'
import { allowedPathsForPermissions } from '@/lib/staff-permissions'

export function SidebarContent({
  collapsed = false,
  onNavigate,
  onToggle,
}: {
  collapsed?: boolean
  onNavigate?: () => void
  onToggle?: () => void
}) {
  const pathname = usePathname()
  const { barbershop, member } = useAppData()
  const [supportOpen, setSupportOpen] = React.useState(false)
  const [supportMessage, setSupportMessage] = React.useState('')
  const currentPlan = getSaasPlan(barbershop.plan)
  const allowedPaths = member.role === 'barber'
    ? allowedPathsForPermissions(member.permissions)
    : member.role === 'reception'
      ? ['/dashboard', '/agenda', '/comandas', '/clientes']
      : null

  return (
    <div className="flex h-full flex-col bg-sidebar">
      <div className={cn('flex h-16 items-center border-b border-sidebar-border px-4', collapsed ? 'justify-center' : 'gap-2.5')}>
        <button
          type="button"
          onClick={collapsed ? onToggle : undefined}
          className={cn(
            'flex size-9 items-center justify-center rounded-lg',
            collapsed && 'cursor-pointer transition-transform hover:scale-105',
          )}
          aria-label={collapsed ? 'Abrir lateral' : barbershop.name || 'BarberHub'}
          title={collapsed ? 'Abrir lateral' : barbershop.name || 'BarberHub'}
        >
          <BrandMark name={barbershop.name} color={barbershop.color} logoUrl={barbershop.logoUrl} className="size-9" />
        </button>
        {!collapsed ? (
          <>
            <div className="min-w-0 flex-1 leading-tight">
              <p className="truncate text-sm font-bold text-sidebar-foreground">{barbershop.name || 'BarberHub'}</p>
              <p className="truncate text-[11px] text-muted-foreground">{barbershop.city || 'Sua barbearia conectada'}</p>
            </div>
            {onToggle ? (
              <button
                type="button"
                onClick={onToggle}
                className="hidden size-8 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground lg:flex"
                aria-label="Fechar lateral"
                title="Fechar lateral"
              >
                <PanelLeftClose className="size-4" />
              </button>
            ) : null}
          </>
        ) : null}
      </div>

      <nav className={cn('flex-1 overflow-y-auto py-4 no-scrollbar', collapsed ? 'px-2' : 'px-3')}>
        {navGroups.map((group) => (
          <div key={group.title} className="mb-5">
            {!collapsed ? (
              <p className="px-3 pb-2 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                {group.title}
              </p>
            ) : null}
            <ul className="flex flex-col gap-0.5">
              {group.items.filter((item) => {
                if (item.managementOnly && !['owner', 'manager'].includes(member.role)) return false
                return !allowedPaths || allowedPaths.includes(item.href)
              }).map((item) => {
                const active = pathname === item.href
                const Icon = item.icon
                return (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      onClick={onNavigate}
                      title={collapsed ? item.label : undefined}
                      className={cn(
                        'flex items-center rounded-lg text-sm font-medium transition-colors',
                        collapsed ? 'justify-center px-0 py-2.5' : 'gap-3 px-3 py-2',
                        active
                          ? 'bg-sidebar-primary text-sidebar-primary-foreground shadow-sm'
                          : 'text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground',
                      )}
                    >
                      <Icon className="size-[18px] shrink-0" />
                      {!collapsed ? <span>{item.label}</span> : null}
                    </Link>
                  </li>
                )
              })}
            </ul>
          </div>
        ))}
      </nav>

      <div className="border-t border-sidebar-border p-3">
        <button
          type="button"
          onClick={() => setSupportOpen(true)}
          className={cn(
            'mb-2 flex w-full items-center rounded-lg border border-[#25D366]/30 bg-[#25D366]/10 text-sm font-semibold text-sidebar-foreground transition-colors hover:bg-[#25D366]/20',
            collapsed ? 'justify-center p-2.5' : 'gap-3 px-3 py-2.5',
          )}
          aria-label="Fale conosco"
          title={collapsed ? 'Fale conosco' : undefined}
        >
          <MessageCircle className="size-[18px] shrink-0 text-[#1b9b4b]" />
          {!collapsed ? <span>Fale conosco</span> : null}
        </button>
        <div
          className={cn(
            'flex rounded-lg bg-accent/60 p-3',
            collapsed ? 'justify-center' : 'items-start gap-2.5',
          )}
          title={collapsed ? `Plano ${currentPlan.name}` : undefined}
        >
          <Sparkles className="mt-0.5 size-4 shrink-0 text-gold-foreground" />
          {!collapsed ? (
            <div className="leading-tight">
              <p className="text-xs font-semibold text-foreground">Plano {currentPlan.name}</p>
              <p className="text-[11px] text-muted-foreground">
                {currentPlan.users} · {currentPlan.reports}
              </p>
            </div>
          ) : null}
        </div>
      </div>

      <Dialog open={supportOpen} onClose={() => setSupportOpen(false)}>
        <DialogHeader
          title="Como podemos ajudar?"
          description="Escreva sua dúvida e escolha por onde deseja falar com o suporte do MeuBarberHub."
        />

        <label htmlFor="support-message" className="text-sm font-medium text-foreground">
          Sua mensagem
        </label>
        <Textarea
          id="support-message"
          value={supportMessage}
          onChange={(event) => setSupportMessage(event.target.value)}
          placeholder="Ex.: Preciso de ajuda para configurar minha agenda..."
          className="mt-2 min-h-28 resize-none"
        />
        <p className="mt-2 text-xs text-muted-foreground">A mensagem será preenchida automaticamente no canal escolhido.</p>

        <div className="mt-5 grid gap-3 sm:grid-cols-2">
          <Button
            type="button"
            className="h-auto min-h-12 bg-[#25D366] px-4 py-3 text-[#10251f] hover:bg-[#20bd5a]"
            disabled={!supportMessage.trim()}
            onClick={() => {
              const message = encodeURIComponent(`Olá, sou da ${barbershop.name}. ${supportMessage.trim()}`)
              window.open(`https://wa.me/5524999327549?text=${message}`, '_blank', 'noopener,noreferrer')
            }}
          >
            <MessageCircle className="size-5" />
            Enviar pelo WhatsApp
          </Button>
          <Button
            type="button"
            variant="outline"
            className="h-auto min-h-12 px-4 py-3"
            disabled={!supportMessage.trim()}
            onClick={() => {
              const subject = encodeURIComponent(`Dúvida sobre o MeuBarberHub — ${barbershop.name}`)
              const body = encodeURIComponent(supportMessage.trim())
              window.location.href = `mailto:suportemeubarberhub@gmail.com?subject=${subject}&body=${body}`
            }}
          >
            <Mail className="size-5" />
            Enviar por e-mail
          </Button>
        </div>

        <div className="mt-4 flex items-center justify-center gap-2 text-xs text-muted-foreground">
          <Send className="size-3.5" />
          WhatsApp: (24) 99932-7549
        </div>
      </Dialog>
    </div>
  )
}
