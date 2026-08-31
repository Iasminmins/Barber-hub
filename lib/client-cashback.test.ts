import { describe, expect, it } from 'vitest'

import { formatClientCashback } from './client-cashback'
import { formatCurrency } from './format'

describe('client cashback formatting', () => {
  it('formats the client cashback balance as currency', () => {
    expect(formatClientCashback(12.5)).toBe(formatCurrency(12.5))
  })
})
