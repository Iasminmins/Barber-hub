import { timeToMinutes } from './schedule-blocks'

type LayoutAppointment = {
  id: string
  start: string
  durationMin: number
}

type PendingLayout = LayoutAppointment & {
  column: number
  endMinutes: number
}

export function getAppointmentColumns(appointments: LayoutAppointment[]) {
  const sorted = [...appointments].sort((a, b) => a.start.localeCompare(b.start))
  const result = new Map<string, { id: string; column: number; columnCount: number }>()
  let cluster: PendingLayout[] = []
  let clusterEnd = -1
  let columnEnds: number[] = []

  function finishCluster() {
    const columnCount = Math.max(1, columnEnds.length)
    for (const appointment of cluster) {
      result.set(appointment.id, {
        id: appointment.id,
        column: appointment.column,
        columnCount,
      })
    }
    cluster = []
    clusterEnd = -1
    columnEnds = []
  }

  for (const appointment of sorted) {
    const startMinutes = timeToMinutes(appointment.start)
    const endMinutes = startMinutes + appointment.durationMin
    if (cluster.length > 0 && startMinutes >= clusterEnd) finishCluster()

    let column = columnEnds.findIndex((end) => end <= startMinutes)
    if (column === -1) column = columnEnds.length
    columnEnds[column] = endMinutes
    cluster.push({ ...appointment, column, endMinutes })
    clusterEnd = Math.max(clusterEnd, endMinutes)
  }
  finishCluster()

  return appointments.map((appointment) => result.get(appointment.id)!)
}
