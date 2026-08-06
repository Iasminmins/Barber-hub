import { ArrowRight, MonitorSmartphone } from 'lucide-react'
import { BENEFITS } from '@/lib/landing-content'
import { cn } from '@/lib/utils'

/**
 * Benefícios práticos.
 *
 * A composição é intencionalmente irregular — o primeiro item ocupa largura
 * dupla e o quarto é destacado em verde escuro — para fugir da grade genérica
 * de cards idênticos. Nenhuma estatística é apresentada, só consequência real.
 */
export function BenefitsSection() {
  return (
    <section className="bg-white py-[var(--lp-section-y)]">
      <div className="mx-auto max-w-7xl px-5">
        <div className="max-w-2xl">
          <p className="text-[13px] font-semibold uppercase tracking-[0.18em] text-lp-ink-600">
            O que muda na rotina
          </p>
          <h2 className="mt-3 text-balance font-bold leading-[1.15] tracking-[-0.03em] text-lp-ink-900 text-[clamp(1.75rem,3.2vw,2.5rem)]">
            Organização que aparece no dia a dia.
          </h2>
        </div>

        <div className="mt-10 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {BENEFITS.map((benefit, index) => {
            const largo = index === 0
            const escuro = index === 3
            return (
              <article
                key={benefit.title}
                className={cn(
                  'flex flex-col rounded-2xl border p-6 transition-all duration-200 hover:-translate-y-1',
                  largo && 'md:col-span-2',
                  escuro
                    ? 'border-lp-ink-800 bg-lp-ink-900 text-lp-cream'
                    : 'border-lp-cream-3 bg-lp-cream-2',
                )}
                style={{ boxShadow: escuro ? 'var(--lp-shadow-lg)' : 'var(--lp-shadow-card)' }}
              >
                <p
                  className={cn(
                    'text-[12.5px] font-medium leading-5',
                    escuro ? 'text-lp-cream/55' : 'text-lp-slate',
                  )}
                >
                  {benefit.context}
                </p>

                <h3
                  className={cn(
                    'mt-3 text-balance font-bold leading-snug tracking-[-0.02em]',
                    largo ? 'text-[clamp(1.2rem,2vw,1.5rem)]' : 'text-[17px]',
                    escuro ? 'text-lp-cream' : 'text-lp-ink-900',
                  )}
                >
                  {benefit.title}
                </h3>

                <p
                  className={cn(
                    'mt-2.5 flex-1 text-[14px] leading-6',
                    escuro ? 'text-lp-cream/72' : 'text-lp-slate',
                  )}
                >
                  {benefit.consequence}
                </p>

                <p
                  className={cn(
                    'mt-5 inline-flex w-fit items-center gap-2 rounded-lg px-2.5 py-1.5 font-mono text-[11.5px]',
                    escuro
                      ? 'bg-lp-cream/10 text-lp-cream/80'
                      : 'bg-white text-lp-ink-700 ring-1 ring-lp-cream-3',
                  )}
                >
                  <MonitorSmartphone className="size-3.5" />
                  {benefit.screen}
                  <ArrowRight className="size-3" />
                </p>
              </article>
            )
          })}
        </div>
      </div>
    </section>
  )
}
