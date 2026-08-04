import { describe, expect, it } from 'vitest'

import * as safeData from './safe-data'

type SafeDataApi = {
  safeText?: (value: unknown) => string
  safeStringArray?: (value: unknown) => string[]
  safeNumber?: (value: unknown) => number
}

const api = safeData as SafeDataApi

describe('Supabase data normalization', () => {
  it('turns missing or non-text values into safe text', () => {
    expect(api.safeText?.(null)).toBe('')
    expect(api.safeText?.(undefined)).toBe('')
    expect(api.safeText?.(123)).toBe('123')
  })

  it('keeps only text entries in array fields', () => {
    expect(api.safeStringArray?.(['vip', null, 42, 'ativo'])).toEqual(['vip', 'ativo'])
    expect(api.safeStringArray?.('vip')).toEqual([])
  })

  it('prevents invalid numeric values from reaching the UI', () => {
    expect(api.safeNumber?.('12.5')).toBe(12.5)
    expect(api.safeNumber?.('not-a-number')).toBe(0)
    expect(api.safeNumber?.(Number.POSITIVE_INFINITY)).toBe(0)
  })
})
