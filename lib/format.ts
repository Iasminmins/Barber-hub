export function formatCurrency(value: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value)
}

export function formatNumber(value: number): string {
  return new Intl.NumberFormat('pt-BR').format(value)
}

export function formatPercent(value: number): string {
  return `${new Intl.NumberFormat('pt-BR', { maximumFractionDigits: 1 }).format(value)}%`
}

function isDisplayableDate(iso: string) {
  const match = iso.match(/^(\d{4})-\d{2}-\d{2}(?:$|T)/)
  return Boolean(match && Number(match[1]) >= 1000 && Number(match[1]) <= 9999)
}

export function formatDate(iso?: string | null): string {
  if (!iso || !isDisplayableDate(iso)) return '-'
  const d = new Date(iso.length <= 10 ? `${iso}T00:00:00` : iso)
  if (Number.isNaN(d.getTime())) return '-'
  return new Intl.DateTimeFormat('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' }).format(d)
}

export function formatDateShort(iso?: string | null): string {
  if (!iso || !isDisplayableDate(iso)) return '-'
  const d = new Date(iso.length <= 10 ? `${iso}T00:00:00` : iso)
  if (Number.isNaN(d.getTime())) return '-'
  return new Intl.DateTimeFormat('pt-BR', { day: '2-digit', month: 'short' }).format(d)
}

export function daysUntil(iso?: string | null): number {
  if (!iso) return Number.POSITIVE_INFINITY
  const targetDate = new Date(iso.length <= 10 ? `${iso}T00:00:00` : iso)
  targetDate.setHours(0, 0, 0, 0)
  const target = targetDate.getTime()
  if (Number.isNaN(target)) return Number.POSITIVE_INFINITY
  const now = new Date()
  now.setHours(0, 0, 0, 0)
  return Math.round((target - now.getTime()) / (1000 * 60 * 60 * 24))
}

export function initials(name: string): string {
  const parts = name.trim().split(/\s+/)
  const first = parts[0]?.[0] ?? ''
  const last = parts.length > 1 ? parts[parts.length - 1][0] : ''
  return (first + last).toUpperCase()
}
