import { NextResponse } from 'next/server'
import { requirePlatformAdmin, platformErrorResponse } from '@/lib/platform-admin'
import { matchesRecipientFilter, type RecipientFilter } from '@/lib/platform-messaging'
import { effectiveBillingStatus } from '@/lib/billing-status'

export const dynamic = 'force-dynamic'

export async function GET(request: Request) {
  try {
    const { admin } = await requirePlatformAdmin(request)
    const url = new URL(request.url)
    const filter: RecipientFilter = {
      status: url.searchParams.get('status') ?? undefined,
      plan: url.searchParams.get('plan') ?? undefined,
      city: url.searchParams.get('city') ?? undefined,
      trialExpiring: url.searchParams.get('trialExpiring') === 'true',
      pastDue: url.searchParams.get('pastDue') === 'true',
      inactive: url.searchParams.get('inactive') === 'true',
    }

    const { data: shops, error } = await admin
      .from('barbershops')
      .select('id, name, slug, city, plan, billing_status, trial_ends_at, next_billing_date, last_payment_at, created_at, updated_at, asaas_subscription_id, complimentary_until')
    if (error) throw new Error('Não foi possível carregar os contatos.')

    const ids = (shops ?? []).map((s) => s.id)
    const { data: members } = ids.length
      ? await admin.from('members').select('id, barbershop_id, name, email, role, active, phone').in('barbershop_id', ids)
      : { data: [] as { id: string; barbershop_id: string; name: string; email: string; role: string; active: boolean; phone: string | null }[] }

    const owners = new Map<string, { id: string; name: string; email: string; phone: string | null }>()
    for (const member of members ?? []) {
      if (member.role === 'owner' && member.active) {
        owners.set(member.barbershop_id, { id: member.id, name: member.name, email: member.email, phone: member.phone ?? null })
      }
    }

    const matched = (shops ?? []).filter((shop) => matchesRecipientFilter(shop, owners.get(shop.id) ?? null, filter))

    const items = matched.map((shop) => {
      const owner = owners.get(shop.id) ?? null
      return {
        ownerId: owner?.id ?? null,
        ownerName: owner?.name ?? 'Sem responsável ativo',
        ownerEmail: owner?.email ?? null,
        ownerPhone: owner?.phone ?? null,
        barbershopId: shop.id,
        barbershopName: shop.name,
        barbershopSlug: shop.slug,
        barbershopCity: shop.city ?? null,
        plan: shop.plan,
        billingStatus: effectiveBillingStatus(shop.billing_status, shop.trial_ends_at),
        trialEndsAt: shop.trial_ends_at,
        nextBillingDate: shop.next_billing_date,
      }
    })

    return NextResponse.json({ items })
  } catch (error) {
    const { message, status } = platformErrorResponse(error)
    return NextResponse.json({ error: message }, { status })
  }
}
