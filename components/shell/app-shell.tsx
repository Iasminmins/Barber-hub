'use client'

import * as React from 'react'
import { X } from 'lucide-react'
import { SidebarContent } from './sidebar'
import { Topbar } from './topbar'
import { Button } from '@/components/ui/button'

export function AppShell({ children }: { children: React.ReactNode }) {
  const [mobileOpen, setMobileOpen] = React.useState(false)
  const [collapsed, setCollapsed] = React.useState(false)

  return (
    <div className="flex min-h-screen bg-background">
      {/* Sidebar desktop */}
      <aside
        className={`fixed inset-y-0 left-0 z-40 hidden border-r border-sidebar-border transition-[width] duration-200 lg:block ${
          collapsed ? 'w-20' : 'w-64'
        }`}
      >
        <SidebarContent collapsed={collapsed} onToggle={() => setCollapsed((value) => !value)} />
      </aside>

      {/* Sidebar mobile (drawer) */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div
            className="absolute inset-0 bg-foreground/40 backdrop-blur-sm"
            onClick={() => setMobileOpen(false)}
            aria-hidden="true"
          />
          <aside className="absolute inset-y-0 left-0 w-72 border-r border-sidebar-border shadow-xl">
            <Button
              variant="ghost"
              size="icon-sm"
              onClick={() => setMobileOpen(false)}
              className="absolute right-2 top-3 z-10 text-muted-foreground"
              aria-label="Fechar menu"
            >
              <X className="size-4" />
            </Button>
            <SidebarContent onNavigate={() => setMobileOpen(false)} />
          </aside>
        </div>
      )}

      <div
        className={`flex min-w-0 flex-1 flex-col transition-[padding] duration-200 ${
          collapsed ? 'lg:pl-20' : 'lg:pl-64'
        }`}
      >
        <Topbar onMenu={() => setMobileOpen(true)} />
        <main className="flex-1 p-4 lg:p-6">{children}</main>
      </div>
    </div>
  )
}
