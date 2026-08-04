import { mkdirSync, writeFileSync } from 'node:fs'
// @ts-expect-error Node's type-stripping runner requires the explicit TypeScript extension.
import { buildDashboardReportPdf, type DashboardReport } from '../lib/dashboard-report-pdf.ts'

const methods = ['Pix', 'Credito', 'Debito', 'Dinheiro', 'Outro']
const professionals = Array.from({ length: 10 }, (_, index) => ({
  name: `Profissional ${index + 1} - João da Silva`,
  revenue: 10000 - index * 650,
  services: 80 - index * 5,
}))

const report: DashboardReport = {
  barbershopName: 'Barbearia São José - Unidade Centro de Volta Redonda',
  range: { start: '2026-08-01', end: '2026-08-31' },
  generatedAt: '2026-08-04T17:00:00-03:00',
  financial: {
    revenue: 78234.56,
    pdvRevenue: 61200.4,
    subscriptionRevenue: 15300.16,
    otherRevenue: 1734,
    averageTicket: 156.47,
    pendingCommissions: 8456.78,
  },
  operational: {
    paidOrders: 100,
    openOrders: 7,
    pendingOrders: 3,
    newClients: 28,
    activeSubscriptions: 92,
    atRiskClients: 11,
    lowStockItems: 6,
  },
  revenueByMethod: methods.map((method, index) => ({ method, value: 25000 - index * 4700 })),
  ranking: professionals,
  paidOrders: Array.from({ length: 100 }, (_, index) => ({
    number: 1000 + index,
    date: `2026-08-${String((index % 31) + 1).padStart(2, '0')}`,
    clientName: `Cliente com nome detalhado ${index + 1} da Conceição`,
    employeeName: professionals[index % professionals.length].name,
    method: methods[index % methods.length],
    total: 80 + index * 3.75,
  })),
}

mkdirSync('tmp/pdfs', { recursive: true })
const output = 'tmp/pdfs/dashboard-report-sample.pdf'
writeFileSync(output, Buffer.from(buildDashboardReportPdf(report).output('arraybuffer')))
console.log(output)
