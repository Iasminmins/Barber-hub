import { describe, expect, it } from 'vitest'
import { calculateEditedOrderValues } from './order-pricing'

describe('calculateEditedOrderValues', () => {
  it('recalculates cashback when an order total changes', () => {
    const result = calculateEditedOrderValues({
      items: [{ quantity: 1, unitPrice: 45 }],
      discount: 9,
      surcharge: 0,
      cashbackSettings: { enabled: true, percentage: 5, minimumPurchase: 0 },
      clientId: 'client-1',
    })

    expect(result.total).toBe(36)
    expect(result.cashbackEarned).toBe(1.8)
  })
})
