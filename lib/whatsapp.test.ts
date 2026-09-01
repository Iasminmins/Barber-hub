import { describe, expect, test } from 'vitest'
import { orderMessage } from './whatsapp'

describe('orderMessage', () => {
  test('termina a mensagem com avaliação, indicação e agradecimento', () => {
    const message = orderMessage({
      clientName: 'Andres Silva',
      orderNumber: 1994,
      items: [{ name: '[Assinatura] Plano Cabelo e Barba', quantity: 1, unitPrice: 129.9 }],
      discount: 0,
      surcharge: 0,
      total: 129.9,
      payment: 'Pix',
      status: 'Paga',
      barbershopName: 'Duke Barber',
    })

    expect(message).toMatch(/Obrigado pela preferência!\n\nDe 0 a 10, qual nota você daria para o nosso atendimento\?\n\nSe gostou da experiência, sua indicação para amigos e familiares será muito bem-vinda\. Ela nos ajuda a crescer e atender cada vez melhor\.\n\nMuito obrigado pela confiança! 🙏$/)
  })

  test('informa o cashback gerado quando a comanda tem cashback', () => {
    const message = orderMessage({
      clientName: 'Marco Pai do Matheus',
      orderNumber: 2358,
      items: [{ name: 'Produto', quantity: 1, unitPrice: 70 }],
      discount: 0,
      surcharge: 0,
      total: 70,
      payment: 'Pix',
      status: 'Paga',
      barbershopName: 'Duke Barber',
      cashbackEarned: 3.5,
    })

    expect(message).toMatch(/🎁 \*CASHBACK GERADO: R\$\s*3,50\*/)
  })
})
