import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { adminCookieHeader, createAdminSessionToken } from '@/lib/platform-admin'
import { createAdminSupabaseClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

const MAX_ATTEMPTS = 5
const LOCK_MS = 15 * 60 * 1000
const attempts = new Map<string, { count: number; until: number }>()

function attemptKey(request: Request, email: string) {
  const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? 'local'
  return `${ip}|${email.toLowerCase()}`
}

function isLocked(key: string) {
  const record = attempts.get(key)
  if (!record) return false
  if (record.until > Date.now()) return true
  attempts.delete(key)
  return false
}

function registerFailure(key: string) {
  const record = attempts.get(key) ?? { count: 0, until: 0 }
  record.count += 1
  if (record.count >= MAX_ATTEMPTS) record.until = Date.now() + LOCK_MS
  attempts.set(key, record)
}

export async function POST(request: Request) {
  const body = await request.json().catch(() => ({}))
  const email = typeof body.email === 'string' ? body.email.trim() : ''
  const password = typeof body.password === 'string' ? body.password : ''

  if (!email || !password) {
    return NextResponse.json({ error: 'Informe e-mail e senha.' }, { status: 400 })
  }

  const key = attemptKey(request, email)
  if (isLocked(key)) {
    return NextResponse.json(
      { error: 'Muitas tentativas. Aguarde 15 minutos antes de tentar novamente.' },
      { status: 429 },
    )
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
    registerFailure(key)
    return NextResponse.json({ error: 'E-mail ou senha inválidos.' }, { status: 401 })
  }

  // A sessao temporaria usada so para validar a senha e descartada.
  await authClient.auth.signOut().catch(() => undefined)

  // 2) Confere se esse usuario esta autorizado como admin da plataforma.
  const admin = createAdminSupabaseClient()
  const { data: adminRow } = await admin
    .from('platform_admins')
    .select('id, user_id, email, name')
    .eq('user_id', signIn.user.id)
    .eq('active', true)
    .maybeSingle()

  if (!adminRow) {
    registerFailure(key)
    await admin.from('platform_audit_log').insert({
      admin_user_id: signIn.user.id,
      admin_email: email,
      action: 'admin.login_denied',
      details: { reason: 'não é admin da plataforma' },
    })
    return NextResponse.json({ error: 'E-mail ou senha inválidos.' }, { status: 401 })
  }

  attempts.delete(key)

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
