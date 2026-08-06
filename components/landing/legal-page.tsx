import type { ReactNode } from 'react'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { SiteFooter } from './site-footer'

/**
 * Layout compartilhado das páginas jurídicas (Termos, Privacidade, Cookies).
 *
 * Usa os mesmos tokens `lp-*` da landing para manter a identidade, mas com
 * cabeçalho simples — sem CTA — porque aqui o objetivo é leitura, não conversão.
 */
export function LegalPage({
  title,
  updatedAt,
  intro,
  children,
}: {
  title: string
  updatedAt: string
  intro: string
  children: ReactNode
}) {
  return (
    <main className="min-h-screen bg-white">
      <header className="bg-lp-ink-900 text-lp-cream">
        <div className="mx-auto max-w-3xl px-5 py-6">
          <Link
            href="/"
            className="inline-flex min-h-11 items-center gap-2 rounded-lg text-[14px] font-medium text-lp-cream/75 transition-colors duration-200 hover:text-lp-cream focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-lp-gold-400"
          >
            <ArrowLeft className="size-4" />
            Voltar para a página inicial
          </Link>
        </div>
        <div className="mx-auto max-w-3xl px-5 pb-14 pt-4">
          <h1 className="text-balance font-bold leading-[1.15] tracking-[-0.03em] text-[clamp(1.9rem,4vw,2.6rem)]">
            {title}
          </h1>
          <p className="mt-4 text-[15.5px] leading-7 text-lp-cream/70">{intro}</p>
          <p className="mt-5 text-[13px] text-lp-cream/50">Última atualização: {updatedAt}</p>
        </div>
      </header>

      <div className="mx-auto max-w-3xl px-5 py-14">
        <div className="space-y-9">{children}</div>
      </div>

      <SiteFooter />
    </main>
  )
}

/** Seção numerada de um documento jurídico. */
export function LegalSection({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section>
      <h2 className="text-[19px] font-bold tracking-[-0.02em] text-lp-ink-900">{title}</h2>
      <div className="mt-3 space-y-3 text-[15px] leading-7 text-lp-slate">{children}</div>
    </section>
  )
}
