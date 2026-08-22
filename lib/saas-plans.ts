export type SaasPlanId = 'solo' | 'starter' | 'pro' | 'premium'

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
    id: 'solo',
    name: 'Solo',
    price: 'R$ 49,90',
    monthlyPrice: 49.9,
    shortDescription: 'Para barbearias com 1 a 2 barbeiros, sem complicação.',
    description: 'O essencial para uma operação pequena começar organizada.',
    users: '1 a 2 barbeiros',
    units: '1 unidade',
    support: 'E-mail',
    reports: 'Essenciais',
    assistant: '20 perguntas/usuário',
    items: ['Gestão essencial', '1 unidade', '1 a 2 barbeiros', '20 perguntas do assistente por usuário'],
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
    id: 'starter',
    name: 'Starter',
    price: 'R$ 89',
    monthlyPrice: 89,
    shortDescription: 'Gestão essencial para começar com organização e controle.',
    description: 'Gestão essencial para uma barbearia começar com organização e controle.',
    users: '3 a 5 usuários',
    units: '1 unidade',
    support: 'E-mail',
    reports: 'Essenciais',
    assistant: '20 perguntas/usuário',
    items: ['Gestão essencial', '1 unidade', '3 a 5 usuários', '20 perguntas do assistente por usuário'],
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
    users: 'Até 15 usuários',
    units: 'Até 3 unidades',
    support: 'Prioritário + implantação',
    reports: 'Avançados por unidade',
    assistant: '150 perguntas/usuário',
    items: ['Sistema completo', 'Multiunidade', 'Até 15 usuários', 'Assistente inteligente com 150 perguntas por usuário'],
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
  ['Usuários da equipe', '1 a 2 barbeiros', '3 a 5 usuários', 'Até 8 usuários', 'Até 15 usuários'],
  ['Relatórios', 'Essenciais', 'Avançados por período', 'Avançados por unidade'],
  ['Assistente inteligente', '20 perguntas/usuário', '50 perguntas/usuário', '150 perguntas/usuário'],
  ['Comissões', 'Controle completo', 'Controle completo', 'Controle completo'],
  ['Importação e exportação', 'Não incluído', 'Incluído', 'Incluído com acompanhamento'],
  ['Suporte', 'E-mail', 'Prioritário', 'Prioritário + implantação'],
]

export function getSaasPlan(planId: SaasPlanId) {
  return saasPlans.find((plan) => plan.id === planId) ?? saasPlans.find((plan) => plan.id === 'starter')!
}

export function canUsePlanFeature(planId: SaasPlanId, feature: SaasFeature) {
  return getSaasPlan(planId).features[feature]
}
