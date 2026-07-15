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

export function formatDate(iso: string): string {
  const d = new Date(iso.length <= 10 ? `${iso}T00:00:00` : iso)
  return new Intl.DateTimeFormat('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' }).format(d)
}

export function formatDateShort(iso: string): string {
  const d = new Date(iso.length <= 10 ? `${iso}T00:00:00` : iso)
  return new Intl.DateTimeFormat('pt-BR', { day: '2-digit', month: 'short' }).format(d)
}

export function daysUntil(iso: string): number {
  const target = new Date(`${iso}T00:00:00`).getTime()
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
