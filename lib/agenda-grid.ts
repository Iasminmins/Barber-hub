import type { BusinessDayConfig } from './barbershop-settings'
import { timeToMinutes } from './schedule-blocks'

const MINUTES_PER_HOUR = 60
export const AGENDA_HOUR_HEIGHT = 64

type GridAppointment = {
  start: string
  durationMin: number
}

type GridBlock = {
  startTime: string | null
  endTime: string | null
}

function floorHour(minutes: number) {
  return Math.floor(minutes / MINUTES_PER_HOUR) * MINUTES_PER_HOUR
}

function ceilHour(minutes: number) {
  return Math.ceil(minutes / MINUTES_PER_HOUR) * MINUTES_PER_HOUR
}

export function getAgendaGridRange(
  businessHours: BusinessDayConfig,
  appointments: GridAppointment[],
  blocks: GridBlock[],
) {
  let startMinutes = floorHour(timeToMinutes(businessHours.start))
  let endMinutes = ceilHour(timeToMinutes(businessHours.end))

  for (const appointment of appointments) {
    const appointmentStart = timeToMinutes(appointment.start)
    startMinutes = Math.min(startMinutes, floorHour(appointmentStart))
    endMinutes = Math.max(endMinutes, ceilHour(appointmentStart + appointment.durationMin))
  }

  for (const block of blocks) {
    if (!block.startTime || !block.endTime) continue
    startMinutes = Math.min(startMinutes, floorHour(timeToMinutes(block.startTime)))
    endMinutes = Math.max(endMinutes, ceilHour(timeToMinutes(block.endTime)))
  }

  if (endMinutes <= startMinutes) endMinutes = startMinutes + MINUTES_PER_HOUR

  const hours = Array.from(
    { length: (endMinutes - startMinutes) / MINUTES_PER_HOUR },
    (_, index) => startMinutes / MINUTES_PER_HOUR + index,
  )

  return {
    closed: businessHours.closed,
    startMinutes,
    endMinutes,
    hours,
  }
}

export function minutesToGridTop(time: string, startMinutes: number) {
  return ((timeToMinutes(time) - startMinutes) / MINUTES_PER_HOUR) * AGENDA_HOUR_HEIGHT
}
