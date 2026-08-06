import { ArrowRight, Check, FileSpreadsheet, MessageCircle, NotebookPen, X } from 'lucide-react'
import { PROBLEM_AFTER, PROBLEM_BEFORE } from '@/lib/landing-content'

/**
 * Seção do problema: composição editorial "antes e depois".
 *
 * O lado esquerdo simula a operação improvisada (WhatsApp, papel, planilha) e o
 * direito mostra a mesma informação organizada. Sem banco de imagens.
 */
export function ProblemSection() {
  return (
    <section id="solucao" className="bg-white py-[var(--lp-section-y)]">
      <div className="mx-auto max-w-7xl px-5">
        <div className="max-w-2xl">
          <p className="text-[13px] font-semibold uppercase tracking-[0.18em] text-lp-ink-600">
            O problema
          </p>
          <h2 className="mt-3 text-balance font-bold leading-[1.15] tracking-[-0.03em] text-lp-ink-900 text-[clamp(1.75rem,3.2vw,2.5rem)]">
            Sua barbearia cresceu.
            <br />
            A gestão precisa acompanhar.
          </h2>
          <p className="mt-4 text-[15.5px] leading-7 text-lp-slate">
            Quando a operação cresce, o improviso começa a custar caro: horário perdido, comanda
            aberta, produto em falta e cliente que não volta.
          </p>
        </div>

        <div className="mt-10 grid items-stretch gap-6 lg:grid-cols-[1fr_auto_1fr] lg:gap-4">
          {/* ANTES */}
          <div className="rounded-2xl border border-lp-cream-3 bg-lp-cream-2 p-6">
            <div className="mb-5 flex items-center gap-2">
              <span className="rounded-lg bg-lp-ink-900/8 px-2.5 py-1 text-[11.5px] font-bold uppercase tracking-wider text-lp-slate">
                Antes
              </span>
              <span className="flex items-center gap-1.5 text-lp-slate">
                <MessageCircle className="size-3.5" />
                <NotebookPen className="size-3.5" />
                <FileSpreadsheet className="size-3.5" />
              </span>
            </div>
            <ul className="space-y-2.5">
              {PROBLEM_BEFORE.map((item) => (
                <li
                  key={item}
                  className="flex items-start gap-2.5 rounded-lg bg-white/70 px-3 py-2.5 text-[13.5px] leading-6 text-lp-slate"
                >
                  <X className="mt-0.5 size-4 shrink-0 text-lp-gold-600" />
                  {item}
                </li>
              ))}
            </ul>
          </div>

          {/* Divisor */}
          <div
            aria-hidden="true"
            className="flex items-center justify-center lg:w-14 lg:flex-col"
          >
            <span className="hidden h-full w-px bg-lp-cream-3 lg:block" />
            <span className="flex size-11 shrink-0 items-center justify-center rounded-full bg-lp-ink-900 text-lp-cream shadow-[var(--lp-shadow-md)] lg:-my-5">
              <ArrowRight className="size-5 rotate-90 lg:rotate-0" />
            </span>
            <span className="hidden h-full w-px bg-lp-cream-3 lg:block" />
          </div>

          {/* DEPOIS */}
          <div
            className="rounded-2xl border border-lp-ink-800 bg-lp-ink-900 p-6 text-lp-cream"
            style={{ boxShadow: 'var(--lp-shadow-lg)' }}
          >
            <div className="mb-5 flex items-center gap-2">
              <span className="rounded-lg bg-lp-gold-500 px-2.5 py-1 text-[11.5px] font-bold uppercase tracking-wider text-lp-gold-ink">
                Com o MeuBarberHub
              </span>
            </div>
            <ul className="space-y-2.5">
              {PROBLEM_AFTER.map((item) => (
                <li
                  key={item}
                  className="flex items-start gap-2.5 rounded-lg bg-lp-cream/[0.06] px-3 py-2.5 text-[13.5px] leading-6 text-lp-cream/90"
                >
                  <Check className="mt-0.5 size-4 shrink-0 text-lp-green-300" />
                  {item}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </section>
  )
}
