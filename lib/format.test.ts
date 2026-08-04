import { describe, expect, it } from 'vitest'

import { formatDate, formatDateShort } from './format'

describe('date formatting', () => {
  it('does not throw for dates outside the supported display range', () => {
    expect(formatDate('20026-08-08')).toBe('-')
    expect(formatDateShort('20026-08-08')).toBe('-')
  })
})
