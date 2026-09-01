import { describe, expect, it } from 'vitest'
import { calculateBookingCashback, calculateCashbackPurchaseTotal, calculateOrderCashback, calculateSubscriptionCashback, getPublicBookingProducts, normalizeReferral, shouldShowPublicProducts } from './public-booking'

describe('public booking merchandising', () => {
  it('returns only active, selected products with available stock', () => {
    const products = getPublicBookingProducts([
      { id: 'p1', type: 'produto', active: true, stock: 4 },
      { id: 'p2', type: 'produto', active: true, stock: 0 },
      { id: 'p3', type: 'produto', active: false, stock: 8 },
      { id: 'p4', type: 'produto', active: true, stock: undefined },
      { id: 's1', type: 'servico', active: true, stock: 8 },
    ], ['p1', 'p2', 'p3', 'p4'])

    expect(products.map((product) => product.id)).toEqual(['p1', 'p4'])
  })

  it('calculates cashback only when enabled and over the minimum purchase', () => {
    expect(calculateBookingCashback(90, { enabled: true, percentage: 5, minimumPurchase: 100 })).toEqual({
      amount: 0,
      remaining: 10,
    })
    expect(calculateBookingCashback(150, { enabled: true, percentage: 5, minimumPurchase: 100 })).toEqual({
      amount: 7.5,
      remaining: 0,
    })
    expect(calculateBookingCashback(150, { enabled: false, percentage: 5, minimumPurchase: 0 })).toEqual({
      amount: 0,
      remaining: 0,
    })
  })

  it('includes service and product values in the cashback purchase total', () => {
    expect(calculateCashbackPurchaseTotal(35, 65)).toBe(100)
  })

  it('calculates cashback from the final order total', () => {
    expect(calculateOrderCashback(95, { enabled: true, percentage: 5, minimumPurchase: 10 })).toEqual({
      amount: 4.75,
      remaining: 0,
    })
  })

  it('calculates cashback from a paid subscription value', () => {
    expect(calculateSubscriptionCashback(129.9, { enabled: true, percentage: 5, minimumPurchase: 100 })).toEqual({
      amount: 6.5,
      remaining: 0,
    })
  })

  it('keeps product visibility independent from cashback visibility', () => {
    expect(shouldShowPublicProducts({ showProducts: false })).toBe(false)
    expect(shouldShowPublicProducts({ showProducts: true })).toBe(true)
  })

  it('trims optional referral fields and rejects incomplete referrals', () => {
    expect(normalizeReferral('  Ana  ', ' (11) 99999-0000 ')).toEqual({ name: 'Ana', phone: '11999990000' })
    expect(normalizeReferral('Ana', '')).toBeNull()
    expect(normalizeReferral('', '11999990000')).toBeNull()
  })
})
