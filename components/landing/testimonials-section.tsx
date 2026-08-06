import { AlertTriangle, Quote, Star } from 'lucide-react'
import { TESTIMONIALS, TESTIMONIALS_READY } from '@/lib/landing-content'
import { cn } from '@/lib/utils'

/**
 * Prova social.
 *
 * Enquanto `TESTIMONIALS_READY` for false, os cards aparecem marcados como
 * conteúdo de exemplo e um aviso é exibido acima — nada aqui é apresentado
 * como resultado real. Ver instruções em `lib/landing-content.ts`.
 */
export function TestimonialsSection() {
  return (
    <section className="bg-lp-cream py-[var(--lp-section-y)]">
      <div className="mx-auto max-w-7xl px-5">
        <div className="max-w-2xl">
          <p className="text-[13px] font-semibold uppercase tracking-[0.18em] text-lp-ink-600">
            Confiança
          </p>
          <h2 className="mt-3 text-balance font-bold leading-[1.15] tracking-[-0.03em] text-lp-ink-900 text-[clamp(1.75rem,3.2vw,2.5rem)]">
            Feito para a rotina real da barbearia.
          </h2>
        </div>

        {!TESTIMONIALS_READY ? (
          <p className="mt-6 flex items-start gap-2.5 rounded-xl border border-dashed border-lp-amber-500/60 bg-lp-amber-500/10 px-4 py-3 text-[13.5px] leading-6 text-lp-gold-600">
            <AlertTriangle className="mt-0.5 size-4 shrink-0" />
            <span>
              <strong className="font-semibold">Conteúdo de exemplo.</strong> Estes cards são
              espaços reservados aguardando depoimentos reais e autorizados. Edite{' '}
              <code className="rounded bg-white/70 px-1 py-0.5 font-mono text-[12px]">
                TESTIMONIALS
              </code>{' '}
              em <code className="font-mono text-[12px]">lib/landing-content.ts</code> antes de
              publicar.
            </span>
          </p>
        ) : null}

        <div className="mt-8 grid gap-4 lg:grid-cols-3">
          {TESTIMONIALS.map((item, index) => (
            <figure
              key={index}
              className={cn(
                'flex flex-col rounded-2xl border bg-white p-6',
                item.placeholder
                  ? 'border-dashed border-lp-cream-3'
                  : 'border-lp-cream-3',
              )}
              style={{ boxShadow: item.placeholder ? undefined : 'var(--lp-shadow-card)' }}
            >
              {item.placeholder ? (
                <span className="mb-4 w-fit rounded-md bg-lp-cream-2 px-2 py-1 text-[10.5px] font-bold uppercase tracking-wider text-lp-slate">
                  Espaço reservado
                </span>
              ) : (
                <Quote className="mb-4 size-5 text-lp-gold-500" aria-hidden="true" />
              )}

              {/* Estrelas apenas quando a avaliação é verdadeira */}
              {item.rating ? (
                <div
                  className="mb-3 flex gap-0.5"
                  aria-label={`Avaliação: ${item.rating} de 5`}
                >
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star
                      key={i}
                      className={cn(
                        'size-3.5',
                        i < item.rating! ? 'fill-lp-gold-500 text-lp-gold-500' : 'text-lp-cream-3',
                      )}
                    />
                  ))}
                </div>
              ) : null}

              <blockquote
                className={cn(
                  'flex-1 text-[14.5px] leading-7',
                  item.placeholder ? 'italic text-lp-slate' : 'text-lp-ink-900',
                )}
              >
                {item.quote}
              </blockquote>

              {item.result ? (
                <p className="mt-4 rounded-lg bg-lp-green-500/10 px-3 py-2 text-[13px] font-semibold text-lp-green-500">
                  {item.result}
                </p>
              ) : null}

              <figcaption className="mt-5 flex items-center gap-3 border-t border-lp-cream-3 pt-4">
                <span
                  className={cn(
                    'flex size-10 shrink-0 items-center justify-center rounded-full text-[13px] font-bold',
                    item.placeholder
                      ? 'bg-lp-cream-2 text-lp-slate'
                      : 'bg-lp-ink-900 text-lp-cream',
                  )}
                >
                  {item.initials}
                </span>
                <span className="min-w-0 leading-tight">
                  <span
                    className={cn(
                      'block truncate text-[14px] font-semibold',
                      item.placeholder ? 'text-lp-slate' : 'text-lp-ink-900',
                    )}
                  >
                    {item.name}
                  </span>
                  <span className="block truncate text-[12.5px] text-lp-slate">
                    {item.barbershop && item.city
                      ? `${item.barbershop} • ${item.city}`
                      : (item.role ?? item.barbershop ?? item.city)}
                  </span>
                </span>
              </figcaption>
            </figure>
          ))}
        </div>
      </div>
    </section>
  )
}
