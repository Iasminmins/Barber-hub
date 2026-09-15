export function calculateCashbackRedemption(balance: number, subtotal: number) {
  const normalizedBalance = Math.max(0, balance)
  const normalizedSubtotal = Math.max(0, subtotal)
  const amount = Math.min(normalizedBalance, normalizedSubtotal)

  return {
    amount,
    remaining: normalizedBalance - amount,
  }
}
