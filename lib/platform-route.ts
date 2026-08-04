export type PlatformDestination = '/plataforma' | '/dashboard'

export class PlatformRouteError extends Error {
  constructor(message: string, public status: number) { super(message) }
}

type Deps = {
  getUser: (token: string) => Promise<{ user: { id: string } | null; error: unknown }>
  findActiveAdmin: (userId: string) => Promise<{ name: string; email: string } | null>
}

export async function classifyAuthenticatedUser(deps: Deps, token: string) {
  if (!token) throw new PlatformRouteError('Token ausente.', 401)
  const { user, error } = await deps.getUser(token)
  if (error || !user) throw new PlatformRouteError('Sessao invalida.', 401)
  const admin = await deps.findActiveAdmin(user.id)
  return admin ? { destination: '/plataforma' as const, admin } : { destination: '/dashboard' as const }
}

export function readPlatformDestination(payload: unknown): PlatformDestination {
  const destination = (payload as { destination?: unknown })?.destination
  if (destination !== '/plataforma' && destination !== '/dashboard') {
    throw new Error('Destino de acesso invalido.')
  }
  return destination
}
