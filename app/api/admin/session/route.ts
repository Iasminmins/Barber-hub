import { NextResponse } from 'next/server'
import { requirePlatformAdmin, platformErrorResponse } from '@/lib/platform-admin'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

/** Usada pelo painel /admin para saber se a sessao administrativa esta valida. */
export async function GET(request: Request) {
  try {
    const { adminRow } = await requirePlatformAdmin(request)
    return NextResponse.json({
      isPlatformAdmin: true,
      admin: { email: adminRow.email, name: adminRow.name ?? adminRow.email },
    })
  } catch (error) {
    const { message, status } = platformErrorResponse(error)
    return NextResponse.json({ isPlatformAdmin: false, error: message }, { status })
  }
}
