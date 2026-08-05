import { beforeEach, describe, expect, it, vi } from 'vitest'

const { createClient } = vi.hoisted(() => ({
  createClient: vi.fn(() => ({ auth: {}, from: vi.fn() })),
}))

vi.mock('@supabase/supabase-js', () => ({ createClient }))

describe('createBrowserSupabaseClient', () => {
  beforeEach(() => {
    vi.resetModules()
    vi.stubEnv('NEXT_PUBLIC_SUPABASE_URL', 'https://example.supabase.co')
    vi.stubEnv('NEXT_PUBLIC_SUPABASE_ANON_KEY', 'publishable-key')
    createClient.mockClear()
  })

  it('reutiliza o mesmo cliente durante toda a execução no navegador', async () => {
    const { createBrowserSupabaseClient } = await import('./client')

    const firstClient = createBrowserSupabaseClient()
    const secondClient = createBrowserSupabaseClient()

    expect(secondClient).toBe(firstClient)
    expect(createClient).toHaveBeenCalledTimes(1)
  })
})
