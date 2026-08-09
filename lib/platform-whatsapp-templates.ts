import { firstName } from './whatsapp'

export type QuickTemplate = {
  id: string
  label: string
  /** Status de conta em que este modelo faz mais sentido — usado só para ordenar/sugerir. */
  suggestedFor?: 'trialing' | 'active' | 'past_due' | 'canceled'
  body: string
}

/**
 * Modelos prontos para envio manual pelo WhatsApp.
 * O corpo aceita as mesmas variáveis do editor ({{nome_responsavel}}, {{nome_barbearia}}, …),
 * substituídas por contato no momento em que o link do wa.me é montado.
 */
export const QUICK_TEMPLATES: QuickTemplate[] = [
  {
    id: 'boas_vindas',
    label: 'Boas-vindas',
    suggestedFor: 'trialing',
    body: [
      'Olá, {{nome_responsavel}}! Tudo bem? 💈',
      '',
      'Aqui é da equipe Barber Hub. Passando para dar as boas-vindas à {{nome_barbearia}} na plataforma!',
      'Já pode cadastrar seus serviços, sua equipe e começar a usar a agenda hoje mesmo.',
      '',
      'Se travar em qualquer passo, me chama por aqui que eu ajudo.',
    ].join('\n'),
  },
  {
    id: 'ajuda_configuracao',
    label: 'Ajuda na configuração',
    suggestedFor: 'trialing',
    body: [
      'Olá, {{nome_responsavel}}! Tudo bem? 💈',
      '',
      'Vi que a {{nome_barbearia}} começou a usar o Barber Hub. Quer que eu te ajude a deixar tudo configurado?',
      'Em uns 10 minutos a gente ajusta serviços, horários e a equipe.',
      '',
      'Me diz um horário bom para você que eu chamo.',
    ].join('\n'),
  },
  {
    id: 'teste_acabando',
    label: 'Teste acabando',
    suggestedFor: 'trialing',
    body: [
      'Olá, {{nome_responsavel}}! Tudo bem? 💈',
      '',
      'Passando para avisar que o período de teste da {{nome_barbearia}} termina em {{dias_restantes}} dia(s).',
      'Para não perder a agenda e o histórico já cadastrados, é só ativar a assinatura antes do fim do prazo.',
      '',
      'Quer que eu te mostre as opções de plano?',
    ].join('\n'),
  },
  {
    id: 'teste_expirado',
    label: 'Teste expirado',
    suggestedFor: 'trialing',
    body: [
      'Olá, {{nome_responsavel}}! Tudo bem? 💈',
      '',
      'O período de teste da {{nome_barbearia}} chegou ao fim, mas seus dados continuam guardados aqui.',
      'Se quiser retomar, consigo reativar o acesso do jeito que você deixou.',
      '',
      'Me avisa que eu resolvo por aqui!',
    ].join('\n'),
  },
  {
    id: 'cobranca_atraso',
    label: 'Cobrança em atraso',
    suggestedFor: 'past_due',
    body: [
      'Olá, {{nome_responsavel}}! Tudo bem? 💈',
      '',
      'Passando para avisar que a assinatura da {{nome_barbearia}} está com pagamento pendente (vencimento em {{data_vencimento}}).',
      'Consigo te enviar uma nova via ou trocar a forma de pagamento, o que for melhor.',
      '',
      'Me diz como prefere que eu já providencio.',
    ].join('\n'),
  },
  {
    id: 'renovacao',
    label: 'Renovação próxima',
    suggestedFor: 'active',
    body: [
      'Olá, {{nome_responsavel}}! Tudo bem? 💈',
      '',
      'Só um lembrete: a renovação do plano {{plano}} da {{nome_barbearia}} está prevista para {{data_vencimento}}.',
      'Não precisa fazer nada — é só deixar o pagamento em dia que a conta segue normalmente.',
      '',
      'Qualquer dúvida, é só chamar!',
    ].join('\n'),
  },
  {
    id: 'reativacao',
    label: 'Reativação',
    suggestedFor: 'canceled',
    body: [
      'Olá, {{nome_responsavel}}! Tudo bem? 💈',
      '',
      'Aqui é da equipe Barber Hub. Vi que a assinatura da {{nome_barbearia}} está cancelada.',
      'Se quiser voltar, consigo reativar sua conta com todos os dados que já estavam salvos.',
      '',
      'Posso preparar isso para você?',
    ].join('\n'),
  },
  {
    id: 'relacionamento',
    label: 'Como está indo?',
    suggestedFor: 'active',
    body: [
      'Olá, {{nome_responsavel}}! Tudo bem? 💈',
      '',
      'Passando para saber como está sendo a experiência da {{nome_barbearia}} com o Barber Hub.',
      'Tem funcionado bem no dia a dia? Alguma coisa que você sente falta?',
      '',
      'Seu retorno ajuda a gente a melhorar a plataforma!',
    ].join('\n'),
  },
  {
    id: 'novidade',
    label: 'Novidade na plataforma',
    body: [
      'Olá, {{nome_responsavel}}! Tudo bem? 💈',
      '',
      'Temos novidade no Barber Hub e queria te contar em primeira mão.',
      'Acabamos de liberar melhorias que deixam o dia a dia da {{nome_barbearia}} ainda mais simples.',
      '',
      'Quer que eu te mostre como usar?',
    ].join('\n'),
  },
  {
    id: 'indicacao',
    label: 'Pedido de indicação',
    suggestedFor: 'active',
    body: [
      'Olá, {{nome_responsavel}}! Tudo bem? 💈',
      '',
      'Que bom ter a {{nome_barbearia}} com a gente!',
      'Se você conhece outro dono de barbearia que também precisa organizar agenda e financeiro, sua indicação ajuda demais.',
      '',
      'É só me passar o contato que eu falo com ele. Obrigado! 🙏',
    ].join('\n'),
  },
  {
    id: 'feedback',
    label: 'Pedir avaliação',
    suggestedFor: 'active',
    body: [
      'Olá, {{nome_responsavel}}! Tudo bem? 💈',
      '',
      'De 0 a 10, que nota você daria para o Barber Hub na rotina da {{nome_barbearia}}?',
      'Pode ser sincero — é com esse retorno que a gente decide o que melhorar primeiro.',
      '',
      'Obrigado pela ajuda! 🙏',
    ].join('\n'),
  },
]

export type SituationalContact = {
  ownerName: string
  barbershopName: string
  plan: string
  billingStatus: string
  trialEndsAt?: string | null
  nextBillingDate?: string | null
}

function daysFromToday(iso?: string | null) {
  if (!iso) return null
  const target = new Date(iso.length <= 10 ? `${iso}T00:00:00` : iso)
  if (Number.isNaN(target.getTime())) return null
  target.setHours(0, 0, 0, 0)
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  return Math.round((target.getTime() - today.getTime()) / 86400000)
}

function planLabel(plan: string) {
  return plan ? plan.charAt(0).toUpperCase() + plan.slice(1) : 'Barber Hub'
}

function deadlineText(days: number | null) {
  if (days === null) return ''
  if (days > 1) return `faltam ${days} dias`
  if (days === 1) return 'falta 1 dia'
  if (days === 0) return 'termina hoje'
  return `terminou há ${Math.abs(days)} ${Math.abs(days) === 1 ? 'dia' : 'dias'}`
}

/**
 * Mensagem padrão de WhatsApp para envio manual, escolhida pelo status da conta.
 * Usada quando o admin dispara o contato sem escrever nada no campo de mensagem.
 */
export function situationalWhatsAppMessage(contact: SituationalContact) {
  const name = firstName(contact.ownerName || 'tudo bem')
  const shop = contact.barbershopName

  if (contact.billingStatus === 'trialing') {
    const remaining = deadlineText(daysFromToday(contact.trialEndsAt))
    return [
      `Olá, ${name}! Tudo bem? 💈`,
      '',
      `Aqui é da equipe Barber Hub. Vi que a ${shop} está no período de teste${remaining ? ` e ${remaining}` : ''}.`,
      'Posso ajudar a configurar alguma coisa ou tirar dúvidas antes de você decidir?',
      '',
      'Fico à disposição!',
    ].join('\n')
  }

  if (contact.billingStatus === 'past_due') {
    const overdue = deadlineText(daysFromToday(contact.nextBillingDate))
    return [
      `Olá, ${name}! Tudo bem? 💈`,
      '',
      `Passando para avisar que a assinatura da ${shop} está com pagamento pendente${overdue ? ` — ${overdue}` : ''}.`,
      'Se precisar de uma nova via do boleto ou quiser trocar a forma de pagamento, é só me chamar.',
      '',
      'Um abraço da equipe Barber Hub!',
    ].join('\n')
  }

  if (contact.billingStatus === 'canceled') {
    return [
      `Olá, ${name}! Tudo bem? 💈`,
      '',
      `Aqui é da equipe Barber Hub. Vi que a assinatura da ${shop} está cancelada.`,
      'Se quiser retomar, consigo reativar sua conta com todos os dados que já estavam salvos.',
      '',
      'Qualquer coisa, é só responder por aqui!',
    ].join('\n')
  }

  const nextBilling = daysFromToday(contact.nextBillingDate)
  const renewal = nextBilling !== null && nextBilling >= 0 && nextBilling <= 7
    ? ` Sua renovação do plano ${planLabel(contact.plan)} ${deadlineText(nextBilling)}.`
    : ''

  return [
    `Olá, ${name}! Tudo bem? 💈`,
    '',
    `Aqui é da equipe Barber Hub. Passando para saber como está a experiência da ${shop} com a plataforma.${renewal}`,
    'Se tiver qualquer sugestão ou precisar de ajuda, é só me chamar por aqui.',
    '',
    'Um abraço!',
  ].join('\n')
}
