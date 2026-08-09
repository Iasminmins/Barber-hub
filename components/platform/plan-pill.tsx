import { cn } from '@/lib/utils'

const planStyles: Record<string, string> = {
  starter: 'border-border/60 bg-muted/50 text-muted-foreground',
  pro: 'border-primary/25 bg-primary/[0.06] text-primary',
  premium: 'border-gold/40 bg-gold/[0.12] text-gold-foreground dark:text-gold',
}

const planLabels: Record<string, string> = {
  starter: 'Starter',
  pro: 'Pro',
  premium: 'Premium',
}

/** Pill do plano contratado — cinza (Starter), verde (Pro), dourado (Premium). */
export function PlanPill({ plan, className }: { plan: string; className?: string }) {
  return (
    <span
      className={cn(
        'inline-flex items-center whitespace-nowrap rounded-full border px-2 py-0.5 text-[11px] font-normal',
        planStyles[plan] ?? planStyles.starter,
        className,
      )}
    >
      {planLabels[plan] ?? plan}
    </span>
  )
}
