import type { Metadata } from 'next'
import { TenantListView } from '@/components/platform/tenant-list-view'

export const metadata: Metadata = {
  title: 'Barbearias · Barber Hub',
  robots: { index: false, follow: false },
}

export const dynamic = 'force-dynamic'

export default function BarbeariasPage() {
  return (
    <TenantListView
      title="Barbearias"
      description="Todas as contas cadastradas na plataforma."
    />
  )
}
