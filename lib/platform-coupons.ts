export type CouponDiscountType = 'percentage' | 'fixed'
export type CouponStoredStatus = 'active' | 'disabled'
export type CouponEffectiveStatus = 'active' | 'expired' | 'disabled'

export type CouponRow = {
  status: CouponStoredStatus
  expires_at: string | null
}

/** Status "expired" é sempre derivado de expires_at, nunca gravado — evita divergência com a coluna. */
export function effectiveCouponStatus(coupon: CouponRow, now = new Date()): CouponEffectiveStatus {
  if (coupon.status === 'disabled') return 'disabled'
  if (coupon.expires_at) {
    const today = now.toISOString().slice(0, 10)
    if (coupon.expires_at < today) return 'expired'
  }
  return 'active'
}

const CODE_ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'

export function generateCouponCode() {
  let suffix = ''
  for (let i = 0; i < 6; i += 1) {
    suffix += CODE_ALPHABET[Math.floor(Math.random() * CODE_ALPHABET.length)]
  }
  return `BARBER-${suffix}`
}

export function formatDiscount(coupon: { discount_type: CouponDiscountType; discount_value: number }) {
  if (coupon.discount_type === 'percentage') return `${coupon.discount_value}%`
  return coupon.discount_value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

/**
 * Valor da primeira cobrança com cupom aplicado (desconto vale só no 1º ciclo — da 2ª
 * cobrança em diante a assinatura no Asaas volta ao preço cheio do plano, sem rotina extra).
 * Piso de R$ 1,00 porque o Asaas rejeita cobranças com valor zero ou negativo.
 */
export function computeFirstChargeValue(
  planPrice: number,
  coupon: { discount_type: CouponDiscountType; discount_value: number },
) {
  const raw = coupon.discount_type === 'percentage'
    ? planPrice * (1 - coupon.discount_value / 100)
    : planPrice - coupon.discount_value
  return Math.max(1, Number(raw.toFixed(2)))
}
