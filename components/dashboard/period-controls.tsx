'use client'

import * as React from 'react'
import { CalendarDays, FileSpreadsheet, FileText } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'

export type Period = 'hoje' | 'semana' | 'mes' | 'ano' | 'personalizado'

export interface DateRange {
  start: string
  end: string
}

const periodOptions: { value: Period; label: string }[] = [
  { value: 'hoje', label: 'Hoje' },
  { value: 'semana', label: 'Semana' },
  { value: 'mes', label: 'Mês' },
  { value: 'ano', label: 'Ano' },
  { value: 'personalizado', label: 'Personalizado' },
]

function toInputDate(date: Date) {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

function formatInputDate(value: string) {
  return new Intl.DateTimeFormat('pt-BR').format(new Date(`${value}T00:00:00`))
}

export function getDefaultRange(period: Period, anchorDate = new Date()): DateRange {
  const today = new Date(anchorDate)
  const start = new Date(today)
  const end = new Date(today)

  if (period === 'semana') {
    const day = today.getDay()
    const diffToMonday = day === 0 ? -6 : 1 - day
    start.setDate(today.getDate() + diffToMonday)
    end.setDate(start.getDate() + 6)
  }

  if (period === 'mes') {
    start.setDate(1)
    end.setMonth(today.getMonth() + 1, 0)
  }

  if (period === 'ano') {
    start.setMonth(0, 1)
    end.setMonth(11, 31)
  }

  return {
    start: toInputDate(start),
    end: toInputDate(end),
  }
}

export function DashboardPeriodControls({
  period,
  range,
  onPeriodChange,
  onRangeChange,
}: {
  period: Period
  range: DateRange
  onPeriodChange: (period: Period) => void
  onRangeChange: (range: DateRange) => void
}) {
  const [customRangeOpen, setCustomRangeOpen] = React.useState(false)
  const customRangeRef = React.useRef<HTMLDivElement>(null)

  React.useEffect(() => {
    if (!customRangeOpen) return
    const closeOnOutsideClick = (event: MouseEvent) => {
      if (customRangeRef.current && !customRangeRef.current.contains(event.target as Node)) {
        setCustomRangeOpen(false)
      }
    }
    document.addEventListener('mousedown', closeOnOutsideClick)
    return () => document.removeEventListener('mousedown', closeOnOutsideClick)
  }, [customRangeOpen])

  function selectPeriod(nextPeriod: Period) {
    onPeriodChange(nextPeriod)
    setCustomRangeOpen(nextPeriod === 'personalizado')
  }

  function changeStart(start: string) {
    if (!start) return
    onRangeChange({
      start,
      end: start > range.end ? start : range.end,
    })
  }

  function changeEnd(end: string) {
    if (!end) return
    onRangeChange({
      start: end < range.start ? end : range.start,
      end,
    })
  }

  return (
    <div className="mb-6 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
      <div className="grid grid-cols-2 gap-1 rounded-lg bg-muted p-1 sm:grid-cols-5 lg:flex-1">
        {periodOptions.map((option) => {
          const active = option.value === period
          return (
            <button
              key={option.value}
              type="button"
              onClick={() => selectPeriod(option.value)}
              className={cn(
                'h-10 min-w-0 rounded-md px-3 text-sm font-semibold transition-colors sm:flex-1',
                active
                  ? 'bg-card text-foreground shadow-sm'
                  : 'text-muted-foreground hover:bg-card/70 hover:text-foreground',
              )}
            >
              {option.label}
            </button>
          )
        })}
      </div>

      <div className="grid grid-cols-2 items-center gap-2 sm:flex sm:flex-wrap">
        <div ref={customRangeRef} className="relative col-span-2 min-w-0 sm:col-auto sm:flex-none">
          <button
            type="button"
            onClick={() => {
              if (period !== 'personalizado') onPeriodChange('personalizado')
              setCustomRangeOpen((current) => !current)
            }}
            className="flex h-10 w-full min-w-0 items-center gap-2 rounded-md border border-border bg-card px-3 text-sm text-foreground shadow-sm hover:bg-muted sm:w-auto"
            aria-expanded={customRangeOpen}
            aria-label="Selecionar período personalizado"
          >
            <CalendarDays className="size-4 shrink-0 text-muted-foreground" />
            <span className="truncate whitespace-nowrap tabular-nums">
              {formatInputDate(range.start)} - {formatInputDate(range.end)}
            </span>
          </button>

          {customRangeOpen ? (
            <div className="absolute left-0 top-full z-50 mt-2 w-[min(22rem,calc(100vw-3rem))] rounded-lg border border-border bg-popover p-4 shadow-xl sm:left-auto sm:right-0">
              <p className="mb-3 text-sm font-semibold text-foreground">Período personalizado</p>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <label className="space-y-1.5 text-xs font-medium text-muted-foreground">
                  Data inicial
                  <Input
                    type="date"
                    value={range.start}
                    max={range.end}
                    onChange={(event) => changeStart(event.target.value)}
                    aria-label="Data inicial"
                    className="h-10"
                  />
                </label>
                <label className="space-y-1.5 text-xs font-medium text-muted-foreground">
                  Data final
                  <Input
                    type="date"
                    value={range.end}
                    min={range.start}
                    onChange={(event) => changeEnd(event.target.value)}
                    aria-label="Data final"
                    className="h-10"
                  />
                </label>
              </div>
              <div className="mt-4 flex justify-end">
                <Button size="sm" onClick={() => setCustomRangeOpen(false)}>Concluir</Button>
              </div>
            </div>
          ) : null}
        </div>

        <Button variant="outline" className="h-10 w-full shrink-0 sm:w-auto">
          <FileSpreadsheet className="size-4" />
          Excel
        </Button>
        <Button variant="outline" className="h-10 w-full shrink-0 sm:w-auto">
          <FileText className="size-4" />
          PDF
        </Button>
      </div>
    </div>
  )
}
