import { describe, expect, it } from 'vitest'
import { allowedPathsForPermissions, receptionPermissions, subscriptionViewsForRole } from './staff-permissions'

describe('reception permissions', () => {
  it('allows every staff area except Financeiro and Gastos', () => {
    expect(allowedPathsForPermissions(receptionPermissions)).toEqual([
      '/dashboard',
      '/agenda',
      '/comandas',
      '/clientes',
      '/catalogo',
      '/assinaturas',
    ])
  })

  it('hides the subscription finance tab from reception', () => {
    expect(subscriptionViewsForRole('reception')).toEqual(['assinaturas', 'planos'])
    expect(subscriptionViewsForRole('owner')).toEqual(['assinaturas', 'planos', 'financeiro'])
  })
})
