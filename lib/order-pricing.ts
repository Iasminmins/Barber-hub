import { calculateConfiguredOrderCashback, type CashbackConfig } from './public-booking'

type OrderPricingItem = {
  quantity: number
  unitPrice: number
}

export function calculateEditedOrderValues(input: {
  items: OrderPricingItem[]
  discount: number
  surcharge: number
  cashbackSettings: CashbackConfig
  clientId?: string | null
}) {
  const total = input.items.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0)
    - input.discount + input.surcharge

  return {
    total,
    cashbackEarned: calculateConfiguredOrderCashback(total, input.cashbackSettings, input.clientId),
  }
}
