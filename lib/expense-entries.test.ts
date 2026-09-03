import { describe, expect, it } from 'vitest'
import { getExpenseEntries, getExpenseTotal } from './expense-entries'
import type { FinancialEntry } from './types'

const entries: FinancialEntry[] = [
  { id: '1', barbershopId: 'shop', type: 'saida', category: 'Materiais', description: 'Pomadas', amount: 40, date: '2026-09-01' },
  { id: '2', barbershopId: 'shop', type: 'entrada', category: 'Serviços', description: 'Corte', amount: 80, date: '2026-09-01' },
  { id: '3', barbershopId: 'shop', type: 'saida', category: 'Aluguel', description: 'Aluguel', amount: 100, date: '2026-09-02' },
]

describe('expense entries', () => {
  it('returns only outgoing financial entries ordered from newest to oldest', () => {
    expect(getExpenseEntries(entries).map((entry) => entry.id)).toEqual(['3', '1'])
  })

  it('sums outgoing entries', () => {
    expect(getExpenseTotal(entries)).toBe(140)
  })
})
