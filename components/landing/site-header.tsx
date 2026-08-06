'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { ArrowRight, Menu, Scissors, X } from 'lucide-react'
import { CTA_PRIMARY, LINKS, NAV_ITEMS } from '@/lib/landing-content'
import { cn } from '@/lib/utils'

/**
 * Header fixo, inicialmente integrado ao hero.
 *
 * Ao rolar aplica fundo translúcido com blur discreto e uma borda inferior
 * quase imperceptível. Como é `fixed` desde o primeiro render, não existe
 * layout shift na transição.
 */
export function SiteHeader() {
  const [scrolled, setScrolled] = useState(false)
  const [open, setOpen] = useState(false)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 16)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  // Trava a rolagem do corpo enquanto o menu mobile está aberto.
  useEffect(() => {
    document.body.style.overflow = open ? 'hidden' : ''
    return () => {
      document.body.style.overflow = ''
    }
  }, [open])

  return (
    <header
      className={cn(
        'fixed inset-x-0 top-0 z-50 border-b border-transparent transition-colors duration-300',
        scrolled || open ? 'lp-header-solid' : 'bg-transparent',
      )}
    >
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-4 px-5 lg:h-[68px]">
        <Link
          href="/"
          className="flex items-center gap-2.5 rounded-lg text-lp-cream focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-lp-gold-400 focus-visible:ring-offset-2 focus-visible:ring-offset-lp-ink-900"
        >
          <span className="flex size-9 items-center justify-center rounded-lg bg-lp-cream/12 ring-1 ring-lp-cream/15">
            <Scissors className="size-[18px]" />
          </span>
          <span className="text-[15px] font-bold tracking-tight">MeuBarberHub</span>
        </Link>

        {/* Navegação desktop */}
        <nav aria-label="Navegação principal" className="hidden items-center gap-7 lg:flex">
          {NAV_ITEMS.map((item) => (
            <a
              key={item.href}
              href={item.href}
              className="rounded text-[13.5px] font-medium text-lp-cream/70 transition-colors duration-200 hover:text-lp-cream focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-lp-gold-400 focus-visible:ring-offset-4 focus-visible:ring-offset-lp-ink-900"
            >
              {item.label}
            </a>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          <Link
            href={LINKS.login}
            className="hidden h-10 items-center rounded-lg px-4 text-[13.5px] font-semibold text-lp-cream/80 transition-colors duration-200 hover:bg-lp-cream/10 hover:text-lp-cream focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-lp-gold-400 sm:inline-flex"
          >
            Entrar
          </Link>
          <Link
            href={LINKS.signup}
            className="group hidden h-10 items-center gap-1.5 rounded-lg bg-lp-gold-500 px-4 text-[13.5px] font-bold text-lp-gold-ink shadow-[var(--lp-shadow-gold)] transition-all duration-200 hover:-translate-y-0.5 hover:bg-lp-gold-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-lp-gold-300 focus-visible:ring-offset-2 focus-visible:ring-offset-lp-ink-900 active:translate-y-0 sm:inline-flex"
          >
            {CTA_PRIMARY}
            <ArrowRight className="size-4 transition-transform duration-200 group-hover:translate-x-0.5" />
          </Link>

          <button
            type="button"
            onClick={() => setOpen((value) => !value)}
            aria-expanded={open}
            aria-controls="menu-mobile"
            aria-label={open ? 'Fechar menu' : 'Abrir menu'}
            className="flex size-11 items-center justify-center rounded-lg text-lp-cream transition-colors duration-200 hover:bg-lp-cream/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-lp-gold-400 lg:hidden"
          >
            {open ? <X className="size-5" /> : <Menu className="size-5" />}
          </button>
        </div>
      </div>

      {/* Menu mobile */}
      <div
        id="menu-mobile"
        hidden={!open}
        className="border-t border-lp-cream/10 bg-lp-ink-900/97 lg:hidden"
      >
        <nav aria-label="Navegação mobile" className="mx-auto max-w-7xl px-5 py-5">
          <ul className="flex flex-col">
            {NAV_ITEMS.map((item) => (
              <li key={item.href}>
                <a
                  href={item.href}
                  onClick={() => setOpen(false)}
                  className="flex min-h-11 items-center rounded-lg px-2 text-[15px] font-medium text-lp-cream/80 transition-colors duration-200 hover:bg-lp-cream/8 hover:text-lp-cream focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-lp-gold-400"
                >
                  {item.label}
                </a>
              </li>
            ))}
          </ul>

          <div className="mt-5 flex flex-col gap-2.5 border-t border-lp-cream/10 pt-5">
            <Link
              href={LINKS.signup}
              onClick={() => setOpen(false)}
              className="inline-flex min-h-12 w-full items-center justify-center gap-1.5 rounded-lg bg-lp-gold-500 px-5 text-[15px] font-bold text-lp-gold-ink transition-colors duration-200 hover:bg-lp-gold-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-lp-gold-300"
            >
              {CTA_PRIMARY}
              <ArrowRight className="size-4" />
            </Link>
            <Link
              href={LINKS.login}
              onClick={() => setOpen(false)}
              className="inline-flex min-h-12 w-full items-center justify-center rounded-lg border border-lp-cream/20 px-5 text-[15px] font-semibold text-lp-cream transition-colors duration-200 hover:bg-lp-cream/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-lp-gold-400"
            >
              Entrar
            </Link>
          </div>
        </nav>
      </div>
    </header>
  )
}
