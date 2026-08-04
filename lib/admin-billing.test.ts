import { describe, expect, test } from 'vitest'
import { addComplimentaryPeriod, calculateAdminBillingMetrics } from './admin-billing'

describe('admin billing', () => {
  test('avança dias a partir do vencimento futuro', () => {
    expect(addComplimentaryPeriod('2026-08-16', { days: 15 }, new Date('2026-08-04T12:00:00-03:00'))).toBe('2026-08-31')
  })

  test('avança meses sem pular para outro mês quando o dia não existe', () => {
    expect(addComplimentaryPeriod('2026-08-31', { months: 1 }, new Date('2026-08-04T12:00:00-03:00'))).toBe('2026-09-30')
  })

  test('usa hoje como base quando a cobrança já venceu', () => {
    expect(addComplimentaryPeriod('2026-07-01', { months: 2 }, new Date('2026-08-04T12:00:00-03:00'))).toBe('2026-10-04')
  })

  test('separa MRR contratado de receita prevista e contabiliza cortesias', () => {
    const result = calculateAdminBillingMetrics([
      { plan: 'starter', billingStatus: 'active', nextBillingDate: '2026-08-16', complimentaryUntil: null, complimentaryValue: 0, hasSubscription: true, createdAt: '2026-07-01' },
      { plan: 'pro', billingStatus: 'active', nextBillingDate: '2026-10-04', complimentaryUntil: '2026-10-04', complimentaryValue: 298, hasSubscription: true, createdAt: '2026-06-01' },
      { plan: 'premium', billingStatus: 'past_due', nextBillingDate: '2026-08-01', complimentaryUntil: null, complimentaryValue: 0, hasSubscription: true, createdAt: '2026-05-01' },
      { plan: 'starter', billingStatus: 'trialing', nextBillingDate: null, complimentaryUntil: null, complimentaryValue: 0, hasSubscription: false, createdAt: '2026-08-02' },
      { plan: 'premium', billingStatus: 'canceled', nextBillingDate: null, complimentaryUntil: null, complimentaryValue: 0, hasSubscription: true, createdAt: '2026-04-01' },
    ], new Date('2026-08-04T12:00:00-03:00'))

    expect(result).toEqual({
      mrr: 487,
      forecast30Days: 89,
      averageTicket: 162.33,
      complimentaryCount: 1,
      complimentaryValue: 298,
      conversionRate: 75,
      contractedCompanies: 3,
      newThisMonth: 1,
    })
  })
})
