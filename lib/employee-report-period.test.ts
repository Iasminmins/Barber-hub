import { describe, expect, it } from 'vitest'
import { monthRange } from './employee-report-period'

describe('employee report periods', () => {
  it('returns the complete selected month', () => {
    const range = monthRange(0, new Date(2026, 7, 12))

    expect(range.start).toBe('2026-08-01')
    expect(range.end).toBe('2026-08-31')
  })
})
