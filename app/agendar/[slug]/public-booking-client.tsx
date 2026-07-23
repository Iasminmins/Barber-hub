'use client'

import * as React from 'react'
import { CalendarDays, CheckCircle2, Clock3, MapPin, Scissors } from 'lucide-react'
import { BrandMark } from '@/components/brand-mark'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { createBrowserSupabaseClient, isSupabaseConfigured } from '@/lib/supabase/client'
import { formatCurrency } from '@/lib/format'
import { cn } from '@/lib/utils'

type BookingService = {
  id: string
  name: string
  category: string
  price: number
  durationMin: number
}

type BookingPage = {
  barbershop: { name: string; slug: string; city: string; color: string }
  services: BookingService[]
}

type BookingResult = {
  appointmentId: string
  barbershopName: string
  serviceName: string
  date: string
  start: string
}

function todayKey() {
  const date = new Date()
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
}

function maxDateKey() {
  const date = new Date()
  date.setDate(date.getDate() + 60)
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
}

export function PublicBookingClient({ slug }: { slug: string }) {
  const [page, setPage] = React.useState<BookingPage | null>(null)
  const [serviceId, setServiceId] = React.useState('')
  const [date, setDate] = React.useState('')
  const [start, setStart] = React.useState('')
  const [slots, setSlots] = React.useState<string[]>([])
  const [name, setName] = React.useState('')
  const [phone, setPhone] = React.useState('')
  const [notes, setNotes] = React.useState('')
  const [status, setStatus] = React.useState('Carregando horários...')
  const [loadingSlots, setLoadingSlots] = React.useState(false)
  const [submitting, setSubmitting] = React.useState(false)
  const [result, setResult] = React.useState<BookingResult | null>(null)

  React.useEffect(() => {
    if (!isSupabaseConfigured()) {
      setStatus('O agendamento online ainda não foi configurado.')
      return
    }
    const supabase = createBrowserSupabaseClient()
    void supabase.rpc('get_public_booking_page', { p_slug: slug }).then(({ data, error }) => {
      if (error || !data) {
        setStatus(error?.message ?? 'Link de agendamento não encontrado.')
        return
      }
      setPage(data as BookingPage)
      setStatus('')
    })
  }, [slug])

  React.useEffect(() => {
    setStart('')
    setSlots([])
    if (!serviceId || !date || !isSupabaseConfigured()) return
    setLoadingSlots(true)
    const supabase = createBrowserSupabaseClient()
    void supabase
      .rpc('get_public_available_slots', {
        p_slug: slug,
        p_service_id: serviceId,
        p_date: date,
      })
      .then(({ data, error }) => {
        setSlots(error ? [] : (data as string[] ?? []))
        setStatus(error?.message ?? '')
        setLoadingSlots(false)
      })
  }, [date, serviceId, slug])

  async function submit() {
    setStatus('')
    if (!serviceId || !date || !start || !name.trim() || !phone.trim()) {
      setStatus('Preencha nome, telefone, serviço, data e horário.')
      return
    }
    setSubmitting(true)
    const supabase = createBrowserSupabaseClient()
    const { data, error } = await supabase.rpc('create_public_appointment', {
      p_slug: slug,
      p_service_id: serviceId,
      p_date: date,
      p_start: start,
      p_client_name: name.trim(),
      p_phone: phone.trim(),
      p_notes: notes.trim() || null,
    })
    setSubmitting(false)
    if (error) {
      setStatus(error.message)
      return
    }
    setResult(data as BookingResult)
  }

  if (result) {
    return (
      <main className="grid min-h-screen place-items-center bg-muted/30 p-4">
        <Card className="w-full max-w-lg p-7 text-center">
          <CheckCircle2 className="mx-auto size-14 text-emerald-600" />
          <h1 className="mt-4 text-2xl font-bold">Horário solicitado!</h1>
          <p className="mt-2 text-muted-foreground">
            Seu agendamento entrou na agenda da {result.barbershopName}.
          </p>
          <div className="mt-5 rounded-lg bg-muted p-4 text-sm">
            <p className="font-semibold">{result.serviceName}</p>
            <p className="mt-1 text-muted-foreground">
              {new Intl.DateTimeFormat('pt-BR', { dateStyle: 'long' }).format(new Date(`${result.date}T00:00:00`))} às {result.start}
            </p>
          </div>
        </Card>
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-muted/30 px-4 py-8">
      <div className="mx-auto max-w-3xl">
        <div className="mb-6 flex items-center gap-3">
          <BrandMark
            name={page?.barbershop.name ?? 'Barbearia'}
            color={page?.barbershop.color}
            className="size-12 rounded-xl"
          />
          <div>
            <h1 className="text-xl font-bold">{page?.barbershop.name ?? 'Agendamento online'}</h1>
            {page?.barbershop.city ? (
              <p className="flex items-center gap-1 text-sm text-muted-foreground">
                <MapPin className="size-3.5" /> {page.barbershop.city}
              </p>
            ) : null}
          </div>
        </div>

        <Card className="p-5 sm:p-7">
          <div className="mb-6">
            <h2 className="text-2xl font-bold">Escolha seu horário</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Selecione o serviço, o dia e o horário. A equipe define automaticamente o profissional disponível.
            </p>
          </div>

          <div className="grid gap-6">
            <section>
              <Label className="mb-2 block">1. O que você deseja fazer?</Label>
              <div className="grid gap-2 sm:grid-cols-2">
                {page?.services.map((service) => (
                  <button
                    key={service.id}
                    type="button"
                    onClick={() => setServiceId(service.id)}
                    className={cn(
                      'flex items-center gap-3 rounded-lg border p-3 text-left transition-colors',
                      serviceId === service.id ? 'border-primary bg-primary/5 ring-2 ring-primary/15' : 'hover:bg-muted/50',
                    )}
                  >
                    <span className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-muted">
                      <Scissors className="size-4" />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block font-semibold">{service.name}</span>
                      <span className="text-xs text-muted-foreground">{service.durationMin} min · {formatCurrency(service.price)}</span>
                    </span>
                  </button>
                ))}
              </div>
            </section>

            <section className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="booking-date">2. Escolha o dia</Label>
                <div className="relative">
                  <CalendarDays className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                  <Input id="booking-date" type="date" min={todayKey()} max={maxDateKey()} value={date} onChange={(event) => setDate(event.target.value)} className="pl-9" />
                </div>
              </div>
              <div>
                <Label className="mb-2 block">3. Escolha o horário</Label>
                <div className="flex min-h-10 flex-wrap gap-2">
                  {loadingSlots ? <span className="text-sm text-muted-foreground">Buscando horários...</span> : null}
                  {!loadingSlots && date && serviceId && slots.length === 0 ? <span className="text-sm text-muted-foreground">Nenhum horário disponível neste dia.</span> : null}
                  {slots.map((slot) => (
                    <button key={slot} type="button" onClick={() => setStart(slot)} className={cn('rounded-md border px-3 py-2 text-sm font-semibold', start === slot ? 'border-primary bg-primary text-primary-foreground' : 'bg-background hover:bg-muted')}>
                      {slot}
                    </button>
                  ))}
                </div>
              </div>
            </section>

            <section>
              <Label className="mb-2 block">4. Seus dados</Label>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="booking-name">Nome completo</Label>
                  <Input id="booking-name" value={name} onChange={(event) => setName(event.target.value)} autoComplete="name" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="booking-phone">Telefone / WhatsApp</Label>
                  <Input id="booking-phone" value={phone} onChange={(event) => setPhone(event.target.value)} inputMode="tel" autoComplete="tel" placeholder="(00) 00000-0000" />
                </div>
                <div className="space-y-2 sm:col-span-2">
                  <Label htmlFor="booking-notes">Observação (opcional)</Label>
                  <Textarea id="booking-notes" value={notes} onChange={(event) => setNotes(event.target.value)} placeholder="Alguma preferência ou informação importante?" />
                </div>
              </div>
            </section>

            {status ? <p className="text-sm font-medium text-destructive">{status}</p> : null}
            <Button variant="gold" size="lg" disabled={!page || submitting} onClick={submit}>
              <Clock3 className="size-4" />
              {submitting ? 'Confirmando...' : 'Confirmar agendamento'}
            </Button>
          </div>
        </Card>
      </div>
    </main>
  )
}
