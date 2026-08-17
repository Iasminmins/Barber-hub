export function formatLastMessageSentAt(value?: string) {
  if (!value) return 'Nunca enviada'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return 'Nunca enviada'
  return `${date.toLocaleDateString('pt-BR')} às ${date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}`
}

