import Link from 'next/link'
import { ArrowRight, CheckCircle2 } from 'lucide-react'
import { LINKS, TRIAL_REASSURANCE } from '@/lib/landing-content'
import { FloatingNotification } from './floating-notification'
import { PhoneMockup } from './phone-mockup'

/**
 * CTA final.
 *
 * Mantém a identidade do hero, mas com composição diferente: fundo mais fechado,
 * celular menor e um único ponto de maior contraste — o botão dourado.
 */
export function FinalCta() {
  return (
    <section
      id="contato"
      className="lp-noise relative isolate overflow-hidden bg-lp-ink-950 py-[var(--lp-section-y)] text-lp-cream"
    >
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 -z-10"
        style={{
          background:
            'radial-gradient(60% 70% at 18% 50%, oklch(0.42 0.05 168 / 0.55) 0%, transparent 72%)',
        }}
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 -z-10"
        style={{
          background:
            'radial-gradient(38% 42% at 82% 20%, oklch(0.742 0.128 86 / 0.14) 0%, transparent 70%)',
        }}
      />

      <div className="mx-auto grid max-w-7xl items-center gap-12 px-5 lg:grid-cols-[1.15fr_0.85fr]">
        <div className="max-w-xl">
          <h2 className="text-balance font-bold leading-[1.12] tracking-[-0.03em] text-[clamp(1.9rem,3.6vw,2.8rem)]">
            Pronto para ter mais controle sobre sua barbearia?
          </h2>
          <p className="mt-5 text-[16px] leading-7 text-lp-cream/72">
            Teste o MeuBarberHub gratuitamente por 30 dias e veja como uma gestão organizada pode
            transformar sua rotina.
          </p>

          <div className="mt-9 flex flex-col gap-3 sm:flex-row sm:items-center">
            <Link
              href={LINKS.signup}
              className="group inline-flex min-h-[3.25rem] w-full items-center justify-center gap-2 rounded-xl bg-lp-gold-500 px-7 text-[16px] font-bold text-lp-gold-ink shadow-[var(--lp-shadow-gold)] transition-all duration-200 hover:-translate-y-0.5 hover:bg-lp-gold-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-lp-gold-300 focus-visible:ring-offset-2 focus-visible:ring-offset-lp-ink-950 active:translate-y-0 sm:w-auto"
            >
              Começar agora
              <ArrowRight className="size-4 transition-transform duration-200 group-hover:translate-x-1" />
            </Link>
            <Link
              href={LINKS.login}
              className="inline-flex min-h-[3.25rem] w-full items-center justify-center rounded-xl border border-lp-cream/20 px-6 text-[15px] font-semibold text-lp-cream transition-colors duration-200 hover:bg-lp-cream/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-lp-gold-400 sm:w-auto"
            >
              Entrar
            </Link>
          </div>

          <ul className="mt-7 flex flex-wrap gap-x-5 gap-y-2 text-[13.5px] text-lp-cream/70">
            {TRIAL_REASSURANCE.map((item) => (
              <li key={item} className="inline-flex items-center gap-1.5">
                <CheckCircle2 className="size-4 shrink-0 text-lp-gold-400" />
                {item}
              </li>
            ))}
          </ul>
        </div>

        {/* Composição menor: celular + notificação */}
        <div className="relative hidden justify-center lg:flex">
          <div className="relative">
            <PhoneMockup scaleClassName="lg:[--lp-phone-scale:0.68] xl:[--lp-phone-scale:0.76]" />
            <FloatingNotification
              title="Pagamento aprovado"
              detail="R$ 85,00"
              tone="success"
              delay={200}
              size="sm"
              className="-left-10 top-[22%] z-30"
            />
          </div>
        </div>
      </div>
    </section>
  )
}
