import { AgendaClient } from './agenda-client'
import { getAppointments, getEmployees } from '@/lib/data'

export default function AgendaPage() {
  return <AgendaClient appointments={getAppointments()} employees={getEmployees()} />
}
