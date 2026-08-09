import type { Metadata } from 'next'
import { ConfiguracoesClient } from './configuracoes-client'

export const metadata: Metadata = {
  title: 'Configurações · Barber Hub',
  robots: { index: false, follow: false },
}

export const dynamic = 'force-dynamic'

export default function ConfiguracoesPage() {
  return <ConfiguracoesClient />
}
