import type { ScheduleBlock } from './types'

export function timeToMinutes(value: string) {
  const [hours, minutes] = value.split(':').map(Number)
  return hours * 60 + minutes
}

export function appointmentConflictsWithScheduleBlock(
  appointmentStart: string,
  durationMin: number,
  block: Pick<ScheduleBlock, 'startTime' | 'endTime'>,
) {
  if (!block.startTime || !block.endTime) return true

  const appointmentStartMin = timeToMinutes(appointmentStart)
  const appointmentEndMin = appointmentStartMin + durationMin
  const blockStartMin = timeToMinutes(block.startTime)
  const blockEndMin = timeToMinutes(block.endTime)

  return appointmentStartMin < blockEndMin && appointmentEndMin > blockStartMin
}

export function formatScheduleBlockPeriod(block: Pick<ScheduleBlock, 'startTime' | 'endTime'>) {
  if (!block.startTime || !block.endTime) return 'Dia inteiro'
  return `${block.startTime.slice(0, 5)}–${block.endTime.slice(0, 5)}`
}

export function getBlockTimeOptions(openingTime: string, closingTime: string) {
  const openingMinutes = timeToMinutes(openingTime)
  const closingMinutes = timeToMinutes(closingTime)
  if (openingMinutes >= closingMinutes) return []

  const options: string[] = []
  for (let minutes = openingMinutes; minutes < closingMinutes; minutes += 30) {
    options.push(`${String(Math.floor(minutes / 60)).padStart(2, '0')}:${String(minutes % 60).padStart(2, '0')}`)
  }
  options.push(closingTime.slice(0, 5))
  return options
}
