'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { CalendarCheck2, PartyPopper, Scissors, Sparkles, Users2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { FREE_TRIAL_DAYS, getSaasPlan, type SaasPlanId } from '@/lib/saas-plans'

const nextSteps = [
  {
    icon: CalendarCheck2,
    title: 'Configure sua agenda',
    description: 'Defina horários de funcionamento e comece a receber agendamentos.',
  },
  {
    icon: Users2,
    title: 'Cadastre sua equipe',
    description: 'Adicione barbeiros e defina comissões por serviço.',
  },
  {
    icon: Sparkles,
    title: 'Monte seu catálogo',
    description: 'Cadastre serviços, pacotes e planos de assinatura.',
  },
]

export function BemVindoClient({ planId, shopName }: { planId: SaasPlanId; shopName: string }) {
  const router = useRouter()
  const plan = getSaasPlan(planId)

  return (
    <main className="flex min-h-screen items-center justify-center bg-background px-4 py-10">
      <div className="w-full max-w-xl">
        <div className="mb-6 flex justify-center">
          <span className="flex size-9 items-center justify-center rounded-lg bg-primary text-primary-foreground shadow-sm">
            <Scissors className="size-5" />
          </span>
        </div>

        <Card className="overflow-hidden p-7 text-center shadow-md sm:p-9">
          <div className="mx-auto flex size-14 items-center justify-center rounded-full bg-success/10 ring-1 ring-success/30">
            <PartyPopper className="size-7 text-success" />
          </div>

          <h1 className="mt-5 text-2xl font-bold tracking-tight text-foreground sm:text-[1.75rem]">
            {shopName ? `Bem-vindo(a), ${shopName}!` : 'Bem-vindo(a) ao BarberHub!'}
          </h1>
          <p className="mx-auto mt-2.5 max-w-md text-sm leading-6 text-muted-foreground">
            Sua conta foi criada com sucesso e você já está no plano{' '}
            <span className="font-semibold text-foreground">{plan.name}</span>, com {FREE_TRIAL_DAYS} dias
            grátis — nenhuma cobrança é feita durante esse período.
          </p>

          <div className="mt-7 space-y-3 text-left">
            {nextSteps.map((step) => (
              <div
                key={step.title}
                className="flex items-start gap-3 rounded-lg border border-border bg-muted/30 p-3.5"
              >
                <span className="flex size-8 shrink-0 items-center justify-center rounded-md bg-primary/10 text-primary">
                  <step.icon className="size-4" />
                </span>
                <div>
                  <p className="text-sm font-semibold text-foreground">{step.title}</p>
                  <p className="text-xs leading-5 text-muted-foreground">{step.description}</p>
                </div>
              </div>
            ))}
          </div>

          <Button variant="gold" size="lg" className="mt-8 w-full" onClick={() => router.replace('/dashboard')}>
            Ir para o painel
          </Button>
        </Card>

        <p className="mt-5 text-center text-xs leading-5 text-muted-foreground">
          Precisa de ajuda para começar?{' '}
          <Link
            href="/dashboard"
            className="font-medium text-foreground underline underline-offset-2 hover:text-primary"
          >
            Acesse o painel e fale com o suporte
          </Link>
          .
        </p>
      </div>
    </main>
  )
}
