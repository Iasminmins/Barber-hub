import { describe, expect, it } from 'vitest'
import { canUsePlanFeature, getSaasPlan } from './saas-plans'

describe('planos SaaS', () => {
  it('define o Solo para 1 a 2 barbeiros por R$ 49,90', () => {
    const solo = getSaasPlan('solo')

    expect(solo.price).toBe('R$ 49,90')
    expect(solo.monthlyPrice).toBe(49.9)
    expect(solo.users).toBe('1 a 2 barbeiros')
  })

  it('mantém o Starter em R$ 89', () => {
    const starter = getSaasPlan('starter')

    expect(starter.price).toBe('R$ 89')
    expect(starter.users).toBe('3 a 5 usuários')
  })

  it('limita o Premium a 15 usuários', () => {
    expect(getSaasPlan('premium').users).toBe('Até 15 usuários')
  })

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
