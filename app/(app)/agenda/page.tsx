'use client'

import { AgendaClient } from './agenda-client'
import { useAppData } from '@/components/data/app-data-provider'

export default function AgendaPage() {
  const { appointments, employees, barbershop } = useAppData()
  return <AgendaClient appointments={appointments} employees={employees} publicSlug={barbershop.slug} barbershopName={barbershop.name} />
}
