import Link from 'next/link'
import { ExternalLink, Mail, MessageCircle, Scissors } from 'lucide-react'
import { LINKS, NAV_ITEMS } from '@/lib/landing-content'

/**
 * Footer.
 *
 * Se alguma página jurídica for removida, apague o `href` correspondente: o
 * item passa a ser renderizado como texto inerte em vez de link quebrado.
 */
const LEGAL_LINKS: { label: string; href?: string }[] = [
  { label: 'Termos de uso', href: '/termos' },
  { label: 'Política de privacidade', href: '/privacidade' },
  { label: 'Política de cookies', href: '/cookies' },
]

export function SiteFooter() {
  return (
    <footer className="border-t border-lp-cream/10 bg-lp-ink-950 text-lp-cream">
      <div className="mx-auto grid max-w-7xl gap-10 px-5 py-14 sm:grid-cols-2 lg:grid-cols-[1.4fr_0.7fr_0.7fr_1.1fr]">
        <div className="max-w-sm">
          <Link href="/" className="inline-flex items-center gap-2.5">
            <span className="flex size-9 items-center justify-center rounded-lg bg-lp-cream/10 ring-1 ring-lp-cream/15">
              <Scissors className="size-[18px]" />
            </span>
            <span className="text-[15px] font-bold tracking-tight">MeuBarberHub</span>
          </Link>
          <p className="mt-5 text-[13.5px] leading-6 text-lp-cream/60">
            Agenda, comandas, clientes, estoque e financeiro reunidos para simplificar a gestão da
            sua barbearia.
          </p>
        </div>

        <nav aria-labelledby="rodape-produto">
          <h2
            id="rodape-produto"
            className="text-[12px] font-semibold uppercase tracking-[0.16em] text-lp-gold-400"
          >
            Produto
          </h2>
          <ul className="mt-4 flex flex-col gap-3 text-[13.5px] text-lp-cream/70">
            {NAV_ITEMS.map((item) => (
              <li key={item.href}>
                <a
                  href={item.href}
                  className="rounded transition-colors duration-200 hover:text-lp-cream focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-lp-gold-400"
                >
                  {item.label}
                </a>
              </li>
            ))}
          </ul>
        </nav>

        <nav aria-labelledby="rodape-conta">
          <h2
            id="rodape-conta"
            className="text-[12px] font-semibold uppercase tracking-[0.16em] text-lp-gold-400"
          >
            Conta
          </h2>
          <ul className="mt-4 flex flex-col gap-3 text-[13.5px] text-lp-cream/70">
            <li>
              <Link
                href={LINKS.signup}
                className="rounded transition-colors duration-200 hover:text-lp-cream focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-lp-gold-400"
              >
                Criar conta
              </Link>
            </li>
            <li>
              <Link
                href={LINKS.login}
                className="rounded transition-colors duration-200 hover:text-lp-cream focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-lp-gold-400"
              >
                Entrar
              </Link>
            </li>
          </ul>
        </nav>

        <div>
          <h2 className="text-[12px] font-semibold uppercase tracking-[0.16em] text-lp-gold-400">
            Suporte
          </h2>
          <p className="mt-4 text-[13.5px] leading-6 text-lp-cream/60">
            Precisa de ajuda? Fale diretamente com nosso suporte.
          </p>
          <div className="mt-4 space-y-3">
            <a
              href={LINKS.email}
              className="flex items-start gap-2.5 rounded text-[13.5px] text-lp-cream/80 transition-colors duration-200 hover:text-lp-cream focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-lp-gold-400"
            >
              <Mail className="mt-0.5 size-4 shrink-0 text-lp-gold-400" />
              <span className="break-all">{LINKS.emailLabel}</span>
            </a>
            <a
              href={LINKS.whatsappSupport}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-2.5 rounded text-[13.5px] text-lp-cream/80 transition-colors duration-200 hover:text-lp-cream focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-lp-gold-400"
            >
              <MessageCircle className="size-4 shrink-0 text-lp-gold-400" />
              WhatsApp: {LINKS.phoneLabel}
              <ExternalLink className="size-3.5" />
            </a>
          </div>
        </div>
      </div>

      <div className="border-t border-lp-cream/10">
        <div className="mx-auto flex max-w-7xl flex-col gap-3 px-5 py-5 text-[12.5px] text-lp-cream/50 sm:flex-row sm:items-center sm:justify-between">
          <p>© {new Date().getFullYear()} MeuBarberHub. Todos os direitos reservados.</p>

          <ul className="flex flex-wrap gap-x-5 gap-y-2">
            {LEGAL_LINKS.map((item) =>
              item.href ? (
                <li key={item.label}>
                  <Link
                    href={item.href}
                    className="rounded underline-offset-4 transition-colors duration-200 hover:text-lp-cream/80 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-lp-gold-400"
                  >
                    {item.label}
                  </Link>
                </li>
              ) : (
                // Página ainda não existe: texto inerte em vez de link quebrado.
                <li key={item.label} className="text-lp-cream/30">
                  {item.label}
                </li>
              ),
            )}
          </ul>
        </div>
      </div>
    </footer>
  )
}
