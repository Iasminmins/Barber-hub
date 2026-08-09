import type { Metadata } from 'next'
import { TenantListView } from '@/components/platform/tenant-list-view'

export const metadata: Metadata = {
  title: 'Testes gratuitos · Barber Hub',
  robots: { index: false, follow: false },
}

export const dynamic = 'force-dynamic'

export default function TestesPage() {
  return (
    <TenantListView
      title="Testes gratuitos"
      description="Contas em período de teste, ordenadas pela urgência do prazo."
      initialStatus="trialing"
      variant="trials"
    />
  )
}
