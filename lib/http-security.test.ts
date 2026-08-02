import { describe, expect, it } from 'vitest'

import { isUuid, readLimitedJson, safeTokenEqual } from './http-security'

describe('http security helpers', () => {
  it('accepts valid JSON within the configured limit', async () => {
    const request = new Request('https://example.com', {
      method: 'POST',
      body: JSON.stringify({ event: 'PAYMENT_CONFIRMED' }),
    })

    await expect(readLimitedJson(request, 128)).resolves.toEqual({ event: 'PAYMENT_CONFIRMED' })
  })

  it('rejects bodies larger than the configured limit', async () => {
    const request = new Request('https://example.com', {
      method: 'POST',
      body: JSON.stringify({ value: 'x'.repeat(100) }),
    })

    await expect(readLimitedJson(request, 32)).rejects.toMatchObject({ status: 413 })
  })

  it('rejects invalid JSON', async () => {
    const request = new Request('https://example.com', { method: 'POST', body: '{invalid' })

    await expect(readLimitedJson(request)).rejects.toMatchObject({ status: 400 })
  })

  it('compares tokens without accepting missing or partial values', () => {
    expect(safeTokenEqual('secret', 'secret')).toBe(true)
    expect(safeTokenEqual('secre', 'secret')).toBe(false)
    expect(safeTokenEqual(null, 'secret')).toBe(false)
  })

  it('accepts UUIDs and rejects arbitrary identifiers', () => {
    expect(isUuid('123e4567-e89b-42d3-a456-426614174000')).toBe(true)
    expect(isUuid('not-a-uuid')).toBe(false)
  })
})
