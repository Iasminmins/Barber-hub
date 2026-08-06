import Link from 'next/link'
import { ArrowRight, CheckCircle2, PlayCircle, Sparkles } from 'lucide-react'
import {
  CTA_PRIMARY,
  CTA_SECONDARY,
  FLOATING_CARDS,
  HERO,
  LINKS,
  TRIAL_REASSURANCE,
} from '@/lib/landing-content'
import { FloatingNotification } from './floating-notification'
import { LaptopMockup } from './laptop-mockup'
import { PhoneMockup } from './phone-mockup'

/**
 * Hero principal — "central de comando da barbearia".
 *
 * Toda a entrada é feita com CSS (`transform` + `opacity`), sem biblioteca de
 * animação, e é neutralizada por `prefers-reduced-motion` em globals.css.
 */
export function Hero() {
  return (
    <section className="lp-noise relative isolate overflow-hidden bg-lp-ink-900 text-lp-cream">
      {/* --- Camadas de fundo --- */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 -z-10"
        style={{ background: 'var(--lp-grad-ink)' }}
      />
      {/* Luz radial principal, atrás do notebook */}
      <div
        aria-hidden="true"
        className="lp-anim lp-fade pointer-events-none absolute inset-0 -z-10"
        style={{
          background:
            'radial-gradient(58% 52% at 72% 34%, oklch(0.46 0.05 168 / 0.55) 0%, transparent 72%)',
        }}
      />
      {/* Luz dourada secundária, suave */}
      <div
        aria-hidden="true"
        className="lp-anim lp-fade pointer-events-none absolute inset-0 -z-10"
        style={{
          animationDelay: '120ms',
          background:
            'radial-gradient(40% 38% at 86% 12%, oklch(0.742 0.128 86 / 0.18) 0%, transparent 68%)',
        }}
      />
      {/* Vinheta discreta */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 -z-10"
        style={{
          background:
            'radial-gradient(120% 100% at 50% 0%, transparent 42%, oklch(0.13 0.02 166 / 0.55) 100%)',
        }}
      />

      <div className="mx-auto grid max-w-7xl items-center gap-12 px-5 pb-16 pt-24 lg:min-h-[88vh] lg:grid-cols-[1.02fr_1fr] lg:gap-10 lg:pb-24 lg:pt-28 xl:gap-12">
        {/* --- Coluna de conteúdo --- */}
        <div className="max-w-xl lg:max-w-[38rem]">
          <p
            className="lp-anim lp-rise mb-6 inline-flex items-center gap-2 rounded-full bg-lp-cream/10 px-3.5 py-1.5 text-[13px] font-semibold text-lp-cream/90 ring-1 ring-lp-cream/15"
            style={{ animationDelay: '60ms' }}
          >
            <Sparkles className="size-3.5 text-lp-gold-400" />
            {HERO.badge}
          </p>

          <h1
            className="lp-anim lp-rise text-balance font-bold leading-[1.06] tracking-[-0.035em] text-[clamp(2.05rem,4.3vw,2.95rem)]"
            style={{ animationDelay: '200ms' }}
          >
            {HERO.headlineLead}
            <br />
            <span className="text-lp-gold-400">{HERO.headlineHighlight}</span>
            {HERO.headlineTail}
          </h1>

          <p
            className="lp-anim lp-rise mt-5 max-w-lg text-[clamp(1rem,1.15vw,1.125rem)] leading-[1.65] text-lp-cream/75"
            style={{ animationDelay: '300ms' }}
          >
            {HERO.subtitle}
          </p>

          <div
            className="lp-anim lp-rise mt-9 flex flex-col gap-3 sm:flex-row"
            style={{ animationDelay: '400ms' }}
          >
            <Link
              href={LINKS.signup}
              className="group inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-lp-gold-500 px-6 text-[15px] font-bold text-lp-gold-ink shadow-[var(--lp-shadow-gold)] transition-all duration-200 hover:-translate-y-0.5 hover:bg-lp-gold-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-lp-gold-300 focus-visible:ring-offset-2 focus-visible:ring-offset-lp-ink-900 active:translate-y-0 sm:w-auto"
            >
              {CTA_PRIMARY}
              <ArrowRight className="size-4 transition-transform duration-200 group-hover:translate-x-1" />
            </Link>
            <a
              href="#recursos"
              className="inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-xl border border-lp-cream/20 bg-lp-cream/5 px-6 text-[15px] font-semibold text-lp-cream transition-colors duration-200 hover:bg-lp-cream/12 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-lp-gold-400 focus-visible:ring-offset-2 focus-visible:ring-offset-lp-ink-900 sm:w-auto"
            >
              <PlayCircle className="size-4" />
              {CTA_SECONDARY}
            </a>
          </div>

          <ul
            className="lp-anim lp-rise mt-7 flex flex-wrap gap-x-5 gap-y-2 text-[13.5px] text-lp-cream/72"
            style={{ animationDelay: '500ms' }}
          >
            {TRIAL_REASSURANCE.map((item) => (
              <li key={item} className="inline-flex items-center gap-1.5">
                <CheckCircle2 className="size-4 shrink-0 text-lp-gold-400" />
                {item}
              </li>
            ))}
          </ul>
        </div>

        {/* --- Composição dos dispositivos --- */}
        <div className="relative flex justify-center lg:justify-end">
          <div className="relative pb-16 pr-0 sm:pb-20 lg:pb-14 lg:pr-6">
            <LaptopMockup />

            {/* Celular sobreposto, em perspectiva diferente */}
            <PhoneMockup className="absolute -bottom-2 right-0 z-20 origin-bottom-right [transform:rotateY(-9deg)_rotateZ(1.5deg)] sm:right-[-4%] lg:-bottom-6 lg:right-[-6%]" />

            {/* Cards flutuantes — reduzidos em telas menores */}
            <FloatingNotification
              title={FLOATING_CARDS[0].title}
              detail={FLOATING_CARDS[0].detail}
              tone={FLOATING_CARDS[0].tone}
              delay={950}
              size="sm"
              className="-left-3 top-[14%] z-30 hidden sm:block lg:-left-8"
            />
            <FloatingNotification
              title={FLOATING_CARDS[1].title}
              detail={FLOATING_CARDS[1].detail}
              tone={FLOATING_CARDS[1].tone}
              delay={1100}
              ambient="lp-ambient-soft"
              className="-left-6 bottom-[26%] z-30 hidden lg:block xl:-left-12"
            />
            <FloatingNotification
              title={FLOATING_CARDS[2].title}
              detail={FLOATING_CARDS[2].detail}
              tone={FLOATING_CARDS[2].tone}
              delay={1250}
              size="sm"
              ambient="lp-ambient-soft"
              className="-top-4 right-[6%] z-30 hidden xl:block"
            />
          </div>
        </div>
      </div>
    </section>
  )
}
