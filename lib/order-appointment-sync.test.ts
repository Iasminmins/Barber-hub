import { describe, expect, it } from 'vitest'
import { shouldCompleteLinkedAppointment } from './order-appointment-sync'

describe('shouldCompleteLinkedAppointment', () => {
  it('conclui somente quando uma comanda vinculada muda para paga', () => {
    expect(shouldCompleteLinkedAppointment('aberta', 'paga', 'appointment-1')).toBe(true)
    expect(shouldCompleteLinkedAppointment('pendente', 'paga', 'appointment-1')).toBe(true)
    expect(shouldCompleteLinkedAppointment('paga', 'paga', 'appointment-1')).toBe(false)
    expect(shouldCompleteLinkedAppointment('aberta', 'pendente', 'appointment-1')).toBe(false)
    expect(shouldCompleteLinkedAppointment('aberta', 'paga', undefined)).toBe(false)
  })
})
