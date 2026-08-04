import { describe, expect, it } from 'vitest'
import { buildEmployeeMonthlyStatement } from './employee-monthly-statement'
import type { Barbershop, Commission, Employee, Order } from './types'

const employee: Employee = {
  id: 'employee-1',
  barbershopId: 'barbershop-1',
  name: 'Ana Barbeira',
  role: 'barber',
  phone: '',
  email: '',
  active: true,
  serviceCommission: 40,
  productCommission: 10,
  subscriptionCommission: 20,
}

const barbershop = {
  id: 'barbershop-1',
  name: 'Barbearia Central',
} as Barbershop

function order(overrides: Partial<Order>): Order {
  return {
    id: 'order-1',
    barbershopId: 'barbershop-1',
    number: 1,
    clientName: 'Cliente',
    employeeId: 'employee-1',
    employeeName: 'Ana Barbeira',
    items: [],
    discount: 0,
    surcharge: 0,
    status: 'paga',
    total: 0,
    createdAt: '2026-08-01T12:00:00.000Z',
    ...overrides,
  }
}

function statementInput(overrides: Partial<{ orders: Order[]; commissions: Commission[] }> = {}) {
  return {
    employeeId: employee.id,
    employees: [employee],
    barbershop,
    competence: '2026-08',
    orders: [],
    commissions: [],
    ...overrides,
  }
}

describe('buildEmployeeMonthlyStatement', () => {
  it('calculates monthly totals and separates subscription commissions', () => {
    const result = buildEmployeeMonthlyStatement(statementInput({
      orders: [order({
        items: [
          { id: 'service-1', refId: 'service-1', type: 'servico', name: 'Corte', quantity: 2, unitPrice: 50 },
          { id: 'product-1', refId: 'product-1', type: 'produto', name: 'Pomada', quantity: 1, unitPrice: 30 },
          { id: 'subscription-1', refId: 'subscription-1', type: 'servico', name: '[Assinatura] Clube', quantity: 1, unitPrice: 70 },
        ],
        total: 200,
      })],
      commissions: [{
        id: 'commission-1',
        barbershopId: 'barbershop-1',
        employeeId: 'employee-1',
        employeeName: 'Ana Barbeira',
        origin: 'assinatura',
        reference: 'Clube mensal',
        base: 100,
        rate: 20,
        amount: 20,
        status: 'pendente',
        date: '2026-08-02',
      }],
    }))

    expect(result.employee).toBe(employee)
    expect(result.barbershop).toBe(barbershop)
    expect(result.competence).toBe('2026-08')
    expect(result.services).toBe(3)
    expect(result.revenue).toBe(200)
    expect(result.subscriptionRevenue).toBe(200)
    expect(result.orderCommission).toBe(57)
    expect(result.subscriptionCommission).toBe(20)
    expect(result.totalCommission).toBe(77)
    expect(result.orders[0]).toMatchObject({ received: 200, commission: 57 })
  })

  it('keeps zero-value orders in the statement without commission', () => {
    const result = buildEmployeeMonthlyStatement(statementInput({
      orders: [order({
        discount: 50,
        items: [{ id: 'service-1', refId: 'service-1', type: 'servico', name: 'Corte', quantity: 1, unitPrice: 50 }],
      })],
      commissions: [{
        id: 'commission-1',
        barbershopId: 'barbershop-1',
        employeeId: 'employee-1',
        employeeName: 'Ana Barbeira',
        origin: 'assinatura',
        reference: 'Clube mensal',
        base: 100,
        rate: 20,
        amount: 20,
        status: 'pendente',
        date: '2026-08-02',
      }],
    }))

    expect(result.orders[0].received).toBe(0)
    expect(result.orders[0].commission).toBe(0)
    expect(result.totalCommission).toBe(result.subscriptionCommission)
  })

  it('includes only paid orders in the selected competence assigned to the employee', () => {
    const result = buildEmployeeMonthlyStatement(statementInput({
      orders: [
        order({ total: 50, items: [{ id: 'service-1', refId: 'service-1', type: 'servico', name: 'Corte', quantity: 1, unitPrice: 50 }] }),
        order({ id: 'order-2', number: 2, status: 'pendente', total: 80 }),
        order({ id: 'order-3', number: 3, createdAt: '2026-07-31T12:00:00.000Z', total: 90 }),
        order({ id: 'order-4', number: 4, employeeId: 'employee-2', employeeName: 'Outro', total: 100 }),
      ],
    }))

    expect(result.orders).toHaveLength(1)
    expect(result.revenue).toBe(50)
  })
})
