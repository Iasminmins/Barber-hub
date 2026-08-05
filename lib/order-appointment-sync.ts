import type { OrderStatus } from './types'

export function shouldCompleteLinkedAppointment(
  previousStatus: OrderStatus,
  nextStatus: OrderStatus,
  appointmentId?: string,
) {
  return Boolean(appointmentId && previousStatus !== 'paga' && nextStatus === 'paga')
}
