/** Telefone brasileiro guardado sempre como dígitos, no máximo DDD + 9 dígitos. */
export function onlyPhoneDigits(value: string) {
  return value.replace(/\D/g, '').slice(0, 11)
}

/** Aceita fixo com DDD (10 dígitos) ou celular com DDD (11 dígitos). */
export function isValidPhone(value: string) {
  const digits = onlyPhoneDigits(value)
  return digits.length === 10 || digits.length === 11
}

/** Máscara progressiva: `(24) 99836-9828`. */
export function formatPhone(value: string) {
  const digits = onlyPhoneDigits(value)
  if (digits.length <= 2) return digits
  if (digits.length <= 7) return `(${digits.slice(0, 2)}) ${digits.slice(2)}`
  const split = digits.length === 11 ? 7 : 6
  return `(${digits.slice(0, 2)}) ${digits.slice(2, split)}-${digits.slice(split)}`
}
