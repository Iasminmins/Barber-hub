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
    expect(html).toContain('aria-busy="true"')
  })
})
