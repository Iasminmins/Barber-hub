import { describe, expect, test } from 'vitest'
import { buildSupportWhatsAppUrl } from './support-contact'

describe('buildSupportWhatsAppUrl', () => {
  test('builds a WhatsApp support URL with the encoded message', () => {
    expect(buildSupportWhatsAppUrl('Preciso de ajuda com o link público')).toBe(
      'https://wa.me/5524998369828?text=Preciso%20de%20ajuda%20com%20o%20link%20p%C3%BAblico',
    )
  })
})
