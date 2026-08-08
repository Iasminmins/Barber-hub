import { describe, expect, test } from 'vitest'
import { formatPhone, isValidPhone, onlyPhoneDigits } from './phone'

describe('formatPhone', () => {
  test('aplica a máscara de celular com DDD', () => {
    expect(formatPhone('24998369828')).toBe('(24) 99836-9828')
  })

  test('aplica a máscara de fixo com DDD', () => {
    expect(formatPhone('2433334444')).toBe('(24) 3333-4444')
  })

  test('descarta o que passa de 11 dígitos', () => {
    expect(formatPhone('249983698281234')).toBe('(24) 99836-9828')
  })

  test('mantém a digitação parcial estável', () => {
    expect(formatPhone('2')).toBe('2')
    expect(formatPhone('24')).toBe('24')
    expect(formatPhone('249')).toBe('(24) 9')
  })
})

describe('isValidPhone', () => {
  test('aceita 10 e 11 dígitos', () => {
    expect(isValidPhone('(24) 3333-4444')).toBe(true)
    expect(isValidPhone('(24) 99836-9828')).toBe(true)
  })

  test('recusa telefone vazio ou sem DDD', () => {
    expect(isValidPhone('')).toBe(false)
    expect(isValidPhone('99836-9828')).toBe(false)
  })
})

describe('onlyPhoneDigits', () => {
  test('remove a máscara antes de salvar', () => {
    expect(onlyPhoneDigits('(24) 99836-9828')).toBe('24998369828')
  })
})
