import type { LucideIcon } from 'lucide-react'
import { Sparkles } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'

export type ExecutiveInsight = {
  label: string
  value: string
  tone?: 'default' | 'gold' | 'success' | 'warning' | 'danger'
}

const toneClass: Record<NonNullable<ExecutiveInsight['tone']>, string> = {
  default: 'text-foreground',
  gold: 'text-gold',
  success: 'text-emerald-600',
  warning: 'text-amber-600',
  danger: 'text-destructive',
}

type SectionHeaderProps = {
  title: string
  description?: string
  insights?: ExecutiveInsight[]
  icon?: LucideIcon
  className?: string
}

export function SectionHeader({ title, description, insights, icon: Icon = Sparkles, className }: SectionHeaderProps) {
  return (
    <div className={cn('overflow-hidden rounded-2xl border border-border/70 bg-card pf-card-lift', className)}>
      <div className="flex flex-wrap items-start justify-between gap-4 p-5">
        <div className="flex min-w-0 items-start gap-3">
          <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-sm">
            <Icon className="size-[18px]" />
          </div>
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-base font-semibold tracking-tight text-foreground">{title}</h2>
              <Badge className="pf-premium-badge border-transparent">Premium</Badge>
            </div>
            {description ? <p className="mt-1 text-sm text-muted-foreground">{description}</p> : null}
          </div>
        </div>
      </div>

      {insights && insights.length > 0 ? (
        <div className="grid grid-cols-2 divide-x divide-border/70 border-t border-border/70 sm:grid-cols-4">
          {insights.map((insight) => (
            <div key={insight.label} className="px-4 py-3">
              <p className="truncate text-[11px] font-medium uppercase tracking-wide text-muted-foreground">{insight.label}</p>
              <p className={cn('mt-1 truncate text-lg font-bold tabular-nums', toneClass[insight.tone ?? 'default'])}>{insight.value}</p>
            </div>
          ))}
        </div>
      ) : null}
    </div>
  )
}
