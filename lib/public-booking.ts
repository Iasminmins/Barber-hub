import type { CatalogItem } from './types'

export interface CashbackConfig {
  enabled: boolean
  percentage: number
  minimumPurchase: number
}

export interface PublicBookingSettings {
  productIds: string[]
  showProducts: boolean
  showCashback: boolean
  cashback: CashbackConfig
}

export const defaultPublicBookingSettings: PublicBookingSettings = {
  productIds: [],
  showProducts: true,
  showCashback: false,
  cashback: { enabled: false, percentage: 5, minimumPurchase: 0 },
}

export function shouldShowPublicProducts(settings: Pick<PublicBookingSettings, 'showProducts'>) {
  return settings.showProducts
}

export function getPublicBookingProducts<T extends Pick<CatalogItem, 'id' | 'type' | 'active' | 'stock'>>(
  products: T[],
  selectedIds: string[],
) {
  const selected = new Set(selectedIds)
  return products.filter((product) => (
    product.type === 'produto'
      && product.active
      && (product.stock === undefined || product.stock > 0)
      && selected.has(product.id)
  ))
}

export function calculateBookingCashback(total: number, config: CashbackConfig) {
  const safeTotal = Math.max(0, total)
  const minimumPurchase = Math.max(0, config.minimumPurchase)
  const percentage = Math.max(0, config.percentage)
  if (!config.enabled || safeTotal < minimumPurchase || percentage === 0) {
    return { amount: 0, remaining: Math.max(0, minimumPurchase - safeTotal) }
  }
  return {
    amount: Math.round(safeTotal * percentage) / 100,
    remaining: 0,
  }
}

export function calculateCashbackPurchaseTotal(serviceTotal: number, productTotal: number) {
  return Math.max(0, serviceTotal) + Math.max(0, productTotal)
}

export function calculateOrderCashback(total: number, config: CashbackConfig) {
  return calculateBookingCashback(Math.max(0, total), config)
}

export function calculateSubscriptionCashback(total: number, config: CashbackConfig) {
  return calculateOrderCashback(total, config)
}

export function normalizeReferral(name: string, phone: string) {
  const cleanName = name.trim()
  const cleanPhone = phone.replace(/\D/g, '')
  if (!cleanName || !cleanPhone) return null
  return { name: cleanName, phone: cleanPhone }
}
