import { describe, expect, it } from 'vitest'
import { canUsePlanFeature, getSaasPlan } from './saas-plans'

describe('planos SaaS', () => {
  it('mantém importação bloqueada no Starter', () => {
    expect(canUsePlanFeature('starter', 'importExport')).toBe(false)
  })

  it('libera importação no Pro', () => {
    expect(canUsePlanFeature('pro', 'importExport')).toBe(true)
  })

  it('usa Starter para identificador inválido', () => {
    expect(getSaasPlan('invalido' as 'starter').id).toBe('starter')
  })
})
