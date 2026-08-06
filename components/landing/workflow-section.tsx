import { WORKFLOW_STEPS } from '@/lib/landing-content'

/**
 * Fluxo completo da operação: do agendamento aos indicadores.
 *
 * Horizontal no desktop com uma linha ligando as etapas; vertical no mobile.
 * A entrada é escalonada por `animation-delay` em CSS puro.
 */
export function WorkflowSection() {
  return (
    <section
      id="como-funciona"
      className="lp-noise relative isolate overflow-hidden bg-lp-ink-900 py-[var(--lp-section-y)] text-lp-cream"
    >
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 -z-10"
        style={{
          background:
            'radial-gradient(70% 60% at 50% 0%, oklch(0.44 0.048 168 / 0.5) 0%, transparent 70%)',
        }}
      />

      <div className="mx-auto max-w-7xl px-5">
        <div className="max-w-2xl">
          <p className="text-[13px] font-semibold uppercase tracking-[0.18em] text-lp-gold-400">
            Como funciona
          </p>
          <h2 className="mt-3 text-balance font-bold leading-[1.15] tracking-[-0.03em] text-[clamp(1.75rem,3.2vw,2.5rem)]">
            Da agenda ao fechamento do caixa, tudo conectado.
          </h2>
          <p className="mt-4 text-[15.5px] leading-7 text-lp-cream/70">
            Cada etapa alimenta a próxima. Ninguém precisa redigitar informação em outro lugar.
          </p>
        </div>

        <ol className="relative mt-12 grid gap-8 md:grid-cols-3 md:gap-x-6 md:gap-y-12 lg:grid-cols-6 lg:gap-x-4">
          {/* Linha de ligação (apenas desktop largo) */}
          <span
            aria-hidden="true"
            className="absolute left-0 right-0 top-[22px] hidden h-px bg-gradient-to-r from-transparent via-lp-cream/20 to-transparent lg:block"
          />

          {WORKFLOW_STEPS.map((step, index) => (
            <li
              key={step.title}
              className="lp-anim lp-rise relative"
              style={{ animationDelay: `${index * 90}ms`, animationDuration: 'var(--lp-dur-slow)' }}
            >
              <span className="relative z-10 flex size-11 items-center justify-center rounded-full bg-lp-ink-800 text-[15px] font-bold text-lp-gold-400 ring-1 ring-lp-cream/15">
                {index + 1}
              </span>
              <h3 className="mt-4 text-[16px] font-semibold text-lp-cream">{step.title}</h3>
              <p className="mt-2 text-[13.5px] leading-6 text-lp-cream/65">{step.text}</p>
              <p className="mt-3 truncate rounded-lg border border-lp-cream/12 bg-lp-cream/[0.06] px-2.5 py-2 font-mono text-[11px] text-lp-cream/75">
                {step.sample}
              </p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  )
}
