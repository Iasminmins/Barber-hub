import Link from 'next/link'
import { ArrowRight, Check, Sparkles } from 'lucide-react'
import { TRIAL_BADGE, TRIAL_LABEL } from '@/lib/landing-content'
import { saasPlans as plans } from '@/lib/saas-plans'
import { cn } from '@/lib/utils'

/**
 * Planos.
 *
 * Preços, limites e recursos vêm de `lib/saas-plans.ts` — a mesma fonte usada
 * pelo billing. Nenhum valor é redefinido aqui, só a apresentação.
 */
export function PricingSection() {
  return (
    <section id="planos" className="bg-lp-cream py-[var(--lp-section-y)]">
      <div className="mx-auto max-w-7xl px-5">
        <div className="mx-auto max-w-2xl text-center">
          <p className="text-[13px] font-semibold uppercase tracking-[0.18em] text-lp-ink-600">
            Planos
          </p>
          <h2 className="mt-3 text-balance font-bold leading-[1.15] tracking-[-0.03em] text-lp-ink-900 text-[clamp(1.75rem,3.2vw,2.5rem)]">
            Mesmo sistema. O que muda é o tamanho da operação.
          </h2>
          <p className="mt-4 text-[15.5px] leading-7 text-lp-slate">
            Todos os planos incluem agenda, clientes, comandas, planos recorrentes e comissões. Os
            upgrades entram quando você precisa de mais usuários, relatórios ou unidades.
          </p>
          <p className="mt-5 inline-flex items-center gap-2 rounded-full bg-lp-ink-900 px-4 py-2 text-[13.5px] font-semibold text-lp-cream">
            <Sparkles className="size-3.5 text-lp-gold-400" />
            {TRIAL_BADGE}
          </p>
        </div>

        <div className="mt-12 grid items-start gap-5 lg:grid-cols-3">
          {plans.map((plan) => {
            const destaque = Boolean(plan.featured)
            return (
              <div
                key={plan.id}
                className={cn(
                  'relative flex h-full flex-col rounded-2xl border p-6 transition-all duration-200 lg:p-7',
                  destaque
                    ? 'border-lp-gold-500/60 bg-lp-ink-900 text-lp-cream ring-1 ring-lp-gold-500/40 lg:-translate-y-3'
                    : 'border-lp-cream-3 bg-white hover:-translate-y-1',
                )}
                style={{ boxShadow: destaque ? 'var(--lp-shadow-lg)' : 'var(--lp-shadow-card)' }}
              >
                {destaque ? (
                  <span className="absolute -top-3 left-6 rounded-full bg-lp-gold-500 px-3 py-1 text-[11.5px] font-bold uppercase tracking-wider text-lp-gold-ink">
                    Mais escolhido
                  </span>
                ) : null}

                <h3 className={cn('text-[19px] font-bold', destaque ? 'text-lp-cream' : 'text-lp-ink-900')}>
                  {plan.name}
                </h3>
                <p
                  className={cn(
                    'mt-2 min-h-[3.25rem] text-[13.5px] leading-6',
                    destaque ? 'text-lp-cream/70' : 'text-lp-slate',
                  )}
                >
                  {plan.shortDescription}
                </p>

                <p className="mt-5 flex items-baseline gap-1">
                  <span
                    className={cn(
                      'text-[2.4rem] font-bold leading-none tracking-tight',
                      destaque ? 'text-lp-cream' : 'text-lp-ink-900',
                    )}
                  >
                    {plan.price}
                  </span>
                  <span className={cn('text-[14px]', destaque ? 'text-lp-cream/60' : 'text-lp-slate')}>
                    /mês
                  </span>
                </p>
                <p className={cn('mt-2 text-[12.5px]', destaque ? 'text-lp-cream/60' : 'text-lp-slate')}>
                  {TRIAL_LABEL} • cobrança só depois do teste
                </p>

                {/* Diferenças-chave, alinhadas entre os planos */}
                <dl
                  className={cn(
                    'mt-6 grid gap-2.5 border-t pt-5 text-[13.5px]',
                    destaque ? 'border-lp-cream/12' : 'border-lp-cream-3',
                  )}
                >
                  {[
                    ['Usuários', plan.users],
                    ['Unidades', plan.units],
                    ['Relatórios', plan.reports],
                    ['Suporte', plan.support],
                  ].map(([rotulo, valor]) => (
                    <div key={rotulo} className="flex items-start justify-between gap-3">
                      <dt className={destaque ? 'text-lp-cream/60' : 'text-lp-slate'}>{rotulo}</dt>
                      <dd
                        className={cn(
                          'text-right font-semibold',
                          destaque ? 'text-lp-cream' : 'text-lp-ink-900',
                        )}
                      >
                        {valor}
                      </dd>
                    </div>
                  ))}
                </dl>

                <ul
                  className={cn(
                    'mt-5 flex-1 space-y-2.5 border-t pt-5 text-[13.5px]',
                    destaque ? 'border-lp-cream/12' : 'border-lp-cream-3',
                  )}
                >
                  {plan.items.map((item) => (
                    <li key={item} className="flex items-start gap-2">
                      <Check
                        className={cn(
                          'mt-0.5 size-4 shrink-0',
                          destaque ? 'text-lp-gold-400' : 'text-lp-green-500',
                        )}
                      />
                      <span className={destaque ? 'text-lp-cream/85' : 'text-lp-ink-900'}>
                        {item}
                      </span>
                    </li>
                  ))}
                </ul>

                <Link
                  href={`/cadastro?plano=${plan.id}`}
                  className={cn(
                    'group mt-7 inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-xl px-5 text-[14.5px] font-bold transition-all duration-200 hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 active:translate-y-0',
                    destaque
                      ? 'bg-lp-gold-500 text-lp-gold-ink shadow-[var(--lp-shadow-gold)] hover:bg-lp-gold-400 focus-visible:ring-lp-gold-300 focus-visible:ring-offset-lp-ink-900'
                      : 'bg-lp-ink-900 text-lp-cream hover:bg-lp-ink-800 focus-visible:ring-lp-ink-700',
                  )}
                >
                  Começar teste grátis
                  <ArrowRight className="size-4 transition-transform duration-200 group-hover:translate-x-1" />
                </Link>
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}
