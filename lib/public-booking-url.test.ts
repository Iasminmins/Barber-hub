import { describe, expect, test } from 'vitest'
import { buildPublicBookingUrl } from './public-booking-url'

describe('buildPublicBookingUrl', () => {
  test('builds the complete public booking URL from an origin and slug', () => {
    expect(buildPublicBookingUrl('https://meubarberhub.com.br', 'barbearia-teste')).toBe(
      'https://meubarberhub.com.br/agendar/barbearia-teste',
    )
  })

  test('encodes slugs before adding them to the URL', () => {
    expect(buildPublicBookingUrl('https://meubarberhub.com.br/', 'barbearia teste')).toBe(
      'https://meubarberhub.com.br/agendar/barbearia%20teste',
    )
  })
})
