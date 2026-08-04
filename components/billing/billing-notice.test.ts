import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest'
import { getBillingState } from './billing-notice'
import type { Barbershop } from '@/lib/types'

const shop: Barbershop = {
  id: 'shop-1',
  name: 'Barber Teste',
  slug: 'barber-teste',
  color: '#1E3A32',
  city: 'Barra Mansa',
  billingDocument: '',
  plan: 'premium',
  billingStatus: 'past_due',
  trialEndsAt: '2026-07-01',
  nextBillingDate: '2026-08-16',
  paymentMethods: [],
  agendaSettings: {} as Barbershop['agendaSettings'],
}

describe('getBillingState', () => {
  beforeEach(() => vi.setSystemTime(new Date('2026-08-04T12:00:00-03:00')))
  afterEach(() => vi.useRealTimers())

  test('não trata status pendente como atraso quando o vencimento ainda é futuro', () => {
    expect(getBillingState(shop)).toMatchObject({ visible: false, blocked: false })
  })

  test.each([
    ['primeiro', '2026-08-03', 1],
    ['sétimo', '2026-07-28', 7],
  ])('mantém a plataforma liberada no %s dia de atraso', (_label, nextBillingDate, overdue) => {
    const state = getBillingState({ ...shop, nextBillingDate })

    expect(state).toMatchObject({ visible: true, blocked: false })
    expect(state.title).toContain(`Pagamento pendente há ${overdue}`)
  })

  test('bloqueia a plataforma somente no oitavo dia de atraso', () => {
    expect(getBillingState({ ...shop, nextBillingDate: '2026-07-27' })).toMatchObject({
      visible: true,
      blocked: true,
      title: 'Acesso operacional temporariamente suspenso',
    })
  })

  test('remove o aviso depois que o pagamento deixa a assinatura ativa', () => {
    expect(getBillingState({ ...shop, billingStatus: 'active', nextBillingDate: '2026-09-03' })).toMatchObject({
      visible: false,
      blocked: false,
    })
  })
})
