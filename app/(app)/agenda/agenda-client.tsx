'use client'

import * as React from 'react'
import Link from 'next/link'
import { ChevronLeft, ChevronRight, Plus, CalendarDays, Ban, Coffee } from 'lucide-react'
import { PageHeader } from '@/components/page-header'
import { StatusBadge } from '@/components/status-badge'
import { Button, buttonVariants } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Tabs } from '@/components/ui/tabs'
import { Avatar } from '@/components/ui/avatar'
import { cn } from '@/lib/utils'
import { formatCurrency } from '@/lib/format'
import type { Appointment, Employee } from '@/lib/types'

const HOURS = Array.from({ length: 12 }, (_, i) => 8 + i) // 08:00 - 19:00

const statusColor: Record<Appointment['status'], string> = {
  agendado: 'border-l-muted-foreground/40 bg-muted/60',
  confirmado: 'border-l-primary bg-primary/8',
  chegou: 'border-l-gold bg-gold/10',
  concluido: 'border-l-success bg-success/8',
  cancelado: 'border-l-destructive bg-destructive/8 opacity-70',
  faltou: 'border-l-warning bg-warning/10 opacity-80',
}

function timeToTop(start: string) {
  const [h, mm] = start.split(':').map(Number)
  return (h - 8) * 64 + (mm / 60) * 64
}

export function AgendaClient({
  appointments,
  employees,
}: {
  appointments: Appointment[]
  employees: Employee[]
}) {
  const [view, setView] = React.useState('dia')
  const [barberFilter, setBarberFilter] = React.useState<string>('todos')
  const agendaAppointments = appointments

  const barbers = employees.filter((e) => e.active && e.role.toLowerCase().includes('barbeiro'))
  const columns = barberFilter === 'todos' ? barbers : barbers.filter((b) => b.id === barberFilter)

  const todayAppts = agendaAppointments.filter((a) => a.date === new Date().toISOString().slice(0, 10))

  const stats = {
    total: todayAppts.length,
    confirmados: todayAppts.filter((a) => ['confirmado', 'chegou'].includes(a.status)).length,
    concluidos: todayAppts.filter((a) => a.status === 'concluido').length,
    receita: todayAppts.filter((a) => a.status === 'concluido').reduce((s, a) => s + a.price, 0),
  }

  return (
    <div>
      <PageHeader title="Agenda" description="Gerencie os agendamentos por dia, semana ou barbeiro.">
        <Button variant="outline" size="sm">
          <Ban className="size-4" />
          Bloquear horário
        </Button>
        <Button variant="outline" size="sm">
          <Coffee className="size-4" />
          Pausa
        </Button>
        <Link href="/agenda/novo" className={buttonVariants({ variant: 'gold', size: 'sm' })}>
          <Plus className="size-4" />
          Novo agendamento
        </Link>
      </PageHeader>

      {/* Resumo do dia */}
      <div className="mb-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Card className="p-3">
          <p className="text-xs text-muted-foreground">Agendamentos hoje</p>
          <p className="mt-1 text-xl font-bold text-foreground">{stats.total}</p>
        </Card>
        <Card className="p-3">
          <p className="text-xs text-muted-foreground">Confirmados / na loja</p>
          <p className="mt-1 text-xl font-bold text-foreground">{stats.confirmados}</p>
        </Card>
        <Card className="p-3">
          <p className="text-xs text-muted-foreground">Concluídos</p>
          <p className="mt-1 text-xl font-bold text-foreground">{stats.concluidos}</p>
        </Card>
        <Card className="p-3">
          <p className="text-xs text-muted-foreground">Receita realizada</p>
          <p className="mt-1 text-xl font-bold text-foreground">{formatCurrency(stats.receita)}</p>
        </Card>
      </div>

      {/* Controles */}
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon-sm" aria-label="Dia anterior">
            <ChevronLeft className="size-4" />
          </Button>
          <div className="flex items-center gap-2 rounded-lg border border-border bg-card px-3 py-1.5">
            <CalendarDays className="size-4 text-muted-foreground" />
            <span className="text-sm font-medium capitalize text-foreground">
              {new Intl.DateTimeFormat('pt-BR', { weekday: 'long', day: '2-digit', month: 'long' }).format(new Date())}
            </span>
          </div>
          <Button variant="outline" size="icon-sm" aria-label="Próximo dia">
            <ChevronRight className="size-4" />
          </Button>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Tabs
            items={[
              { value: 'dia', label: 'Dia' },
              { value: 'semana', label: 'Semana' },
              { value: 'mes', label: 'Mês' },
            ]}
            value={view}
            onValueChange={setView}
          />
          <select
            value={barberFilter}
            onChange={(e) => setBarberFilter(e.target.value)}
            className="h-9 rounded-lg border border-border bg-card px-3 text-sm outline-none focus:border-ring focus:ring-2 focus:ring-ring/30"
          >
            <option value="todos">Todos os barbeiros</option>
            {barbers.map((b) => (
              <option key={b.id} value={b.id}>
                {b.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {view === 'dia' ? (
        <Card className="overflow-hidden p-0">
          <div className="flex overflow-x-auto">
            {/* Coluna de horas */}
            <div className="w-16 shrink-0 border-r border-border pt-12">
              {HOURS.map((h) => (
                <div key={h} className="relative h-16 pr-2 text-right">
                  <span className="text-xs text-muted-foreground">{String(h).padStart(2, '0')}:00</span>
                </div>
              ))}
            </div>

            {/* Colunas de barbeiros */}
            <div className="flex min-w-0 flex-1">
              {columns.map((barber) => {
                const appts = todayAppts.filter((a) => a.employeeId === barber.id)
                return (
                  <div key={barber.id} className="min-w-40 flex-1 border-r border-border last:border-r-0">
                    <div className="flex h-12 items-center gap-2 border-b border-border bg-muted/40 px-3">
                      <Avatar name={barber.name} className="size-6 text-[10px]" />
                      <span className="truncate text-xs font-semibold text-foreground">{barber.name}</span>
                    </div>
                    <div className="relative" style={{ height: HOURS.length * 64 }}>
                      {HOURS.map((h) => (
                        <div key={h} className="h-16 border-b border-border/60" />
                      ))}
                      {appts.map((a) => (
                        <div
                          key={a.id}
                          className={cn(
                            'absolute left-1 right-1 overflow-hidden rounded-md border-l-2 px-2 py-1 shadow-sm',
                            statusColor[a.status],
                          )}
                          style={{ top: timeToTop(a.start), height: (a.durationMin / 60) * 64 - 4 }}
                        >
                          <p className="truncate text-xs font-semibold text-foreground">{a.start} · {a.clientName}</p>
                          <p className="truncate text-[11px] text-muted-foreground">{a.serviceName}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </Card>
      ) : (
        <Card className="p-0">
          <div className="border-b border-border p-4">
            <p className="text-sm font-medium text-foreground">
              Lista de agendamentos {view === 'semana' ? 'da semana' : 'do mês'}
            </p>
          </div>
          <div className="divide-y divide-border">
            {agendaAppointments
              .sort((a, b) => (a.date + a.start).localeCompare(b.date + b.start))
              .map((a) => (
                <div key={a.id} className="flex items-center gap-3 p-3 hover:bg-muted/50">
                  <div className="flex w-16 flex-col items-center rounded-md bg-muted py-1">
                    <span className="text-xs font-semibold text-foreground">{a.start}</span>
                    <span className="text-[10px] text-muted-foreground">
                      {new Intl.DateTimeFormat('pt-BR', { day: '2-digit', month: '2-digit' }).format(new Date(`${a.date}T00:00:00`))}
                    </span>
                  </div>
                  <Avatar name={a.clientName} className="size-8" />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-foreground">{a.clientName}</p>
                    <p className="truncate text-xs text-muted-foreground">{a.serviceName} · {a.employeeName}</p>
                  </div>
                  <span className="hidden text-sm font-medium text-foreground sm:block">{formatCurrency(a.price)}</span>
                  <StatusBadge status={a.status} />
                </div>
              ))}
          </div>
        </Card>
      )}
    </div>
  )
}
