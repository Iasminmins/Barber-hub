import type { Appointment, Client, Order } from '@/lib/types'

export type ReturnFilter = 30 | 60 | 90

function dateOnly(value: string) {
  return value.slice(0, 10)
}

function diffDays(from: string, to: string) {
  const start = new Date(`${dateOnly(from)}T00:00:00`).getTime()
  const end = new Date(`${dateOnly(to)}T00:00:00`).getTime()
  return Math.floor((end - start) / 86400000)
}

export function getClientsWithoutReturn(clients: Client[], orders: Order[], days: ReturnFilter, today: string) {
  const lastVisits = new Map<string, string>()
  for (const order of orders) {
    if (order.status !== 'paga' || !order.clientId) continue
    const current = lastVisits.get(order.clientId)
    if (!current || dateOnly(order.createdAt) > current) lastVisits.set(order.clientId, dateOnly(order.createdAt))
  }

  return clients.filter((client) => {
    const lastVisit = lastVisits.get(client.id) ?? (client.lastVisit ? dateOnly(client.lastVisit) : '')
    if (!lastVisit) return false
    const age = diffDays(lastVisit, today)
    const upperBound = days === 90 ? Number.POSITIVE_INFINITY : days + 30
    return age >= days && age < upperBound
  })
}

export function isExpiredUnconfirmedAppointment(appointment: Appointment, today: string) {
  return appointment.status === 'agendado' && diffDays(appointment.date, today) > 0
}
