import { TRUST_ITEMS } from '@/lib/landing-content'
import { cn } from '@/lib/utils'

/**
 * Faixa logo abaixo do hero. Substitui a antiga barra "PDV / CRM / BI" por
 * quatro benefícios em linguagem de dono de barbearia.
 */
export function TrustBar() {
  return (
    <section
      aria-label="Principais recursos"
      className="border-b border-lp-cream-3 bg-lp-cream"
    >
      <ul className="mx-auto grid max-w-7xl px-5 sm:grid-cols-2 lg:grid-cols-4">
        {TRUST_ITEMS.map((item, index) => (
          <li
            key={item.title}
            className={cn(
              'group bg-lp-cream py-7 transition-colors duration-200 sm:px-6 lg:px-6',
              index > 0 && 'border-t border-lp-cream-3 sm:border-t-0',
              index % 2 === 1 && 'sm:border-l sm:border-lp-cream-3',
              'lg:border-l lg:border-lp-cream-3',
              index === 0 && 'lg:border-l-0 lg:pl-0',
              index === 2 && 'sm:border-l-0 sm:border-t lg:border-l lg:border-t-0',
              index === 3 && 'sm:border-t lg:border-t-0',
            )}
          >
            <span className="mb-3.5 flex size-10 items-center justify-center rounded-xl bg-lp-ink-900/6 text-lp-ink-700 transition-colors duration-200 group-hover:bg-lp-ink-900 group-hover:text-lp-cream">
              <item.icon className="size-[18px]" />
            </span>
            <h3 className="text-[15px] font-semibold text-lp-ink-900">{item.title}</h3>
            <p className="mt-1.5 text-[13.5px] leading-6 text-lp-slate">{item.description}</p>
          </li>
        ))}
      </ul>
    </section>
  )
}
