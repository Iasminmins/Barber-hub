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

const escapeXml = (value: SpreadsheetCell) => String(value ?? '')
  .replace(/&/g, '&amp;')
  .replace(/</g, '&lt;')
  .replace(/>/g, '&gt;')
  .replace(/"/g, '&quot;')
  .replace(/'/g, '&apos;')

const safeSheetName = (value: string) => value.replace(/[\\/?*[\]:]/g, ' ').slice(0, 31) || 'Dados'

function dataCell(value: SpreadsheetCell, kind: SpreadsheetColumn<Record<string, SpreadsheetCell>>['kind']) {
  if ((kind === 'number' || kind === 'currency') && value !== '' && value !== null && value !== undefined) {
    return `<Cell ss:StyleID="${kind === 'currency' ? 'Currency' : 'Number'}"><Data ss:Type="Number">${Number(value) || 0}</Data></Cell>`
  }
  if (kind === 'date' && value) {
    const iso = String(value).slice(0, 10)
    return `<Cell ss:StyleID="Date"><Data ss:Type="DateTime">${escapeXml(iso)}T00:00:00.000</Data></Cell>`
  }
  return `<Cell><Data ss:Type="String">${escapeXml(value)}</Data></Cell>`
}

export function downloadExcelWorkbook(fileName: string, sheets: SpreadsheetSheet[]) {
  const worksheets = sheets.map((sheet) => {
    const columns = sheet.columns.map((column) => `<Column ss:AutoFitWidth="0" ss:Width="${column.width ?? 110}"/>`).join('')
    const columnCount = Math.max(sheet.columns.length, 1)
    const header = sheet.columns.map((column) => `<Cell ss:StyleID="Header"><Data ss:Type="String">${escapeXml(column.label)}</Data></Cell>`).join('')
    const rows = sheet.rows.length
      ? sheet.rows.map((row) => `<Row>${sheet.columns.map((column) => dataCell(row[column.key], column.kind)).join('')}</Row>`).join('')
      : `<Row><Cell ss:MergeAcross="${columnCount - 1}" ss:StyleID="Empty"><Data ss:Type="String">Nenhum registro encontrado</Data></Cell></Row>`

    return `<Worksheet ss:Name="${escapeXml(safeSheetName(sheet.name))}">
      <Table>
        ${columns}
        <Row ss:Height="30"><Cell ss:MergeAcross="${columnCount - 1}" ss:StyleID="Title"><Data ss:Type="String">${escapeXml(sheet.title)}</Data></Cell></Row>
        <Row ss:Height="22"><Cell ss:MergeAcross="${columnCount - 1}" ss:StyleID="Subtitle"><Data ss:Type="String">${escapeXml(sheet.subtitle ?? `Gerado em ${new Intl.DateTimeFormat('pt-BR', { dateStyle: 'long' }).format(new Date())}`)}</Data></Cell></Row>
        <Row ss:Height="8"><Cell><Data ss:Type="String"></Data></Cell></Row>
        <Row ss:Height="24">${header}</Row>
        ${rows}
      </Table>
      <AutoFilter x:Range="R4C1:R${Math.max(sheet.rows.length + 4, 4)}C${columnCount}" xmlns="urn:schemas-microsoft-com:office:excel"/>
      <WorksheetOptions xmlns="urn:schemas-microsoft-com:office:excel"><FreezePanes/><FrozenNoSplit/><SplitHorizontal>4</SplitHorizontal><TopRowBottomPane>4</TopRowBottomPane><ActivePane>2</ActivePane><ProtectObjects>False</ProtectObjects><ProtectScenarios>False</ProtectScenarios></WorksheetOptions>
    </Worksheet>`
  }).join('')

  const xml = `<?xml version="1.0"?><?mso-application progid="Excel.Sheet"?>
  <Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet" xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet">
    <DocumentProperties xmlns="urn:schemas-microsoft-com:office:office"><Author>BarberHub</Author><Company>BarberHub</Company><Title>Relatório BarberHub</Title></DocumentProperties>
    <Styles>
      <Style ss:ID="Default" ss:Name="Normal"><Alignment ss:Vertical="Center"/><Borders/><Font ss:FontName="Calibri" ss:Size="11" ss:Color="#17211F"/><Interior/><NumberFormat/><Protection/></Style>
      <Style ss:ID="Title"><Alignment ss:Vertical="Center"/><Font ss:FontName="Calibri" ss:Size="18" ss:Bold="1" ss:Color="#FFFFFF"/><Interior ss:Color="#234E42" ss:Pattern="Solid"/></Style>
      <Style ss:ID="Subtitle"><Alignment ss:Vertical="Center"/><Font ss:FontName="Calibri" ss:Size="10" ss:Color="#5E665F"/><Interior ss:Color="#F7F4EC" ss:Pattern="Solid"/></Style>
      <Style ss:ID="Header"><Alignment ss:Vertical="Center"/><Font ss:FontName="Calibri" ss:Size="10" ss:Bold="1" ss:Color="#17211F"/><Interior ss:Color="#D9AD36" ss:Pattern="Solid"/><Borders><Border ss:Position="Bottom" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#B28B25"/></Borders></Style>
      <Style ss:ID="Currency"><NumberFormat ss:Format="[$R$-416] #,##0.00;[Red]-[$R$-416] #,##0.00"/></Style>
      <Style ss:ID="Number"><NumberFormat ss:Format="#,##0.00"/></Style>
      <Style ss:ID="Date"><NumberFormat ss:Format="dd/mm/yyyy"/></Style>
      <Style ss:ID="Empty"><Alignment ss:Horizontal="Center"/><Font ss:Italic="1" ss:Color="#707770"/></Style>
    </Styles>
    ${worksheets}
  </Workbook>`

  const url = URL.createObjectURL(new Blob([xml], { type: 'application/vnd.ms-excel;charset=utf-8' }))
  const link = document.createElement('a')
  link.href = url
  link.download = fileName.endsWith('.xml') ? fileName : `${fileName}.xml`
  link.click()
  URL.revokeObjectURL(url)
}
