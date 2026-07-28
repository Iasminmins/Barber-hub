export const staffPermissionOptions = [
  { key: 'dashboard', label: 'Dashboard', path: '/dashboard' },
  { key: 'agenda', label: 'Agenda', path: '/agenda' },
  { key: 'comandas', label: 'Comandas / PDV', path: '/comandas' },
  { key: 'clientes', label: 'Clientes', path: '/clientes' },
  { key: 'catalogo', label: 'Produtos e serviços', path: '/catalogo' },
  { key: 'assinaturas', label: 'Assinaturas', path: '/assinaturas' },
  { key: 'financeiro', label: 'Financeiro', path: '/financeiro' },
] as const

export type StaffPermission = typeof staffPermissionOptions[number]['key']

export function allowedPathsForPermissions(permissions: StaffPermission[]) {
  return staffPermissionOptions
    .filter((item) => permissions.includes(item.key))
    .map((item) => item.path)
}

export function canAccessPath(pathname: string, permissions: StaffPermission[]) {
  return allowedPathsForPermissions(permissions).some((path) => pathname === path || pathname.startsWith(`${path}/`))
}
