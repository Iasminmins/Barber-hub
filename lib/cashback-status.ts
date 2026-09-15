export type CashbackStatus = 'nao_aplicavel' | 'pendente' | 'creditado'

export function getCashbackStatus(order: {
  total: number
  cashbackEarned?: number | null
  cashbackAwarded?: boolean | null
}): CashbackStatus {
  const total = Math.max(0, order.total)
  const earned = Math.max(0, order.cashbackEarned ?? 0)

  if (total === 0 || earned === 0) return 'nao_aplicavel'
  return order.cashbackAwarded ? 'creditado' : 'pendente'
}

export function needsCashbackReconciliation(order: {
  status?: string
  total: number
  cashbackAwarded?: boolean | null
}) {
  return order.status === 'paga' && order.total > 0 && !order.cashbackAwarded
}
