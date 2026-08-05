import type { Metadata } from 'next'
import { TenantListView } from '@/components/platform/tenant-list-view'

export const metadata: Metadata = {
  title: 'Cupons e cortesias · Barber Hub',
  robots: { index: false, follow: false },
}

export const dynamic = 'force-dynamic'

export default function CortesiasPage() {
  return (
    <TenantListView
      title="Cupons e cortesias"
      description="Contas com cortesia ativa concedida pela plataforma."
      initialBilling="complimentary"
    />
  )
}
