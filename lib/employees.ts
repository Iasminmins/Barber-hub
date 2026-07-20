export function isBarberRole(role: string) {
  const normalized = role.trim().toLowerCase()
  return normalized === 'barber' || normalized.includes('barbeiro')
}
