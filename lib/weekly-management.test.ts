import { describe, expect, it } from 'vitest'
import { buildWeeklyBarberResults, getWeekRange } from './weekly-management'

describe('weekly management helpers', () => {
  it('returns a Monday-to-Sunday range for a selected date', () => {
    expect(getWeekRange('2026-09-08')).toEqual({ start: '2026-09-07', end: '2026-09-13' })
  })

  it('aggregates paid orders by active barber inside the selected week', () => {
    const result = buildWeeklyBarberResults(
      [
        { id: 'o1', employeeId: 'e1', employeeName: 'Barbeiro 1', total: 120, status: 'paga', createdAt: '2026-09-08T10:00:00Z' },
        { id: 'o2', employeeId: 'e1', employeeName: 'Barbeiro 1', total: 80, status: 'aberta', createdAt: '2026-09-08T11:00:00Z' },
        { id: 'o3', employeeId: 'e2', employeeName: 'Barbeiro 2', total: 100, status: 'paga', createdAt: '2026-09-14T10:00:00Z' },
      ] as never,
      [
        { id: 'e1', name: 'Barbeiro 1', active: true, role: 'barbeiro' },
        { id: 'e2', name: 'Barbeiro 2', active: true, role: 'barber' },
      ] as never,
      { start: '2026-09-07', end: '2026-09-13' },
    )

    expect(result).toEqual([
      { name: 'Barbeiro 1', revenue: 120, appointments: 1, averageTicket: 120 },
      { name: 'Barbeiro 2', revenue: 0, appointments: 0, averageTicket: 0 },
    ])
  })
})
