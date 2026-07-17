import { NovoAgendamentoClient } from './novo-agendamento-client'
import { getAppointments, getClients, getEmployees, getServices } from '@/lib/data'

export default function NovoAgendamentoPage() {
  const clients = getClients()
  const barbers = getEmployees().filter(
    (employee) => employee.active && employee.role.toLowerCase().includes('barbeiro'),
  )
  const services = getServices().filter((service) => service.active)
  const existingAppointments = getAppointments()

  return (
    <NovoAgendamentoClient
      clients={clients}
      barbers={barbers}
      services={services}
      existingAppointments={existingAppointments}
    />
  )
}
