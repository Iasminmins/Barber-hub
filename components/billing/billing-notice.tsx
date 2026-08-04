'use client'

import Link from 'next/link'
import { AlertTriangle, CalendarClock, CreditCard } from 'lucide-react'
import { buttonVariants } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { daysUntil, formatDate } from '@/lib/format'
import type { Barbershop, Member } from '@/lib/types'

export interface BillingState {
  visible: boolean
  blocked: boolean
  title: string
  description: string
  tone: 'warning' | 'danger'
}

export function getBillingState(barbershop: Barbershop): BillingState {
  const dueDate = barbershop.billingStatus === 'trialing' ? barbershop.trialEndsAt : barbershop.nextBillingDate
  const remaining = daysUntil(dueDate)
  if (!Number.isFinite(remaining)) return { visible: false, blocked: false, title: '', description: '', tone: 'warning' }

  if (remaining >= 0 && remaining <= 3) {
    const label = barbershop.billingStatus === 'trialing' ? 'Seu teste termina' : 'Sua assinatura vence'
    return { visible: true, blocked: false, tone: 'warning', title: remaining === 0 ? `${label} hoje` : `${label} em ${remaining} ${remaining === 1 ? 'dia' : 'dias'}`, description: `Regularize com antecedência para manter a operação funcionando sem interrupções. Data: ${formatDate(dueDate)}.` }
  }

  if (remaining < 0) {
    const overdue = Math.abs(remaining)
    const blocked = overdue > 7
    return { visible: true, blocked, tone: 'danger', title: blocked ? 'Acesso operacional temporariamente suspenso' : `Pagamento pendente há ${overdue} ${overdue === 1 ? 'dia' : 'dias'}`, description: blocked ? 'Seus dados permanecem seguros. Regularize a assinatura para liberar agenda, PDV, cadastros e financeiro.' : `Você ainda pode usar a plataforma durante o período de tolerância. Regularize agora para evitar o bloqueio após 7 dias de atraso. Faltam ${8 - overdue} ${8 - overdue === 1 ? 'dia' : 'dias'} para o bloqueio.` }
  }

  return { visible: false, blocked: false, title: '', description: '', tone: 'warning' }
}

export function BillingNotice({ barbershop, member, compact = false }: { barbershop: Barbershop, member: Member, compact?: boolean }) {
  const state = getBillingState(barbershop)
  if (!state.visible) return null
  const canManage = member.role === 'owner' || member.role === 'manager'
  return <div className={`border px-4 py-3 ${state.tone === 'danger' ? 'border-red-200 bg-red-50 text-red-950' : 'border-amber-200 bg-amber-50 text-amber-950'} ${compact ? 'rounded-xl' : 'border-x-0 border-t-0'}`}>
    <div className="mx-auto flex max-w-7xl flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex min-w-0 gap-3">{state.tone === 'danger' ? <AlertTriangle className="mt-0.5 size-5 shrink-0 text-red-600" /> : <CalendarClock className="mt-0.5 size-5 shrink-0 text-amber-600" />}<div><p className="text-sm font-semibold">{state.title}</p><p className="mt-0.5 text-xs opacity-80">{state.description}</p></div></div>
      {canManage ? <Link href="/configuracoes" className={cn(buttonVariants({ size: 'sm', variant: state.tone === 'danger' ? 'destructive' : 'outline' }), 'shrink-0')}><CreditCard className="size-4" />Regularizar assinatura</Link> : <p className="shrink-0 text-xs font-medium">Avise o proprietário da conta.</p>}
    </div>
  </div>
}
