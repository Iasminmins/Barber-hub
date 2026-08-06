'use client'

import { useRef, useState } from 'react'
import Link from 'next/link'
import { ArrowRight, Check } from 'lucide-react'
import { CTA_PRIMARY, LINKS, PRODUCT_TOUR } from '@/lib/landing-content'
import { cn } from '@/lib/utils'
import { TourScreen } from './tour-screen'

/**
 * Tour interativo do produto.
 *
 * Tabs seguem o padrão ARIA (roles, aria-selected, roving tabindex e setas do
 * teclado). O painel usa `grid-area` empilhado para manter altura estável e
 * impedir layout shift na troca de aba — só opacidade e deslocamento animam.
 */
export function ProductTour() {
  const [ativa, setAtiva] = useState(0)
  const tabsRef = useRef<(HTMLButtonElement | null)[]>([])

  function onKeyDown(event: React.KeyboardEvent) {
    const total = PRODUCT_TOUR.length
    // A navegação parte da aba que está com foco, não da que está selecionada.
    const focada = tabsRef.current.findIndex((node) => node === document.activeElement)
    const atual = focada >= 0 ? focada : ativa

    let proxima: number | null = null
    if (event.key === 'ArrowRight') proxima = (atual + 1) % total
    if (event.key === 'ArrowLeft') proxima = (atual - 1 + total) % total
    if (event.key === 'Home') proxima = 0
    if (event.key === 'End') proxima = total - 1
    if (proxima === null) return
    event.preventDefault()
    setAtiva(proxima)
    tabsRef.current[proxima]?.focus()
  }

  return (
    <section id="recursos" className="bg-lp-cream py-[var(--lp-section-y)]">
      <div className="mx-auto max-w-7xl px-5">
        <div className="max-w-2xl">
          <p className="text-[13px] font-semibold uppercase tracking-[0.18em] text-lp-ink-600">
            Tour do produto
          </p>
          <h2 className="mt-3 text-balance font-bold tracking-[-0.03em] text-lp-ink-900 text-[clamp(1.75rem,3.2vw,2.5rem)]">
            Tudo conectado em uma única operação.
          </h2>
        </div>

        {/* Lista de abas */}
        <div
          role="tablist"
          aria-label="Módulos do MeuBarberHub"
          onKeyDown={onKeyDown}
          className="no-scrollbar mt-8 flex gap-2 overflow-x-auto pb-1"
        >
          {PRODUCT_TOUR.map((tab, index) => {
            const selecionada = index === ativa
            return (
              <button
                key={tab.id}
                ref={(node) => {
                  tabsRef.current[index] = node
                }}
                type="button"
                role="tab"
                id={`tab-${tab.id}`}
                aria-selected={selecionada}
                aria-controls={`painel-${tab.id}`}
                tabIndex={selecionada ? 0 : -1}
                onClick={() => setAtiva(index)}
                className={cn(
                  'inline-flex min-h-11 shrink-0 items-center gap-2 rounded-xl border px-4 text-[14px] font-semibold transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-lp-ink-700 focus-visible:ring-offset-2',
                  selecionada
                    ? 'border-lp-ink-900 bg-lp-ink-900 text-lp-cream shadow-[var(--lp-shadow-md)]'
                    : 'border-lp-cream-3 bg-white text-lp-slate hover:border-lp-ink-600/40 hover:text-lp-ink-900',
                )}
              >
                <tab.icon className="size-4" />
                {tab.label}
              </button>
            )
          })}
        </div>

        {/* Painéis empilhados na mesma célula de grid: altura estável */}
        <div className="mt-6 grid">
          {PRODUCT_TOUR.map((tab, index) => {
            const selecionada = index === ativa
            return (
              <div
                key={tab.id}
                role="tabpanel"
                id={`painel-${tab.id}`}
                aria-labelledby={`tab-${tab.id}`}
                inert={!selecionada}
                aria-hidden={!selecionada}
                className={cn(
                  'col-start-1 row-start-1 transition-all duration-300 ease-[var(--lp-ease-out)]',
                  selecionada
                    ? 'translate-x-0 opacity-100 blur-0'
                    : 'pointer-events-none translate-x-3 opacity-0 blur-[2px]',
                )}
              >
                <div
                  className="grid gap-8 rounded-2xl border border-lp-cream-3 bg-white p-6 lg:grid-cols-[0.92fr_1.08fr] lg:items-center lg:gap-10 lg:p-8"
                  style={{ boxShadow: 'var(--lp-shadow-card)' }}
                >
                  <div>
                    <p className="inline-flex rounded-lg bg-lp-amber-500/14 px-2.5 py-1 text-[12px] font-semibold text-lp-gold-600">
                      {tab.problem}
                    </p>
                    <h3 className="mt-4 text-balance text-[clamp(1.3rem,2.1vw,1.65rem)] font-bold leading-snug tracking-[-0.02em] text-lp-ink-900">
                      {tab.title}
                    </h3>
                    <p className="mt-3 text-[15px] leading-7 text-lp-slate">{tab.description}</p>

                    <ul className="mt-5 grid gap-2 sm:grid-cols-2">
                      {tab.features.map((feature) => (
                        <li key={feature} className="flex items-start gap-2 text-[13.5px] text-lp-ink-900">
                          <Check className="mt-0.5 size-4 shrink-0 text-lp-green-500" />
                          {feature}
                        </li>
                      ))}
                    </ul>

                    <Link
                      href={LINKS.signup}
                      className="group mt-7 inline-flex min-h-11 items-center gap-2 rounded-xl bg-lp-ink-900 px-5 text-[14px] font-bold text-lp-cream transition-all duration-200 hover:-translate-y-0.5 hover:bg-lp-ink-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-lp-ink-700 focus-visible:ring-offset-2 active:translate-y-0"
                    >
                      {CTA_PRIMARY}
                      <ArrowRight className="size-4 transition-transform duration-200 group-hover:translate-x-1" />
                    </Link>
                  </div>

                  <TourScreen id={tab.id} />
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}
