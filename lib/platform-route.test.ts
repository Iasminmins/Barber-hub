import { describe, expect, it } from 'vitest'
import {
  classifyAuthenticatedUser,
  PlatformRouteError,
  readPlatformDestination,
} from './platform-route'

function deps(options: { userId?: string; admin?: { name: string; email: string }; authError?: boolean } = {}) {
  return {
    getUser: async () => options.authError
      ? { user: null, error: new Error('invalid') }
      : { user: { id: options.userId ?? 'user-1' }, error: null },
    findActiveAdmin: async () => options.admin ?? null,
  }
}

describe('classifyAuthenticatedUser', () => {
  it('prioriza administrador ativo', async () => {
    await expect(classifyAuthenticatedUser(deps({ admin: { name: 'Leticia', email: 'admin@example.com' } }), 'token'))
      .resolves.toEqual({ destination: '/plataforma', admin: { name: 'Leticia', email: 'admin@example.com' } })
  })

  it('envia usuario comum ao dashboard', async () => {
    await expect(classifyAuthenticatedUser(deps(), 'token')).resolves.toEqual({ destination: '/dashboard' })
  })

  it('rejeita token invalido', async () => {
    await expect(classifyAuthenticatedUser(deps({ authError: true }), 'invalid'))
      .rejects.toEqual(expect.objectContaining<Partial<PlatformRouteError>>({ status: 401 }))
  })

  it('aceita somente destinos internos conhecidos', () => {
    expect(readPlatformDestination({ destination: '/plataforma' })).toBe('/plataforma')
    expect(readPlatformDestination({ destination: '/dashboard' })).toBe('/dashboard')
    expect(() => readPlatformDestination({ destination: 'https://evil.example' })).toThrow('Destino de acesso invalido.')
  })
})
