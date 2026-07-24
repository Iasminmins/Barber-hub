'use client'

import * as React from 'react'
import Link from 'next/link'
import { ChevronLeft, ChevronRight, Plus, CalendarDays, Ban, Coffee, Copy, ExternalLink, MessageCircle, Share2, Save } from 'lucide-react'
import { PageHeader } from '@/components/page-header'
import { StatusBadge } from '@/components/status-badge'
import { Button, buttonVariants } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Tabs } from '@/components/ui/tabs'
import { Avatar } from '@/components/ui/avatar'
import { Dialog, DialogHeader } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { cn } from '@/lib/utils'
import { formatCurrency } from '@/lib/format'
import type { Appointment, Employee } from '@/lib/types'
import { isBarberRole } from '@/lib/employees'
import { useAppData } from '@/components/data/app-data-provider'

const HOURS = Array.from({ length: 12 }, (_, i) => 8 + i) // 08:00 - 19:00

const statusColor: Record<Appointment['status'], string> = {
  agendado: 'border-l-muted-foreground/40 bg-muted/60',
  confirmado: 'border-l-primary bg-primary/8',
  chegou: 'border-l-gold bg-gold/10',
  concluido: 'border-l-success bg-success/8',
  cancelado: 'border-l-destructive bg-destructive/8 opacity-70',
  faltou: 'border-l-warning bg-warning/10 opacity-80',
}

const appointmentStatuses: Array<{ value: Appointment['status']; label: string }> = [
  { value: 'agendado', label: 'Agendado' },
  { value: 'confirmado', label: 'Confirmado' },
  { value: 'chegou', label: 'Chegou' },
  { value: 'concluido', label: 'Concluído' },
  { value: 'cancelado', label: 'Cancelado' },
  { value: 'faltou', label: 'Faltou' },
]

function timeToTop(start: string) {
  const [h, mm] = start.split(':').map(Number)
  return (h - 8) * 64 + (mm / 60) * 64
}

function timeToMinutes(value: string) {
  const [hours, minutes] = value.split(':').map(Number)
  return hours * 60 + minutes
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
  const { catalog, clients, updateRecord } = useAppData()
  const [view, setView] = React.useState('dia')
  const [barberFilter, setBarberFilter] = React.useState<string>('todos')
  const [selectedDate, setSelectedDate] = React.useState(() => toDateKey(new Date()))
  const [shareOpen, setShareOpen] = React.useState(false)
  const [publicBookingUrl, setPublicBookingUrl] = React.useState('')
  const [copied, setCopied] = React.useState(false)
  const [editingAppointment, setEditingAppointment] = React.useState<Appointment | null>(null)
  const [editingPhone, setEditingPhone] = React.useState('')
  const [savingAppointment, setSavingAppointment] = React.useState(false)
  const [appointmentError, setAppointmentError] = React.useState('')
  const agendaAppointments = appointments

  React.useEffect(() => {
    setPublicBookingUrl(`${window.location.origin}/agendar/${encodeURIComponent(publicSlug.trim())}`)
  }, [publicSlug])

  async function copyBookingLink() {
    await navigator.clipboard.writeText(publicBookingUrl)
    setCopied(true)
    window.setTimeout(() => setCopied(false), 2000)
  }

  function openAppointment(appointment: Appointment) {
    const client = clients.find((item) => item.id === appointment.clientId)
    setEditingAppointment({ ...appointment })
    setEditingPhone(client?.phone ?? '')
    setAppointmentError('')
  }

  function closeAppointment() {
    if (savingAppointment) return
    setEditingAppointment(null)
    setAppointmentError('')
  }

  function updateAppointmentDraft(values: Partial<Appointment>) {
    setEditingAppointment((current) => current ? { ...current, ...values } : current)
    setAppointmentError('')
  }

  async function saveAppointment() {
    if (!editingAppointment) return
    const clientName = editingAppointment.clientName.trim()
    const employee = employees.find((item) => item.id === editingAppointment.employeeId)
    const service = catalog.find((item) => item.id === editingAppointment.serviceId && item.type === 'servico')
    const price = Number(editingAppointment.price)
    const durationMin = Number(editingAppointment.durationMin)

    if (!clientName || !employee || !service || !editingAppointment.date || !editingAppointment.start) {
      setAppointmentError('Preencha cliente, serviço, barbeiro, data e horário.')
      return
    }
    if (!Number.isFinite(price) || price < 0 || !Number.isFinite(durationMin) || durationMin < 5) {
      setAppointmentError('Revise o valor e a duração do serviço.')
      return
    }

    const editedStart = timeToMinutes(editingAppointment.start)
    const editedEnd = editedStart + durationMin
    const hasConflict = appointments.some((appointment) => {
      if (
        appointment.id === editingAppointment.id
        || appointment.employeeId !== employee.id
        || appointment.date !== editingAppointment.date
        || appointment.status === 'cancelado'
      ) return false
      const appointmentStart = timeToMinutes(appointment.start)
      const appointmentEnd = appointmentStart + appointment.durationMin
      return appointmentStart < editedEnd && appointmentEnd > editedStart
    })
    if (hasConflict) {
      setAppointmentError('Este barbeiro já possui outro agendamento nesse horário.')
      return
    }

    setSavingAppointment(true)
    setAppointmentError('')

    if (editingAppointment.clientId) {
      const clientResult = await updateRecord('clients', editingAppointment.clientId, {
        name: clientName,
        phone: editingPhone.trim() || null,
      })
      if (clientResult.error) {
        setAppointmentError(clientResult.error)
        setSavingAppointment(false)
        return
      }
    }

    const result = await updateRecord('appointments', editingAppointment.id, {
      client_name: clientName,
      employee_id: employee.id,
      employee_name: employee.name,
      service_id: service.id,
      service_name: service.name,
      date: editingAppointment.date,
      start: editingAppointment.start,
      duration_min: durationMin,
      status: editingAppointment.status,
      price,
      notes: editingAppointment.notes?.trim() || null,
    })

    setSavingAppointment(false)
    if (result.error) {
      setAppointmentError(result.error)
      return
    }
    setEditingAppointment(null)
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
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between">
        <div className="flex min-w-0 items-center gap-2">
          <Button variant="outline" size="icon-sm" aria-label="Período anterior" onClick={() => changePeriod(-1)}>
            <ChevronLeft className="size-4" />
          </Button>
          <div className="flex min-w-0 flex-1 items-center gap-2 rounded-lg border border-border bg-card px-3 py-1.5 sm:flex-none">
            <CalendarDays className="size-4 text-muted-foreground" />
            <span className="truncate text-sm font-medium capitalize text-foreground">
              {periodLabel}
            </span>
          </div>
          <Button variant="outline" size="icon-sm" aria-label="Próximo período" onClick={() => changePeriod(1)}>
            <ChevronRight className="size-4" />
          </Button>
        </div>
        <div className="flex w-full flex-wrap items-center gap-2 sm:w-auto">
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
            className="h-9 min-w-0 flex-1 rounded-lg border border-border bg-card px-3 text-sm outline-none focus:border-ring focus:ring-2 focus:ring-ring/30 sm:flex-none"
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
                        <button
                          type="button"
                          key={a.id}
                          onClick={() => openAppointment(a)}
                          aria-label={`Abrir agendamento de ${a.clientName} às ${a.start}`}
                          className={cn(
                            'absolute left-1 right-1 cursor-pointer overflow-hidden rounded-md border-l-2 px-2 py-1 text-left shadow-sm transition hover:brightness-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
                            statusColor[a.status],
                          )}
                          style={{ top: timeToTop(a.start), height: (a.durationMin / 60) * 64 - 4 }}
                        >
                          <p className="truncate text-xs font-semibold text-foreground">{a.start} · {a.clientName}</p>
                          <p className="truncate text-[11px] text-muted-foreground">{a.serviceName}</p>
                        </button>
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
                <button
                  type="button"
                  key={a.id}
                  onClick={() => openAppointment(a)}
                  className="flex w-full items-center gap-3 p-3 text-left transition hover:bg-muted/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring"
                  aria-label={`Abrir agendamento de ${a.clientName} às ${a.start}`}
                >
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
                </button>
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

      <Dialog open={Boolean(editingAppointment)} onClose={closeAppointment} className="sm:max-w-2xl">
        {editingAppointment ? (
          <>
            <DialogHeader
              title="Detalhes do agendamento"
              description="Consulte e edite as informações. As alterações serão refletidas diretamente na agenda."
            />

            <div className="grid gap-4 sm:grid-cols-2">
              <label className="grid gap-1.5 text-sm font-medium text-foreground">
                Nome do cliente
                <Input
                  value={editingAppointment.clientName}
                  onChange={(event) => updateAppointmentDraft({ clientName: event.target.value })}
                  autoComplete="name"
                />
              </label>

              <label className="grid gap-1.5 text-sm font-medium text-foreground">
                Telefone / WhatsApp
                <Input
                  value={editingPhone}
                  onChange={(event) => setEditingPhone(event.target.value)}
                  inputMode="tel"
                  autoComplete="tel"
                  placeholder="(00) 00000-0000"
                  disabled={!editingAppointment.clientId}
                />
              </label>

              <label className="grid gap-1.5 text-sm font-medium text-foreground">
                Serviço
                <select
                  value={editingAppointment.serviceId}
                  onChange={(event) => {
                    const service = catalog.find((item) => item.id === event.target.value)
                    updateAppointmentDraft({
                      serviceId: event.target.value,
                      serviceName: service?.name ?? editingAppointment.serviceName,
                      durationMin: service?.durationMin ?? editingAppointment.durationMin,
                      price: service?.price ?? editingAppointment.price,
                    })
                  }}
                  className="h-10 rounded-md border border-input bg-background px-3 text-sm outline-none focus:ring-2 focus:ring-ring"
                >
                  {catalog.filter((item) => item.type === 'servico' && item.active).map((service) => (
                    <option key={service.id} value={service.id}>{service.name}</option>
                  ))}
                </select>
              </label>

              <label className="grid gap-1.5 text-sm font-medium text-foreground">
                Barbeiro
                <select
                  value={editingAppointment.employeeId}
                  onChange={(event) => {
                    const employee = employees.find((item) => item.id === event.target.value)
                    updateAppointmentDraft({
                      employeeId: event.target.value,
                      employeeName: employee?.name ?? editingAppointment.employeeName,
                    })
                  }}
                  className="h-10 rounded-md border border-input bg-background px-3 text-sm outline-none focus:ring-2 focus:ring-ring"
                >
                  {barbers.map((employee) => (
                    <option key={employee.id} value={employee.id}>{employee.name}</option>
                  ))}
                </select>
              </label>

              <label className="grid gap-1.5 text-sm font-medium text-foreground">
                Data
                <Input
                  type="date"
                  value={editingAppointment.date}
                  onChange={(event) => updateAppointmentDraft({ date: event.target.value })}
                />
              </label>

              <label className="grid gap-1.5 text-sm font-medium text-foreground">
                Horário
                <Input
                  type="time"
                  value={editingAppointment.start}
                  onChange={(event) => updateAppointmentDraft({ start: event.target.value })}
                />
              </label>

              <label className="grid gap-1.5 text-sm font-medium text-foreground">
                Duração em minutos
                <Input
                  type="number"
                  min={5}
                  step={5}
                  value={editingAppointment.durationMin}
                  onChange={(event) => updateAppointmentDraft({ durationMin: Number(event.target.value) })}
                />
              </label>

              <label className="grid gap-1.5 text-sm font-medium text-foreground">
                Valor
                <Input
                  type="number"
                  min={0}
                  step="0.01"
                  value={editingAppointment.price}
                  onChange={(event) => updateAppointmentDraft({ price: Number(event.target.value) })}
                />
              </label>

              <label className="grid gap-1.5 text-sm font-medium text-foreground sm:col-span-2">
                Status
                <select
                  value={editingAppointment.status}
                  onChange={(event) => updateAppointmentDraft({ status: event.target.value as Appointment['status'] })}
                  className="h-10 rounded-md border border-input bg-background px-3 text-sm outline-none focus:ring-2 focus:ring-ring"
                >
                  {appointmentStatuses.map((status) => (
                    <option key={status.value} value={status.value}>{status.label}</option>
                  ))}
                </select>
              </label>

              <label className="grid gap-1.5 text-sm font-medium text-foreground sm:col-span-2">
                Observação
                <Textarea
                  value={editingAppointment.notes ?? ''}
                  onChange={(event) => updateAppointmentDraft({ notes: event.target.value })}
                  placeholder="Preferências ou informações importantes do cliente"
                />
              </label>
            </div>

            {appointmentError ? (
              <p role="alert" className="mt-4 rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">
                {appointmentError}
              </p>
            ) : null}

            <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
              <Button variant="outline" onClick={closeAppointment} disabled={savingAppointment}>
                Cancelar
              </Button>
              <Button onClick={saveAppointment} disabled={savingAppointment}>
                <Save className="size-4" />
                {savingAppointment ? 'Salvando...' : 'Salvar alterações'}
              </Button>
            </div>
          </>
        ) : null}
      </Dialog>
    </div>
  )
}
