import { NextResponse } from 'next/server'
import { requirePlatformAdmin, platformErrorResponse, logPlatformAction } from '@/lib/platform-admin'
import {
  buildRecipientContext,
  estimateChannelCost,
  getMessageProvider,
  matchesRecipientFilter,
  personalizeMessage,
  type MessageChannel,
  type RecipientFilter,
} from '@/lib/platform-messaging'

export const dynamic = 'force-dynamic'

async function resolveRecipients(admin: Awaited<ReturnType<typeof requirePlatformAdmin>>['admin'], filter: RecipientFilter) {
  const { data: shops, error } = await admin
    .from('barbershops')
    .select('id, name, slug, city, plan, billing_status, trial_ends_at, next_billing_date, last_payment_at, created_at, updated_at, asaas_subscription_id, complimentary_until')
  if (error) throw new Error('Não foi possível carregar destinatários.')

  const ids = (shops ?? []).map((s) => s.id)
  const { data: members } = ids.length
    ? await admin.from('members').select('barbershop_id, name, email, role, active, phone').in('barbershop_id', ids)
    : { data: [] }

  const owners = new Map<string, { name: string; email: string; phone: string | null }>()
  for (const member of members ?? []) {
    if (member.role === 'owner' && member.active) {
      owners.set(member.barbershop_id, { name: member.name, email: member.email, phone: member.phone ?? null })
    }
  }

  return (shops ?? []).filter((shop) => matchesRecipientFilter(shop, owners.get(shop.id) ?? null, filter))
    .map((shop) => ({
      shop,
      owner: owners.get(shop.id) ?? null,
    }))
}

export async function GET(request: Request) {
  try {
    const { admin } = await requirePlatformAdmin(request)
    const url = new URL(request.url)
    const status = url.searchParams.get('status')?.trim() ?? ''
    const limit = Math.min(Number(url.searchParams.get('limit') ?? 50), 100)

    let query = admin
      .from('platform_messages')
      .select('id, channel, subject, body, status, scheduled_at, sent_at, recipient_count, admin_email, estimated_cost, created_at')
      .order('created_at', { ascending: false })
      .limit(limit)

    if (status) query = query.eq('status', status)

    const { data, error } = await query
    if (error) throw new Error('Não foi possível carregar mensagens.')

    return NextResponse.json({ items: data ?? [] })
  } catch (error) {
    const { message, status } = platformErrorResponse(error)
    return NextResponse.json({ error: message }, { status })
  }
}

export async function POST(request: Request) {
  try {
    const { admin, user, adminRow } = await requirePlatformAdmin(request)
    const body = await request.json()
    const channel = body.channel as MessageChannel
    const subject = typeof body.subject === 'string' ? body.subject : null
    const messageBody = String(body.body ?? '').trim()
    const filter = (body.filter ?? {}) as RecipientFilter
    const barbershopIds = Array.isArray(body.barbershopIds) ? body.barbershopIds as string[] : undefined
    const scheduledAt = body.scheduledAt ? String(body.scheduledAt) : null
    const saveAsDraft = Boolean(body.saveAsDraft)
    const templateId = body.templateId ? String(body.templateId) : null
    const confirmed = Boolean(body.confirmed)

    if (!['whatsapp', 'email', 'sms', 'in_app'].includes(channel)) {
      return NextResponse.json({ error: 'Canal inválido.' }, { status: 400 })
    }
    if (messageBody.length < 3) {
      return NextResponse.json({ error: 'Informe o conteúdo da mensagem.' }, { status: 400 })
    }

    const recipients = await resolveRecipients(admin, { ...filter, barbershopIds })
    if (!recipients.length && !saveAsDraft) {
      return NextResponse.json({ error: 'Nenhum destinatário encontrado com os filtros selecionados.' }, { status: 400 })
    }

    const estimatedCost = estimateChannelCost(channel, recipients.length)

    if (!saveAsDraft && !confirmed) {
      return NextResponse.json({
        preview: true,
        recipientCount: recipients.length,
        channel,
        estimatedCost,
        message: messageBody,
        requiresConfirmation: true,
      })
    }

    const status = saveAsDraft ? 'draft' : scheduledAt ? 'scheduled' : 'queued'

    const { data: message, error: insertError } = await admin
      .from('platform_messages')
      .insert({
        admin_user_id: user.id,
        admin_email: adminRow.email,
        channel,
        subject,
        body: messageBody,
        status,
        scheduled_at: scheduledAt,
        recipient_count: recipients.length,
        filter_snapshot: { ...filter, barbershopIds },
        template_id: templateId,
        estimated_cost: estimatedCost,
      })
      .select('id')
      .single()

    if (insertError || !message) throw new Error('Não foi possível registrar a mensagem.')

    if (!saveAsDraft && recipients.length) {
      const recipientRows = recipients.map(({ shop, owner }) => {
        const context = buildRecipientContext(shop, owner)
        return {
          message_id: message.id,
          barbershop_id: shop.id,
          recipient_name: owner?.name ?? null,
          recipient_email: owner?.email ?? null,
          recipient_phone: owner?.phone ?? null,
          personalized_body: personalizeMessage(messageBody, context),
          status: scheduledAt ? 'pending' : 'queued',
        }
      })

      const { error: recipientError } = await admin.from('platform_message_recipients').insert(recipientRows)
      if (recipientError) throw new Error('Não foi possível registrar destinatários.')

      if (!scheduledAt) {
        const provider = getMessageProvider(channel)
        let sentCount = 0
        let failedCount = 0

        for (const row of recipientRows) {
          const to = channel === 'email' ? row.recipient_email ?? '' : row.recipient_phone ?? row.recipient_email ?? ''
          if (!to) {
            failedCount += 1
            continue
          }
          const result = await provider.send({
            to,
            subject: subject ?? undefined,
            body: row.personalized_body,
            recipientId: row.barbershop_id,
          })
          if (result.success) sentCount += 1
          else failedCount += 1
        }

        const finalStatus = failedCount === recipientRows.length ? 'failed' : sentCount > 0 ? 'sent' : 'queued'
        await admin.from('platform_messages').update({
          status: finalStatus,
          sent_at: sentCount > 0 ? new Date().toISOString() : null,
          error_message: failedCount > 0 ? `${failedCount} destinatário(s) não puderam ser enviados — provedor não configurado.` : null,
        }).eq('id', message.id)
      }
    }

    await logPlatformAction(admin, { id: user.id, email: adminRow.email }, {
      action: 'message.create',
      targetType: 'platform_message',
      targetId: message.id,
      details: { channel, recipientCount: recipients.length, status, saveAsDraft },
    })

    return NextResponse.json({ id: message.id, recipientCount: recipients.length, status })
  } catch (error) {
    const { message, status } = platformErrorResponse(error)
    return NextResponse.json({ error: message }, { status })
  }
}
