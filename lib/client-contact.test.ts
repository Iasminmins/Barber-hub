import { describe, expect, it } from 'vitest'
import { formatLastMessageSentAt } from './client-contact'

describe('formatLastMessageSentAt', () => {
  it('keeps the last message date and time visible', () => {
    expect(formatLastMessageSentAt('2026-08-17T15:42:00.000Z')).toMatch(/17\/08\/2026.*12:42/)
  })

  it('shows never sent for an empty or invalid value', () => {
    expect(formatLastMessageSentAt()).toBe('Nunca enviada')
    expect(formatLastMessageSentAt('invalid')).toBe('Nunca enviada')
  })
})

