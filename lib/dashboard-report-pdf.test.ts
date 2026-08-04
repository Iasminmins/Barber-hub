import { describe, expect, it } from 'vitest'
import {
  buildDashboardReportPdf,
  dashboardReportFilename,
  type DashboardReport,
} from './dashboard-report-pdf'

const report: DashboardReport = {
  barbershopName: 'Barbearia São José',
  range: { start: '2026-08-01', end: '2026-08-31' },
  generatedAt: '2026-08-04T12:00:00-03:00',
  financial: {
    revenue: 1850,
    pdvRevenue: 1500,
    subscriptionRevenue: 300,
    otherRevenue: 50,
    averageTicket: 150,
    pendingCommissions: 175,
  },
  operational: {
    paidOrders: 10,
    openOrders: 2,
    pendingOrders: 1,
    newClients: 4,
    activeSubscriptions: 7,
    atRiskClients: 2,
    lowStockItems: 3,
  },
  revenueByMethod: [
    { method: 'Pix', value: 1200 },
    { method: 'Dinheiro', value: 650 },
  ],
  ranking: [{ name: 'Ana', revenue: 900, services: 6 }],
  paidOrders: [{ number: 42, date: '2026-08-03', clientName: 'Carlos', employeeName: 'Ana', method: 'Pix', total: 150 }],
}

describe('dashboard report PDF', () => {
  it('uses a safe filename with the exact selected range', () => {
    expect(dashboardReportFilename(report)).toBe('relatorio-barbearia-sao-jose-2026-08-01-a-2026-08-31.pdf')
  })

  it('contains the selected range, totals, methods, ranking, and orders', () => {
    const pdf = buildDashboardReportPdf(report)
    const content = pdf.output()

    expect(content).toContain('RELATORIO GERENCIAL')
    expect(content).toContain('01/08/2026 a 31/08/2026')
    expect(content).toContain('R$ 1.850,00')
    expect(content).toContain('Carlos')
    expect(content).toContain('Ana')
    expect(pdf.output('arraybuffer').byteLength).toBeGreaterThan(1500)
  })

  it('renders readable empty states', () => {
    const pdf = buildDashboardReportPdf({
      ...report,
      revenueByMethod: [],
      ranking: [],
      paidOrders: [],
    })
    const content = pdf.output()

    expect(content).toContain('Nenhuma receita registrada no periodo')
    expect(content).toContain('Nenhuma venda registrada no periodo')
    expect(content).toContain('Nenhuma comanda paga no periodo')
  })

  it('paginates long order tables with a header and resolved page totals', () => {
    const pdf = buildDashboardReportPdf({
      ...report,
      paidOrders: Array.from({ length: 100 }, (_, index) => ({
        ...report.paidOrders[0],
        number: index + 1,
        clientName: `Cliente detalhado ${index + 1}`,
      })),
    })
    const pages = pdf.getNumberOfPages()
    const content = pdf.output()

    expect(pages).toBeGreaterThan(1)
    expect(content.match(/RELATORIO GERENCIAL/g)).toHaveLength(pages)
    expect(content).toContain(`Pagina 1 de ${pages}`)
    expect(content).toContain(`Pagina ${pages} de ${pages}`)
  })
})
