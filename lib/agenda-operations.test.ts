import { describe, expect, it } from 'vitest'
import type { Appointment, Order } from './types'
import { findLinkedOrder, getAgendaStats, isFreshAppointmentNotification } from './agenda-operations'

const appointment = (overrides: Partial<Appointment> = {}): Appointment => ({
  id: 'appointment-1',
  barbershopId: 'shop-1',
  clientId: 'client-1',
  clientName: 'Cliente',
  employeeId: 'employee-1',
  employeeName: 'Barbeiro',
  serviceId: 'service-1',
  serviceName: 'Corte',
  date: '2026-08-05',
  start: '10:00',
  durationMin: 40,
  status: 'concluido',
  price: 50,
  ...overrides,
})

const order = (overrides: Partial<Order> = {}): Order => ({
  id: 'order-1',
  barbershopId: 'shop-1',
  appointmentId: 'appointment-1',
  number: 1,
  clientId: 'client-1',
  clientName: 'Cliente',
  employeeId: 'employee-1',
  employeeName: 'Barbeiro',
  items: [],
  discount: 0,
  surcharge: 0,
  status: 'paga',
  method: 'pix',
  total: 75,
  createdAt: '2026-08-05T13:00:00.000Z',
  ...overrides,
})

describe('getAgendaStats', () => {
  it('usa o total pago da comanda vinculada como receita realizada', () => {
    expect(getAgendaStats([appointment()], [order()], '2026-08-05', '2026-08-05')).toEqual({
      total: 1,
      confirmados: 0,
      concluidos: 1,
      receita: 75,
    })
  })

  it('ignora comandas avulsas, não pagas e fora do filtro de barbeiro', () => {
    const appointments = [
      appointment(),
      appointment({ id: 'appointment-2', employeeId: 'employee-2', status: 'confirmado' }),
    ]
    const orders = [
      order({ id: 'avulsa', appointmentId: undefined, total: 200 }),
      order({ id: 'aberta', status: 'aberta', total: 90 }),
      order({ id: 'outro-barbeiro', appointmentId: 'appointment-2', total: 100 }),
    ]

    expect(getAgendaStats(appointments, orders, '2026-08-05', '2026-08-05', 'employee-1')).toEqual({
      total: 1,
      confirmados: 0,
      concluidos: 1,
      receita: 0,
    })
  })
})

describe('notification and link helpers', () => {
  it('considera novidade somente dentro de 24 horas', () => {
    const now = new Date('2026-08-05T15:00:00.000Z')
    expect(isFreshAppointmentNotification('2026-08-04T15:01:00.000Z', now)).toBe(true)
    expect(isFreshAppointmentNotification('2026-08-04T14:59:00.000Z', now)).toBe(false)
  })

  it('encontra a comanda pelo vínculo explícito', () => {
    expect(findLinkedOrder('appointment-1', [order()])?.id).toBe('order-1')
    expect(findLinkedOrder('missing', [order()])).toBeUndefined()
  })
})
