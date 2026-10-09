export const staffPermissionOptions = [
  { key: 'dashboard', label: 'Dashboard', path: '/dashboard' },
  { key: 'agenda', label: 'Agenda', path: '/agenda' },
  { key: 'comandas', label: 'Comandas / PDV', path: '/comandas' },
  { key: 'clientes', label: 'Clientes', path: '/clientes' },
  { key: 'catalogo', label: 'Produtos e serviços', path: '/catalogo' },
  { key: 'assinaturas', label: 'Assinaturas', path: '/assinaturas' },
  { key: 'financeiro', label: 'Financeiro', path: '/financeiro' },
  { key: 'gastos', label: 'Gastos', path: '/gastos' },
] as const

export type StaffPermission = typeof staffPermissionOptions[number]['key']

export const receptionPermissions: StaffPermission[] = staffPermissionOptions
  .filter((item) => item.key !== 'financeiro' && item.key !== 'gastos')
  .map((item) => item.key)

export type SubscriptionView = 'assinaturas' | 'planos' | 'financeiro'

export function subscriptionViewsForRole(role: string): SubscriptionView[] {
  return role === 'owner' || role === 'manager'
    ? ['assinaturas', 'planos', 'financeiro']
    : ['assinaturas', 'planos']
}

export function allowedPathsForPermissions(permissions: StaffPermission[]) {
  return staffPermissionOptions
    .filter((item) => permissions.includes(item.key))
    .map((item) => item.path)
}

export function canAccessPath(pathname: string, permissions: StaffPermission[]) {
  return allowedPathsForPermissions(permissions).some((path) => pathname === path || pathname.startsWith(`${path}/`))
}
