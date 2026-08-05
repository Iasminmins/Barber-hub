import { describe, expect, it } from 'vitest'
import { getAppointmentColumns } from './agenda-layout'

describe('layout visual dos agendamentos', () => {
  it('mantem largura total quando os horarios nao se sobrepoem', () => {
    expect(getAppointmentColumns([
      { id: 'a', start: '09:00', durationMin: 30 },
      { id: 'b', start: '09:30', durationMin: 30 },
    ])).toEqual([
      { id: 'a', column: 0, columnCount: 1 },
      { id: 'b', column: 0, columnCount: 1 },
    ])
  })

  it('coloca atendimentos sobrepostos lado a lado', () => {
    expect(getAppointmentColumns([
      { id: 'a', start: '09:00', durationMin: 60 },
      { id: 'b', start: '09:30', durationMin: 30 },
    ])).toEqual([
      { id: 'a', column: 0, columnCount: 2 },
      { id: 'b', column: 1, columnCount: 2 },
    ])
  })
})
