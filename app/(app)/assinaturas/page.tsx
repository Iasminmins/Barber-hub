'use client'

import { AssinaturasClient } from './assinaturas-client'
import { useAppData } from '@/components/data/app-data-provider'

export default function AssinaturasPage() {
  const { catalog, financialEntries, plans, subscriptions } = useAppData()
  return <AssinaturasClient catalog={catalog} financialEntries={financialEntries} plans={plans} subscriptions={subscriptions} />
}
