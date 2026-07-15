'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Scissors, Sparkles } from 'lucide-react'
import { getActiveBarbershop } from '@/lib/data'
import { navGroups } from '@/lib/nav'
import { getSaasPlan } from '@/lib/saas-plans'
import { cn } from '@/lib/utils'

export function SidebarContent({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname()
  const currentPlan = getSaasPlan(getActiveBarbershop().plan)

  return (
    <div className="flex h-full flex-col bg-sidebar">
      <div className="flex h-16 items-center gap-2.5 border-b border-sidebar-border px-5">
        <div className="flex size-9 items-center justify-center rounded-lg bg-primary text-primary-foreground">
          <Scissors className="size-5" />
        </div>
        <div className="leading-tight">
          <p className="text-sm font-bold text-sidebar-foreground">BarberHub</p>
          <p className="text-[11px] text-muted-foreground">Sua barbearia conectada</p>
        </div>
      </div>

      <nav className="flex-1 overflow-y-auto px-3 py-4 no-scrollbar">
        {navGroups.map((group) => (
          <div key={group.title} className="mb-5">
            <p className="px-3 pb-2 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
              {group.title}
            </p>
            <ul className="flex flex-col gap-0.5">
              {group.items.map((item) => {
                const active = pathname === item.href
                const Icon = item.icon
                return (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      onClick={onNavigate}
                      className={cn(
                        'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                        active
                          ? 'bg-sidebar-primary text-sidebar-primary-foreground shadow-sm'
                          : 'text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground',
                      )}
                    >
                      <Icon className="size-[18px] shrink-0" />
                      <span>{item.label}</span>
                    </Link>
                  </li>
                )
              })}
            </ul>
          </div>
        ))}
      </nav>

      <div className="border-t border-sidebar-border p-3">
        <div className="flex items-start gap-2.5 rounded-lg bg-accent/60 p-3">
          <Sparkles className="mt-0.5 size-4 shrink-0 text-gold-foreground" />
          <div className="leading-tight">
            <p className="text-xs font-semibold text-foreground">Plano {currentPlan.name}</p>
            <p className="text-[11px] text-muted-foreground">
              {currentPlan.users} · {currentPlan.reports}
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
