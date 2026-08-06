import { cn } from '@/lib/utils'
import {
  DASHBOARD_BASE_HEIGHT,
  DASHBOARD_BASE_WIDTH,
  DashboardPreview,
} from './dashboard-preview'

/**
 * Notebook construído inteiramente em HTML + CSS.
 *
 * A escala é dirigida pela variável `--lp-dash-scale`: o dashboard é desenhado
 * numa largura-base fixa e o corpo do notebook deriva o próprio tamanho dessa
 * mesma escala. Assim a proporção nunca quebra e não existe layout shift,
 * porque todas as medidas são calculadas em CSS antes da pintura.
 */
export function LaptopMockup({
  className,
  animate = true,
}: {
  className?: string
  animate?: boolean
}) {
  const screenWidth = `calc(${DASHBOARD_BASE_WIDTH}px * var(--lp-dash-scale))`
  const screenHeight = `calc(${DASHBOARD_BASE_HEIGHT}px * var(--lp-dash-scale))`
  // largura da tela + 7px de moldura e 1px de borda de cada lado
  const bodyWidth = `calc(${DASHBOARD_BASE_WIDTH}px * var(--lp-dash-scale) + 16px)`

  return (
    <div
      className={cn(
        'relative [--lp-dash-scale:0.26] sm:[--lp-dash-scale:0.34] md:[--lp-dash-scale:0.42]',
        'lg:[--lp-dash-scale:0.40] xl:[--lp-dash-scale:0.46] 2xl:[--lp-dash-scale:0.52]',
        animate && 'lp-anim lp-laptop-in',
        className,
      )}
      style={{ width: bodyWidth, animationDelay: animate ? '400ms' : undefined }}
    >
      {/* Sombra ambiental projetada no fundo */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -bottom-6 left-1/2 h-10 w-[86%] -translate-x-1/2 rounded-[50%] bg-lp-ink-950/55 blur-2xl"
      />

      {/* Tampa: moldura + tela */}
      <div
        className="relative rounded-t-[14px] rounded-b-[5px] p-[1px]"
        style={{
          background:
            'linear-gradient(160deg, oklch(0.72 0.006 250) 0%, oklch(0.44 0.006 250) 26%, oklch(0.3 0.006 250) 62%, oklch(0.52 0.006 250) 100%)',
          boxShadow: 'var(--lp-shadow-device)',
        }}
      >
        <div
          className="relative overflow-hidden rounded-t-[13px] rounded-b-[4px] px-[7px] pb-[9px] pt-[14px]"
          style={{
            background:
              'linear-gradient(175deg, oklch(0.26 0.005 250) 0%, oklch(0.18 0.005 250) 100%)',
          }}
        >
          {/* Câmera discreta */}
          <span
            aria-hidden="true"
            className="absolute left-1/2 top-[5px] flex -translate-x-1/2 items-center gap-[3px]"
          >
            <span className="size-[3px] rounded-full bg-white/12" />
            <span className="size-[4px] rounded-full bg-white/22 ring-[0.5px] ring-white/10" />
            <span className="size-[3px] rounded-full bg-white/12" />
          </span>

          {/* Tela */}
          <div
            className="relative overflow-hidden rounded-[3px] bg-lp-cream-2"
            style={{ width: screenWidth, height: screenHeight }}
          >
            <div
              className="origin-top-left"
              style={{
                width: DASHBOARD_BASE_WIDTH,
                height: DASHBOARD_BASE_HEIGHT,
                transform: 'scale(var(--lp-dash-scale))',
              }}
            >
              <DashboardPreview animate={animate} />
            </div>

            {/* Reflexo diagonal discreto, fixo */}
            <span
              aria-hidden="true"
              className="pointer-events-none absolute inset-0"
              style={{
                background:
                  'linear-gradient(122deg, rgba(255,255,255,0.16) 0%, rgba(255,255,255,0.05) 22%, rgba(255,255,255,0) 46%)',
              }}
            />
            {/* Brilho que cruza a tela uma única vez após a entrada */}
            {animate ? (
              <span
                aria-hidden="true"
                className="lp-sheen pointer-events-none absolute inset-y-0 -left-1/3 w-1/3 bg-gradient-to-r from-transparent via-white/22 to-transparent"
              />
            ) : null}
          </div>
        </div>
      </div>

      {/* Dobradiça */}
      <div
        aria-hidden="true"
        className="relative mx-auto h-[5px] w-[97%] rounded-b-[3px]"
        style={{
          background:
            'linear-gradient(180deg, oklch(0.34 0.005 250) 0%, oklch(0.5 0.005 250) 45%, oklch(0.28 0.005 250) 100%)',
        }}
      />

      {/* Base: deck com teclado em perspectiva */}
      <div aria-hidden="true" className="relative" style={{ perspective: '620px' }}>
        <div
          className="relative mx-auto origin-top overflow-hidden"
          style={{
            width: '104%',
            height: `calc(46px * var(--lp-dash-scale) * 2.1)`,
            transform: 'rotateX(70deg)',
            transformStyle: 'preserve-3d',
            borderRadius: '4px 4px 10px 10px',
            background:
              'linear-gradient(180deg, oklch(0.66 0.005 250) 0%, oklch(0.55 0.005 250) 40%, oklch(0.42 0.005 250) 100%)',
            boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.35)',
          }}
        >

          {/* Teclas */}
          <div className="flex h-[62%] w-full flex-col justify-between px-[6%] pt-[3%]">
            {[14, 14, 14, 13, 12].map((count, row) => (
              <div key={row} className="flex w-full gap-[1.5px]">
                {Array.from({ length: count }).map((_, key) => (
                  <span
                    key={key}
                    className="h-[3.5px] flex-1 rounded-[1px] bg-lp-ink-950/72 sm:h-[5px]"
                  />
                ))}
              </div>
            ))}
            <div className="flex w-full justify-center">
              <span className="h-[3.5px] w-[38%] rounded-[1px] bg-lp-ink-950/72 sm:h-[5px]" />
            </div>
          </div>

          {/* Trackpad */}
          <div className="flex h-[38%] w-full items-start justify-center pt-[2%]">
            <span
              className="h-[68%] w-[26%] rounded-[3px]"
              style={{
                background:
                  'linear-gradient(180deg, oklch(0.6 0.005 250) 0%, oklch(0.52 0.005 250) 100%)',
                boxShadow: 'inset 0 0 0 0.5px rgba(0,0,0,0.22)',
              }}
            />
          </div>
        </div>

        {/* Espessura da base e sombra de contato */}
        <div
          className="mx-auto h-[5px] w-[106%] rounded-b-[7px]"
          style={{
            background:
              'linear-gradient(180deg, oklch(0.46 0.005 250) 0%, oklch(0.3 0.005 250) 70%, oklch(0.22 0.005 250) 100%)',
          }}
        />
        <div className="mx-auto h-[10px] w-[92%] rounded-[50%] bg-lp-ink-950/60 blur-md" />
      </div>
    </div>
  )
}
