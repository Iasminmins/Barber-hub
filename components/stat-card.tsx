import * as React from 'react'
import type { LucideIcon } from 'lucide-react'
import { ArrowDownRight, ArrowUpRight } from 'lucide-react'
import { Card } from '@/components/ui/card'
import { cn } from '@/lib/utils'

interface StatCardProps {
  label: string
  value: string
  icon: LucideIcon
  hint?: string
  trend?: { value: string; positive: boolean }
  accent?: 'primary' | 'gold' | 'success' | 'warning' | 'destructive'
}

const accentMap: Record<NonNullable<StatCardProps['accent']>, string> = {
  primary: 'bg-primary/10 text-primary',
  gold: 'bg-gold/15 text-gold-foreground',
  success: 'bg-success/12 text-success',
  warning: 'bg-warning/18 text-warning-foreground',
  destructive: 'bg-destructive/12 text-destructive',
}

export function StatCard({ label, value, icon: Icon, hint, trend, accent = 'primary' }: StatCardProps) {
  return (
    <Card className="p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="truncate text-sm font-medium text-muted-foreground">{label}</p>
          <p className="mt-1.5 text-2xl font-bold tracking-tight text-foreground">{value}</p>
        </div>
        <span className={cn('flex size-10 shrink-0 items-center justify-center rounded-lg', accentMap[accent])}>
          <Icon className="size-5" />
        </span>
      </div>
      {(hint || trend) && (
        <div className="mt-3 flex items-center gap-2 text-xs">
          {trend && (
            <span
              className={cn(
                'inline-flex items-center gap-0.5 rounded-full px-1.5 py-0.5 font-medium',
                trend.positive ? 'bg-success/12 text-success' : 'bg-destructive/12 text-destructive',
              )}
            >
              {trend.positive ? <ArrowUpRight className="size-3" /> : <ArrowDownRight className="size-3" />}
              {trend.value}
            </span>
          )}
          {hint && <span className="text-muted-foreground">{hint}</span>}
        </div>
      )}
    </Card>
  )
}
