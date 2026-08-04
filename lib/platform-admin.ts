import { createHmac, timingSafeEqual } from 'node:crypto'
import { createAdminSupabaseClient } from '@/lib/supabase/server'

export const ADMIN_COOKIE = 'bh_platform_session'
export const SESSION_TTL_SECONDS = 60 * 60 * 2 // 2 horas

export class PlatformAdminError extends Error {
  status: number
  constructor(message: string, status = 403) {
    super(message)
    this.status = status
  }
}

function sessionSecret() {
  const secret =
    process.env.PLATFORM_ADMIN_SECRET ??
    process.env.SUPABASE_SERVICE_ROLE_KEY ??
    process.env.SUPABASE_SECRET_KEY
  if (!secret) throw new PlatformAdminError('PLATFORM_ADMIN_SECRET não configurada.', 500)
  return secret
}

function sign(payload: string) {
  return createHmac('sha256', sessionSecret()).update(payload).digest('base64url')
}

/** Gera um token assinado (HMAC-SHA256) com validade curta. */
export function createAdminSessionToken(userId: string) {
  const expiresAt = Math.floor(Date.now() / 1000) + SESSION_TTL_SECONDS
  const payload = Buffer.from(JSON.stringify({ sub: userId, exp: expiresAt })).toString('base64url')
  return `${payload}.${sign(payload)}`
}

function readAdminSessionToken(token: string) {
  const [payload, signature] = token.split('.')
  if (!payload || !signature) return null

  const expected = Buffer.from(sign(payload))
  const received = Buffer.from(signature)
  if (expected.length !== received.length) return null
  if (!timingSafeEqual(expected, received)) return null

  try {
    const data = JSON.parse(Buffer.from(payload, 'base64url').toString()) as { sub?: string; exp?: number }
    if (!data.sub || !data.exp) return null
    if (data.exp * 1000 < Date.now()) return null
    return data as { sub: string; exp: number }
  } catch {
    return null
  }
}

function readCookie(request: Request, name: string) {
  const header = request.headers.get('cookie') ?? ''
  for (const part of header.split(';')) {
    const [key, ...rest] = part.trim().split('=')
    if (key === name) return decodeURIComponent(rest.join('='))
  }
  return ''
}

export function adminCookieHeader(token: string, maxAgeSeconds = SESSION_TTL_SECONDS) {
  const flags = [
    `${ADMIN_COOKIE}=${encodeURIComponent(token)}`,
    'Path=/',
    'HttpOnly',
    'SameSite=Strict',
    `Max-Age=${maxAgeSeconds}`,
  ]
  if (process.env.NODE_ENV === 'production') flags.push('Secure')
  return flags.join('; ')
}

export function clearAdminCookieHeader() {
  return adminCookieHeader('', 0)
}

/**
 * Exige uma sessao administrativa valida.
 * 1) cookie httpOnly assinado e dentro da validade
 * 2) usuario AINDA presente e ativo em platform_admins (revogacao imediata)
 */
export async function requirePlatformAdmin(request: Request) {
  const token = readCookie(request, ADMIN_COOKIE)
  if (!token) throw new PlatformAdminError('Faça login na administração da plataforma.', 401)

  const session = readAdminSessionToken(token)
  if (!session) throw new PlatformAdminError('Sessão administrativa expirada ou inválida.', 401)

  const admin = createAdminSupabaseClient()
  const { data: adminRow, error } = await admin
    .from('platform_admins')
    .select('id, user_id, email, name, active')
    .eq('user_id', session.sub)
    .eq('active', true)
    .maybeSingle()

  if (error) throw new PlatformAdminError('Falha ao validar acesso administrativo.', 500)
  if (!adminRow) throw new PlatformAdminError('Acesso restrito à administração da plataforma.', 403)

  return { admin, user: { id: adminRow.user_id, email: adminRow.email }, adminRow }
}

type AuditInput = {
  action: string
  targetType?: string
  targetId?: string
  details?: Record<string, unknown>
}

export async function logPlatformAction(
  admin: ReturnType<typeof createAdminSupabaseClient>,
  actor: { id: string; email?: string | null },
  input: AuditInput,
) {
  await admin.from('platform_audit_log').insert({
    admin_user_id: actor.id,
    admin_email: actor.email ?? null,
    action: input.action,
    target_type: input.targetType ?? null,
    target_id: input.targetId ?? null,
    details: input.details ?? {},
  })
}

export function platformErrorResponse(error: unknown) {
  const status = error instanceof PlatformAdminError ? error.status : 400
  const message = error instanceof Error ? error.message : 'Erro inesperado.'
  return { message, status }
}
