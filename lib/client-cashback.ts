import { formatCurrency } from './format'

export function formatClientCashback(balance: number | null | undefined) {
  return formatCurrency(Math.max(0, balance ?? 0))
}
