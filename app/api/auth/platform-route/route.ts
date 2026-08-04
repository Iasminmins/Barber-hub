import { NextResponse } from 'next/server'
import { adminCookieHeader, createAdminSessionToken } from '@/lib/platform-admin'
import { classifyAuthenticatedUser, PlatformRouteError } from '@/lib/platform-route'
import { createAdminSupabaseClient } from '@/lib/supabase/server'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function POST(request: Request) {
  const token = request.headers.get('authorization')?.replace(/^Bearer\s+/i, '') ?? ''
  const supabase = createAdminSupabaseClient()
  try {
    const result = await classifyAuthenticatedUser({
      getUser: async (accessToken) => {
        const { data, error } = await supabase.auth.getUser(accessToken)
        return { user: data.user, error }
      },
      findActiveAdmin: async (userId) => {
        const { data, error } = await supabase.from('platform_admins')
          .select('name,email').eq('user_id', userId).eq('active', true).maybeSingle()
        if (error) throw error
        return data
      },
    }, token)
    const response = NextResponse.json(result)
    if (result.destination === '/plataforma') {
      const { data } = await supabase.auth.getUser(token)
      if (!data.user) throw new PlatformRouteError('Sessao invalida.', 401)
      response.headers.set('Set-Cookie', adminCookieHeader(createAdminSessionToken(data.user.id)))
    }
    return response
  } catch (error) {
    const status = error instanceof PlatformRouteError ? error.status : 500
    return NextResponse.json({ error: status === 401 ? 'Sessao invalida.' : 'Nao foi possivel validar o acesso.' }, { status })
  }
}
