import { jsPDF } from 'jspdf'
import autoTable from 'jspdf-autotable'
import type { EmployeeMonthlyStatement } from './employee-monthly-statement'

const currencyFormatter = new Intl.NumberFormat('pt-BR', {
  style: 'currency',
  currency: 'BRL',
})

const totalPagesPlaceholder = '__TOTAL_PAGES__'

function formatCurrency(value: number) {
  return currencyFormatter.format(value).replace(/\u00a0/g, ' ')
}

function filenamePart(value: string) {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
}

function drawHeader(doc: jsPDF, statement: EmployeeMonthlyStatement) {
  doc.setTextColor(20, 83, 45)
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(16)
  doc.text('FECHAMENTO MENSAL', 40, 42)
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(10)
  doc.setTextColor(55, 65, 81)
  doc.text(statement.barbershop.name, 40, 60)
  doc.text(`Funcionário: ${statement.employee.name}`, 40, 76)
  doc.text(`Competência: ${statement.competence}`, 40, 92)
  doc.setDrawColor(209, 213, 219)
  doc.line(40, 104, 555, 104)
}

function drawFooter(doc: jsPDF) {
  const pageNumber = doc.getCurrentPageInfo().pageNumber
  const pageWidth = doc.internal.pageSize.getWidth()
  const pageHeight = doc.internal.pageSize.getHeight()
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(8)
  doc.setTextColor(107, 114, 128)
  doc.text(`Página ${pageNumber} de ${totalPagesPlaceholder}`, pageWidth - 40, pageHeight - 24, { align: 'right' })
}

export function employeeMonthlyPdfFilename(statement: EmployeeMonthlyStatement) {
  return `fechamento-${filenamePart(statement.employee.name)}-${statement.competence}.pdf`
}

export function buildEmployeeMonthlyPdf(statement: EmployeeMonthlyStatement): jsPDF {
  const doc = new jsPDF({ unit: 'pt', format: 'a4' })

  autoTable(doc, {
    startY: 120,
    margin: { left: 40, right: 40 },
    theme: 'grid',
    head: [['Resumo', 'Valor']],
    body: [
      ['Serviços vendidos', String(statement.services)],
      ['Faturamento', formatCurrency(statement.revenue)],
      ['Faturamento de assinaturas', formatCurrency(statement.subscriptionRevenue)],
      ['Comissões das comandas', formatCurrency(statement.orderCommission)],
      ['Comissões de assinatura', formatCurrency(statement.subscriptionCommission)],
      ['TOTAL DE COMISSÕES', formatCurrency(statement.totalCommission)],
    ],
    styles: { font: 'helvetica', fontSize: 9, cellPadding: 7 },
    headStyles: { fillColor: [20, 83, 45], textColor: 255 },
    columnStyles: { 1: { halign: 'right' } },
  })

  autoTable(doc, {
    startY: 300,
    margin: { top: 118, right: 40, bottom: 48, left: 40 },
    theme: 'grid',
    head: [['Comanda', 'Itens', 'Recebido', 'Comissão']],
    body: statement.orders.length > 0
      ? statement.orders.map((order) => [
        `#${order.number}`,
        [
          ...order.items.map((item) => `${item.quantity}x ${item.name}`),
          ...(order.received === 0 ? ['Comanda zerada: comissão anulada por valor final zero.'] : []),
        ].join('\n'),
        formatCurrency(order.received),
        formatCurrency(order.commission),
      ])
      : [['Nenhuma comanda paga no período', '', formatCurrency(0), formatCurrency(0)]],
    styles: { font: 'helvetica', fontSize: 8, cellPadding: 6, valign: 'middle' },
    headStyles: { fillColor: [20, 83, 45], textColor: 255 },
    columnStyles: {
      0: { cellWidth: 60 },
      1: { cellWidth: 250 },
      2: { halign: 'right' },
      3: { halign: 'right' },
    },
    willDrawPage: () => drawHeader(doc, statement),
    didDrawPage: () => drawFooter(doc),
  })

  doc.putTotalPages(totalPagesPlaceholder)
  return doc
}
