import { describe, expect, it } from 'vitest'
import { calculateCashbackRedemption } from './cashback-redemption'

describe('cashback redemption', () => {
  it('uses the available balance when it is lower than the order subtotal', () => {
    expect(calculateCashbackRedemption(25, 80)).toEqual({
      amount: 25,
      remaining: 0,
    })
  })

  it('limits the redemption to the order subtotal', () => {
    expect(calculateCashbackRedemption(100, 40)).toEqual({
      amount: 40,
      remaining: 60,
    })
  })

  it('does not redeem negative or empty values', () => {
    expect(calculateCashbackRedemption(-10, 80)).toEqual({ amount: 0, remaining: 0 })
    expect(calculateCashbackRedemption(10, -80)).toEqual({ amount: 0, remaining: 10 })
  })
})
