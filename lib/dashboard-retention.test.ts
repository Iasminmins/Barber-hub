import { describe, expect, it } from 'vitest'
import { getClientsWithoutReturn, isExpiredUnconfirmedAppointment } from './dashboard-retention'
import type { Appointment, Client, Order } from './types'

const client = (id: string, lastVisit = '') => ({ id, name: id, lastVisit, tags: [] } as unknown as Client)
const order = (clientId: string, createdAt: string, status: Order['status'] = 'paga') => ({ clientId, createdAt, status } as unknown as Order)

describe('dashboard retention filters', () => {
  it('finds clients whose completed attendance reached the selected threshold', () => {
    const result = getClientsWithoutReturn(
      [client('old'), client('recent')],
      [order('old', '2026-06-01T10:00:00'), order('recent', '2026-07-15T10:00:00')],
      60,
      '2026-08-11',
    )
    expect(result.map((item) => item.id)).toEqual(['old'])
  })

  it('does not use unpaid orders as the last attendance', () => {
    expect(getClientsWithoutReturn([client('one')], [order('one', '2026-01-01', 'pendente')], 60, '2026-08-11')).toHaveLength(0)
  })

  it('expires only unconfirmed appointments whose scheduled date has passed', () => {
    const base = { status: 'agendado', date: '2026-08-08' } as Appointment
    expect(isExpiredUnconfirmedAppointment(base, '2026-08-11')).toBe(true)
    expect(isExpiredUnconfirmedAppointment({ ...base, status: 'confirmado' }, '2026-08-11')).toBe(false)
    expect(isExpiredUnconfirmedAppointment({ ...base, date: '2026-08-11' }, '2026-08-11')).toBe(false)
    expect(isExpiredUnconfirmedAppointment({ ...base, date: '2026-08-20' }, '2026-08-11')).toBe(false)
  })
})
