import type { Metadata } from 'next'
import { TenantListView } from '@/components/platform/tenant-list-view'

export const metadata: Metadata = {
  title: 'Assinaturas · Barber Hub',
  robots: { index: false, follow: false },
}

export const dynamic = 'force-dynamic'

export default function AssinaturasPage() {
  return (
    <TenantListView
      title="Assinaturas"
      description="Contas ativas por plano contratado e data da próxima cobrança."
      initialStatus="active"
      variant="subscriptions"
    />
  )
}
