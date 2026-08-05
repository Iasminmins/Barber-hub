import { NextResponse } from 'next/server'
import { requirePlatformAdmin, platformErrorResponse } from '@/lib/platform-admin'
import { estimateChannelCost, matchesRecipientFilter } from '@/lib/platform-messaging'
import type { RecipientFilter } from '@/lib/platform-messaging'

export const dynamic = 'force-dynamic'

export async function POST(request: Request) {
  try {
    const { admin } = await requirePlatformAdmin(request)
    const filter = (await request.json()) as RecipientFilter

    const { data: shops, error } = await admin
      .from('barbershops')
      .select('id, name, slug, city, plan, billing_status, trial_ends_at, next_billing_date, last_payment_at, created_at, updated_at, asaas_subscription_id, complimentary_until')

    if (error) throw new Error('Não foi possível calcular destinatários.')

    const ids = (shops ?? []).map((s) => s.id)
    const { data: members } = ids.length
      ? await admin.from('members').select('barbershop_id, name, email, role, active').in('barbershop_id', ids)
      : { data: [] }

    const owners = new Map<string, { name: string; email: string }>()
    for (const member of members ?? []) {
      if (member.role === 'owner' && member.active) {
        owners.set(member.barbershop_id, { name: member.name, email: member.email })
      }
    }

    const matched = (shops ?? []).filter((shop) => matchesRecipientFilter(shop, owners.get(shop.id) ?? null, filter))
    const channel = filter as RecipientFilter & { channel?: string }
    const estimatedCost = estimateChannelCost(
      (channel.channel as 'whatsapp' | 'email' | 'sms' | 'in_app') ?? 'email',
      matched.length,
    )

    return NextResponse.json({
      count: matched.length,
      estimatedCost,
      sample: matched.slice(0, 5).map((shop) => ({
        id: shop.id,
        name: shop.name,
        owner: owners.get(shop.id)?.name ?? null,
      })),
    })
  } catch (error) {
    const { message, status } = platformErrorResponse(error)
    return NextResponse.json({ error: message }, { status })
  }
}
