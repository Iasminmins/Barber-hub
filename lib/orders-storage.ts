import type { Order } from './types'

const STORAGE_KEY = 'barberhub.orders'

function canUseStorage() {
  return typeof window !== 'undefined' && typeof window.localStorage !== 'undefined'
}

export function getStoredOrders(): Order[] {
  if (!canUseStorage()) return []

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    if (!raw) return []

    const parsed = JSON.parse(raw)
    return Array.isArray(parsed) ? (parsed as Order[]) : []
  } catch {
    return []
  }
}

export function getAllOrders(baseOrders: Order[]): Order[] {
  const storedOrders = getStoredOrders()
  const storedIds = new Set(storedOrders.map((order) => order.id))

  return [...storedOrders, ...baseOrders.filter((order) => !storedIds.has(order.id))]
}

export function saveStoredOrder(order: Order) {
  if (!canUseStorage()) return

  const currentOrders = getStoredOrders()
  const nextOrders = [order, ...currentOrders.filter((storedOrder) => storedOrder.id !== order.id)]
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(nextOrders))
}

export function removeStoredOrder(orderId: string) {
  if (!canUseStorage()) return

  const nextOrders = getStoredOrders().filter((order) => order.id !== orderId)
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(nextOrders))
}

export function getNextOrderNumber(baseNumber: number) {
  const storedNumbers = getStoredOrders().map((order) => order.number)
  return Math.max(baseNumber, ...storedNumbers) + 1
}
