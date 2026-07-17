import type { Appointment } from './types'

const STORAGE_KEY = 'barberhub.appointments'

function canUseStorage() {
  return typeof window !== 'undefined' && typeof window.localStorage !== 'undefined'
}

export function getStoredAppointments(): Appointment[] {
  if (!canUseStorage()) return []

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    if (!raw) return []

    const parsed = JSON.parse(raw)
    return Array.isArray(parsed) ? (parsed as Appointment[]) : []
  } catch {
    return []
  }
}

export function getAllAppointments(baseAppointments: Appointment[]): Appointment[] {
  const storedAppointments = getStoredAppointments()
  const storedIds = new Set(storedAppointments.map((appointment) => appointment.id))

  return [
    ...storedAppointments,
    ...baseAppointments.filter((appointment) => !storedIds.has(appointment.id)),
  ]
}

export function saveStoredAppointment(appointment: Appointment) {
  if (!canUseStorage()) return

  const currentAppointments = getStoredAppointments()
  const nextAppointments = [
    appointment,
    ...currentAppointments.filter((storedAppointment) => storedAppointment.id !== appointment.id),
  ]
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(nextAppointments))
}
