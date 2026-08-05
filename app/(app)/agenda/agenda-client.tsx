'use client'

import * as React from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import posthog from 'posthog-js'
import { ChevronLeft, ChevronRight, Plus, CalendarDays, Ban, CheckCircle2, Coffee, Copy, ExternalLink, MessageCircle, ReceiptText, Share2, Save, Trash2 } from 'lucide-react'
import { PageHeader } from '@/components/page-header'
import { StatusBadge } from '@/components/status-badge'
import { Button, buttonVariants } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Tabs } from '@/components/ui/tabs'
import { Avatar } from '@/components/ui/avatar'
import { Dialog, DialogHeader } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Select } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { cn } from '@/lib/utils'
import { formatCurrency } from '@/lib/format'
import type { Appointment, Employee, ScheduleBlock } from '@/lib/types'
import { isBarberRole } from '@/lib/employees'
import { appointmentConflictsWithScheduleBlock, formatScheduleBlockPeriod, getBlockTimeOptions, timeToMinutes } from '@/lib/schedule-blocks'
import type { BusinessDayKey } from '@/lib/barbershop-settings'
import { useAppData } from '@/components/data/app-data-provider'
import { findLinkedOrder, getAgendaStats, getAgendaUrlSelection } from '@/lib/agenda-operations'
import { AGENDA_HOUR_HEIGHT, getAgendaGridRange, minutesToGridTop } from '@/lib/agenda-grid'
import { getAppointmentColumns } from '@/lib/agenda-layout'

const BUSINESS_DAY_KEYS: BusinessDayKey[] = ['domingo', 'segunda', 'terca', 'quarta', 'quinta', 'sexta', 'sabado']

const statusColor: Record<Appointment['status'], string> = {
  agendado: 'border-slate-300 bg-slate-50 hover:bg-slate-100',
  confirmado: 'border-blue-300 bg-blue-50 hover:bg-blue-100',
  chegou: 'border-amber-300 bg-amber-50 hover:bg-amber-100',
  concluido: 'border-emerald-300 bg-emerald-50 hover:bg-emerald-100',
  cancelado: 'border-red-300 bg-red-50 opacity-70 hover:bg-red-100',
  faltou: 'border-orange-300 bg-orange-50 opacity-80 hover:bg-orange-100',
}

const compactStatusLabel: Record<Appointment['status'], string> = {
  agendado: 'Agendado',
  confirmado: 'Confirmado',
  chegou: 'Na loja',
  concluido: 'ConcluÃ­do',
  cancelado: 'Cancelado',
  faltou: 'Faltou',
}

const statusDotColor: Record<Appointment['status'], string> = {
  agendado: 'bg-slate-400',
  confirmado: 'bg-blue-500',
  chegou: 'bg-amber-500',
  concluido: 'bg-emerald-500',
  cancelado: 'bg-red-500',
  faltou: 'bg-orange-500',
}

const appointmentStatuses: Array<{ value: Appointment['status']; label: string }> = [
  { value: 'agendado', label: 'Agendado' },
  { value: 'confirmado', label: 'Confirmado' },
  { value: 'chegou', label: 'Chegou' },
  { value: 'concluido', label: 'Concluído' },
  { value: 'cancelado', label: 'Cancelado' },
  { value: 'faltou', label: 'Faltou' },
]

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
  scheduleBlocks,
  publicSlug,
  barbershopName,
  barbershopId,
}: {
  appointments: Appointment[]
  employees: Employee[]
  scheduleBlocks: ScheduleBlock[]
  publicSlug: string
  barbershopName: string
  barbershopId: string
}) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const agendaSearch = searchParams.toString()
  const { barbershop, catalog, clients, orders, insertRecord, updateRecord, deleteRecord } = useAppData()
  const quickPreferences = barbershop.agendaSettings.quickPreferences
  const [view, setView] = React.useState('dia')
  const [barberFilter, setBarberFilter] = React.useState<string>('todos')
  const [showCompleted, setShowCompleted] = React.useState(true)
  const [selectedDate, setSelectedDate] = React.useState(() => toDateKey(new Date()))
  const [shareOpen, setShareOpen] = React.useState(false)
  const [publicBookingUrl, setPublicBookingUrl] = React.useState('')
  const [copied, setCopied] = React.useState(false)
  const [editingAppointment, setEditingAppointment] = React.useState<Appointment | null>(null)
  const [editingPhone, setEditingPhone] = React.useState('')
  const [savingAppointment, setSavingAppointment] = React.useState(false)
  const [deletingAppointment, setDeletingAppointment] = React.useState(false)
  const [confirmingDelete, setConfirmingDelete] = React.useState(false)
  const [appointmentError, setAppointmentError] = React.useState('')
  const [blockBarber, setBlockBarber] = React.useState<Employee | null>(null)
  const [savingBlock, setSavingBlock] = React.useState(false)
  const [blockError, setBlockError] = React.useState('')
  const [blockMode, setBlockMode] = React.useState<'day' | 'period'>('day')
  const [blockStart, setBlockStart] = React.useState('08:00')
  const [blockEnd, setBlockEnd] = React.useState('14:00')
  const handledAgendaLink = React.useRef<string | null>(null)
  const agendaAppointments = appointments

  React.useEffect(() => {
    if (handledAgendaLink.current === agendaSearch) return
    handledAgendaLink.current = agendaSearch
    const selection = getAgendaUrlSelection(agendaSearch, toDateKey(new Date()))
    setSelectedDate(selection.date)
    setView('dia')

    const requestedAppointment = appointments.find((appointment) => appointment.id === selection.appointmentId)
    if (requestedAppointment) {
      const client = clients.find((item) => item.id === requestedAppointment.clientId)
      setEditingAppointment({ ...requestedAppointment })
      setEditingPhone(client?.phone ?? '')
      setAppointmentError('')
      setConfirmingDelete(false)
    } else {
      setEditingAppointment(null)
    }
  }, [agendaSearch, appointments, clients])

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
    setConfirmingDelete(false)
  }

  function closeAppointment() {
    if (savingAppointment || deletingAppointment) return
    setEditingAppointment(null)
    setAppointmentError('')
    setConfirmingDelete(false)
    if (searchParams.has('agendamento')) {
      router.replace(`/agenda?data=${encodeURIComponent(selectedDate)}`, { scroll: false })
    }
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

    const conflictingBlock = scheduleBlocks.find((block) =>
      block.employeeId === employee.id
      && block.date === editingAppointment.date
      && appointmentConflictsWithScheduleBlock(editingAppointment.start, durationMin, block),
    )
    if (conflictingBlock) {
      setAppointmentError(conflictingBlock.startTime
        ? `A agenda deste barbeiro está bloqueada das ${conflictingBlock.startTime} às ${conflictingBlock.endTime}.`
        : 'A agenda deste barbeiro está bloqueada neste dia.')
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
    if (hasConflict && !quickPreferences.allowWalkIns) {
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
    posthog.capture('appointment_updated', {
      appointment_status: editingAppointment.status,
      service_id: service.id,
      duration_minutes: durationMin,
      price,
    })
    setEditingAppointment(null)
  }

  async function deleteAppointment() {
    if (!editingAppointment) return
    setDeletingAppointment(true)
    setAppointmentError('')
    const result = await deleteRecord('appointments', editingAppointment.id)
    setDeletingAppointment(false)
    if (result.error) {
      setAppointmentError(result.error)
      return
    }
    posthog.capture('appointment_deleted', {
      appointment_status: editingAppointment.status,
    })
    setEditingAppointment(null)
    setConfirmingDelete(false)
  }

  function openBlockDialog(barber: Employee) {
    const selectedBusinessHours = barbershop.agendaSettings.businessHours[BUSINESS_DAY_KEYS[fromDateKey(selectedDate).getDay()]]
    setBlockBarber(barber)
    setBlockError('')
    setBlockMode('day')
    setBlockStart(selectedBusinessHours.start)
    setBlockEnd(selectedBusinessHours.end)
  }

  async function createScheduleBlock() {
    if (!blockBarber) return
    if (blockMode === 'period' && timeToMinutes(blockStart) >= timeToMinutes(blockEnd)) {
      setBlockError('O horário final precisa ser depois do horário inicial.')
      return
    }
    setSavingBlock(true)
    setBlockError('')
    const result = await insertRecord('schedule_blocks', {
      barbershop_id: barbershopId,
      employee_id: blockBarber.id,
      date: selectedDate,
      start_time: blockMode === 'period' ? blockStart : null,
      end_time: blockMode === 'period' ? blockEnd : null,
    })
    setSavingBlock(false)
    if (result.error) {
      setBlockError(result.error)
      return
    }
    posthog.capture('schedule_block_created', {
      block_mode: blockMode,
    })
    setBlockBarber(null)
  }

  async function removeScheduleBlock(blockId: string) {
    setSavingBlock(true)
    setBlockError('')
    const result = await deleteRecord('schedule_blocks', blockId)
    setSavingBlock(false)
    if (result.error) {
      setBlockError(result.error)
      return
    }
    posthog.capture('schedule_block_removed')
  }

  const selectedBusinessHours = barbershop.agendaSettings.businessHours[BUSINESS_DAY_KEYS[fromDateKey(selectedDate).getDay()]]
  const blockTimeOptions = getBlockTimeOptions(selectedBusinessHours.start, selectedBusinessHours.end)

  const barbers = employees.filter((e) => e.active && isBarberRole(e.role))
  const columns = quickPreferences.showByBarber && barberFilter === 'todos'
    ? barbers
    : barbers.filter((b) => b.id === (barberFilter === 'todos' ? barbers[0]?.id : barberFilter))

  const weekRange = getWeekRange(selectedDate)
  const periodAppointments = agendaAppointments
    .filter((appointment) => {
      if (view === 'dia') return appointment.date === selectedDate
      if (view === 'semana') return appointment.date >= weekRange.start && appointment.date <= weekRange.end
      return appointment.date.slice(0, 7) === selectedDate.slice(0, 7)
    })
    .filter((appointment) => barberFilter === 'todos' || appointment.employeeId === barberFilter)
    .sort((a, b) => (a.date + a.start).localeCompare(b.date + b.start))

  const periodStart = view === 'dia' ? selectedDate : view === 'semana' ? weekRange.start : `${selectedDate.slice(0, 7)}-01`
  const monthEnd = new Date(fromDateKey(periodStart).getFullYear(), fromDateKey(periodStart).getMonth() + 1, 0)
  const periodEnd = view === 'dia' ? selectedDate : view === 'semana' ? weekRange.end : toDateKey(monthEnd)
  const stats = getAgendaStats(
    agendaAppointments,
    orders,
    periodStart,
    periodEnd,
    barberFilter === 'todos' ? undefined : barberFilter,
  )
  const visiblePeriodAppointments = showCompleted
    ? periodAppointments
    : periodAppointments.filter((appointment) => appointment.status !== 'concluido')
  const selectedDayAppointments = agendaAppointments.filter((appointment) => (
    appointment.date === selectedDate && (showCompleted || appointment.status !== 'concluido')
  ))
  const visibleEmployeeIds = new Set(columns.map((column) => column.id))
  const visibleDayAppointments = selectedDayAppointments.filter((appointment) => visibleEmployeeIds.has(appointment.employeeId))
  const visibleDayBlocks = scheduleBlocks.filter((block) => (
    block.date === selectedDate && visibleEmployeeIds.has(block.employeeId)
  ))
  const agendaGrid = getAgendaGridRange(selectedBusinessHours, visibleDayAppointments, visibleDayBlocks)
  const agendaGridHeight = agendaGrid.hours.length * AGENDA_HOUR_HEIGHT
  const now = new Date()
  const currentMinutes = now.getHours() * 60 + now.getMinutes()
  const showCurrentTime = selectedDate === toDateKey(now)
    && currentMinutes >= agendaGrid.startMinutes
    && currentMinutes <= agendaGrid.endMinutes
  const currentTimeTop = ((currentMinutes - agendaGrid.startMinutes) / 60) * AGENDA_HOUR_HEIGHT
  const linkedOrder = editingAppointment ? findLinkedOrder(editingAppointment.id, orders) : undefined

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
        <Button
          variant="outline"
          size="sm"
          onClick={() => {
            const barber = barberFilter === 'todos' ? barbers[0] : barbers.find((item) => item.id === barberFilter)
            if (barber) openBlockDialog(barber)
          }}
          disabled={barbers.length === 0}
        >
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
      <div className="mb-4 flex flex-col gap-3 rounded-xl border border-border bg-card p-2 shadow-sm sm:flex-row sm:flex-wrap sm:items-center sm:justify-between">
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
          <Button
            variant="outline"
            size="sm"
            aria-pressed={!showCompleted}
            onClick={() => setShowCompleted((current) => !current)}
          >
            <CheckCircle2 className="size-4" />
            {showCompleted ? 'Ocultar concluídos' : 'Mostrar concluídos'}
          </Button>
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
            {quickPreferences.showByBarber ? <option value="todos">Todos os barbeiros</option> : null}
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
          {agendaGrid.closed ? (
            <div className="border-b border-warning/30 bg-warning/10 px-4 py-3 text-sm text-warning-foreground">
              <p className="font-semibold">Barbearia fechada neste dia</p>
              <p className="mt-0.5 text-xs text-muted-foreground">
                {visibleDayAppointments.length > 0
                  ? 'Os agendamentos excepcionais existentes continuam visÃ­veis abaixo.'
                  : 'NÃ£o hÃ¡ expediente configurado para esta data.'}
              </p>
            </div>
          ) : null}
          <div className="flex overflow-x-auto">
            {/* Coluna de horas */}
            <div className="w-16 shrink-0 border-r border-border pb-4 pt-14">
              {agendaGrid.hours.map((h) => (
                <div key={h} className="relative h-16 pr-2 text-right">
                  <span className="text-xs text-muted-foreground">{String(h).padStart(2, '0')}:00</span>
                </div>
              ))}
              <div className="relative h-0 pr-2 text-right">
                <span className="absolute right-2 top-0 -translate-y-1/2 text-xs text-muted-foreground">
                  {agendaGrid.endLabel}
                </span>
              </div>
            </div>

            {/* Colunas de barbeiros */}
            <div className="flex min-w-0 flex-1">
              {columns.map((barber) => {
                const appts = selectedDayAppointments.filter((a) => a.employeeId === barber.id)
                const appointmentLayouts = new Map(
                  getAppointmentColumns(appts).map((layout) => [layout.id, layout]),
                )
                const dayBlocks = scheduleBlocks.filter((block) => block.employeeId === barber.id && block.date === selectedDate)
                const dayBlocked = dayBlocks.some((block) => !block.startTime || !block.endTime)
                const hasBlocks = dayBlocks.length > 0
                const occupiedMinutes = appts
                  .filter((appointment) => appointment.status !== 'cancelado')
                  .reduce((sum, appointment) => sum + appointment.durationMin, 0)
                const occupancy = Math.min(100, Math.round(
                  (occupiedMinutes / Math.max(60, agendaGrid.endMinutes - agendaGrid.startMinutes)) * 100,
                ))
                return (
                  <div key={barber.id} className="min-w-40 flex-1 border-r border-border last:border-r-0">
                    <button
                      type="button"
                      onClick={() => openBlockDialog(barber)}
                      className={cn(
                        'flex h-14 w-full items-center gap-2 border-b border-border px-3 text-left transition hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring',
                        hasBlocks ? 'bg-destructive/10' : 'bg-muted/40',
                      )}
                      aria-label={`Gerenciar bloqueios da agenda de ${barber.name} em ${selectedDate}`}
                    >
                      <Avatar name={barber.name} src={barber.avatarUrl} color={barber.avatarColor} className="size-6 text-[10px]" />
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-xs font-semibold text-foreground">{barber.name}</span>
                        <span className="block text-[10px] text-muted-foreground">
                          {appts.length} {appts.length === 1 ? 'agendamento' : 'agendamentos'}
                        </span>
                      </span>
                      <span className="hidden items-center gap-1.5 text-[10px] font-medium text-muted-foreground sm:flex">
                        <span className="h-1.5 w-10 overflow-hidden rounded-full bg-muted">
                          <span className="block h-full rounded-full bg-primary" style={{ width: `${occupancy}%` }} />
                        </span>
                        {occupancy}%
                      </span>
                      {hasBlocks ? <Ban className="ml-auto size-3.5 text-destructive" /> : null}
                    </button>
                    <div className={cn('relative', dayBlocked && 'bg-destructive/[0.04]')} style={{ height: agendaGridHeight }}>
                      {agendaGrid.hours.map((h) => {
                        const hourIsFree = !appts.some((appointment) => {
                          const start = timeToMinutes(appointment.start)
                          const end = start + appointment.durationMin
                          return start < (h + 1) * 60 && end > h * 60 && appointment.status !== 'cancelado'
                        })
                        return (
                          <div
                            key={h}
                            className={cn(
                              'h-16 border-b border-border/60',
                              quickPreferences.highlightFreeSlots && hourIsFree && !dayBlocked && !agendaGrid.closed && 'bg-success/[0.04]',
                            )}
                          />
                        )
                      })}
                      {showCurrentTime ? (
                        <div
                          className="pointer-events-none absolute inset-x-0 z-30 border-t border-red-500"
                          style={{ top: currentTimeTop }}
                        >
                          {barber.id === columns[0]?.id ? (
                            <span className="absolute left-1 top-0 -translate-y-1/2 rounded bg-red-500 px-1.5 py-0.5 text-[9px] font-bold text-white shadow-sm">
                              Agora
                            </span>
                          ) : null}
                        </div>
                      ) : null}
                      {dayBlocks.filter((block) => block.startTime && block.endTime).map((block) => (
                        <div
                          key={block.id}
                          className="pointer-events-none absolute inset-x-1 z-10 overflow-hidden rounded-md border border-destructive/30 bg-destructive/10 px-2 py-1 text-center text-[11px] font-semibold text-destructive"
                          style={{
                            top: minutesToGridTop(block.startTime!, agendaGrid.startMinutes),
                            height: Math.max(28, ((timeToMinutes(block.endTime!) - timeToMinutes(block.startTime!)) / 60) * AGENDA_HOUR_HEIGHT - 2),
                          }}
                        >
                          Bloqueado · {formatScheduleBlockPeriod(block)}
                        </div>
                      ))}
                      {appts.map((a) => {
                        const layout = appointmentLayouts.get(a.id) ?? { column: 0, columnCount: 1 }
                        const width = 100 / layout.columnCount
                        return (
                          <button
                            type="button"
                            key={a.id}
                            onClick={() => openAppointment(a)}
                            aria-label={`Abrir agendamento de ${a.clientName} às ${a.start}`}
                            className={cn(
                              'absolute z-20 cursor-pointer overflow-hidden rounded-lg border px-2.5 py-1 text-left shadow-sm transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
                              statusColor[a.status],
                              quickPreferences.alertDelays
                                && selectedDate === toDateKey(new Date())
                                && timeToMinutes(a.start) < new Date().getHours() * 60 + new Date().getMinutes()
                                && ['agendado', 'confirmado'].includes(a.status)
                                && 'ring-2 ring-warning',
                            )}
                            style={{
                              left: `calc(${layout.column * width}% + 4px)`,
                              width: `calc(${width}% - 8px)`,
                              top: minutesToGridTop(a.start, agendaGrid.startMinutes),
                              height: (a.durationMin / 60) * AGENDA_HOUR_HEIGHT - 4,
                            }}
                          >
                            <span className="flex min-w-0 items-center gap-1.5">
                              <span className="shrink-0 text-[11px] font-bold text-foreground">{a.start}</span>
                              <span className="truncate text-xs font-semibold text-foreground">{a.clientName}</span>
                              <span className="ml-auto hidden shrink-0 items-center gap-1 rounded-full bg-background/80 px-1.5 py-0.5 text-[9px] font-semibold text-muted-foreground xl:flex">
                                <span className={cn('size-1.5 rounded-full', statusDotColor[a.status])} />
                                {layout.columnCount > 1 ? 'Conflito' : compactStatusLabel[a.status]}
                              </span>
                            </span>
                            {a.durationMin >= 35 ? (
                              <span className="block truncate text-[10px] text-muted-foreground">
                                {a.serviceName} · {a.durationMin} min
                              </span>
                            ) : null}
                          </button>
                        )
                      })}
                      {dayBlocked ? (
                        <div className="pointer-events-none absolute inset-x-2 top-3 z-10 rounded-md border border-destructive/30 bg-background/95 px-2 py-1.5 text-center text-xs font-semibold text-destructive shadow-sm">
                          Agenda bloqueada neste dia
                        </div>
                      ) : null}
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
            {visiblePeriodAppointments.map((a) => (
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
            {visiblePeriodAppointments.length === 0 && (
              <p className="p-6 text-center text-sm text-muted-foreground">Nenhum agendamento neste período.</p>
            )}
          </div>
        </Card>
      )}

      <Dialog open={Boolean(blockBarber)} onClose={() => !savingBlock && setBlockBarber(null)} className="sm:max-w-md">
        {blockBarber ? (
          <>
            <DialogHeader
              title="Bloquear agenda"
              description={`${blockBarber.name} · ${new Intl.DateTimeFormat('pt-BR', { dateStyle: 'long' }).format(fromDateKey(selectedDate))}`}
            />
            <p className="text-sm text-muted-foreground">
              Novos agendamentos serão impedidos no período escolhido. Agendamentos já existentes serão mantidos.
            </p>
            <div className="mt-4 grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => { setBlockMode('day'); setBlockError('') }}
                className={cn('rounded-lg border px-3 py-2 text-sm font-medium transition', blockMode === 'day' ? 'border-primary bg-primary/10 text-primary' : 'border-border hover:bg-muted')}
              >
                Dia inteiro
              </button>
              <button
                type="button"
                onClick={() => { setBlockMode('period'); setBlockError('') }}
                className={cn('rounded-lg border px-3 py-2 text-sm font-medium transition', blockMode === 'period' ? 'border-primary bg-primary/10 text-primary' : 'border-border hover:bg-muted')}
              >
                Período
              </button>
            </div>
            {blockMode === 'period' ? (
              <div className="mt-4 grid grid-cols-2 gap-3">
                <label className="space-y-1.5 text-sm font-medium">
                  <span>Das</span>
                  <Select value={blockStart} onChange={(event) => { setBlockStart(event.target.value); setBlockError('') }}>
                    {blockTimeOptions.slice(0, -1).map((time) => <option key={time} value={time}>{time}</option>)}
                  </Select>
                </label>
                <label className="space-y-1.5 text-sm font-medium">
                  <span>Até</span>
                  <Select value={blockEnd} onChange={(event) => { setBlockEnd(event.target.value); setBlockError('') }}>
                    {blockTimeOptions.slice(1).map((time) => <option key={time} value={time}>{time}</option>)}
                  </Select>
                </label>
              </div>
            ) : null}
            {scheduleBlocks.some((block) => block.employeeId === blockBarber.id && block.date === selectedDate) ? (
              <div className="mt-5 border-t border-border pt-4">
                <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Bloqueios deste dia</p>
                <div className="space-y-2">
                  {scheduleBlocks
                    .filter((block) => block.employeeId === blockBarber.id && block.date === selectedDate)
                    .map((block) => (
                      <div key={block.id} className="flex items-center justify-between rounded-lg border border-border px-3 py-2">
                        <span className="text-sm font-medium">{formatScheduleBlockPeriod(block)}</span>
                        <Button
                          variant="ghost"
                          size="icon-sm"
                          aria-label={`Remover bloqueio ${formatScheduleBlockPeriod(block)}`}
                          onClick={() => removeScheduleBlock(block.id)}
                          disabled={savingBlock}
                        >
                          <Trash2 className="size-4 text-destructive" />
                        </Button>
                      </div>
                    ))}
                </div>
              </div>
            ) : null}
            {blockError ? <p role="alert" className="mt-4 rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">{blockError}</p> : null}
            <div className="mt-6 flex justify-end gap-2">
              <Button variant="outline" onClick={() => setBlockBarber(null)} disabled={savingBlock}>Cancelar</Button>
              <Button
                variant="destructive"
                onClick={createScheduleBlock}
                disabled={savingBlock}
              >
                <Ban className="size-4" />
                {savingBlock ? 'Salvando...' : blockMode === 'day' ? 'Bloquear dia' : 'Bloquear período'}
              </Button>
            </div>
          </>
        ) : null}
      </Dialog>

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

            {confirmingDelete ? (
              <div className="mt-6 rounded-lg border border-destructive/30 bg-destructive/5 p-3">
                <p className="text-sm font-medium text-foreground">Excluir este agendamento?</p>
                <p className="mt-1 text-xs text-muted-foreground">
                  Ele será removido definitivamente da agenda.
                </p>
                <div className="mt-3 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
                  <Button variant="outline" onClick={() => setConfirmingDelete(false)} disabled={deletingAppointment}>
                    Voltar
                  </Button>
                  <Button variant="destructive" onClick={deleteAppointment} disabled={deletingAppointment}>
                    <Trash2 className="size-4" />
                    {deletingAppointment ? 'Excluindo...' : 'Sim, excluir'}
                  </Button>
                </div>
              </div>
            ) : (
              <div className="mt-6 flex flex-col gap-2 sm:flex-row sm:items-center">
                <Button
                  variant="ghost"
                  className="text-destructive hover:bg-destructive/10 hover:text-destructive sm:mr-auto"
                  onClick={() => setConfirmingDelete(true)}
                  disabled={savingAppointment}
                >
                  <Trash2 className="size-4" />
                  Excluir agendamento
                </Button>
                {linkedOrder ? (
                  <Link
                    href={`/comandas?order=${encodeURIComponent(linkedOrder.id)}`}
                    className={buttonVariants({ variant: 'outline' })}
                  >
                    <ReceiptText className="size-4" />
                    Ver comanda #{linkedOrder.number}
                  </Link>
                ) : !['cancelado', 'faltou'].includes(editingAppointment.status) ? (
                  <Link
                    href={`/comandas/nova?agendamento=${encodeURIComponent(editingAppointment.id)}`}
                    className={buttonVariants({ variant: 'outline' })}
                  >
                    <ReceiptText className="size-4" />
                    Criar comanda
                  </Link>
                ) : null}
                <Button variant="outline" onClick={closeAppointment} disabled={savingAppointment}>
                  Cancelar
                </Button>
                <Button onClick={saveAppointment} disabled={savingAppointment}>
                  <Save className="size-4" />
                  {savingAppointment ? 'Salvando...' : 'Salvar alterações'}
                </Button>
              </div>
            )}
          </>
        ) : null}
      </Dialog>
    </div>
  )
}
