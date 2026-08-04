import { describe, expect, it } from 'vitest'
import { buildEmployeeMonthlyPdf, employeeMonthlyPdfFilename } from './employee-monthly-pdf'
import type { EmployeeMonthlyStatement } from './employee-monthly-statement'

const statement: EmployeeMonthlyStatement = {
  employee: {
    id: 'employee-1',
    barbershopId: 'barbershop-1',
    name: 'Evandro',
    role: 'barber',
    phone: '',
    email: '',
    active: true,
    serviceCommission: 40,
    productCommission: 10,
    subscriptionCommission: 20,
  },
  barbershop: {
    id: 'barbershop-1',
    name: 'Barbearia Central',
  } as EmployeeMonthlyStatement['barbershop'],
  competence: '2026-08',
  services: 2,
  revenue: 200,
  subscriptionRevenue: 70,
  orderCommission: 57,
  subscriptionCommission: 20,
  totalCommission: 77,
  orders: [{
    id: 'order-1',
    number: 12,
    received: 200,
    discount: 0,
    surcharge: 0,
    commission: 57,
    items: [{
      id: 'item-1',
      name: 'Corte',
      type: 'servico',
      origin: 'Serviço',
      quantity: 2,
      unitPrice: 50,
      base: 100,
      rate: 40,
      commission: 40,
    }],
  }],
}

describe('employee monthly PDF', () => {
  it('creates the monthly statement filename', () => {
    expect(employeeMonthlyPdfFilename(statement)).toBe('fechamento-evandro-2026-08.pdf')
  })

  it('builds an A4 PDF with the header and monthly totals', () => {
    const pdf = buildEmployeeMonthlyPdf(statement)
    const content = pdf.output()
    const bytes = pdf.output('arraybuffer')

    expect(pdf.internal.pageSize.getWidth()).toBeCloseTo(595.28, 2)
    expect(pdf.internal.pageSize.getHeight()).toBeCloseTo(841.89, 2)
    expect(content).toContain('FECHAMENTO MENSAL')
    expect(content).toContain('Evandro')
    expect(content).toContain('R$ 200,00')
    expect(content).toContain('R$ 77,00')
    expect(bytes.byteLength).toBeGreaterThan(1000)
  })

  it('repeats the header and page footer for a long statement and explains zero-value orders', () => {
    const longStatement: EmployeeMonthlyStatement = {
      ...statement,
      orders: Array.from({ length: 90 }, (_, index) => ({
        ...statement.orders[0],
        id: `order-${index + 1}`,
        number: index + 1,
        received: index === 0 ? 0 : 200,
        commission: index === 0 ? 0 : 57,
        items: [{
          ...statement.orders[0].items[0],
          id: `item-${index + 1}`,
          name: `Corte detalhado ${index + 1}`,
        }],
      })),
    }
    const pdf = buildEmployeeMonthlyPdf(longStatement)
    const content = pdf.output()
    const pages = pdf.getNumberOfPages()

    expect(pages).toBeGreaterThan(1)
    expect(content.match(/FECHAMENTO MENSAL/g)).toHaveLength(pages)
    expect(content).toContain(`Página 1 de ${pages}`)
    expect(content).toContain(`Página ${pages} de ${pages}`)
    expect(content).toContain('Comanda zerada: comissão anulada por valor final zero.')
  })
})
