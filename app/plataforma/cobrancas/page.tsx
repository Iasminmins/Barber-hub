import type { Metadata } from 'next'
import { TenantListView } from '@/components/platform/tenant-list-view'

export const metadata: Metadata = {
  title: 'Cobranças · Barber Hub',
  robots: { index: false, follow: false },
}

export const dynamic = 'force-dynamic'

export default function CobrancasPage() {
  return (
    <TenantListView
      title="Cobranças"
      description="Vencimentos dos próximos 7 dias e contas em atraso."
      initialBilling="attention"
      variant="billing"
    />
  )
}
