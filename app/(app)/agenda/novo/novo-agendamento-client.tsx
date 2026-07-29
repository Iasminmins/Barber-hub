'use client'

import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { useState } from 'react'
import { ArrowLeft, CalendarPlus, MessageCircle, Save } from 'lucide-react'
import { PageHeader } from '@/components/page-header'
import { Button, buttonVariants } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { useAppData } from '@/components/data/app-data-provider'
import type { Appointment, AppointmentStatus, CatalogItem, Client, Employee } from '@/lib/types'

interface NovoAgendamentoClientProps {
  clients: Client[]
  barbers: Employee[]
  services: CatalogItem[]
  existingAppointments: Appointment[]
}

function todayISO() {
  return new Date().toISOString().slice(0, 10)
}

function normalizePhone(value: string) {
  return value.replace(/\D/g, '')
}

function whatsappUrl(phone: string, message: string) {
  const digits = normalizePhone(phone)
  const brNumber = digits.length <= 11 ? `55${digits}` : digits
  return `https://wa.me/${brNumber}?text=${encodeURIComponent(message)}`
}

function formatAppointmentDate(value: string) {
  return new Intl.DateTimeFormat('pt-BR', {
    weekday: 'long',
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(new Date(`${value}T12:00:00`))
}

export function NovoAgendamentoClient({
  clients,
  barbers,
  services,
  existingAppointments,
}: NovoAgendamentoClientProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { barbershop, appointments: liveAppointments, insertRecord } = useAppData()
  const [clientId, setClientId] = useState(() => searchParams.get('cliente') ?? '')
  const [barberId, setBarberId] = useState('')
  const [serviceId, setServiceId] = useState('')
  const [status, setStatus] = useState<AppointmentStatus | ''>('')
  const [date, setDate] = useState('')
  const [start, setStart] = useState('')
  const [notes, setNotes] = useState('')
  const [saveError, setSaveError] = useState('')

  async function saveAppointment(sendWhatsapp = false) {
    setSaveError('')

    const client = clients.find((item) => item.id === clientId)
    if (!client) {
      setSaveError('Selecione um cliente.')
      return
    }
    if (sendWhatsapp && !normalizePhone(client.phone)) {
      setSaveError('Este cliente está sem telefone. Cadastre o WhatsApp antes de enviar.')
      return
    }

    const barber = barbers.find((item) => item.id === barberId)
    if (!barber) {
      setSaveError('Selecione um barbeiro.')
      return
    }

    const service = services.find((item) => item.id === serviceId)
    if (!service) {
      setSaveError('Selecione um serviço.')
      return
    }

    if (!status) {
      setSaveError('Selecione o status inicial.')
      return
    }

    if (!date || !start) {
      setSaveError('Informe data e horário.')
      return
    }

    const hasConflict = [...existingAppointments, ...liveAppointments].some(
      (appointment) =>
        appointment.employeeId === barber.id &&
        appointment.date === date &&
        appointment.start === start &&
        appointment.status !== 'cancelado',
    )
    if (hasConflict) {
      setSaveError('Já existe um agendamento para este barbeiro nesse horário.')
      return
    }

    const whatsappWindow = sendWhatsapp ? window.open('', '_blank') : null
    const result = await insertRecord('appointments', { barbershop_id: barbershop.id, client_id: client.id, client_name: client.name, employee_id: barber.id, employee_name: barber.name, service_id: service.id, service_name: service.name, date, start, duration_min: service.durationMin ?? 40, status, price: service.price, notes: notes.trim() || null })
    if (result.error) {
      whatsappWindow?.close()
      setSaveError(result.error)
      return
    }
    if (sendWhatsapp) {
      const message = [
        `Olá, ${client.name}! 👋`,
        '',
        `Seu horário na *${barbershop.name}* foi agendado:`,
        `📅 *Data:* ${formatAppointmentDate(date)}`,
        `⏰ *Horário:* ${start}`,
        `✂️ *Serviço:* ${service.name}`,
        `👤 *Barbeiro:* ${barber.name}`,
        '',
        'Se precisar remarcar, fale com a gente por aqui.',
      ].join('\n')
      const url = whatsappUrl(client.phone, message)
      if (whatsappWindow) whatsappWindow.location.href = url
      else {
        window.location.href = url
        return
      }
    }
    router.push('/agenda')
  }

  return (
    <div>
      <PageHeader title="Novo agendamento" description="Escolha cliente, barbeiro, serviço, data e horário.">
        <Link href="/agenda" className={buttonVariants({ variant: 'outline', size: 'sm' })}>
          <ArrowLeft className="size-4" />
          Voltar
        </Link>
      </PageHeader>

      <form className="grid gap-4 lg:grid-cols-[1fr_320px]" onSubmit={(event) => event.preventDefault()}>
        <Card className="p-5">
          <h2 className="mb-4 flex items-center gap-2 font-semibold text-foreground">
            <CalendarPlus className="size-4 text-muted-foreground" />
            Dados do horário
          </h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="client">Cliente</Label>
              <Select id="client" value={clientId} onChange={(event) => setClientId(event.target.value)}>
                <option value="">Selecionar cliente</option>
                {clients.map((client) => (
                  <option key={client.id} value={client.id}>
                    {client.name}
                  </option>
                ))}
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="barber">Barbeiro</Label>
              <Select id="barber" value={barberId} onChange={(event) => setBarberId(event.target.value)}>
                <option value="">Selecionar barbeiro</option>
                {barbers.map((barber) => (
                  <option key={barber.id} value={barber.id}>
                    {barber.name}
                  </option>
                ))}
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="service">Serviço</Label>
              <Select id="service" value={serviceId} onChange={(event) => setServiceId(event.target.value)}>
                <option value="">Selecionar serviço</option>
                {services.map((service) => (
                  <option key={service.id} value={service.id}>
                    {service.name}
                  </option>
                ))}
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="status">Status inicial</Label>
              <Select
                id="status"
                value={status}
                onChange={(event) => setStatus(event.target.value as AppointmentStatus)}
              >
                <option value="">Selecionar status</option>
                <option value="agendado">Agendado</option>
                <option value="confirmado">Confirmado</option>
                <option value="chegou">Cliente chegou</option>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="date">Data</Label>
              <Input id="date" type="date" min={todayISO()} value={date} onChange={(event) => setDate(event.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="start">Horário</Label>
              <Input id="start" type="time" value={start} onChange={(event) => setStart(event.target.value)} />
            </div>
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="notes">Observações do agendamento</Label>
              <Textarea
                id="notes"
                value={notes}
                onChange={(event) => setNotes(event.target.value)}
                placeholder="Preferências, atraso tolerado, aviso importante..."
              />
            </div>
          </div>
        </Card>

        <Card className="h-fit p-5">
          <h3 className="mb-2 font-semibold text-foreground">Finalizar agendamento</h3>
          <p className="mb-4 text-sm text-muted-foreground">
            Salve normalmente ou envie ao cliente uma confirmação com data, horário, serviço e barbeiro.
          </p>
          {saveError ? <p className="mb-3 text-sm font-medium text-destructive">{saveError}</p> : null}
          <div className="space-y-2">
            <Button type="button" variant="gold" className="w-full" onClick={() => saveAppointment(true)}>
              <MessageCircle className="size-4" />
              Salvar e enviar WhatsApp
            </Button>
            <Button type="button" variant="outline" className="w-full" onClick={() => saveAppointment(false)}>
              <Save className="size-4" />
              Salvar sem enviar
            </Button>
          </div>
        </Card>
      </form>
    </div>
  )
}
