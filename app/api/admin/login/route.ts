import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { adminCookieHeader, createAdminSessionToken } from '@/lib/platform-admin'
import { createAdminSupabaseClient } from '@/lib/supabase/server'
import {
  adminRequestRateLimitLayers,
  checkAdminRateLimit,
  clearAdminRateLimit,
  recordAdminLoginFailure,
  type RateLimitRpcClient,
} from '@/lib/admin-rate-limit'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

function lockedResponse(retryAfter: number) {
  return NextResponse.json(
    { error: 'Muitas tentativas. Aguarde antes de tentar novamente.' },
    { status: 429, headers: { 'Retry-After': String(retryAfter) } },
  )
}

function rateLimitUnavailableResponse() {
  return NextResponse.json(
    { error: 'Login administrativo temporariamente indisponível.' },
    { status: 503 },
  )
}

export async function POST(request: Request) {
  const body = await request.json().catch(() => ({}))
  const email = typeof body.email === 'string' ? body.email.trim() : ''
  const password = typeof body.password === 'string' ? body.password : ''

  if (!email || !password) {
    return NextResponse.json({ error: 'Informe e-mail e senha.' }, { status: 400 })
  }

  const admin = createAdminSupabaseClient()
  const rateLimitClient = admin as unknown as RateLimitRpcClient
  let layers
  try {
    layers = adminRequestRateLimitLayers(request, email)
    const retryAfter = await checkAdminRateLimit(rateLimitClient, layers)
    if (retryAfter > 0) return lockedResponse(retryAfter)
  } catch {
    return rateLimitUnavailableResponse()
  }

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  if (!url || !anonKey) {
    return NextResponse.json({ error: 'Supabase não configurado neste ambiente.' }, { status: 500 })
  }

  // 1) Confere e-mail + SENHA de verdade contra o Supabase Auth.
  const authClient = createClient(url, anonKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  })
  const { data: signIn, error: signInError } = await authClient.auth.signInWithPassword({
    email,
    password,
  })

  if (signInError || !signIn.user) {
    try {
      const retryAfter = await recordAdminLoginFailure(rateLimitClient, layers)
      if (retryAfter > 0) return lockedResponse(retryAfter)
    } catch {
      return rateLimitUnavailableResponse()
    }
    return NextResponse.json({ error: 'E-mail ou senha inválidos.' }, { status: 401 })
  }

  // A sessao temporaria usada so para validar a senha e descartada.
  await authClient.auth.signOut().catch(() => undefined)

  // 2) Confere se esse usuario esta autorizado como admin da plataforma.
  const { data: adminRow } = await admin
    .from('platform_admins')
    .select('id, user_id, email, name')
    .eq('user_id', signIn.user.id)
    .eq('active', true)
    .maybeSingle()

  if (!adminRow) {
    try {
      const retryAfter = await recordAdminLoginFailure(rateLimitClient, layers)
      if (retryAfter > 0) return lockedResponse(retryAfter)
    } catch {
      return rateLimitUnavailableResponse()
    }
    await admin.from('platform_audit_log').insert({
      admin_user_id: signIn.user.id,
      admin_email: email,
      action: 'admin.login_denied',
      details: { reason: 'não é admin da plataforma' },
    })
    return NextResponse.json({ error: 'E-mail ou senha inválidos.' }, { status: 401 })
  }

  try {
    await clearAdminRateLimit(rateLimitClient, layers)
  } catch {
    return rateLimitUnavailableResponse()
  }

  await admin.from('platform_audit_log').insert({
    admin_user_id: adminRow.user_id,
    admin_email: adminRow.email,
    action: 'admin.login',
    details: { ip: request.headers.get('x-forwarded-for') ?? 'local' },
  })

  const token = createAdminSessionToken(adminRow.user_id)
  const response = NextResponse.json({
    ok: true,
    admin: { email: adminRow.email, name: adminRow.name ?? adminRow.email },
  })
  response.headers.set('Set-Cookie', adminCookieHeader(token))
  return response
}
