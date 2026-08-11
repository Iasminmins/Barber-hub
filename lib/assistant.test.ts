import { describe, expect, it } from 'vitest'
import {
  buildAssistantAnswer,
  buildAssistantMetricData,
  canUseAssistantIntent,
  classifyAssistantIntent,
  estimateAssistantAiCostUsd,
  getAssistantMonthlyBudgetUsd,
  getAssistantMonthlyLimit,
  getAssistantPeriod,
  getNextAssistantResetDate,
  parseAiAssistantIntent,
} from './assistant'
import type { Appointment, Client, FinancialEntry, Order } from './types'

const paidOrder: Order = {
  id: 'order-1',
  barbershopId: 'shop-1',
  number: 1,
  clientName: 'Ana',
  employeeId: 'employee-1',
  employeeName: 'Joao',
  items: [{ id: 'item-1', refId: 'service-1', type: 'servico', name: 'Corte', quantity: 2, unitPrice: 50 }],
  discount: 0,
  surcharge: 0,
  status: 'paga',
  method: 'pix',
  total: 100,
  createdAt: '2026-08-10T13:00:00.000Z',
}

const openOrder: Order = {
  ...paidOrder,
  id: 'order-2',
  number: 2,
  status: 'aberta',
  method: undefined,
  total: 30,
}

describe('assistant classifier', () => {
  it('classifica perguntas de faturamento de hoje', () => {
    expect(classifyAssistantIntent('quanto faturou hoje?')).toBe('revenue_today')
  })

  it('classifica perguntas de faturamento anual', () => {
    expect(classifyAssistantIntent('quanto faturamos no ano')).toBe('revenue_year')
  })

  it('classifica faturamento da semana mesmo com texto grudado', () => {
    expect(classifyAssistantIntent('quanto faturou essamsemana')).toBe('revenue_week')
  })

  it('classifica consultas de agendamentos por periodo', () => {
    expect(classifyAssistantIntent('quntos agendamentos teve na semana')).toBe('appointments_week')
    expect(classifyAssistantIntent('quantos horarios tenho no mes')).toBe('appointments_month')
    expect(classifyAssistantIntent('quantos agendamentos teve no ano')).toBe('appointments_year')
  })

  it('classifica ajuda para criar comanda', () => {
    expect(classifyAssistantIntent('como criar comanda?')).toBe('help_create_order')
  })

  it('classifica ajuda sobre link publico da agenda mesmo com frase informal', () => {
    expect(classifyAssistantIntent('como arrumar o link publico da agenda')).toBe('help_public_booking_link')
  })

  it('classifica ajuda sobre foto de funcionario mesmo com frase informal', () => {
    expect(classifyAssistantIntent('como eu adiciono foto de funcionario')).toBe('help_employee_photo')
  })

  it('classifica ajuda sobre horario da agenda mesmo com frase informal', () => {
    expect(classifyAssistantIntent('como arruma o horario da agenda')).toBe('help_schedule_hours')
  })

  it('classifica pergunta generica sobre modulo conhecido como ajuda da plataforma', () => {
    expect(classifyAssistantIntent('onde mexe nas comissoes dos barbeiros')).toBe('platform_help')
  })

  it('bloqueia assuntos fora da Barber Hub', () => {
    expect(classifyAssistantIntent('quem ganhou o jogo ontem?')).toBe('out_of_scope')
  })

  it('aceita intencao valida retornada pela IA', () => {
    expect(parseAiAssistantIntent('{"intent":"help_schedule_hours"}')).toBe('help_schedule_hours')
  })

  it('bloqueia resposta invalida retornada pela IA', () => {
    expect(parseAiAssistantIntent('{"intent":"delete_all_orders"}')).toBe('out_of_scope')
    expect(parseAiAssistantIntent('texto solto')).toBe('out_of_scope')
  })
})

describe('assistant permissions', () => {
  it('permite faturamento para dono e gerente', () => {
    expect(canUseAssistantIntent('revenue_today', 'owner')).toBe(true)
    expect(canUseAssistantIntent('revenue_today', 'manager')).toBe(true)
  })

  it('bloqueia faturamento para barbeiro', () => {
    expect(canUseAssistantIntent('revenue_today', 'barber')).toBe(false)
  })

  it('permite ajuda operacional para barbeiro', () => {
    expect(canUseAssistantIntent('help_create_client', 'barber')).toBe(true)
  })
})

describe('assistant periods', () => {
  it('gera periodo mensal e reset no primeiro dia do proximo mes', () => {
    const now = new Date('2026-08-10T12:00:00')

    expect(getAssistantPeriod(now)).toBe('2026-08')
    expect(getNextAssistantResetDate(now)).toBe('2026-09-01')
  })
})

describe('assistant plan limits', () => {
  it('usa limites mensais diferentes por plano', () => {
    expect(getAssistantMonthlyLimit('starter')).toBe(20)
    expect(getAssistantMonthlyLimit('pro')).toBe(50)
    expect(getAssistantMonthlyLimit('premium')).toBe(150)
  })

  it('usa starter para plano desconhecido', () => {
    expect(getAssistantMonthlyLimit('unknown')).toBe(20)
  })

  it('usa teto mensal de custo por plano', () => {
    expect(getAssistantMonthlyBudgetUsd('starter')).toBe(0.05)
    expect(getAssistantMonthlyBudgetUsd('pro')).toBe(0.1)
    expect(getAssistantMonthlyBudgetUsd('premium')).toBe(0.3)
  })

  it('estima custo de classificacao por tokens', () => {
    expect(estimateAssistantAiCostUsd({ inputTokens: 1000, outputTokens: 100 })).toBeCloseTo(0.00016, 8)
  })
})

describe('assistant metric data', () => {
  it('soma comandas pagas e entradas avulsas no faturamento de hoje', () => {
    const financialEntries: FinancialEntry[] = [{
      id: 'entry-1',
      barbershopId: 'shop-1',
      type: 'entrada',
      category: 'Avulso',
      description: 'Produto',
      amount: 25,
      method: 'dinheiro',
      date: '2026-08-10',
    }]

    expect(buildAssistantMetricData({
      intent: 'revenue_today',
      now: new Date('2026-08-10T10:00:00'),
      orders: [paidOrder, openOrder],
      financialEntries,
    })).toEqual({ kind: 'money', total: 125, orders: 1 })
  })

  it('soma faturamento do ano', () => {
    expect(buildAssistantMetricData({
      intent: 'revenue_year',
      now: new Date('2026-08-10T10:00:00'),
      orders: [
        paidOrder,
        { ...paidOrder, id: 'order-previous-year', createdAt: '2025-12-31T10:00:00.000Z', total: 999 },
      ],
    })).toEqual({ kind: 'money', total: 100, orders: 1 })
  })

  it('soma faturamento da semana atual', () => {
    expect(buildAssistantMetricData({
      intent: 'revenue_week',
      now: new Date('2026-08-10T10:00:00'),
      orders: [
        paidOrder,
        { ...paidOrder, id: 'order-last-week', createdAt: '2026-08-03T10:00:00.000Z', total: 999 },
      ],
    })).toEqual({ kind: 'money', total: 100, orders: 1 })
  })

  it('lista agendamentos de amanha em ordem de horario', () => {
    const appointments: Appointment[] = [
      appointment('2', '2026-08-11', '14:00'),
      appointment('1', '2026-08-11', '09:00'),
    ]

    expect(buildAssistantMetricData({
      intent: 'appointments_tomorrow',
      now: new Date('2026-08-10T10:00:00'),
      appointments,
    })).toEqual({
      kind: 'appointments',
      period: 'amanha',
      appointments: [
        { date: '2026-08-11', start: '09:00', clientName: 'Cliente 1', serviceName: 'Corte', employeeName: 'Joao', status: 'agendado' },
        { date: '2026-08-11', start: '14:00', clientName: 'Cliente 2', serviceName: 'Corte', employeeName: 'Joao', status: 'agendado' },
      ],
    })
  })

  it('conta agendamentos da semana atual', () => {
    expect(buildAssistantMetricData({
      intent: 'appointments_week',
      now: new Date('2026-08-10T10:00:00'),
      appointments: [
        appointment('1', '2026-08-10', '09:00'),
        appointment('2', '2026-08-09', '09:00'),
        appointment('3', '2026-08-03', '09:00'),
      ],
    })).toEqual({
      kind: 'appointments',
      period: 'esta semana',
      appointments: [
        { date: '2026-08-10', start: '09:00', clientName: 'Cliente 1', serviceName: 'Corte', employeeName: 'Joao', status: 'agendado' },
      ],
    })
  })

  it('conta clientes novos no mes', () => {
    const clients: Client[] = [
      client('1', '2026-08-02T10:00:00.000Z'),
      client('2', '2026-07-30T10:00:00.000Z'),
    ]

    expect(buildAssistantMetricData({
      intent: 'new_clients_month',
      now: new Date('2026-08-10T10:00:00'),
      clients,
    })).toEqual({ kind: 'count', count: 1 })
  })
})

describe('assistant answers', () => {
  it('responde fora do escopo sem dados', () => {
    expect(buildAssistantAnswer({ intent: 'out_of_scope' })).toContain('Barber Hub')
  })

  it('explica permissao negada', () => {
    expect(buildAssistantAnswer({ intent: 'revenue_today', denied: true })).toContain('dono ou gerente')
  })

  it('orienta onde ajustar o link publico da agenda', () => {
    expect(buildAssistantAnswer({ intent: 'help_public_booking_link' })).toContain('Configuracoes')
  })

  it('orienta onde adicionar foto de funcionario', () => {
    expect(buildAssistantAnswer({ intent: 'help_employee_photo' })).toContain('Funcionarios')
  })

  it('orienta onde ajustar horario da agenda', () => {
    expect(buildAssistantAnswer({ intent: 'help_schedule_hours' })).toContain('Configuracoes')
  })

  it('responde ajuda generica da plataforma sem bloquear como fora do escopo', () => {
    expect(buildAssistantAnswer({ intent: 'platform_help' })).toContain('Barber Hub')
  })
})

function appointment(id: string, date: string, start: string): Appointment {
  return {
    id,
    barbershopId: 'shop-1',
    clientId: `client-${id}`,
    clientName: `Cliente ${id}`,
    employeeId: 'employee-1',
    employeeName: 'Joao',
    serviceId: 'service-1',
    serviceName: 'Corte',
    date,
    start,
    durationMin: 40,
    status: 'agendado',
    price: 50,
  }
}

function client(id: string, createdAt: string): Client {
  return {
    id,
    barbershopId: 'shop-1',
    name: `Cliente ${id}`,
    phone: '',
    email: '',
    birthDate: '',
    postalCode: '',
    address: '',
    addressNumber: '',
    addressComplement: '',
    neighborhood: '',
    city: '',
    state: '',
    preferredDay: '',
    notes: '',
    tags: [],
    totalSpent: 0,
    visits: 0,
    lastVisit: '',
    favoriteService: '',
    preferredBarber: '',
    createdAt,
  }
}
