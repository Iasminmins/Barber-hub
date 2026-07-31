'use client'

import { AgendaClient } from './agenda-client'
import { useAppData } from '@/components/data/app-data-provider'

export default function AgendaPage() {
  const { appointments, employees, scheduleBlocks, barbershop } = useAppData()
  return <AgendaClient appointments={appointments} employees={employees} scheduleBlocks={scheduleBlocks} publicSlug={barbershop.slug} barbershopName={barbershop.name} barbershopId={barbershop.id} />
}
