import { describe, expect, test } from 'vitest'
import { effectiveBillingStatus } from './billing-status'

describe('effectiveBillingStatus', () => {
  const now = new Date('2026-08-04T12:00:00-03:00')

  test('mantém a conta em teste quando o Asaas marcou atraso antes do fim do período grátis', () => {
    expect(effectiveBillingStatus('past_due', '2026-08-11T03:23:38.011Z', now)).toBe('trialing')
  })

  test('mantém atraso depois que o teste terminou', () => {
    expect(effectiveBillingStatus('past_due', '2026-08-03T03:23:38.011Z', now)).toBe('past_due')
  })

  test('não altera uma assinatura já ativa', () => {
    expect(effectiveBillingStatus('active', '2026-08-11T03:23:38.011Z', now)).toBe('active')
  })

  test('rejeita um status desconhecido vindo do banco', () => {
    expect(() => effectiveBillingStatus('unknown', null, now)).toThrow('Status de cobrança inválido: unknown')
  })
})
