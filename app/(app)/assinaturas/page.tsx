'use client'

import { AssinaturasClient } from './assinaturas-client'
import { useAppData } from '@/components/data/app-data-provider'

export default function AssinaturasPage() {
  const { plans, subscriptions } = useAppData()
  return <AssinaturasClient plans={plans} subscriptions={subscriptions} />
}
