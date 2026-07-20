'use client'

import { NovoAgendamentoClient } from './novo-agendamento-client'
import { useAppData } from '@/components/data/app-data-provider'
import { isBarberRole } from '@/lib/employees'

export default function NovoAgendamentoPage() {
  const { appointments, catalog, clients, employees } = useAppData()
  const barbers = employees.filter(
    (employee) => employee.active && isBarberRole(employee.role),
  )
  const services = catalog.filter((service) => service.type === 'servico' && service.active)
  const existingAppointments = appointments

  return (
    <NovoAgendamentoClient
      clients={clients}
      barbers={barbers}
      services={services}
      existingAppointments={existingAppointments}
    />
  )
}
