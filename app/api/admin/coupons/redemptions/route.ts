import { NextResponse } from 'next/server'
import { requirePlatformAdmin, platformErrorResponse } from '@/lib/platform-admin'

export const dynamic = 'force-dynamic'

export async function GET(request: Request) {
  try {
    const { admin } = await requirePlatformAdmin(request)
    const url = new URL(request.url)
    const limit = Math.min(Number(url.searchParams.get('limit') ?? 200), 500)

    const { data: redemptions, error } = await admin
      .from('platform_coupon_redemptions')
      .select('id, coupon_id, barbershop_id, barbershop_name, discount_applied, note, redeemed_by_email, redeemed_at')
      .order('redeemed_at', { ascending: false })
      .limit(limit)
    if (error) throw new Error('Não foi possível carregar os resgates.')

    const couponIds = [...new Set((redemptions ?? []).map((r) => r.coupon_id))]
    const { data: coupons } = couponIds.length
      ? await admin.from('platform_coupons').select('id, code').in('id', couponIds)
      : { data: [] as { id: string; code: string }[] }
    const codeById = new Map((coupons ?? []).map((c) => [c.id, c.code]))

    const items = (redemptions ?? []).map((r) => ({ ...r, coupon_code: codeById.get(r.coupon_id) ?? '—' }))

    return NextResponse.json({ items })
  } catch (error) {
    const { message, status } = platformErrorResponse(error)
    return NextResponse.json({ error: message }, { status })
  }
}
