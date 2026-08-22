import { NextResponse } from 'next/server'
import { requirePlatformAdmin, platformErrorResponse, logPlatformAction } from '@/lib/platform-admin'
import { effectiveCouponStatus, generateCouponCode } from '@/lib/platform-coupons'

export const dynamic = 'force-dynamic'

const PLANS = ['solo', 'starter', 'pro', 'premium']

export async function GET(request: Request) {
  try {
    const { admin } = await requirePlatformAdmin(request)
    const url = new URL(request.url)
    const search = url.searchParams.get('search')?.trim() ?? ''
    const status = url.searchParams.get('status')?.trim() ?? ''

    let query = admin
      .from('platform_coupons')
      .select('*')
      .order('created_at', { ascending: false })

    if (search) query = query.ilike('code', `%${search}%`)

    const { data, error } = await query
    if (error) throw new Error('Não foi possível listar os cupons.')

    let items = data ?? []
    if (status) items = items.filter((c) => effectiveCouponStatus(c) === status)

    return NextResponse.json({ items: items.map((c) => ({ ...c, status: effectiveCouponStatus(c) })) })
  } catch (error) {
    const { message, status } = platformErrorResponse(error)
    return NextResponse.json({ error: message }, { status })
  }
}

export async function POST(request: Request) {
  try {
    const { admin, user, adminRow } = await requirePlatformAdmin(request)
    const body = await request.json().catch(() => ({}))

    const discountType = body.discountType === 'fixed' ? 'fixed' : body.discountType === 'percentage' ? 'percentage' : null
    if (!discountType) throw new Error('Selecione o tipo de desconto.')

    const discountValue = Number(body.discountValue)
    if (!Number.isFinite(discountValue) || discountValue <= 0) throw new Error('Informe um valor de desconto válido.')
    if (discountType === 'percentage' && discountValue > 100) throw new Error('O desconto percentual não pode passar de 100%.')

    const applicablePlans = Array.isArray(body.applicablePlans)
      ? (body.applicablePlans as unknown[]).filter((p): p is string => typeof p === 'string' && PLANS.includes(p))
      : []

    const maxRedemptions = body.maxRedemptions === null || body.maxRedemptions === undefined || body.maxRedemptions === ''
      ? null
      : Number(body.maxRedemptions)
    if (maxRedemptions !== null && (!Number.isFinite(maxRedemptions) || maxRedemptions <= 0)) {
      throw new Error('O limite de usos deve ser um número maior que zero.')
    }

    const startsAt = typeof body.startsAt === 'string' && body.startsAt.trim() ? body.startsAt.trim() : null
    const expiresAt = typeof body.expiresAt === 'string' && body.expiresAt.trim() ? body.expiresAt.trim() : null
    if (startsAt && expiresAt && startsAt > expiresAt) throw new Error('A validade final deve ser depois do início.')

    const description = typeof body.description === 'string' ? body.description.trim() || null : null

    const code = typeof body.code === 'string' ? body.code.trim().toUpperCase() : ''
    if (code && !/^[A-Z0-9-]{3,32}$/.test(code)) throw new Error('Use apenas letras, números e hífen no código (3 a 32 caracteres).')

    const insertPayload = {
      description,
      discount_type: discountType,
      discount_value: discountValue,
      applicable_plans: applicablePlans,
      max_redemptions: maxRedemptions,
      starts_at: startsAt,
      expires_at: expiresAt,
      created_by_admin_id: user.id,
      created_by_email: adminRow.email,
    }

    let coupon = null
    let lastError: string | null = null
    for (let attempt = 0; attempt < 5; attempt += 1) {
      const candidateCode = code || generateCouponCode()
      const { data, error } = await admin
        .from('platform_coupons')
        .insert({ ...insertPayload, code: candidateCode })
        .select('*')
        .maybeSingle()

      if (!error && data) {
        coupon = data
        break
      }
      if (error?.code === '23505') {
        if (code) throw new Error('Já existe um cupom com esse código.')
        lastError = error.message
        continue
      }
      lastError = error?.message ?? 'Erro desconhecido.'
      break
    }

    if (!coupon) throw new Error(lastError ?? 'Não foi possível criar o cupom.')

    await logPlatformAction(admin, { id: user.id, email: adminRow.email }, {
      action: 'coupon.create',
      targetType: 'platform_coupon',
      targetId: coupon.id,
      details: insertPayload,
    })

    return NextResponse.json({ item: { ...coupon, status: effectiveCouponStatus(coupon) } })
  } catch (error) {
    const { message, status } = platformErrorResponse(error)
    return NextResponse.json({ error: message }, { status })
  }
}
