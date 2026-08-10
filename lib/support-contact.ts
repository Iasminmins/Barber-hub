const supportPhone = '5524998369828'

export function buildSupportWhatsAppUrl(message: string) {
  return `https://wa.me/${supportPhone}?text=${encodeURIComponent(message)}`
}
