import type { Metadata } from 'next'
import { ReportsClient } from './reports-client'

export const metadata: Metadata = {
  title: 'Relatórios · Barber Hub',
  robots: { index: false, follow: false },
}

export const dynamic = 'force-dynamic'

export default function RelatoriosPage() {
  return <ReportsClient />
}
