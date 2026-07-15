import { AssinaturasClient } from './assinaturas-client'
import { getPlans, getSubscriptions } from '@/lib/data'

export default function AssinaturasPage() {
  return <AssinaturasClient plans={getPlans()} subscriptions={getSubscriptions()} />
}
