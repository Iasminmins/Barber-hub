import { describe, expect, it } from 'vitest'
import type { ScheduleBlock } from './types'
import { appointmentConflictsWithScheduleBlock, formatScheduleBlockPeriod, getBlockTimeOptions } from './schedule-blocks'

function block(values: Partial<ScheduleBlock> = {}): ScheduleBlock {
  return {
    id: 'block-1',
    barbershopId: 'shop-1',
    employeeId: 'employee-1',
    date: '2026-08-03',
    startTime: null,
    endTime: null,
    ...values,
  }
}

describe('bloqueios de agenda', () => {
  it('bloqueia qualquer novo agendamento quando o dia inteiro está bloqueado', () => {
    expect(appointmentConflictsWithScheduleBlock('10:00', 40, block())).toBe(true)
  })

  it('bloqueia um serviço que começa antes e termina dentro do período', () => {
    expect(appointmentConflictsWithScheduleBlock('13:30', 40, block({ startTime: '14:00', endTime: '15:00' }))).toBe(true)
  })

  it('permite um serviço que termina exatamente quando o bloqueio começa', () => {
    expect(appointmentConflictsWithScheduleBlock('13:20', 40, block({ startTime: '14:00', endTime: '15:00' }))).toBe(false)
  })

  it('permite um serviço que começa exatamente quando o bloqueio termina', () => {
    expect(appointmentConflictsWithScheduleBlock('15:00', 40, block({ startTime: '14:00', endTime: '15:00' }))).toBe(false)
  })

  it('formata dia inteiro e período para exibição', () => {
    expect(formatScheduleBlockPeriod(block())).toBe('Dia inteiro')
    expect(formatScheduleBlockPeriod(block({ startTime: '08:00:00', endTime: '14:00:00' }))).toBe('08:00–14:00')
  })

  it('gera horários conforme a abertura e o fechamento da barbearia', () => {
    expect(getBlockTimeOptions('07:00', '09:00')).toEqual(['07:00', '07:30', '08:00', '08:30', '09:00'])
  })
})
