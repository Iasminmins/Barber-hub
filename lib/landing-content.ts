/**
 * Conteúdo centralizado da landing page pública.
 *
 * Tudo que é texto, dado de demonstração ou lista repetida vive aqui, para que
 * os componentes fiquem apenas com estrutura e estilo. Nenhum dado deste
 * arquivo é usado pela plataforma interna.
 */

import type { LucideIcon } from 'lucide-react'
import {
  BarChart3,
  CalendarDays,
  Package,
  Receipt,
  Users,
  Wallet,
} from 'lucide-react'

/**
 * Rótulo curto do teste grátis usado em TODA a landing.
 *
 * A constante `FREE_TRIAL_LABEL` de `lib/saas-plans.ts` ('1 mês grátis') é
 * consumida por billing e pela plataforma e por isso não foi alterada. Aqui
 * usamos a forma "30 dias" de maneira consistente em todos os textos públicos.
 */
export const TRIAL_LABEL = '30 dias grátis'
export const TRIAL_BADGE = '30 dias grátis • Sem cartão'
export const TRIAL_REASSURANCE = ['Sem cartão', 'Cancele quando quiser', 'Suporte na implantação']

/** Rotas e links externos reais do projeto. */
export const LINKS = {
  signup: '/cadastro',
  login: '/login',
  whatsapp:
    'https://wa.me/5524998369828?text=Ol%C3%A1%2C%20gostaria%20de%20falar%20com%20o%20MeuBarberHub.',
  whatsappSupport:
    'https://wa.me/5524998369828?text=Ol%C3%A1%2C%20preciso%20de%20ajuda%20com%20o%20MeuBarberHub.',
  email: 'mailto:suportemeubarberhub@gmail.com',
  emailLabel: 'suportemeubarberhub@gmail.com',
  phoneLabel: '(24) 99836-9828',
} as const

/** CTA único e repetido em toda a página. */
export const CTA_PRIMARY = 'Começar teste grátis'
export const CTA_SECONDARY = 'Ver o sistema funcionando'

export const NAV_ITEMS = [
  { label: 'Solução', href: '#solucao' },
  { label: 'Recursos', href: '#recursos' },
  { label: 'Como funciona', href: '#como-funciona' },
  { label: 'Planos', href: '#planos' },
  { label: 'Dúvidas', href: '#duvidas' },
] as const

/* -------------------------------------------------------------------------- */
/* HERO                                                                        */
/* -------------------------------------------------------------------------- */

export const HERO = {
  badge: TRIAL_BADGE,
  headlineLead: 'Menos tempo administrando.',
  headlineHighlight: 'Mais clientes',
  headlineTail: ' na cadeira.',
  subtitle:
    'Agenda, comandas, clientes, estoque e financeiro conectados em um único sistema. Mais controle para sua barbearia crescer.',
} as const

/* -------------------------------------------------------------------------- */
/* DADOS DE DEMONSTRAÇÃO DO DASHBOARD (dentro do notebook)                      */
/* -------------------------------------------------------------------------- */

export interface DemoMetric {
  label: string
  value: string
  delta: string
  positive: boolean
  icon: LucideIcon
}

export const DEMO_METRICS: DemoMetric[] = [
  { label: 'Receita do mês', value: 'R$ 18.640', delta: '+12,4%', positive: true, icon: Wallet },
  { label: 'Agendamentos', value: '126', delta: '+18', positive: true, icon: CalendarDays },
  { label: 'Ticket médio', value: 'R$ 74,90', delta: '+3,1%', positive: true, icon: Receipt },
  { label: 'Clientes recorrentes', value: '68%', delta: '+5 pts', positive: true, icon: Users },
]

/** Faturamento diário — altura em % para as barras do gráfico. */
export const DEMO_REVENUE_BARS = [
  { day: '01', height: 38 },
  { day: '04', height: 52 },
  { day: '07', height: 44 },
  { day: '10', height: 67 },
  { day: '13', height: 58 },
  { day: '16', height: 81 },
  { day: '19', height: 63 },
  { day: '22', height: 74 },
  { day: '25', height: 92 },
  { day: '28', height: 70 },
  { day: '30', height: 84 },
]

export interface DemoAppointment {
  time: string
  client: string
  initials: string
  service: string
  professional: string
  status: 'Confirmado' | 'Aguardando' | 'Em atendimento'
}

/** Agenda do dia — usada no dashboard e, resumida, na tela do celular. */
export const DEMO_AGENDA: DemoAppointment[] = [
  {
    time: '09:00',
    client: 'Carlos Henrique',
    initials: 'CH',
    service: 'Corte degradê',
    professional: 'Diego',
    status: 'Confirmado',
  },
  {
    time: '10:00',
    client: 'Matheus Silva',
    initials: 'MS',
    service: 'Corte + barba',
    professional: 'Diego',
    status: 'Aguardando',
  },
  {
    time: '11:30',
    client: 'Rafael Costa',
    initials: 'RC',
    service: 'Barba completa',
    professional: 'Bruno',
    status: 'Confirmado',
  },
  {
    time: '13:00',
    client: 'Anderson Lima',
    initials: 'AL',
    service: 'Corte social',
    professional: 'Bruno',
    status: 'Em atendimento',
  },
]

export const DEMO_PHONE_DATE = 'Terça, 12 de agosto'
export const DEMO_PHONE_PROFESSIONAL = 'Diego Martins'

/** Painéis auxiliares do dashboard. */
export const DEMO_EXPIRING_PLANS = [
  { name: 'Lucas Ferreira', plan: 'Mensal Barba', due: 'vence em 2 dias' },
  { name: 'Pedro Alves', plan: 'Corte Ilimitado', due: 'vence em 4 dias' },
  { name: 'Thiago Nunes', plan: 'Mensal Completo', due: 'vence em 6 dias' },
]

export const DEMO_LOW_STOCK = [
  { name: 'Pomada modeladora', left: '3 un.' },
  { name: 'Óleo para barba', left: '2 un.' },
  { name: 'Shampoo anticaspa', left: '5 un.' },
]

export const DEMO_OPEN_TABS = [
  { client: 'Anderson Lima', value: 'R$ 68,00', items: '2 itens' },
  { client: 'Vitor Machado', value: 'R$ 125,00', items: '4 itens' },
]

/* -------------------------------------------------------------------------- */
/* CARDS FLUTUANTES DO HERO                                                    */
/* -------------------------------------------------------------------------- */

export const FLOATING_CARDS = [
  { title: 'Novo agendamento', detail: 'Carlos agendou para 14:30', tone: 'neutral' as const },
  { title: 'Pagamento aprovado', detail: 'R$ 85,00', tone: 'success' as const },
  { title: 'Cliente recorrente', detail: 'Lucas completou 6 visitas', tone: 'gold' as const },
]

/* -------------------------------------------------------------------------- */
/* BARRA DE BENEFÍCIOS (substitui PDV / CRM / BI)                              */
/* -------------------------------------------------------------------------- */

export interface TrustItem {
  title: string
  description: string
  icon: LucideIcon
}

export const TRUST_ITEMS: TrustItem[] = [
  {
    title: 'Agenda inteligente',
    description: 'Horários, encaixes e confirmações sem depender de mensagem solta.',
    icon: CalendarDays,
  },
  {
    title: 'Comandas e pagamentos',
    description: 'Do serviço ao fechamento do caixa em poucos toques.',
    icon: Receipt,
  },
  {
    title: 'Clientes que retornam',
    description: 'Histórico, preferências e planos recorrentes sempre à mão.',
    icon: Users,
  },
  {
    title: 'Controle financeiro',
    description: 'Receita, comissões e ticket médio atualizados por período.',
    icon: BarChart3,
  },
]

/* -------------------------------------------------------------------------- */
/* TOUR DO PRODUTO — abas                                                      */
/* -------------------------------------------------------------------------- */

export type ProductTourId = 'agenda' | 'comandas' | 'clientes' | 'estoque' | 'financeiro'

export interface ProductTourTab {
  id: ProductTourId
  label: string
  icon: LucideIcon
  problem: string
  title: string
  description: string
  features: string[]
}

export const PRODUCT_TOUR: ProductTourTab[] = [
  {
    id: 'agenda',
    label: 'Agenda',
    icon: CalendarDays,
    problem: 'Horários combinados no WhatsApp e anotados de cabeça.',
    title: 'Organize horários sem depender de mensagens perdidas.',
    description:
      'Visualize profissionais, serviços, duração, status e disponibilidade em um só lugar.',
    features: [
      'Visão diária e semanal',
      'Status do atendimento',
      'Encaixes',
      'Histórico',
      'Confirmação',
      'Filtros por profissional',
    ],
  },
  {
    id: 'comandas',
    label: 'Comandas',
    icon: Receipt,
    problem: 'Comanda aberta que ninguém sabe se foi paga.',
    title: 'Feche cada atendimento com serviço, produto e pagamento juntos.',
    description:
      'A comanda acompanha o atendimento do início ao fim e alimenta o caixa automaticamente.',
    features: [
      'Serviços e produtos na mesma conta',
      'Descontos',
      'Múltiplas formas de pagamento',
      'Comandas pendentes destacadas',
      'Ticket médio por período',
    ],
  },
  {
    id: 'clientes',
    label: 'Clientes',
    icon: Users,
    problem: 'Cliente some e ninguém percebe a tempo.',
    title: 'Saiba quem volta, quem sumiu e o que cada um prefere.',
    description:
      'Histórico completo, preferências, aniversários e planos recorrentes em uma ficha única.',
    features: [
      'Ficha com histórico completo',
      'Clientes inativos em destaque',
      'Aniversariantes do mês',
      'Planos e pacotes vinculados',
      'Observações da equipe',
    ],
  },
  {
    id: 'estoque',
    label: 'Estoque',
    icon: Package,
    problem: 'O produto acaba antes de alguém notar.',
    title: 'Acompanhe produtos sem contar prateleira toda semana.',
    description:
      'Entradas, saídas e alertas de estoque baixo conectados às vendas das comandas.',
    features: [
      'Baixa automática pela comanda',
      'Alerta de estoque mínimo',
      'Entradas e saídas',
      'Custo e margem por produto',
    ],
  },
  {
    id: 'financeiro',
    label: 'Financeiro',
    icon: BarChart3,
    problem: 'Faturamento só aparece no fim do mês, no chute.',
    title: 'Enxergue receita, comissões e resultados por período.',
    description:
      'Indicadores prontos para decidir preço, escala e investimento sem montar planilha.',
    features: [
      'Receita por período',
      'Comissões por profissional',
      'Entradas e saídas',
      'Ticket médio',
      'Relatórios exportáveis',
    ],
  },
]

/* -------------------------------------------------------------------------- */
/* SEÇÃO DO PROBLEMA — antes e depois                                          */
/* -------------------------------------------------------------------------- */

export const PROBLEM_BEFORE = [
  'Agendamentos espalhados no WhatsApp',
  'Horários esquecidos e encaixes no papel',
  'Comandas pendentes sem ninguém saber',
  'Estoque conferido na base do olho',
  'Clientes que somem e ninguém percebe',
  'Faturamento só no fim do mês, no chute',
  'Comissão calculada na calculadora',
  'Informações em planilhas diferentes',
]

export const PROBLEM_AFTER = [
  'Agenda centralizada, com status de cada horário',
  'Comandas organizadas e fechadas no caixa',
  'Clientes acompanhados por histórico e plano',
  'Estoque com baixa automática e alerta',
  'Financeiro atualizado a cada atendimento',
  'Comissões calculadas junto com a venda',
  'Indicadores prontos, sem montar planilha',
]

/* -------------------------------------------------------------------------- */
/* FLUXO DA OPERAÇÃO                                                           */
/* -------------------------------------------------------------------------- */

export const WORKFLOW_STEPS = [
  {
    title: 'Agendamento',
    text: 'O horário entra na agenda com cliente, serviço e profissional definidos.',
    sample: '09:00 • Corte degradê',
  },
  {
    title: 'Atendimento',
    text: 'A equipe marca o início e o status muda em tempo real para todo mundo.',
    sample: 'Em atendimento',
  },
  {
    title: 'Comanda',
    text: 'Serviços e produtos entram na mesma conta, com desconto quando houver.',
    sample: 'Corte + pomada',
  },
  {
    title: 'Pagamento',
    text: 'O fechamento registra a forma de pagamento e alimenta o caixa do dia.',
    sample: 'Pix • R$ 68,00',
  },
  {
    title: 'Relacionamento',
    text: 'A visita vira histórico e atualiza o plano recorrente do cliente.',
    sample: '6ª visita • Mensal',
  },
  {
    title: 'Indicadores',
    text: 'Receita, ticket médio e comissões se atualizam sem trabalho manual.',
    sample: 'Ticket: R$ 74,90',
  },
]

/* -------------------------------------------------------------------------- */
/* FAQ                                                                         */
/* -------------------------------------------------------------------------- */

export interface FaqItem {
  question: string
  answer: string
  /** true = resposta que ainda precisa de validação do time antes de publicar. */
  needsReview?: boolean
}

export const FAQ_ITEMS: FaqItem[] = [
  {
    question: 'Preciso instalar algum programa?',
    answer:
      'Não. O MeuBarberHub roda direto no navegador. Você acessa com seu login, sem instalar nada e sem depender de um computador específico.',
  },
  {
    question: 'O sistema funciona no celular?',
    answer:
      'Sim. A interface se adapta ao tamanho da tela, então dá para consultar a agenda, abrir comanda e acompanhar o movimento pelo celular ou tablet.',
  },
  {
    question: 'Preciso cadastrar cartão para testar?',
    answer:
      'Não. O teste de 30 dias começa sem cartão e nenhuma cobrança é feita durante esse período.',
  },
  {
    question: 'Posso cancelar quando quiser?',
    answer:
      'Sim. O cancelamento é feito por você mesmo em Configurações, sem multa e sem fidelidade. Não há novas cobranças e o acesso continua até o fim do período já pago.',
  },
  {
    question: 'Consigo testar antes de contratar?',
    answer:
      'Sim. Você pode criar sua conta, cadastrar sua barbearia e testar o fluxo completo com seus próprios dados.',
  },
  {
    question: 'Consigo importar meus clientes e produtos?',
    answer:
      'Nos planos Pro e Premium a importação e exportação entram como recurso do plano. No Premium ela pode ser acompanhada durante a implantação.',
  },
  {
    question: 'O sistema funciona em mais de uma unidade?',
    answer:
      'Sim. O plano Premium é pensado para multiunidade, com visão da operação por barbearia.',
  },
  {
    question: 'Existe suporte durante a implantação?',
    answer:
      'O Starter conta com suporte por e-mail e o Pro com atendimento prioritário. O Premium inclui implantação assistida.',
  },
]

/* -------------------------------------------------------------------------- */
/* BENEFÍCIOS — resultados práticos, sem estatística inventada                  */
/* -------------------------------------------------------------------------- */

export interface Benefit {
  /** Situação do dia a dia que gera o problema. */
  context: string
  /** O que muda na prática. */
  title: string
  consequence: string
  /** Rótulo da tela do sistema que resolve isso. */
  screen: string
}

export const BENEFITS: Benefit[] = [
  {
    context: 'Horário combinado por mensagem e anotado depois',
    title: 'Menos horários perdidos',
    consequence:
      'Com a agenda como fonte única, o encaixe não some e o cliente não fica sem confirmação.',
    screen: 'Agenda › visão do dia',
  },
  {
    context: 'Fechamento conferido na memória e na calculadora',
    title: 'Caixa fechado com o dia inteiro conferido',
    consequence:
      'Cada comanda paga já entra no caixa, então o fechamento vira conferência e não reconstrução.',
    screen: 'Financeiro › caixa do dia',
  },
  {
    context: 'Cliente que sumiu e ninguém percebeu',
    title: 'Histórico centralizado de cada cliente',
    consequence:
      'Preferências, visitas e plano ficam na mesma ficha, visíveis para quem estiver atendendo.',
    screen: 'Clientes › ficha completa',
  },
  {
    context: 'Produto que acaba no meio do atendimento',
    title: 'Estoque acompanhado sem conferir prateleira',
    consequence:
      'A venda na comanda dá baixa sozinha e o alerta aparece antes do produto acabar.',
    screen: 'Estoque › alertas',
  },
  {
    context: 'Comissão calculada à mão no fim do mês',
    title: 'Comissões calculadas junto com a venda',
    consequence:
      'O valor de cada profissional acompanha o atendimento, sem planilha paralela no fechamento.',
    screen: 'Financeiro › comissões',
  },
  {
    context: 'Decisão tomada sem saber o número real',
    title: 'Mais clareza para decidir',
    consequence:
      'Receita, ticket médio e recorrência ficam disponíveis por período, prontos para comparar.',
    screen: 'Relatórios › por período',
  },
]


/* -------------------------------------------------------------------------- */
/* PROVA SOCIAL                                                                */
/* -------------------------------------------------------------------------- */

/**
 * Depoimentos que já estavam publicados na landing anterior, preservados.
 *
 * Duas observações importantes:
 *
 * 1. As cinco estrelas que apareciam antes NÃO foram mantidas. Estrela é uma
 *    nota atribuída por alguém; sem origem verificável, publicar isso é
 *    afirmar um fato que não se sustenta. Para exibi-las, preencha `rating`
 *    com a avaliação real — o componente só renderiza estrelas se o campo
 *    existir.
 *
 * 2. Dois dos três autores são cargos genéricos ("Gestor de barbearia",
 *    "Líder de atendimento"), o que enfraquece a prova social. Substituir por
 *    nome, barbearia e cidade reais aumenta bastante a credibilidade — basta
 *    preencher `barbershop` e `city`.
 */
export const TESTIMONIALS_READY = true

export interface Testimonial {
  quote: string
  name: string
  /** Função do autor. Usada quando não há barbearia/cidade informadas. */
  role?: string
  barbershop?: string
  city?: string
  result?: string
  /** Preencher SOMENTE com avaliação real. Sem isso, não há estrelas. */
  rating?: number
  initials: string
  photo?: string
  placeholder?: boolean
}

export const TESTIMONIALS: Testimonial[] = [
  {
    quote:
      'Antes eu só sabia o movimento pelo caixa do fim do dia. Agora vejo agenda, comandas e planos no mesmo lugar.',
    name: 'Gestor de barbearia',
    role: 'Operação e financeiro',
    initials: 'GB',
  },
  {
    quote:
      'O melhor é conseguir acompanhar comissão e estoque sem ficar perguntando para todo mundo.',
    name: 'Renata Costa',
    role: 'Gerente operacional',
    initials: 'RC',
  },
  {
    quote:
      'A parte de planos ajuda a não deixar cliente recorrente sumir. O alerta de vencimento é simples e resolve.',
    name: 'Líder de atendimento',
    role: 'Agenda e relacionamento',
    initials: 'LA',
  },
]
