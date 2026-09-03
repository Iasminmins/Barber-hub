import type { FinancialEntry } from './types'

export function getExpenseEntries(entries: FinancialEntry[]) {
  return entries.filter((entry) => entry.type === 'saida').sort((a, b) => b.date.localeCompare(a.date))
}

export function getExpenseTotal(entries: FinancialEntry[]) {
  return getExpenseEntries(entries).reduce((total, entry) => total + entry.amount, 0)
}
