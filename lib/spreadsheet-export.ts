'use client'

export type SpreadsheetCell = string | number | boolean | null | undefined

export interface SpreadsheetColumn<Row extends Record<string, SpreadsheetCell>> {
  key: keyof Row
  label: string
  width?: number
  kind?: 'text' | 'number' | 'currency' | 'date'
}

export interface SpreadsheetSheet<Row extends Record<string, SpreadsheetCell> = Record<string, SpreadsheetCell>> {
  name: string
  title: string
  subtitle?: string
  columns: SpreadsheetColumn<Row>[]
  rows: Row[]
}

const BRAND = {
  green: 'FF234E42',
  gold: 'FFD9AD36',
  goldEdge: 'FFB28B25',
  ink: 'FF17211F',
  muted: 'FF6B7069',
  subtitleBg: 'FFF3EFE4',
  zebra: 'FFF9F7F1',
  grid: 'FFE7E3D8',
  white: 'FFFFFFFF',
}

const safeSheetName = (value: string) => value.replace(/[\\/?*[\]:]/g, ' ').slice(0, 31) || 'Dados'

function toDateValue(value: SpreadsheetCell): Date | string {
  const iso = String(value ?? '').slice(0, 10)
  const date = new Date(`${iso}T00:00:00`)
  return Number.isNaN(date.getTime()) ? String(value ?? '') : date
}

export async function downloadExcelWorkbook(fileName: string, sheets: SpreadsheetSheet[]) {
  const mod = await import('exceljs')
  const ExcelJS = (mod as unknown as { default?: typeof mod }).default ?? mod

  const workbook = new ExcelJS.Workbook()
  workbook.creator = 'BarberHub'
  workbook.created = new Date()

  const thin = { style: 'thin' as const, color: { argb: BRAND.grid } }

  for (const sheet of sheets) {
    const colCount = Math.max(sheet.columns.length, 1)
    const ws = workbook.addWorksheet(safeSheetName(sheet.name), {
      views: [{ state: 'frozen', ySplit: 4 }],
    })

    sheet.columns.forEach((column, index) => {
      ws.getColumn(index + 1).width = Math.max(10, (column.width ?? 110) / 7)
    })

    // Title (row 1)
    ws.mergeCells(1, 1, 1, colCount)
    const titleCell = ws.getCell(1, 1)
    titleCell.value = sheet.title
    titleCell.font = { name: 'Calibri', size: 16, bold: true, color: { argb: BRAND.white } }
    titleCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: BRAND.green } }
    titleCell.alignment = { vertical: 'middle', horizontal: 'left', indent: 1 }
    ws.getRow(1).height = 32

    // Subtitle (row 2)
    ws.mergeCells(2, 1, 2, colCount)
    const subtitleCell = ws.getCell(2, 1)
    subtitleCell.value =
      sheet.subtitle ?? `Gerado em ${new Intl.DateTimeFormat('pt-BR', { dateStyle: 'long' }).format(new Date())}`
    subtitleCell.font = { name: 'Calibri', size: 10, italic: true, color: { argb: BRAND.muted } }
    subtitleCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: BRAND.subtitleBg } }
    subtitleCell.alignment = { vertical: 'middle', horizontal: 'left', indent: 1 }
    ws.getRow(2).height = 20

    // Spacer (row 3)
    ws.getRow(3).height = 6

    // Header (row 4)
    const headerRow = ws.getRow(4)
    sheet.columns.forEach((column, index) => {
      const cell = headerRow.getCell(index + 1)
      const numeric = column.kind === 'number' || column.kind === 'currency'
      cell.value = column.label
      cell.font = { name: 'Calibri', size: 10, bold: true, color: { argb: BRAND.ink } }
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: BRAND.gold } }
      cell.alignment = { vertical: 'middle', horizontal: numeric ? 'right' : 'left' }
      cell.border = { bottom: { style: 'medium', color: { argb: BRAND.goldEdge } } }
    })
    headerRow.height = 22

    // Data rows (from row 5)
    if (sheet.rows.length === 0) {
      ws.mergeCells(5, 1, 5, colCount)
      const emptyCell = ws.getCell(5, 1)
      emptyCell.value = 'Nenhum registro encontrado'
      emptyCell.font = { name: 'Calibri', size: 10, italic: true, color: { argb: BRAND.muted } }
      emptyCell.alignment = { vertical: 'middle', horizontal: 'center' }
      ws.getRow(5).height = 20
    } else {
      sheet.rows.forEach((row, rowIndex) => {
        const excelRow = ws.getRow(5 + rowIndex)
        sheet.columns.forEach((column, colIndex) => {
          const cell = excelRow.getCell(colIndex + 1)
          const raw = row[column.key]
          const numeric = column.kind === 'currency' || column.kind === 'number'
          if (numeric && raw !== '' && raw !== null && raw !== undefined) {
            cell.value = Number(raw) || 0
            cell.numFmt = column.kind === 'currency' ? '"R$" #,##0.00;[Red]-"R$" #,##0.00' : '#,##0.##'
            cell.alignment = { horizontal: 'right', vertical: 'middle' }
          } else if (column.kind === 'date' && raw) {
            cell.value = toDateValue(raw)
            cell.numFmt = 'dd/mm/yyyy'
            cell.alignment = { horizontal: 'left', vertical: 'middle' }
          } else {
            cell.value = raw === null || raw === undefined ? '' : String(raw)
            cell.alignment = { horizontal: 'left', vertical: 'middle' }
          }
          cell.font = { name: 'Calibri', size: 11, color: { argb: BRAND.ink } }
          cell.border = { bottom: thin, left: thin, right: thin }
          if (rowIndex % 2 === 1) {
            cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: BRAND.zebra } }
          }
        })
        excelRow.height = 20
      })
    }

    const lastRow = Math.max(sheet.rows.length + 4, 4)
    ws.autoFilter = { from: { row: 4, column: 1 }, to: { row: lastRow, column: colCount } }
  }

  const buffer = await workbook.xlsx.writeBuffer()
  const blob = new Blob([buffer], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = `${fileName.replace(/\.(xml|xlsx?)$/i, '')}.xlsx`
  link.click()
  URL.revokeObjectURL(url)
}
