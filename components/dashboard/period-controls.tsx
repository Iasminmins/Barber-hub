'use client'

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
  return (
    <div className="mb-6 flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
      <div className="inline-grid grid-cols-2 gap-1 rounded-lg bg-muted p-1 sm:grid-cols-5">
        {periodOptions.map((option) => {
          const active = option.value === period
          return (
            <button
              key={option.value}
              type="button"
              onClick={() => onPeriodChange(option.value)}
              className={cn(
                'h-10 rounded-md px-4 text-sm font-semibold transition-colors',
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

      <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
        <div className="flex min-h-10 items-center gap-2 rounded-md border border-border bg-card px-3 text-sm text-foreground shadow-sm">
          <CalendarDays className="size-4 text-muted-foreground" />
          <span className="tabular-nums">
            {formatInputDate(range.start)} - {formatInputDate(range.end)}
          </span>
        </div>

        {period === 'personalizado' && (
          <div className="grid grid-cols-2 gap-2">
            <Input
              type="date"
              value={range.start}
              onChange={(event) => onRangeChange({ ...range, start: event.target.value })}
              aria-label="Data inicial"
              className="h-10"
            />
            <Input
              type="date"
              value={range.end}
              onChange={(event) => onRangeChange({ ...range, end: event.target.value })}
              aria-label="Data final"
              className="h-10"
            />
          </div>
        )}

        <Button variant="outline" className="h-10">
          <FileSpreadsheet className="size-4" />
          Excel
        </Button>
        <Button variant="outline" className="h-10">
          <FileText className="size-4" />
          PDF
        </Button>
      </div>
    </div>
  )
}
