import { NextResponse } from 'next/server'
import { requirePlatformAdmin, platformErrorResponse } from '@/lib/platform-admin'

export const dynamic = 'force-dynamic'

export async function GET(request: Request) {
  try {
    const { admin } = await requirePlatformAdmin(request)

    const { data, error } = await admin
      .from('platform_message_templates')
      .select('id, slug, name, channel, subject, body, variables')
      .eq('active', true)
      .order('name')

    if (error) throw new Error('Não foi possível carregar modelos.')

    return NextResponse.json({ items: data ?? [] })
  } catch (error) {
    const { message, status } = platformErrorResponse(error)
    return NextResponse.json({ error: message }, { status })
  }
}
