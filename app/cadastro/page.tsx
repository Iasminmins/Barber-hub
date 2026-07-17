import { CadastroClient } from './cadastro-client'
import { saasPlans, type SaasPlanId } from '@/lib/saas-plans'

interface CadastroPageProps {
  searchParams?: Promise<{ plano?: string }>
}

function normalizePlan(plan?: string): SaasPlanId {
  return saasPlans.some((item) => item.id === plan) ? (plan as SaasPlanId) : 'starter'
}

export default async function CadastroPage({ searchParams }: CadastroPageProps) {
  const params = await searchParams
  return <CadastroClient selectedPlanId={normalizePlan(params?.plano)} />
}
