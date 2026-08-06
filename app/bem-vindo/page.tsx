import { BemVindoClient } from './bem-vindo-client'
import { saasPlans, type SaasPlanId } from '@/lib/saas-plans'

interface BemVindoPageProps {
  searchParams?: Promise<{ plano?: string; nome?: string }>
}

function normalizePlan(plan?: string): SaasPlanId {
  return saasPlans.some((item) => item.id === plan) ? (plan as SaasPlanId) : 'starter'
}

export default async function BemVindoPage({ searchParams }: BemVindoPageProps) {
  const params = await searchParams
  return <BemVindoClient planId={normalizePlan(params?.plano)} shopName={params?.nome ?? ''} />
}
