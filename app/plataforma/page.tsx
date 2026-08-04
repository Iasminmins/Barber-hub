import type { Metadata } from 'next'
import { AdminClient } from './admin-client'

export const metadata: Metadata = {
  title: 'Administração da Plataforma · Barber Hub',
  robots: { index: false, follow: false },
}

export const dynamic = 'force-dynamic'

export default function AdminPage() {
  return <AdminClient />
}
