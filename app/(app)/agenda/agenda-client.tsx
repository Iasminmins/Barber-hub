'use client'

import * as React from 'react'
import Link from 'next/link'
import { ChevronLeft, ChevronRight, Plus, CalendarDays, Ban, Coffee, Copy, ExternalLink, MessageCircle, Share2 } from 'lucide-react'
import { PageHeader } from '@/components/page-header'
import { StatusBadge } from '@/components/status-badge'
import { Button, buttonVariants } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Tabs } from '@/components/ui/tabs'
import { Avatar } from '@/components/ui/avatar'
import { Dialog, DialogHeader } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'
import { formatCurrency } from '@/lib/format'
import type { Appointment, Employee } from '@/lib/types'
import { isBarberRole } from '@/lib/employees'

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

function toDateKey(date: Date) {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

function fromDateKey(value: string) {
  const [year, month, day] = value.split('-').map(Number)
  return new Date(year, month - 1, day)
}

function getWeekRange(value: string) {
  const start = fromDateKey(value)
  const daysSinceMonday = (start.getDay() + 6) % 7
  start.setDate(start.getDate() - daysSinceMonday)
  const end = new Date(start)
  end.setDate(end.getDate() + 6)
  return { start: toDateKey(start), end: toDateKey(end) }
}

export function AgendaClient({
  appointments,
  employees,
  publicSlug,
  barbershopName,
}: {
  appointments: Appointment[]
  employees: Employee[]
  publicSlug: string
  barbershopName: string
}) {
  const [view, setView] = React.useState('dia')
  const [barberFilter, setBarberFilter] = React.useState<string>('todos')
  const [selectedDate, setSelectedDate] = React.useState(() => toDateKey(new Date()))
  const [shareOpen, setShareOpen] = React.useState(false)
  const [publicBookingUrl, setPublicBookingUrl] = React.useState('')
  const [copied, setCopied] = React.useState(false)
  const agendaAppointments = appointments

  React.useEffect(() => {
    setPublicBookingUrl(`${window.location.origin}/agendar/${publicSlug}`)
  }, [publicSlug])

  async function copyBookingLink() {
    await navigator.clipboard.writeText(publicBookingUrl)
    setCopied(true)
    window.setTimeout(() => setCopied(false), 2000)
  }

  const barbers = employees.filter((e) => e.active && isBarberRole(e.role))
  const columns = barberFilter === 'todos' ? barbers : barbers.filter((b) => b.id === barberFilter)

  const selectedDayAppointments = agendaAppointments.filter((a) => a.date === selectedDate)
  const weekRange = getWeekRange(selectedDate)
  const periodAppointments = agendaAppointments
    .filter((appointment) => {
      if (view === 'dia') return appointment.date === selectedDate
      if (view === 'semana') return appointment.date >= weekRange.start && appointment.date <= weekRange.end
      return appointment.date.slice(0, 7) === selectedDate.slice(0, 7)
    })
    .filter((appointment) => barberFilter === 'todos' || appointment.employeeId === barberFilter)
    .sort((a, b) => (a.date + a.start).localeCompare(b.date + b.start))

  const stats = {
    total: periodAppointments.length,
    confirmados: periodAppointments.filter((a) => ['confirmado', 'chegou'].includes(a.status)).length,
    concluidos: periodAppointments.filter((a) => a.status === 'concluido').length,
    receita: periodAppointments.filter((a) => a.status === 'concluido').reduce((s, a) => s + a.price, 0),
  }

  function changePeriod(direction: -1 | 1) {
    setSelectedDate((current) => {
      const date = fromDateKey(current)
      if (view === 'mes') {
        date.setDate(1)
        date.setMonth(date.getMonth() + direction)
      } else {
        date.setDate(date.getDate() + direction * (view === 'semana' ? 7 : 1))
      }
      return toDateKey(date)
    })
  }

  const selectedDateObject = fromDateKey(selectedDate)
  const periodLabel = view === 'dia'
    ? new Intl.DateTimeFormat('pt-BR', { weekday: 'long', day: '2-digit', month: 'long' }).format(selectedDateObject)
    : view === 'semana'
      ? `Semana de ${new Intl.DateTimeFormat('pt-BR', { day: '2-digit', month: '2-digit' }).format(fromDateKey(weekRange.start))} a ${new Intl.DateTimeFormat('pt-BR', { day: '2-digit', month: '2-digit' }).format(fromDateKey(weekRange.end))}`
      : new Intl.DateTimeFormat('pt-BR', { month: 'long', year: 'numeric' }).format(selectedDateObject)

  return (
    <div>
      <PageHeader title="Agenda" description="Gerencie os agendamentos por dia, semana ou barbeiro.">
        <Button variant="outline" size="sm" onClick={() => setShareOpen(true)}>
          <Share2 className="size-4" />
          Link de agendamento
        </Button>
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
          <p className="text-xs text-muted-foreground">Agendamentos no período</p>
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
          <Button variant="outline" size="icon-sm" aria-label="Período anterior" onClick={() => changePeriod(-1)}>
            <ChevronLeft className="size-4" />
          </Button>
          <div className="flex items-center gap-2 rounded-lg border border-border bg-card px-3 py-1.5">
            <CalendarDays className="size-4 text-muted-foreground" />
            <span className="text-sm font-medium capitalize text-foreground">
              {periodLabel}
            </span>
          </div>
          <Button variant="outline" size="icon-sm" aria-label="Próximo período" onClick={() => changePeriod(1)}>
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
                const appts = selectedDayAppointments.filter((a) => a.employeeId === barber.id)
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
            {periodAppointments.map((a) => (
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
            {periodAppointments.length === 0 && (
              <p className="p-6 text-center text-sm text-muted-foreground">Nenhum agendamento neste período.</p>
            )}
          </div>
        </Card>
      )}

      <Dialog open={shareOpen} onClose={() => setShareOpen(false)} className="sm:max-w-xl">
        <DialogHeader
          title="Link de agendamento online"
          description="Envie este link para o cliente escolher serviço, dia e horário sem acessar o painel."
        />
        <div className="flex gap-2">
          <Input value={publicBookingUrl} readOnly aria-label="Link público de agendamento" />
          <Button variant="outline" size="icon" onClick={copyBookingLink} aria-label="Copiar link">
            <Copy className="size-4" />
          </Button>
        </div>
        {copied ? <p className="mt-2 text-sm font-medium text-emerald-700">Link copiado!</p> : null}
        <div className="mt-5 flex flex-wrap justify-end gap-2">
          <a href={publicBookingUrl} target="_blank" rel="noreferrer" className={buttonVariants({ variant: 'outline' })}>
            <ExternalLink className="size-4" />
            Visualizar página
          </a>
          <a
            href={`https://wa.me/?text=${encodeURIComponent(`Olá! Agende seu horário na ${barbershopName} por aqui: ${publicBookingUrl}`)}`}
            target="_blank"
            rel="noreferrer"
            className={buttonVariants({ variant: 'default' })}
          >
            <MessageCircle className="size-4" />
            Enviar pelo WhatsApp
          </a>
        </div>
      </Dialog>
    </div>
  )
}
