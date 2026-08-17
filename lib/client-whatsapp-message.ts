export function buildClientWhatsAppMessage(input: {
  clientName: string
  barbershopName: string
  bookingUrl: string
  isNoReturn: boolean
}) {
  if (!input.isNoReturn) {
    return `Olá, ${input.clientName}! Tudo bem? Passando para lembrar que aqui na ${input.barbershopName} temos horários disponíveis hoje e nos próximos dias. Será um prazer receber você novamente!`
  }

  return `Olá, ${input.clientName.split(/\s+/)[0]}! Tudo bem? Sentimos sua falta aqui na ${input.barbershopName}. Já faz um tempo desde sua última visita e gostaríamos de receber você novamente.\n\nAgende seu próximo horário pelo nosso link:\n${input.bookingUrl}\n\nSerá um prazer cuidar do seu visual novamente!`
}

