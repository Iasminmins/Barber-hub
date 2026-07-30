export function normalizeWhatsAppPhone(phone: string) {
  const digits = phone.replace(/\D/g, '')
  if (!digits) return ''
  return digits.length <= 11 ? `55${digits}` : digits
}

export function firstName(name: string) {
  return name.trim().split(/\s+/)[0] || name.trim()
}

export function birthdayMessage(name: string, barbershopName = 'Duke Barber') {
  return `Olá, ${firstName(name)}! 🎉
Passando para desejar um feliz aniversário! Que seu novo ciclo seja cheio de saúde, conquistas e bons momentos. 🎂✨
Um grande abraço de toda a equipe ${barbershopName}! 💈`
}

export function renewalMessage(
  name: string,
  planName: string,
  dueInDays: number,
  barbershopName = 'Duke Barber',
) {
  const dueText = dueInDays === 0
    ? 'vence hoje'
    : dueInDays > 0
      ? `vence em ${dueInDays} ${dueInDays === 1 ? 'dia' : 'dias'}`
      : `venceu há ${Math.abs(dueInDays)} ${Math.abs(dueInDays) === 1 ? 'dia' : 'dias'}`

  return `Olá, ${firstName(name)}! Tudo bem? 💈
Passando para avisar que seu plano ${planName} ${dueText}.
Que tal renovar para continuar aproveitando todos os benefícios? Estamos à disposição para ajudar! 😊
Um abraço da equipe ${barbershopName}!`
}

export function whatsappUrl(phone: string, message?: string) {
  const normalizedPhone = normalizeWhatsAppPhone(phone)
  if (!normalizedPhone) return ''
  const query = message ? `?text=${encodeURIComponent(message)}` : ''
  return `https://wa.me/${normalizedPhone}${query}`
}

export function orderMessage({
  clientName,
  orderNumber,
  items,
  discount,
  surcharge,
  total,
  payment,
  status,
  barbershopName,
}: {
  clientName: string
  orderNumber: number
  items: { name: string; quantity: number; unitPrice: number }[]
  discount: number
  surcharge: number
  total: number
  payment: string
  status: string
  barbershopName: string
}) {
  const currency = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' })
  const itemLines = items.map((item) => (
    `• ${item.quantity}x ${item.name} — ${currency.format(item.quantity * item.unitPrice)}`
  ))
  const adjustments = [
    discount > 0 ? `Desconto: -${currency.format(discount)}` : '',
    surcharge > 0 ? `Acréscimo: ${currency.format(surcharge)}` : '',
  ].filter(Boolean)

  return [
    `Olá, ${firstName(clientName)}! Tudo bem? 💈`,
    '',
    `Segue o resumo da sua comanda #${orderNumber} na ${barbershopName}:`,
    '',
    ...itemLines,
    ...adjustments,
    '',
    `*Total: ${currency.format(total)}*`,
    `Pagamento: ${payment}`,
    `Status: ${status}`,
    '',
    'Obrigado pela preferência!',
  ].join('\n')
}
