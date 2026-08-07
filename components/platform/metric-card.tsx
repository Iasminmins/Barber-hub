'use client'

import type { LucideIcon } from 'lucide-react'
import { TrendingDown, TrendingUp, Minus } from 'lucide-react'
import { Card } from '@/components/ui/card'
import { cn } from '@/lib/utils'

type MetricCardProps = {
  label: string
  value: string | number
  hint?: string
  icon: LucideIcon
  delta?: number | null
  deltaLabel?: string
  loading?: boolean
  accent?: 'default' | 'gold' | 'success' | 'warning' | 'danger'
}

const accentStyles = {
  default: 'text-muted-foreground',
  gold: 'text-gold',
  success: 'text-emerald-600',
  warning: 'text-amber-600',
  danger: 'text-destructive',
}

export function MetricCard({
  label,
  value,
  hint,
  icon: Icon,
  delta,
  deltaLabel,
  loading,
  accent = 'default',
}: MetricCardProps) {
  const trend = delta === null || delta === undefined ? null : delta > 0 ? 'up' : delta < 0 ? 'down' : 'flat'

  return (
    <Card className="pf-card-lift group relative overflow-hidden rounded-2xl border-border/70 bg-card p-5">
      <div
        className={cn(
          'absolute inset-x-0 top-0 h-0.5 opacity-0 transition-opacity group-hover:opacity-100',
          accent === 'gold' && 'bg-gold',
          accent === 'success' && 'bg-emerald-500',
          accent === 'warning' && 'bg-amber-500',
          accent === 'danger' && 'bg-destructive',
          accent === 'default' && 'bg-primary',
        )}
      />
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <p className="text-sm font-medium text-muted-foreground">{label}</p>
          {loading ? (
            <div className="pf-skeleton mt-3 h-8 w-24 rounded-lg" />
          ) : (
            <p className="mt-2 text-2xl font-bold tabular-nums tracking-tight text-foreground">{value}</p>
          )}
          {hint ? <p className="mt-1.5 text-xs text-muted-foreground">{hint}</p> : null}
        </div>
        <div className={cn('flex size-10 items-center justify-center rounded-xl bg-muted/60', accentStyles[accent])}>
          <Icon className="size-[18px]" />
        </div>
      </div>

      {trend !== null ? (
        <div className="mt-4 flex items-center gap-1.5 text-xs">
          {trend === 'up' ? (
            <TrendingUp className="size-3.5 text-emerald-600" />
          ) : trend === 'down' ? (
            <TrendingDown className="size-3.5 text-destructive" />
          ) : (
            <Minus className="size-3.5 text-muted-foreground" />
          )}
          <span
            className={cn(
              'font-medium',
              trend === 'up' && 'text-emerald-600',
              trend === 'down' && 'text-destructive',
              trend === 'flat' && 'text-muted-foreground',
            )}
          >
            {delta !== null && delta !== undefined ? `${delta > 0 ? '+' : ''}${delta}%` : '—'}
          </span>
          {deltaLabel ? <span className="text-muted-foreground">{deltaLabel}</span> : null}
        </div>
      ) : null}
    </Card>
  )
}
