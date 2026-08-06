import { ChevronLeft, Signal, Wifi } from 'lucide-react'
import { DEMO_AGENDA, DEMO_PHONE_DATE, DEMO_PHONE_PROFESSIONAL } from '@/lib/landing-content'
import { cn } from '@/lib/utils'

const PHONE_BASE_WIDTH = 268
const PHONE_BASE_HEIGHT = 556

const STATUS_STYLES: Record<string, string> = {
  Confirmado: 'bg-lp-green-500/14 text-lp-green-500',
  Aguardando: 'bg-lp-amber-500/18 text-lp-gold-600',
  'Em atendimento': 'bg-lp-ink-700/10 text-lp-ink-700',
}

/**
 * Smartphone em HTML + CSS mostrando a agenda do dia.
 *
 * A perspectiva é levemente diferente da do notebook (rotação no eixo Y) para
 * criar profundidade real na composição em vez de dois planos paralelos.
 */
export function PhoneMockup({
  className,
  scaleClassName = 'sm:[--lp-phone-scale:0.74] lg:[--lp-phone-scale:0.64] xl:[--lp-phone-scale:0.72] 2xl:[--lp-phone-scale:0.80]',
  animate = true,
}: {
  className?: string
  /** Escalas por breakpoint. Substituível para composições menores (ex.: CTA final). */
  scaleClassName?: string
  animate?: boolean
}) {
  return (
    <div
      className={cn(
        'relative [--lp-phone-scale:0.62]',
        scaleClassName,
        animate && 'lp-anim lp-phone-in',
        className,
      )}
      style={{
        width: `calc(${PHONE_BASE_WIDTH}px * var(--lp-phone-scale))`,
        height: `calc(${PHONE_BASE_HEIGHT}px * var(--lp-phone-scale))`,
        animationDelay: animate ? '650ms' : undefined,
      }}
    >

      <div
        className="relative origin-top-left"
        style={{
          width: PHONE_BASE_WIDTH,
          height: PHONE_BASE_HEIGHT,
          transform: 'scale(var(--lp-phone-scale))',
        }}
      >
        {/* Botões laterais */}
        <span
          aria-hidden="true"
          className="absolute -left-[2px] top-[104px] h-[30px] w-[3px] rounded-l-[2px] bg-[oklch(0.42_0.004_250)]"
        />
        <span
          aria-hidden="true"
          className="absolute -left-[2px] top-[144px] h-[30px] w-[3px] rounded-l-[2px] bg-[oklch(0.42_0.004_250)]"
        />
        <span
          aria-hidden="true"
          className="absolute -right-[2px] top-[126px] h-[46px] w-[3px] rounded-r-[2px] bg-[oklch(0.42_0.004_250)]"
        />

        {/* Corpo metálico */}
        <div
          className="relative h-full w-full rounded-[34px] p-[3px]"
          style={{
            background:
              'linear-gradient(155deg, oklch(0.74 0.004 250) 0%, oklch(0.44 0.004 250) 30%, oklch(0.3 0.004 250) 66%, oklch(0.58 0.004 250) 100%)',
            boxShadow: 'var(--lp-shadow-phone)',
          }}
        >
          <div className="relative h-full w-full overflow-hidden rounded-[31px] bg-lp-ink-950 p-[2px]">
            <div className="relative h-full w-full overflow-hidden rounded-[29px] bg-lp-cream-2">
              {/* Dynamic island */}
              <span
                aria-hidden="true"
                className="absolute left-1/2 top-[7px] z-20 h-[18px] w-[68px] -translate-x-1/2 rounded-full bg-lp-ink-950"
              />

              {/* Barra de status */}
              <div className="flex items-center justify-between px-5 pb-1 pt-[11px] text-[9px] font-semibold text-lp-ink-900">
                <span>09:41</span>
                <span className="flex items-center gap-1">
                  <Signal className="size-[9px]" />
                  <Wifi className="size-[9px]" />
                  <span className="ml-0.5 h-[7px] w-[14px] rounded-[2px] border border-lp-ink-900/50 p-[1px]">
                    <span className="block h-full w-[72%] rounded-[1px] bg-lp-ink-900" />
                  </span>
                </span>
              </div>

              {/* Cabeçalho do app */}
              <div className="bg-lp-ink-900 px-4 pb-4 pt-3 text-lp-cream">
                <div className="flex items-center gap-2">
                  <ChevronLeft className="size-3.5 text-lp-cream/60" />
                  <p className="text-[12.5px] font-bold">Agenda</p>
                </div>
                <p className="mt-2 text-[10px] text-lp-cream/60">{DEMO_PHONE_DATE}</p>
                <div className="mt-2.5 flex items-center gap-2">
                  <span className="flex size-6 items-center justify-center rounded-full bg-lp-gold-500 text-[9px] font-bold text-lp-gold-ink">
                    DM
                  </span>
                  <span className="text-[10.5px] font-medium text-lp-cream/85">
                    {DEMO_PHONE_PROFESSIONAL}
                  </span>
                  <span className="ml-auto rounded-md bg-lp-cream/12 px-2 py-0.5 text-[9px] text-lp-cream/70">
                    4 hoje
                  </span>
                </div>
              </div>

              {/* Lista de atendimentos */}
              <div className="space-y-2 px-3 pt-3">
                {DEMO_AGENDA.map((item, index) => (
                  <div
                    key={item.time}
                    className={cn(
                      'rounded-xl border border-lp-cream-3 bg-white p-2.5',
                      animate && 'lp-anim lp-card-in',
                    )}
                    style={{ animationDelay: animate ? `${1000 + index * 110}ms` : undefined }}
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-[11px] font-bold text-lp-ink-900">{item.time}</span>
                      <span
                        className={cn(
                          'ml-auto rounded-md px-1.5 py-0.5 text-[8.5px] font-semibold',
                          STATUS_STYLES[item.status],
                        )}
                      >
                        {item.status}
                      </span>
                    </div>
                    <div className="mt-1.5 flex items-center gap-2">
                      <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-lp-ink-900/8 text-[9px] font-bold text-lp-ink-800">
                        {item.initials}
                      </span>
                      <span className="min-w-0 leading-tight">
                        <span className="block truncate text-[11px] font-semibold text-lp-ink-900">
                          {item.client}
                        </span>
                        <span className="block truncate text-[9.5px] text-lp-slate">
                          {item.service}
                        </span>
                      </span>
                    </div>
                  </div>
                ))}
              </div>

              {/* Barra inferior */}
              <div className="absolute inset-x-0 bottom-0 border-t border-lp-cream-3 bg-white/95 px-6 pb-3 pt-2">
                <div className="flex items-center justify-between text-[8.5px] font-medium">
                  <span className="flex flex-col items-center gap-1 text-lp-ink-900">
                    <span className="h-[3px] w-4 rounded-full bg-lp-ink-900" />
                    Agenda
                  </span>
                  <span className="flex flex-col items-center gap-1 text-lp-slate">
                    <span className="h-[3px] w-4 rounded-full bg-transparent" />
                    Comandas
                  </span>
                  <span className="flex flex-col items-center gap-1 text-lp-slate">
                    <span className="h-[3px] w-4 rounded-full bg-transparent" />
                    Clientes
                  </span>
                </div>
                <span
                  aria-hidden="true"
                  className="mx-auto mt-2 block h-[3px] w-[86px] rounded-full bg-lp-ink-950/25"
                />
              </div>

              {/* Reflexo suave da tela */}
              <span
                aria-hidden="true"
                className="pointer-events-none absolute inset-0 rounded-[29px]"
                style={{
                  background:
                    'linear-gradient(128deg, rgba(255,255,255,0.2) 0%, rgba(255,255,255,0.04) 24%, rgba(255,255,255,0) 48%)',
                }}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
