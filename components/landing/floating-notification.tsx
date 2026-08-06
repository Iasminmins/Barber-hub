import { BellRing, CheckCircle2, Repeat } from 'lucide-react'
import { cn } from '@/lib/utils'

const TONES = {
  neutral: { icon: BellRing, ring: 'text-lp-ink-700', bg: 'bg-lp-ink-700/10' },
  success: { icon: CheckCircle2, ring: 'text-lp-green-500', bg: 'bg-lp-green-500/12' },
  gold: { icon: Repeat, ring: 'text-lp-gold-600', bg: 'bg-lp-gold-500/16' },
} as const

export type FloatingTone = keyof typeof TONES

/**
 * Card de notificação que flutua ao lado dos dispositivos no hero.
 * A entrada é sequenciada por `delay` e o movimento ambiental é quase
 * imperceptível — nunca uma pulsação contínua.
 */
export function FloatingNotification({
  title,
  detail,
  tone = 'neutral',
  delay = 0,
  size = 'md',
  ambient = 'lp-ambient',
  className,
  animate = true,
}: {
  title: string
  detail: string
  tone?: FloatingTone
  delay?: number
  size?: 'sm' | 'md'
  ambient?: 'lp-ambient' | 'lp-ambient-soft'
  className?: string
  animate?: boolean
}) {
  const { icon: Icon, ring, bg } = TONES[tone]

  return (
    <div className={cn('absolute', animate && ambient, className)}>
      <div
        aria-hidden="true"
        className={cn(
          'flex items-center gap-2.5 rounded-xl border border-white/70 bg-white/95 backdrop-blur-sm',
          size === 'sm' ? 'px-3 py-2' : 'px-3.5 py-2.5',
          animate && 'lp-anim lp-card-in',
        )}
        style={{
          boxShadow: 'var(--lp-shadow-lg)',
          animationDelay: animate ? `${delay}ms` : undefined,
        }}
      >
        <span className={cn('flex shrink-0 items-center justify-center rounded-lg', bg, size === 'sm' ? 'size-7' : 'size-8')}>
          <Icon className={cn(size === 'sm' ? 'size-3.5' : 'size-4', ring)} />
        </span>
        <span className="leading-tight">
          <span className={cn('block font-semibold text-lp-ink-900', size === 'sm' ? 'text-[11px]' : 'text-xs')}>
            {title}
          </span>
          <span className={cn('block text-lp-slate', size === 'sm' ? 'text-[10px]' : 'text-[11px]')}>
            {detail}
          </span>
        </span>
      </div>
    </div>
  )
}
