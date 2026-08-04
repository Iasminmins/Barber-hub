import { NextResponse } from 'next/server'
import { requirePlatformAdmin, platformErrorResponse, logPlatformAction } from '@/lib/platform-admin'

export const dynamic = 'force-dynamic'

type Ctx = { params: Promise<{ id: string }> }

const PLANS = ['starter', 'pro', 'premium']
const STATUSES = ['trialing', 'active', 'past_due', 'canceled']

export async function GET(request: Request, ctx: Ctx) {
  try {
    const { admin } = await requirePlatformAdmin(request)
    const { id } = await ctx.params

    const { data: shop, error } = await admin
      .from('barbershops')
      .select('*')
      .eq('id', id)
      .maybeSingle()
    if (error || !shop) throw new Error('Conta não encontrada.')

    const { data: members } = await admin
      .from('members')
      .select('id, user_id, name, email, role, active, created_at')
      .eq('barbershop_id', id)
      .order('created_at', { ascending: true })

    return NextResponse.json({ barbershop: shop, members: members ?? [] })
  } catch (error) {
    const { message, status } = platformErrorResponse(error)
    return NextResponse.json({ error: message }, { status })
  }
}

export async function PATCH(request: Request, ctx: Ctx) {
  try {
    const { admin, user, adminRow } = await requirePlatformAdmin(request)
    const { id } = await ctx.params
    const body = await request.json().catch(() => ({}))

    const patch: Record<string, unknown> = {}
    if (typeof body.plan === 'string') {
      if (!PLANS.includes(body.plan)) throw new Error('Plano inválido.')
      patch.plan = body.plan
    }
    if (typeof body.billing_status === 'string') {
      if (!STATUSES.includes(body.billing_status)) throw new Error('Status inválido.')
      patch.billing_status = body.billing_status
    }
    if (typeof body.trialDays === 'number' && Number.isFinite(body.trialDays)) {
      const end = new Date()
      end.setDate(end.getDate() + Math.trunc(body.trialDays))
      patch.trial_ends_at = end.toISOString()
      patch.billing_status = patch.billing_status ?? 'trialing'
    }
    if (!Object.keys(patch).length) throw new Error('Nenhuma alteração informada.')

    patch.updated_at = new Date().toISOString()
    const { data: updated, error } = await admin
      .from('barbershops')
      .update(patch)
      .eq('id', id)
      .select('id, name, plan, billing_status, trial_ends_at')
      .maybeSingle()
    if (error || !updated) throw new Error('Não foi possível atualizar a conta.')

    await logPlatformAction(admin, { id: user.id, email: adminRow.email }, {
      action: 'tenant.update',
      targetType: 'barbershop',
      targetId: id,
      details: patch as Record<string, unknown>,
    })

    return NextResponse.json({ barbershop: updated })
  } catch (error) {
    const { message, status } = platformErrorResponse(error)
    return NextResponse.json({ error: message }, { status })
  }
}

export async function DELETE(request: Request, ctx: Ctx) {
  try {
    const { admin, user, adminRow } = await requirePlatformAdmin(request)
    const { id } = await ctx.params
    const url = new URL(request.url)
    const confirmSlug = url.searchParams.get('confirm')?.trim() ?? ''
    const deleteUsers = url.searchParams.get('deleteUsers') === 'true'

    const { data: shop } = await admin
      .from('barbershops')
      .select('id, name, slug')
      .eq('id', id)
      .maybeSingle()
    if (!shop) throw new Error('Conta não encontrada.')
    if (confirmSlug !== shop.slug) {
      throw new Error(`Confirmação inválida. Digite o slug exato da conta: ${shop.slug}`)
    }

    const { data: members } = await admin
      .from('members')
      .select('user_id')
      .eq('barbershop_id', id)
    const memberIds = [...new Set((members ?? []).map((m) => m.user_id))]

    const { error: deleteError } = await admin.from('barbershops').delete().eq('id', id)
    if (deleteError) throw new Error('Não foi possível remover a conta.')

    const removedUsers: string[] = []
    if (deleteUsers && memberIds.length) {
      const { data: stillLinked } = await admin
        .from('members')
        .select('user_id')
        .in('user_id', memberIds)
      const linked = new Set((stillLinked ?? []).map((m) => m.user_id))
      for (const userId of memberIds) {
        if (linked.has(userId) || userId === user.id) continue
        const { error } = await admin.auth.admin.deleteUser(userId)
        if (!error) removedUsers.push(userId)
      }
    }

    await logPlatformAction(admin, { id: user.id, email: adminRow.email }, {
      action: 'tenant.delete',
      targetType: 'barbershop',
      targetId: id,
      details: { name: shop.name, slug: shop.slug, deletedUsers: removedUsers.length },
    })

    return NextResponse.json({ ok: true, deletedUsers: removedUsers.length })
  } catch (error) {
    const { message, status } = platformErrorResponse(error)
    return NextResponse.json({ error: message }, { status })
  }
}
