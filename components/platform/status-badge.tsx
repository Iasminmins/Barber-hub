import { cn } from '@/lib/utils'

export type StatusTone = 'success' | 'warning' | 'danger' | 'gold' | 'neutral'

const toneStyles: Record<StatusTone, { wrapper: string; dot: string }> = {
  success: { wrapper: 'border-primary/25 bg-primary/[0.06] text-primary', dot: 'bg-primary' },
  warning: { wrapper: 'border-amber-500/30 bg-amber-500/[0.08] text-amber-700 dark:text-amber-400', dot: 'bg-amber-500' },
  danger: { wrapper: 'border-destructive/30 bg-destructive/[0.07] text-destructive', dot: 'bg-destructive' },
  gold: { wrapper: 'border-gold/35 bg-gold/[0.1] text-gold-foreground dark:text-gold', dot: 'bg-gold' },
  neutral: { wrapper: 'border-border/60 bg-muted/40 text-muted-foreground', dot: 'bg-muted-foreground/60' },
}

type StatusBadgeProps = {
  tone: StatusTone
  label: string
  className?: string
}

/** Badge de status com ponto colorido — padrão visual do painel da plataforma. */
export function StatusBadge({ tone, label, className }: StatusBadgeProps) {
  const style = toneStyles[tone]
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 whitespace-nowrap rounded-full border px-2 py-0.5 text-[11px] font-normal',
        style.wrapper,
        className,
      )}
    >
      <span className={cn('size-1.5 shrink-0 rounded-full', style.dot)} aria-hidden="true" />
      {label}
    </span>
  )
}

export const billingTone: Record<string, StatusTone> = {
  active: 'success',
  trialing: 'warning',
  past_due: 'danger',
  canceled: 'neutral',
}

export const billingLabel: Record<string, string> = {
  active: 'Ativo',
  trialing: 'Em teste',
  past_due: 'Em atraso',
  canceled: 'Cancelado',
}
