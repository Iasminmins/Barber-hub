import { describe, expect, it } from 'vitest'
import { selectClientSearchOption } from '@/lib/client-search'
import type { Client } from '@/lib/types'

describe('client search selection', () => {
  it('keeps the selected client visible in the field and closes the results', () => {
    expect(selectClientSearchOption({
      id: 'client-1',
      name: 'João Silva',
    } as Client)).toEqual({
      clientId: 'client-1',
      clientQuery: 'João Silva',
      isClientSearchOpen: false,
    })
  })
})
