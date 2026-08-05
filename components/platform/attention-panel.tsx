'use client'

import Link from 'next/link'
import { AlertTriangle, Clock, CreditCard, MessageSquare, UserX, Timer } from 'lucide-react'
import { Card } from '@/components/ui/card'
import { buttonVariants } from '@/components/ui/button'
import type { AttentionItem } from '@/app/plataforma/types'
import { cn } from '@/lib/utils'

const typeIcons = {
  trial_expiring: Timer,
  past_due: CreditCard,
  inactive: UserX,
  payment_due: Clock,
  subscription_expiring: AlertTriangle,
  unread_message: MessageSquare,
}

const severityStyles = {
  high: 'border-l-destructive bg-destructive/5',
  medium: 'border-l-gold bg-gold/5',
  low: 'border-l-border bg-muted/30',
}

type AttentionPanelProps = {
  items: AttentionItem[]
  loading?: boolean
}

export function AttentionPanel({ items, loading }: AttentionPanelProps) {
  return (
    <Card className="rounded-2xl border-border/70 shadow-sm">
      <div className="border-b border-border/70 px-5 py-4">
        <h2 className="flex items-center gap-2 font-semibold">
          <AlertTriangle className="size-4 text-gold" />
          Requer atenção
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Testes vencendo, cobranças, inatividade e mensagens pendentes
        </p>
      </div>

      <div className="max-h-[420px] overflow-y-auto divide-y divide-border/60">
        {loading ? (
          Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-16 animate-pulse bg-muted/30" />
          ))
        ) : items.length === 0 ? (
          <div className="px-5 py-10 text-center text-sm text-muted-foreground">
            Nenhum item urgente no momento. Tudo em ordem.
          </div>
        ) : (
          items.map((item) => {
            const Icon = typeIcons[item.type as keyof typeof typeIcons] ?? AlertTriangle
            return (
              <div
                key={item.id}
                className={cn('flex items-center gap-4 border-l-4 px-5 py-4', severityStyles[item.severity])}
              >
                <div className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-card shadow-sm">
                  <Icon className="size-4 text-muted-foreground" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate font-medium text-foreground">{item.title}</p>
                  <p className="text-sm text-muted-foreground">{item.description}</p>
                </div>
                <Link href={item.action.href} className={buttonVariants({ variant: 'outline', size: 'sm', className: 'shrink-0 rounded-xl' })}>
                  {item.action.label}
                </Link>
              </div>
            )
          })
        )}
      </div>
    </Card>
  )
}
