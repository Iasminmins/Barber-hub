import type { Appointment, Client, ImportRecord, Order } from '@/lib/types'

function dateKey(value: string | null | undefined) {
  if (!value) return ''
  const key = value.slice(0, 10)
  return /^\d{4}-\d{2}-\d{2}$/.test(key) ? key : ''
}

function normalizeName(value: string) {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim()
    .toLowerCase()
    .replace(/\s+/g, ' ')
}

function nameKey(name: string) {
  return `name:${normalizeName(name)}`
}

export function buildFirstClientActivity(orders: Order[], appointments: Appointment[]) {
  const firstActivity = new Map<string, string>()
  const register = (id: string | undefined, name: string, date: string) => {
    const activityDate = dateKey(date)
    if (!activityDate) return
    for (const key of [id, nameKey(name)].filter(Boolean) as string[]) {
      const current = firstActivity.get(key)
      if (!current || activityDate < current) firstActivity.set(key, activityDate)
    }
  }

  for (const order of orders) {
    if (order.status === 'paga') register(order.clientId, order.clientName, order.createdAt)
  }
  for (const appointment of appointments) {
    register(appointment.clientId, appointment.clientName, appointment.date)
  }
  return firstActivity
}

function wasCreatedByRecentImport(client: Client, imports: ImportRecord[]) {
  const createdAt = new Date(client.createdAt).getTime()
  if (Number.isNaN(createdAt)) return false
  return imports.some((record) => {
    if (!['clientes', 'comandas', 'assinaturas'].includes(record.entity)) return false
    const completedAt = new Date(record.createdAt).getTime()
    if (Number.isNaN(completedAt)) return false
    const elapsed = completedAt - createdAt
    return elapsed >= 0 && elapsed <= 6 * 60 * 60 * 1000
  })
}

export function getEffectiveClientStartDate(
  client: Client,
  firstActivity: Map<string, string>,
  imports: ImportRecord[],
) {
  const createdDate = dateKey(client.createdAt)
  const activityDate = firstActivity.get(client.id) ?? firstActivity.get(nameKey(client.name))
  if (activityDate) return createdDate && createdDate < activityDate ? createdDate : activityDate
  if (wasCreatedByRecentImport(client, imports)) return ''
  return createdDate
}
