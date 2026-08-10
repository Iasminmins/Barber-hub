export type SaasPlanId = 'starter' | 'pro' | 'premium'

export type SaasFeature =
  | 'coreSystem'
  | 'appointments'
  | 'subscriptions'
  | 'commissions'
  | 'advancedReports'
  | 'importExport'
  | 'multiUnit'
  | 'assistedOnboarding'

export interface SaasPlan {
  id: SaasPlanId
  name: string
  price: string
  monthlyPrice: number
  shortDescription: string
  description: string
  users: string
  units: string
  support: string
  reports: string
  assistant: string
  items: string[]
  featured?: boolean
  features: Record<SaasFeature, boolean>
}

export const FREE_TRIAL_DAYS = 30
export const FREE_TRIAL_LABEL = '1 mês grátis'
export const FREE_TRIAL_DESCRIPTION = 'Teste grátis por 30 dias. Nenhuma cobrança é feita durante esse período.'

export const saasPlans: SaasPlan[] = [
  {
    id: 'starter',
    name: 'Starter',
    price: 'R$ 89',
    monthlyPrice: 89,
    shortDescription: 'Gestão essencial para começar com organização e controle.',
    description: 'Gestão essencial para uma barbearia começar com organização e controle.',
    users: 'Até 3 usuários',
    units: '1 unidade',
    support: 'E-mail',
    reports: 'Essenciais',
    assistant: '20 perguntas/usuário',
    items: ['Gestão essencial', '1 unidade', 'Até 3 usuários', '20 perguntas do assistente por usuário'],
    features: {
      coreSystem: true,
      appointments: true,
      subscriptions: true,
      commissions: true,
      advancedReports: false,
      importExport: false,
      multiUnit: false,
      assistedOnboarding: false,
    },
  },
  {
    id: 'pro',
    name: 'Pro',
    price: 'R$ 149',
    monthlyPrice: 149,
    shortDescription: 'Mais acessos, importação e relatórios para a equipe.',
    description: 'Para equipes que precisam de mais acessos, comissões e operação mais acompanhada.',
    users: 'Até 8 usuários',
    units: '1 unidade',
    support: 'Prioritário',
    reports: 'Avançados por período',
    assistant: '50 perguntas/usuário',
    items: ['Sistema completo', 'Até 8 usuários', 'Assistente inteligente com 50 perguntas por usuário', 'Importação, exportação e relatórios avançados'],
    featured: true,
    features: {
      coreSystem: true,
      appointments: true,
      subscriptions: true,
      commissions: true,
      advancedReports: true,
      importExport: true,
      multiUnit: false,
      assistedOnboarding: false,
    },
  },
  {
    id: 'premium',
    name: 'Premium',
    price: 'R$ 249',
    monthlyPrice: 249,
    shortDescription: 'Escala para redes, multiunidade e implantação assistida.',
    description: 'Para barbearias maiores, redes ou operações que precisam escalar com suporte.',
    users: 'Ilimitado',
    units: 'Até 3 unidades',
    support: 'Prioritário + implantação',
    reports: 'Avançados por unidade',
    assistant: '150 perguntas/usuário',
    items: ['Sistema completo', 'Multiunidade', 'Usuários ilimitados', 'Assistente inteligente com 150 perguntas por usuário'],
    features: {
      coreSystem: true,
      appointments: true,
      subscriptions: true,
      commissions: true,
      advancedReports: true,
      importExport: true,
      multiUnit: true,
      assistedOnboarding: true,
    },
  },
]

export const planComparisonRows = [
  ['Teste grátis para novos usuários', FREE_TRIAL_LABEL, FREE_TRIAL_LABEL, FREE_TRIAL_LABEL],
  ['Sistema principal', 'Completo', 'Completo', 'Completo'],
  ['Agenda, clientes e comandas', 'Incluído', 'Incluído', 'Incluído'],
  ['Planos, pacotes e créditos', 'Incluído', 'Incluído', 'Incluído'],
  ['Unidades', '1 unidade', '1 unidade', 'Até 3 unidades'],
  ['Usuários da equipe', 'Até 3 usuários', 'Até 8 usuários', 'Ilimitado'],
  ['Relatórios', 'Essenciais', 'Avançados por período', 'Avançados por unidade'],
  ['Assistente inteligente', '20 perguntas/usuário', '50 perguntas/usuário', '150 perguntas/usuário'],
  ['Comissões', 'Controle completo', 'Controle completo', 'Controle completo'],
  ['Importação e exportação', 'Não incluído', 'Incluído', 'Incluído com acompanhamento'],
  ['Suporte', 'E-mail', 'Prioritário', 'Prioritário + implantação'],
]

export function getSaasPlan(planId: SaasPlanId) {
  return saasPlans.find((plan) => plan.id === planId) ?? saasPlans[0]
}

export function canUsePlanFeature(planId: SaasPlanId, feature: SaasFeature) {
  return getSaasPlan(planId).features[feature]
}
