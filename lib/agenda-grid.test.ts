import { describe, expect, it } from 'vitest'
import { getAgendaGridRange, minutesToGridTop } from './agenda-grid'

describe('faixa horaria da agenda', () => {
  it('arredonda abertura e fechamento configurados para horas completas', () => {
    expect(getAgendaGridRange(
      { closed: false, start: '09:30', end: '19:30' },
      [],
      [],
    )).toEqual({
      closed: false,
      startMinutes: 9 * 60,
      endMinutes: 20 * 60,
      endLabel: '20:00',
      hours: [9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19],
    })
  })

  it('expande a grade para nao esconder agendamentos fora do expediente', () => {
    expect(getAgendaGridRange(
      { closed: false, start: '09:00', end: '18:00' },
      [
        { start: '08:15', durationMin: 40 },
        { start: '18:30', durationMin: 45 },
      ],
      [],
    )).toMatchObject({
      startMinutes: 8 * 60,
      endMinutes: 20 * 60,
    })
  })

  it('mantem a faixa configurada e sinaliza quando o dia esta fechado', () => {
    expect(getAgendaGridRange(
      { closed: true, start: '09:00', end: '19:30' },
      [],
      [],
    )).toMatchObject({
      closed: true,
      startMinutes: 9 * 60,
      endMinutes: 20 * 60,
    })
  })

  it('calcula a posicao relativa ao inicio dinamico da grade', () => {
    expect(minutesToGridTop('09:30', 8 * 60)).toBe(96)
  })
})
