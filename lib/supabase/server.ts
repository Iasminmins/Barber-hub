import { createClient } from '@supabase/supabase-js'

function requireServerEnv(name: string) {
  const value = process.env[name]
  if (!value) throw new Error(`Variavel ${name} nao configurada.`)
  return value
}

function requireSupabaseAdminKey() {
  const value = process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.SUPABASE_SECRET_KEY
  if (!value) {
    throw new Error('Variavel SUPABASE_SERVICE_ROLE_KEY ou SUPABASE_SECRET_KEY nao configurada.')
  }
  return value
}

export function createAuthenticatedServerClient(accessToken: string) {
  return createClient(
    requireServerEnv('NEXT_PUBLIC_SUPABASE_URL'),
    requireServerEnv('NEXT_PUBLIC_SUPABASE_ANON_KEY'),
    {
      global: { headers: { Authorization: `Bearer ${accessToken}` } },
      auth: { persistSession: false, autoRefreshToken: false },
    },
  )
}

export function createAdminSupabaseClient() {
  return createClient(
    requireServerEnv('NEXT_PUBLIC_SUPABASE_URL'),
    requireSupabaseAdminKey(),
    { auth: { persistSession: false, autoRefreshToken: false } },
  )
}
