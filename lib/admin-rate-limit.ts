import { createHmac } from 'node:crypto'

export type RateLimitLayer = {
  scope: 'identity' | 'ip'
  key: string
  limit: number
}

export type RateLimitResult = {
  locked: boolean
  retryAfter: number
}

export type RateLimitRpcClient = {
  rpc: (
    name: string,
    args: Record<string, unknown>,
  ) => PromiseLike<{ data: unknown; error: { message: string } | null }>
}

function opaqueKey(value: string, secret: string) {
  return createHmac('sha256', secret).update(value).digest('hex')
}

export function buildAdminRateLimitLayers(ip: string, email: string, secret: string): RateLimitLayer[] {
  const normalizedIp = ip.trim().toLowerCase() || 'unknown'
  const normalizedEmail = email.trim().toLowerCase()
  return [
    { scope: 'identity', key: opaqueKey(`identity:${normalizedIp}:${normalizedEmail}`, secret), limit: 5 },
    { scope: 'ip', key: opaqueKey(`ip:${normalizedIp}`, secret), limit: 20 },
  ]
}

export function maxRetryAfter(results: RateLimitResult[]) {
  return results.reduce((maximum, result) => (
    result.locked ? Math.max(maximum, Math.max(1, Math.ceil(result.retryAfter))) : maximum
  ), 0)
}

function rateLimitSecret() {
  const secret =
    process.env.PLATFORM_ADMIN_SECRET ??
    process.env.SUPABASE_SERVICE_ROLE_KEY ??
    process.env.SUPABASE_SECRET_KEY
  if (!secret) throw new Error('rate limit unavailable')
  return secret
}

export function adminRequestRateLimitLayers(request: Request, email: string) {
  const ip =
    request.headers.get('x-real-ip')?.trim() ||
    request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    'unknown'
  return buildAdminRateLimitLayers(ip, email, rateLimitSecret())
}

async function applyRateLimitAction(
  client: RateLimitRpcClient,
  layers: RateLimitLayer[],
  action: 'check' | 'failure' | 'success',
) {
  return Promise.all(layers.map(async (layer) => {
    const { data, error } = await client.rpc('apply_platform_login_rate_limit', {
      p_rate_key: layer.key,
      p_action: action,
      p_limit: layer.limit,
      p_window_seconds: 15 * 60,
    })
    if (error) throw new Error('rate limit unavailable')
    const value = Array.isArray(data) ? data[0] : data
    const row = (value ?? {}) as { locked?: boolean; retry_after?: number }
    return { locked: row.locked === true, retryAfter: Number(row.retry_after ?? 0) }
  }))
}

export async function checkAdminRateLimit(client: RateLimitRpcClient, layers: RateLimitLayer[]) {
  return maxRetryAfter(await applyRateLimitAction(client, layers, 'check'))
}

export async function recordAdminLoginFailure(client: RateLimitRpcClient, layers: RateLimitLayer[]) {
  return maxRetryAfter(await applyRateLimitAction(client, layers, 'failure'))
}

export async function clearAdminRateLimit(client: RateLimitRpcClient, layers: RateLimitLayer[]) {
  await applyRateLimitAction(client, layers, 'success')
}
