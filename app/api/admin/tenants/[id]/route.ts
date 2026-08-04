import { NextResponse } from 'next/server'
import { requirePlatformAdmin, platformErrorResponse, logPlatformAction } from '@/lib/platform-admin'
import { addComplimentaryPeriod } from '@/lib/admin-billing'
import { asaasRequest } from '@/lib/asaas'
import { getSaasPlan, type SaasPlanId } from '@/lib/saas-plans'

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

    const { data: audit } = await admin
      .from('platform_audit_log')
      .select('id, admin_email, action, details, created_at')
      .eq('target_id', id)
      .order('created_at', { ascending: false })
      .limit(20)

    return NextResponse.json({ barbershop: shop, members: members ?? [], audit: audit ?? [] })
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

    const { data: current, error: currentError } = await admin
      .from('barbershops')
      .select('id, name, plan, billing_status, trial_ends_at, next_billing_date, asaas_subscription_id')
      .eq('id', id)
      .maybeSingle()
    if (currentError || !current) throw new Error('Conta não encontrada.')

    const patch: Record<string, unknown> = {}
    if (body.syncAsaas === true) {
      if (!current.asaas_subscription_id) throw new Error('Esta conta ainda não possui assinatura no Asaas.')
      const subscription = await asaasRequest<{ nextDueDate?: string; status?: string }>(`/subscriptions/${current.asaas_subscription_id}`)
      if (subscription.nextDueDate) patch.next_billing_date = subscription.nextDueDate
      if (subscription.status === 'INACTIVE' || subscription.status === 'EXPIRED') patch.billing_status = 'canceled'
      else if (subscription.status === 'ACTIVE') patch.billing_status = 'active'
    }
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
    const complimentaryDays = typeof body.complimentaryDays === 'number' ? Math.trunc(body.complimentaryDays) : 0
    const complimentaryMonths = typeof body.complimentaryMonths === 'number' ? Math.trunc(body.complimentaryMonths) : 0
    const customComplimentaryUntil = typeof body.complimentaryUntil === 'string' ? body.complimentaryUntil.trim() : ''
    const nextBillingDate = typeof body.nextBillingDate === 'string' ? body.nextBillingDate.trim() : ''
    const reason = typeof body.reason === 'string' ? body.reason.trim() : ''
    const hasComplimentaryPeriod = complimentaryDays > 0 || complimentaryMonths > 0 || Boolean(customComplimentaryUntil)
    if (complimentaryDays < 0 || complimentaryDays > 730) throw new Error('A cortesia deve ter no máximo 730 dias.')
    if (complimentaryMonths < 0 || complimentaryMonths > 24) throw new Error('A cortesia deve ter no máximo 24 meses.')
    if ((hasComplimentaryPeriod || nextBillingDate || typeof body.billing_status === 'string') && reason.length < 3) {
      throw new Error('Informe o motivo da alteração administrativa.')
    }

    let effectiveBillingDate = nextBillingDate
    if (effectiveBillingDate && !/^\d{4}-\d{2}-\d{2}$/.test(effectiveBillingDate)) throw new Error('Data da próxima cobrança inválida.')
    if (hasComplimentaryPeriod) {
      if (customComplimentaryUntil) {
        if (!/^\d{4}-\d{2}-\d{2}$/.test(customComplimentaryUntil) || customComplimentaryUntil <= new Date().toISOString().slice(0, 10)) {
          throw new Error('A data final da cortesia deve estar no futuro.')
        }
        effectiveBillingDate = customComplimentaryUntil
      } else {
        effectiveBillingDate = addComplimentaryPeriod(
          current.asaas_subscription_id ? current.next_billing_date : current.trial_ends_at,
          complimentaryMonths ? { months: complimentaryMonths } : { days: complimentaryDays },
        )
      }
      const plan = getSaasPlan(current.plan as SaasPlanId)
      const estimatedDays = complimentaryDays || Math.max(1, Math.round((new Date(`${effectiveBillingDate}T12:00:00`).getTime() - Date.now()) / 86400000))
      patch.complimentary_until = effectiveBillingDate
      patch.complimentary_reason = reason
      patch.complimentary_value = complimentaryMonths ? complimentaryMonths * plan.monthlyPrice : Number(((estimatedDays / 30) * plan.monthlyPrice).toFixed(2))
      patch.complimentary_granted_at = new Date().toISOString()
      patch.billing_status = current.asaas_subscription_id ? 'active' : 'trialing'
      if (current.asaas_subscription_id) patch.next_billing_date = effectiveBillingDate
      else patch.trial_ends_at = effectiveBillingDate
    } else if (effectiveBillingDate) {
      patch.next_billing_date = effectiveBillingDate
    }

    const asaasUpdate: Record<string, unknown> = {}
    if (effectiveBillingDate && current.asaas_subscription_id) asaasUpdate.nextDueDate = effectiveBillingDate
    if (typeof patch.plan === 'string' && current.asaas_subscription_id) {
      const plan = getSaasPlan(patch.plan as SaasPlanId)
      Object.assign(asaasUpdate, { value: plan.monthlyPrice, cycle: 'MONTHLY', description: `BarberHub - Plano ${plan.name}`, updatePendingPayments: true })
    }
    if (Object.keys(asaasUpdate).length && current.asaas_subscription_id) {
      await asaasRequest(`/subscriptions/${current.asaas_subscription_id}`, {
        method: 'PUT',
        body: JSON.stringify(asaasUpdate),
      })
    }
    if (!Object.keys(patch).length) throw new Error('Nenhuma alteração informada.')

    patch.updated_at = new Date().toISOString()
    const { data: updated, error } = await admin
      .from('barbershops')
      .update(patch)
      .eq('id', id)
      .select('*')
      .maybeSingle()
    if (error || !updated) throw new Error('Não foi possível atualizar a conta.')

    await logPlatformAction(admin, { id: user.id, email: adminRow.email }, {
      action: hasComplimentaryPeriod ? 'tenant.complimentary_grant' : 'tenant.billing_update',
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
