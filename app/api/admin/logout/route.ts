import { NextResponse } from 'next/server'
import { clearAdminCookieHeader } from '@/lib/platform-admin'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

export async function POST() {
  const response = NextResponse.json({ ok: true })
  response.headers.set('Set-Cookie', clearAdminCookieHeader())
  return response
}
