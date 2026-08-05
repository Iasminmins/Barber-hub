import type { Metadata } from 'next'
import { ClientesClient } from './clientes-client'

export const metadata: Metadata = {
  title: 'Clientes · Barber Hub',
  robots: { index: false, follow: false },
}

export const dynamic = 'force-dynamic'

export default function ClientesPage() {
  return <ClientesClient />
}
