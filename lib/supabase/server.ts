import { createClient } from '@supabase/supabase-js'

function requireServerEnv(name: string) {
  const value = process.env[name]
  if (!value) throw new Error(`Variável ${name} não configurada.`)
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
    requireServerEnv('SUPABASE_SERVICE_ROLE_KEY'),
    { auth: { persistSession: false, autoRefreshToken: false } },
  )
}
