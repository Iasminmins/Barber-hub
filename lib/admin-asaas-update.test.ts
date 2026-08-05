import { describe, expect, test } from 'vitest'
import { buildAsaasBillingUpdate } from './admin-asaas-update'

const proPlan = { value: 149, description: 'BarberHub - Plano Pro' }

describe('buildAsaasBillingUpdate', () => {
  test('não reenvia dados do plano quando o plano não mudou', () => {
    const result = buildAsaasBillingUpdate({
      currentPlan: 'pro',
      requestedPlan: 'pro',
      currentNextBillingDate: '2026-08-16',
      requestedNextBillingDate: '2026-08-16',
      requestedPlanDetails: proPlan,
      payments: [],
    })

    expect(result).toEqual({ subscriptionUpdate: {} })
  })

  test('atualiza a cobrança aberta que já foi gerada em vez da assinatura', () => {
    const result = buildAsaasBillingUpdate({
      currentPlan: 'pro',
      requestedPlan: 'pro',
      currentNextBillingDate: '2026-08-16',
      requestedNextBillingDate: '2026-09-16',
      requestedPlanDetails: proPlan,
      payments: [
        { id: 'pay_future', dueDate: '2026-09-16', status: 'PENDING' },
        { id: 'pay_current', dueDate: '2026-08-16', status: 'PENDING' },
      ],
    })

    expect(result).toEqual({
      subscriptionUpdate: {},
      paymentUpdate: { id: 'pay_current', dueDate: '2026-09-16' },
    })
  })

  test('altera nextDueDate quando a cobrança ainda não foi gerada', () => {
    const result = buildAsaasBillingUpdate({
      currentPlan: 'pro',
      requestedPlan: 'pro',
      currentNextBillingDate: '2026-08-16',
      requestedNextBillingDate: '2026-09-16',
      requestedPlanDetails: proPlan,
      payments: [],
    })

    expect(result).toEqual({ subscriptionUpdate: { nextDueDate: '2026-09-16' } })
  })

  test('ignora cobranças liquidadas ao escolher o vencimento que pode ser alterado', () => {
    const result = buildAsaasBillingUpdate({
      currentPlan: 'pro',
      requestedPlan: 'premium',
      currentNextBillingDate: '2026-08-16',
      requestedNextBillingDate: '2026-09-16',
      requestedPlanDetails: { value: 249, description: 'BarberHub - Plano Premium' },
      payments: [
        { id: 'pay_received', dueDate: '2026-08-16', status: 'RECEIVED' },
        { id: 'pay_overdue', dueDate: '2026-08-20', status: 'OVERDUE' },
      ],
    })

    expect(result).toEqual({
      subscriptionUpdate: {
        value: 249,
        cycle: 'MONTHLY',
        description: 'BarberHub - Plano Premium',
        updatePendingPayments: true,
      },
      paymentUpdate: { id: 'pay_overdue', dueDate: '2026-09-16' },
    })
  })
})
