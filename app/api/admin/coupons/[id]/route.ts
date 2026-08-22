import { NextResponse } from 'next/server'
import { requirePlatformAdmin, platformErrorResponse, logPlatformAction } from '@/lib/platform-admin'
import { effectiveCouponStatus } from '@/lib/platform-coupons'

export const dynamic = 'force-dynamic'

type Ctx = { params: Promise<{ id: string }> }
const PLANS = ['solo', 'starter', 'pro', 'premium']

export async function PATCH(request: Request, ctx: Ctx) {
  try {
    const { admin, user, adminRow } = await requirePlatformAdmin(request)
    const { id } = await ctx.params
    const body = await request.json().catch(() => ({}))

    const patch: Record<string, unknown> = {}

    if (typeof body.description === 'string') patch.description = body.description.trim() || null
    if (body.discountType === 'percentage' || body.discountType === 'fixed') patch.discount_type = body.discountType
    if (body.discountValue !== undefined) {
      const value = Number(body.discountValue)
      if (!Number.isFinite(value) || value <= 0) throw new Error('Valor de desconto inválido.')
      patch.discount_value = value
    }
    if (Array.isArray(body.applicablePlans)) {
      patch.applicable_plans = (body.applicablePlans as unknown[]).filter((p): p is string => typeof p === 'string' && PLANS.includes(p))
    }
    if (body.maxRedemptions !== undefined) {
      patch.max_redemptions = body.maxRedemptions === null || body.maxRedemptions === '' ? null : Number(body.maxRedemptions)
    }
    if (typeof body.startsAt === 'string' || body.startsAt === null) patch.starts_at = body.startsAt || null
    if (typeof body.expiresAt === 'string' || body.expiresAt === null) patch.expires_at = body.expiresAt || null
    if (typeof body.status === 'string') {
      if (!['active', 'disabled'].includes(body.status)) throw new Error('Status inválido.')
      patch.status = body.status
    }
    if (!Object.keys(patch).length) throw new Error('Nenhuma alteração informada.')

    patch.updated_at = new Date().toISOString()
    const { data: coupon, error } = await admin
      .from('platform_coupons')
      .update(patch)
      .eq('id', id)
      .select('*')
      .maybeSingle()
    if (error || !coupon) throw new Error('Não foi possível atualizar o cupom.')

    await logPlatformAction(admin, { id: user.id, email: adminRow.email }, {
      action: 'coupon.update',
      targetType: 'platform_coupon',
      targetId: id,
      details: patch,
    })

    return NextResponse.json({ item: { ...coupon, status: effectiveCouponStatus(coupon) } })
  } catch (error) {
    const { message, status } = platformErrorResponse(error)
    return NextResponse.json({ error: message }, { status })
  }
}

export async function DELETE(request: Request, ctx: Ctx) {
  try {
    const { admin, user, adminRow } = await requirePlatformAdmin(request)
    const { id } = await ctx.params

    const { error } = await admin.from('platform_coupons').delete().eq('id', id)
    if (error) throw new Error('Não foi possível remover o cupom.')

    await logPlatformAction(admin, { id: user.id, email: adminRow.email }, {
      action: 'coupon.delete',
      targetType: 'platform_coupon',
      targetId: id,
    })

    return NextResponse.json({ ok: true })
  } catch (error) {
    const { message, status } = platformErrorResponse(error)
    return NextResponse.json({ error: message }, { status })
  }
}
