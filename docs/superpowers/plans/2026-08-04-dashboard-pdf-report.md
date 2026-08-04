# Dashboard PDF Report Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the inert Excel/PDF controls with one working PDF download that reports the dashboard data for the exact selected date range.

**Architecture:** The dashboard will assemble a typed, presentation-neutral report model from the metrics it already computes. A focused `dashboard-report-pdf` module will format that model with jsPDF/AutoTable and download it; the period control will only expose the PDF action and loading state.

**Tech Stack:** Next.js 16, React 19, TypeScript 5.7, jsPDF 4.2.1, jspdf-autotable 5.0.8, Vitest 4.1.

## Global Constraints

- Remove Excel export from the dashboard.
- The report must use the exact active range for Hoje, Semana, Mes, Ano, or Personalizado.
- Generate in the browser, show `Gerando...`, and preserve dashboard usability on failure.
- Format currency and dates for `pt-BR` and paginate long tables safely.
- Do not change dashboard metric calculation rules or persist reports in Supabase.

---

## File Structure

- Create `lib/dashboard-report-pdf.ts`: report types, safe filename, PDF builder, page decoration, and download function.
- Create `lib/dashboard-report-pdf.test.ts`: filename, content, empty state, and multipage regression tests.
- Create `components/dashboard/period-controls.test.tsx`: server-rendered behavior test for the single PDF action and loading state.
- Modify `components/dashboard/period-controls.tsx`: remove Excel and accept `onExportPdf`/`isExportingPdf`.
- Modify `app/(app)/dashboard/dashboard-client.tsx`: build the report model, lazy-load the generator, handle loading/error, and pass the PDF action.
- Modify `app/(app)/dashboard/page.tsx`: pass the active barbershop name into `DashboardClient`.
- Create `scripts/generate-dashboard-report-sample.ts`: deterministic sample used only for visual PDF verification.

### Task 1: Typed PDF generator

**Files:**
- Create: `lib/dashboard-report-pdf.test.ts`
- Create: `lib/dashboard-report-pdf.ts`

**Interfaces:**
- Produces: `DashboardReport`, `dashboardReportFilename(report): string`, `buildDashboardReportPdf(report): jsPDF`, and `downloadDashboardReportPdf(report, download?): string`.
- `DashboardReport` includes `barbershopName`, `range`, `generatedAt`, `financial`, `operational`, `revenueByMethod`, `ranking`, and `paidOrders`.

- [ ] **Step 1: Write failing filename and content tests**

```ts
import { describe, expect, it } from 'vitest'
import {
  buildDashboardReportPdf,
  dashboardReportFilename,
  type DashboardReport,
} from './dashboard-report-pdf'

const report: DashboardReport = {
  barbershopName: 'Barbearia Sao Jose',
  range: { start: '2026-08-01', end: '2026-08-31' },
  generatedAt: '2026-08-04T12:00:00-03:00',
  financial: { revenue: 1850, pdvRevenue: 1500, subscriptionRevenue: 300, otherRevenue: 50, averageTicket: 150, pendingCommissions: 175 },
  operational: { paidOrders: 10, openOrders: 2, pendingOrders: 1, newClients: 4, activeSubscriptions: 7, atRiskClients: 2, lowStockItems: 3 },
  revenueByMethod: [{ method: 'Pix', value: 1200 }, { method: 'Dinheiro', value: 650 }],
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
})
```

- [ ] **Step 2: Run the test and verify RED**

Run: `pnpm vitest run lib/dashboard-report-pdf.test.ts`

Expected: FAIL because `./dashboard-report-pdf` does not exist.

- [ ] **Step 3: Implement the minimal generator**

Create the exported report types and use `new jsPDF({ unit: 'pt', format: 'a4' })` plus `autoTable`. Draw a branded header, paired financial/operational summary tables, payment-method and ranking tables, paid-order detail, and `Pagina X de Y` footer. Use explicit `pt-BR` formatters and `__TOTAL_PAGES__` with `putTotalPages`.

```ts
export function dashboardReportFilename(report: DashboardReport) {
  return `relatorio-${filenamePart(report.barbershopName)}-${report.range.start}-a-${report.range.end}.pdf`
}

export function downloadDashboardReportPdf(
  report: DashboardReport,
  download: (pdf: jsPDF, filename: string) => void = (pdf, filename) => pdf.save(filename),
) {
  const filename = dashboardReportFilename(report)
  download(buildDashboardReportPdf(report), filename)
  return filename
}
```

- [ ] **Step 4: Add empty-state and pagination regression tests**

Add one test with empty arrays and assert `Nenhuma comanda paga no periodo`, then one with 100 paid orders and assert more than one page, a header on every page, and final resolved page totals.

- [ ] **Step 5: Run generator tests and verify GREEN**

Run: `pnpm vitest run lib/dashboard-report-pdf.test.ts`

Expected: all tests PASS.

- [ ] **Step 6: Commit**

```powershell
git add -- lib/dashboard-report-pdf.ts lib/dashboard-report-pdf.test.ts
git commit -m "feat: gera relatorio pdf do dashboard"
```

### Task 2: Dashboard export interaction

**Files:**
- Create: `components/dashboard/period-controls.test.tsx`
- Modify: `components/dashboard/period-controls.tsx`
- Modify: `app/(app)/dashboard/dashboard-client.tsx`
- Modify: `app/(app)/dashboard/page.tsx`

**Interfaces:**
- Consumes: `DashboardReport` and `downloadDashboardReportPdf(report)` from Task 1.
- Produces: `DashboardPeriodControls` props `onExportPdf: () => void` and `isExportingPdf: boolean`; `DashboardClient` prop `barbershopName: string`.

- [ ] **Step 1: Write the failing period-control rendering test**

```tsx
import React from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import { DashboardPeriodControls } from './period-controls'

describe('DashboardPeriodControls export action', () => {
  it('shows only PDF and exposes the loading state', () => {
    const html = renderToStaticMarkup(
      <DashboardPeriodControls
        period="mes"
        range={{ start: '2026-08-01', end: '2026-08-31' }}
        onPeriodChange={() => undefined}
        onRangeChange={() => undefined}
        onExportPdf={() => undefined}
        isExportingPdf
      />,
    )
    expect(html).toContain('Gerando...')
    expect(html).not.toContain('Excel')
    expect(html).toContain('disabled')
  })
})
```

- [ ] **Step 2: Run the test and verify RED**

Run: `pnpm vitest run components/dashboard/period-controls.test.tsx`

Expected: FAIL because the new props and loading label do not exist.

- [ ] **Step 3: Implement the period-control contract**

Remove `FileSpreadsheet` and the Excel button. Add the two required props, bind `onClick={onExportPdf}`, disable during generation, add `aria-busy`, and render `Gerando...` while busy.

- [ ] **Step 4: Build and export the current dashboard model**

Add `barbershopName` to `DashboardClient`. Derive `DashboardReport` from the already filtered `paidOrders`, calculated metrics, `revenueByMethod`, and `ranking`. Map payment method labels with `METHOD_LABEL`. Add an async handler:

```ts
async function handleExportPdf() {
  if (isExportingPdf) return
  setIsExportingPdf(true)
  setExportError('')
  try {
    const { downloadDashboardReportPdf } = await import('@/lib/dashboard-report-pdf')
    downloadDashboardReportPdf(report)
  } catch {
    setExportError('Nao foi possivel gerar o PDF. Tente novamente.')
  } finally {
    setIsExportingPdf(false)
  }
}
```

Render `exportError` below the controls with `role="alert"`. In `app/(app)/dashboard/page.tsx`, pass `barbershopName={barbershop.name}` from the existing app data.

- [ ] **Step 5: Run focused tests and typecheck**

Run: `pnpm vitest run components/dashboard/period-controls.test.tsx lib/dashboard-report-pdf.test.ts`

Expected: all tests PASS.

Run: `pnpm typecheck`

Expected: exit 0.

- [ ] **Step 6: Commit**

```powershell
git add -- 'components/dashboard/period-controls.tsx' 'components/dashboard/period-controls.test.tsx' 'app/(app)/dashboard/dashboard-client.tsx' 'app/(app)/dashboard/page.tsx'
git commit -m "feat: exporta dashboard em pdf por periodo"
```

### Task 3: Visual PDF verification and final checks

**Files:**
- Create: `scripts/generate-dashboard-report-sample.ts`
- Create temporarily: `tmp/pdfs/dashboard-report-sample.pdf`
- Create temporarily: `tmp/pdfs/dashboard-report-sample-*.png`

**Interfaces:**
- Consumes: `buildDashboardReportPdf(report)` from Task 1.
- Produces: repeatable visual QA evidence; no production API.

- [ ] **Step 1: Create the deterministic sample script**

Use a long barbershop name, accented client/employee names, every financial and operational metric, five payment methods, ten professionals, and 100 paid orders. Write `pdf.output('arraybuffer')` to `tmp/pdfs/dashboard-report-sample.pdf`.

- [ ] **Step 2: Generate and structurally inspect the sample**

Run: `pnpm tsx scripts/generate-dashboard-report-sample.ts`

Run: `pdfinfo tmp/pdfs/dashboard-report-sample.pdf`

Expected: valid A4 PDF with at least two pages.

- [ ] **Step 3: Render every page and inspect visually**

Run: `pdftoppm -png tmp/pdfs/dashboard-report-sample.pdf tmp/pdfs/dashboard-report-sample`

Inspect all PNG pages for clipped content, overlaps, unreadable glyphs, broken table continuation, inconsistent margins, and missing headers/footers. Correct the generator and repeat the focused tests and rendering until there are no visual defects.

- [ ] **Step 4: Run complete verification**

Run: `pnpm lint`

Run: `pnpm typecheck`

Run: `pnpm test`

Run: `pnpm build`

Expected: every command exits 0. If a pre-existing failure occurs, record the exact command and error separately from the feature results.

- [ ] **Step 5: Commit QA support**

```powershell
git add -- scripts/generate-dashboard-report-sample.ts
git commit -m "test: valida layout do relatorio do dashboard"
```

Do not commit files under `tmp/pdfs/`.
