export function isBarberRole(role: string) {
  const normalized = role.trim().toLowerCase()
  return normalized === 'barber' || normalized.includes('barbeiro')
}

export function isReceptionRole(role: string) {
  const normalized = role.trim().toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '')
  return normalized === 'reception' || normalized.includes('recepcao')
}
