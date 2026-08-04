import { jsPDF } from 'jspdf'
import autoTable from 'jspdf-autotable'

export interface DashboardReport {
  barbershopName: string
  range: { start: string; end: string }
  generatedAt: string
  financial: {
    revenue: number
    pdvRevenue: number
    subscriptionRevenue: number
    otherRevenue: number
    averageTicket: number
    pendingCommissions: number
  }
  operational: {
    paidOrders: number
    openOrders: number
    pendingOrders: number
    newClients: number
    activeSubscriptions: number
    atRiskClients: number
    lowStockItems: number
  }
  revenueByMethod: Array<{ method: string; value: number }>
  ranking: Array<{ name: string; revenue: number; services: number }>
  paidOrders: Array<{
    number: number
    date: string
    clientName: string
    employeeName: string
    method: string
    total: number
  }>
}

type PdfWithTable = jsPDF & { lastAutoTable?: { finalY: number } }

const currencyFormatter = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' })
const dateFormatter = new Intl.DateTimeFormat('pt-BR')
const green: [number, number, number] = [31, 78, 61]
const gold: [number, number, number] = [214, 171, 54]
const ink: [number, number, number] = [22, 32, 42]
const muted: [number, number, number] = [100, 110, 120]
const totalPagesPlaceholder = '__TOTAL_PAGES__'

function formatCurrency(value: number) {
  return currencyFormatter.format(value).replace(/\u00a0/g, ' ')
}

function formatDate(value: string) {
  return dateFormatter.format(new Date(`${value.slice(0, 10)}T00:00:00`))
}

function filenamePart(value: string) {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '') || 'barbearia'
}

function sectionTitle(doc: jsPDF, title: string, y: number) {
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(11)
  doc.setTextColor(...green)
  doc.text(title.toUpperCase(), 40, y)
  doc.setDrawColor(220, 224, 220)
  doc.line(40, y + 7, doc.internal.pageSize.getWidth() - 40, y + 7)
}

function ensureSpace(doc: PdfWithTable, required = 110) {
  const currentY = (doc.lastAutoTable?.finalY ?? 110) + 28
  const pageHeight = doc.internal.pageSize.getHeight()
  if (currentY + required <= pageHeight - 54) return currentY
  doc.addPage()
  return 122
}

function drawPageFrame(doc: jsPDF, report: DashboardReport, pageNumber: number) {
  const pageWidth = doc.internal.pageSize.getWidth()
  const pageHeight = doc.internal.pageSize.getHeight()

  doc.setFillColor(...green)
  doc.rect(0, 0, pageWidth, 10, 'F')
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(16)
  doc.setTextColor(...ink)
  doc.text('RELATORIO GERENCIAL', 40, 42)
  doc.setFontSize(10)
  doc.setTextColor(...green)
  doc.text(report.barbershopName, 40, 61)
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(9)
  doc.setTextColor(...muted)
  doc.text(`${formatDate(report.range.start)} a ${formatDate(report.range.end)}`, 40, 78)
  doc.text(`Gerado em ${new Intl.DateTimeFormat('pt-BR', { dateStyle: 'short', timeStyle: 'short' }).format(new Date(report.generatedAt))}`, pageWidth - 40, 61, { align: 'right' })
  doc.setDrawColor(...gold)
  doc.setLineWidth(1.5)
  doc.line(40, 92, pageWidth - 40, 92)

  doc.setFontSize(8)
  doc.setTextColor(...muted)
  doc.text('BarberHub - gestao profissional para barbearias', 40, pageHeight - 24)
  doc.text(`Pagina ${pageNumber} de ${totalPagesPlaceholder}`, pageWidth - 40, pageHeight - 24, { align: 'right' })
}

export function dashboardReportFilename(report: DashboardReport) {
  return `relatorio-${filenamePart(report.barbershopName)}-${report.range.start}-a-${report.range.end}.pdf`
}

export function buildDashboardReportPdf(report: DashboardReport): jsPDF {
  const doc = new jsPDF({ unit: 'pt', format: 'a4' }) as PdfWithTable
  const tableDefaults = {
    margin: { top: 108, right: 40, bottom: 48, left: 40 },
    styles: { font: 'helvetica', fontSize: 8.5, cellPadding: 6, textColor: ink },
    headStyles: { fillColor: green, textColor: 255, fontStyle: 'bold' as const },
    alternateRowStyles: { fillColor: [247, 248, 246] as [number, number, number] },
  }

  sectionTitle(doc, 'Resumo financeiro', 116)
  autoTable(doc, {
    ...tableDefaults,
    startY: 128,
    head: [['Indicador', 'Valor', 'Indicador', 'Valor']],
    body: [
      ['Receita total', formatCurrency(report.financial.revenue), 'Ticket medio', formatCurrency(report.financial.averageTicket)],
      ['Receita do PDV', formatCurrency(report.financial.pdvRevenue), 'Comissoes pendentes', formatCurrency(report.financial.pendingCommissions)],
      ['Assinaturas', formatCurrency(report.financial.subscriptionRevenue), 'Outras receitas', formatCurrency(report.financial.otherRevenue)],
    ],
    columnStyles: { 1: { halign: 'right' }, 3: { halign: 'right' } },
  })

  let y = ensureSpace(doc, 120)
  sectionTitle(doc, 'Resumo operacional', y)
  autoTable(doc, {
    ...tableDefaults,
    startY: y + 12,
    head: [['Comandas', 'Qtd.', 'Operacao', 'Qtd.']],
    body: [
      ['Pagas', String(report.operational.paidOrders), 'Clientes novos', String(report.operational.newClients)],
      ['Abertas', String(report.operational.openOrders), 'Assinaturas ativas', String(report.operational.activeSubscriptions)],
      ['Pendentes', String(report.operational.pendingOrders), 'Clientes em risco', String(report.operational.atRiskClients)],
      ['', '', 'Estoque baixo', String(report.operational.lowStockItems)],
    ],
    columnStyles: { 1: { halign: 'right' }, 3: { halign: 'right' } },
  })

  y = ensureSpace(doc, 115)
  sectionTitle(doc, 'Receita por forma de pagamento', y)
  autoTable(doc, {
    ...tableDefaults,
    startY: y + 12,
    head: [['Forma de pagamento', 'Valor', 'Participacao']],
    body: report.revenueByMethod.length > 0
      ? report.revenueByMethod.map((item) => [
        item.method,
        formatCurrency(item.value),
        report.financial.revenue > 0 ? `${((item.value / report.financial.revenue) * 100).toFixed(1).replace('.', ',')}%` : '0,0%',
      ])
      : [['Nenhuma receita registrada no periodo', formatCurrency(0), '0,0%']],
    columnStyles: { 1: { halign: 'right' }, 2: { halign: 'right' } },
  })

  y = ensureSpace(doc, 115)
  sectionTitle(doc, 'Ranking dos profissionais', y)
  autoTable(doc, {
    ...tableDefaults,
    startY: y + 12,
    head: [['Posicao', 'Profissional', 'Servicos', 'Receita']],
    body: report.ranking.length > 0
      ? report.ranking.map((item, index) => [String(index + 1), item.name, String(item.services), formatCurrency(item.revenue)])
      : [['-', 'Nenhuma venda registrada no periodo', '0', formatCurrency(0)]],
    columnStyles: { 0: { cellWidth: 55, halign: 'center' }, 2: { halign: 'right' }, 3: { halign: 'right' } },
  })

  y = ensureSpace(doc, 130)
  sectionTitle(doc, 'Comandas pagas', y)
  autoTable(doc, {
    ...tableDefaults,
    startY: y + 12,
    head: [['Data', 'Comanda', 'Cliente', 'Profissional', 'Pagamento', 'Valor']],
    body: report.paidOrders.length > 0
      ? report.paidOrders.map((order) => [
        formatDate(order.date),
        `#${order.number}`,
        order.clientName || 'Cliente avulso',
        order.employeeName || '-',
        order.method || 'Nao informado',
        formatCurrency(order.total),
      ])
      : [['-', '-', 'Nenhuma comanda paga no periodo', '-', '-', formatCurrency(0)]],
    columnStyles: {
      0: { cellWidth: 62 },
      1: { cellWidth: 52 },
      5: { cellWidth: 68, halign: 'right' },
    },
  })

  const pages = doc.getNumberOfPages()
  for (let page = 1; page <= pages; page += 1) {
    doc.setPage(page)
    drawPageFrame(doc, report, page)
  }
  doc.putTotalPages(totalPagesPlaceholder)
  return doc
}

export function downloadDashboardReportPdf(
  report: DashboardReport,
  download: (pdf: jsPDF, filename: string) => void = (pdf, filename) => pdf.save(filename),
) {
  const filename = dashboardReportFilename(report)
  download(buildDashboardReportPdf(report), filename)
  return filename
}
