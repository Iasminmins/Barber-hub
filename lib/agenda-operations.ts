import type { Appointment, Order } from './types'

export interface AgendaStats {
  total: number
  confirmados: number
  concluidos: number
  receita: number
}

export function findLinkedOrder(appointmentId: string, orders: Order[]) {
  return orders.find((order) => order.appointmentId === appointmentId)
}

export function isFreshAppointmentNotification(
  createdAt: string | undefined,
  now = new Date(),
  maxAgeHours = 24,
) {
  if (!createdAt) return false
  const createdAtMs = new Date(createdAt).getTime()
  if (!Number.isFinite(createdAtMs)) return false
  const ageMs = now.getTime() - createdAtMs
  return ageMs >= 0 && ageMs <= maxAgeHours * 60 * 60 * 1000
}

export function isActionableOrderNotification(
  order: Pick<Order, 'status' | 'createdAt'>,
  now = new Date(),
) {
  if (order.status !== 'aberta' && order.status !== 'pendente') return false
  return isFreshAppointmentNotification(order.createdAt, now)
}

export function getAgendaStats(
  appointments: Appointment[],
  orders: Order[],
  startDate: string,
  endDate: string,
  employeeId?: string,
): AgendaStats {
  const periodAppointments = appointments.filter((appointment) => (
    appointment.date >= startDate
    && appointment.date <= endDate
    && (!employeeId || appointment.employeeId === employeeId)
  ))
  const appointmentIds = new Set(periodAppointments.map((appointment) => appointment.id))

  return {
    total: periodAppointments.length,
    confirmados: periodAppointments.filter((appointment) => ['confirmado', 'chegou'].includes(appointment.status)).length,
    concluidos: periodAppointments.filter((appointment) => appointment.status === 'concluido').length,
    receita: orders
      .filter((order) => order.status === 'paga' && order.appointmentId && appointmentIds.has(order.appointmentId))
      .reduce((sum, order) => sum + order.total, 0),
  }
}
