import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest'
import { getBillingState, getBillingStatusLabel } from './billing-notice'
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

  test('apresenta cobrança futura como agendada mesmo se o status armazenado estiver pendente', () => {
    expect(getBillingStatusLabel('past_due', '2026-08-16')).toBe('Cobrança agendada')
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

describe('assinatura cancelada', () => {
  beforeEach(() => vi.setSystemTime(new Date('2026-08-04T12:00:00-03:00')))
  afterEach(() => vi.useRealTimers())

  const canceled: Barbershop = { ...shop, billingStatus: 'canceled' }

  test('mantém o acesso liberado até o fim do período já pago', () => {
    const state = getBillingState({ ...canceled, nextBillingDate: '2026-08-16' })

    expect(state).toMatchObject({ visible: true, blocked: false, tone: 'warning' })
    expect(state.title).toContain('Assinatura cancelada')
  })

  test('não chama o cliente cancelado de inadimplente', () => {
    const state = getBillingState({ ...canceled, nextBillingDate: '2026-08-16' })

    expect(state.title).not.toContain('Pagamento pendente')
    expect(state.description).not.toContain('Regularize')
  })

  test('bloqueia assim que o período contratado termina, sem tolerância de 7 dias', () => {
    expect(getBillingState({ ...canceled, nextBillingDate: '2026-08-03' })).toMatchObject({
      visible: true,
      blocked: true,
      title: 'Assinatura cancelada',
    })
  })

  test('avisa que os dados continuam guardados após o bloqueio', () => {
    const state = getBillingState({ ...canceled, nextBillingDate: '2026-08-03' })

    expect(state.description).toContain('dados continuam guardados')
  })

  test('usa o fim do teste como limite quando o cancelamento ocorre durante o trial', () => {
    const state = getBillingState({
      ...canceled,
      trialEndsAt: '2026-08-20',
      nextBillingDate: undefined,
    })

    expect(state).toMatchObject({ visible: true, blocked: false })
  })

  test('exibe o rótulo Cancelada', () => {
    expect(getBillingStatusLabel('canceled', '2026-08-16')).toBe('Cancelada')
  })
})
