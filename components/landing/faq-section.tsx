'use client'

import { useState } from 'react'
import Link from 'next/link'
import { ArrowRight, Minus, Plus } from 'lucide-react'
import { CTA_PRIMARY, FAQ_ITEMS, LINKS, TRIAL_BADGE } from '@/lib/landing-content'
import { cn } from '@/lib/utils'

/**
 * Accordion do FAQ.
 *
 * Cada item é um botão com `aria-expanded` controlando uma região identificada
 * por `aria-controls`. A altura anima por `grid-template-rows` (0fr → 1fr), o
 * que evita `max-height` chutado e mantém a animação curta.
 */
export function FaqSection() {
  const [aberto, setAberto] = useState<number | null>(0)

  return (
    <section id="duvidas" className="bg-white py-[var(--lp-section-y)]">
      <div className="mx-auto grid max-w-7xl gap-10 px-5 lg:grid-cols-[0.8fr_1.2fr] lg:gap-16">
        <div className="lg:sticky lg:top-28 lg:self-start">
          <p className="text-[13px] font-semibold uppercase tracking-[0.18em] text-lp-ink-600">
            Dúvidas frequentes
          </p>
          <h2 className="mt-3 text-balance font-bold leading-[1.15] tracking-[-0.03em] text-lp-ink-900 text-[clamp(1.75rem,3.2vw,2.5rem)]">
            Antes de testar, o essencial já fica claro.
          </h2>
          <p className="mt-4 text-[15.5px] leading-7 text-lp-slate">
            Ficou alguma pergunta? Fale com a gente pelo WhatsApp — respondemos antes de você
            começar o teste.
          </p>
          <Link
            href={LINKS.signup}
            className="group mt-7 inline-flex min-h-12 items-center gap-2 rounded-xl bg-lp-ink-900 px-5 text-[14.5px] font-bold text-lp-cream transition-all duration-200 hover:-translate-y-0.5 hover:bg-lp-ink-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-lp-ink-700 focus-visible:ring-offset-2 active:translate-y-0"
          >
            {CTA_PRIMARY}
            <ArrowRight className="size-4 transition-transform duration-200 group-hover:translate-x-1" />
          </Link>
          <p className="mt-3 text-[13px] text-lp-slate">{TRIAL_BADGE}</p>
        </div>

        <ul className="divide-y divide-lp-cream-3 border-y border-lp-cream-3">
          {FAQ_ITEMS.map((item, index) => {
            const expandido = aberto === index
            return (
              <li key={item.question}>
                <h3>
                  <button
                    type="button"
                    onClick={() => setAberto(expandido ? null : index)}
                    aria-expanded={expandido}
                    aria-controls={`faq-resposta-${index}`}
                    id={`faq-pergunta-${index}`}
                    className="flex w-full min-h-14 items-center justify-between gap-4 py-4 text-left text-[15.5px] font-semibold text-lp-ink-900 transition-colors duration-200 hover:text-lp-ink-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-lp-ink-700 focus-visible:ring-offset-2"
                  >
                    {item.question}
                    <span
                      aria-hidden="true"
                      className={cn(
                        'flex size-8 shrink-0 items-center justify-center rounded-full border transition-colors duration-200',
                        expandido
                          ? 'border-lp-ink-900 bg-lp-ink-900 text-lp-cream'
                          : 'border-lp-cream-3 text-lp-slate',
                      )}
                    >
                      {expandido ? <Minus className="size-4" /> : <Plus className="size-4" />}
                    </span>
                  </button>
                </h3>

                <div
                  id={`faq-resposta-${index}`}
                  role="region"
                  aria-labelledby={`faq-pergunta-${index}`}
                  className={cn(
                    'grid transition-[grid-template-rows] duration-300 ease-[var(--lp-ease-out)] motion-reduce:transition-none',
                    expandido ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]',
                  )}
                >
                  <div className="overflow-hidden">
                    <p className="pb-5 pr-12 text-[14.5px] leading-7 text-lp-slate">
                      {item.answer}
                    </p>
                  </div>
                </div>
              </li>
            )
          })}
        </ul>
      </div>
    </section>
  )
}
