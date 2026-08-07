import { Check, AlertTriangle, X } from 'lucide-react'
import { cn } from '@/lib/utils'

export type FeedbackTone = 'ok' | 'error'

type FeedbackBannerProps = {
  type: FeedbackTone
  text: string
  onDismiss?: () => void
  className?: string
}

export function FeedbackBanner({ type, text, onDismiss, className }: FeedbackBannerProps) {
  return (
    <div
      className={cn(
        'flex items-center gap-2 rounded-xl border p-3 text-sm shadow-sm',
        type === 'ok' ? 'border-emerald-300 bg-emerald-50 text-emerald-800' : 'border-destructive/40 bg-destructive/10 text-destructive',
        className,
      )}
    >
      {type === 'ok' ? <Check className="size-4 shrink-0" /> : <AlertTriangle className="size-4 shrink-0" />}
      <span className="flex-1">{text}</span>
      {onDismiss ? (
        <button type="button" onClick={onDismiss} aria-label="Fechar" className="shrink-0 opacity-70 hover:opacity-100">
          <X className="size-4" />
        </button>
      ) : null}
    </div>
  )
}
