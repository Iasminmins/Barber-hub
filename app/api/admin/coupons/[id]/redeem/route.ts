import { NextResponse } from 'next/server'
import { requirePlatformAdmin, platformErrorResponse, logPlatformAction } from '@/lib/platform-admin'
import { effectiveCouponStatus } from '@/lib/platform-coupons'

export const dynamic = 'force-dynamic'

type Ctx = { params: Promise<{ id: string }> }

export async function POST(request: Request, ctx: Ctx) {
  try {
    const { admin, user, adminRow } = await requirePlatformAdmin(request)
    const { id } = await ctx.params
    const body = await request.json().catch(() => ({}))

    const barbershopId = typeof body.barbershopId === 'string' ? body.barbershopId.trim() : ''
    if (!barbershopId) throw new Error('Selecione a barbearia que recebeu o cupom.')
    const note = typeof body.note === 'string' ? body.note.trim() || null : null

    const { data: coupon, error: couponError } = await admin
      .from('platform_coupons')
      .select('*')
      .eq('id', id)
      .maybeSingle()
    if (couponError || !coupon) throw new Error('Cupom não encontrado.')

    const status = effectiveCouponStatus(coupon)
    if (status !== 'active') throw new Error(status === 'expired' ? 'Este cupom está expirado.' : 'Este cupom está desativado.')
    if (coupon.max_redemptions !== null && coupon.redemptions_count >= coupon.max_redemptions) {
      throw new Error('Este cupom já atingiu o limite de usos.')
    }

    const { data: shop, error: shopError } = await admin
      .from('barbershops')
      .select('id, name, plan')
      .eq('id', barbershopId)
      .maybeSingle()
    if (shopError || !shop) throw new Error('Barbearia não encontrada.')

    if (coupon.applicable_plans.length && !coupon.applicable_plans.includes(shop.plan)) {
      throw new Error(`Este cupom só é válido para os planos: ${coupon.applicable_plans.join(', ')}.`)
    }

    const discountApplied = coupon.discount_type === 'percentage'
      ? null
      : coupon.discount_value

    const { data: redemption, error: redemptionError } = await admin
      .from('platform_coupon_redemptions')
      .insert({
        coupon_id: id,
        barbershop_id: shop.id,
        barbershop_name: shop.name,
        discount_applied: discountApplied,
        note,
        redeemed_by_admin_id: user.id,
        redeemed_by_email: adminRow.email,
      })
      .select('*')
      .maybeSingle()
    if (redemptionError || !redemption) throw new Error('Não foi possível registrar o resgate.')

    const { error: updateError } = await admin
      .from('platform_coupons')
      .update({ redemptions_count: coupon.redemptions_count + 1, updated_at: new Date().toISOString() })
      .eq('id', id)
    if (updateError) throw new Error('Resgate registrado, mas não foi possível atualizar o contador do cupom.')

    await logPlatformAction(admin, { id: user.id, email: adminRow.email }, {
      action: 'coupon.redeem',
      targetType: 'platform_coupon',
      targetId: id,
      details: { barbershopId: shop.id, barbershopName: shop.name, note },
    })

    return NextResponse.json({ redemption })
  } catch (error) {
    const { message, status } = platformErrorResponse(error)
    return NextResponse.json({ error: message }, { status })
  }
}
