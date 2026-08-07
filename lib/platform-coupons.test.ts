import { describe, expect, it } from 'vitest'
import { computeFirstChargeValue, effectiveCouponStatus, formatDiscount } from './platform-coupons'

describe('computeFirstChargeValue', () => {
  it('applies a percentage discount', () => {
    expect(computeFirstChargeValue(149, { discount_type: 'percentage', discount_value: 20 })).toBe(119.2)
  })

  it('applies a fixed discount', () => {
    expect(computeFirstChargeValue(149, { discount_type: 'fixed', discount_value: 50 })).toBe(99)
  })

  it('never goes to zero or negative', () => {
    expect(computeFirstChargeValue(89, { discount_type: 'fixed', discount_value: 200 })).toBe(1)
    expect(computeFirstChargeValue(89, { discount_type: 'percentage', discount_value: 100 })).toBe(1)
  })
})

describe('effectiveCouponStatus', () => {
  it('is disabled when stored as disabled, regardless of expiry', () => {
    expect(effectiveCouponStatus({ status: 'disabled', expires_at: '2999-01-01' })).toBe('disabled')
  })

  it('is expired once past expires_at', () => {
    expect(effectiveCouponStatus({ status: 'active', expires_at: '2000-01-01' })).toBe('expired')
  })

  it('is active when no expiry or still within it', () => {
    expect(effectiveCouponStatus({ status: 'active', expires_at: null })).toBe('active')
    expect(effectiveCouponStatus({ status: 'active', expires_at: '2999-01-01' })).toBe('active')
  })
})

describe('formatDiscount', () => {
  it('formats percentage and fixed discounts', () => {
    expect(formatDiscount({ discount_type: 'percentage', discount_value: 15 })).toBe('15%')
    expect(formatDiscount({ discount_type: 'fixed', discount_value: 30 })).toContain('30')
  })
})
