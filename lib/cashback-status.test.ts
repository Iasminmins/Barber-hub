import { describe, expect, it } from 'vitest'
import { getCashbackStatus, needsCashbackReconciliation } from './cashback-status'

describe('cashback status', () => {
  it('does not create a pending cashback for a zero-value order', () => {
    expect(getCashbackStatus({ total: 0, cashbackEarned: 0, cashbackAwarded: false })).toBe('nao_aplicavel')
  })

  it('marks generated cashback as pending until the balance is credited', () => {
    expect(getCashbackStatus({ total: 40, cashbackEarned: 2, cashbackAwarded: false })).toBe('pendente')
  })

  it('marks cashback as credited after the database trigger completes', () => {
    expect(getCashbackStatus({ total: 40, cashbackEarned: 2, cashbackAwarded: true })).toBe('creditado')
  })

  it('flags paid non-zero orders that have not been reconciled', () => {
    expect(needsCashbackReconciliation({ status: 'paga', total: 40, cashbackAwarded: false })).toBe(true)
    expect(needsCashbackReconciliation({ status: 'paga', total: 0, cashbackAwarded: false })).toBe(false)
  })
})
