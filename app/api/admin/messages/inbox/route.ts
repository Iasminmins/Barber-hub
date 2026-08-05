import { NextResponse } from 'next/server'
import { requirePlatformAdmin, platformErrorResponse, logPlatformAction } from '@/lib/platform-admin'

export const dynamic = 'force-dynamic'

export async function GET(request: Request) {
  try {
    const { admin } = await requirePlatformAdmin(request)
    const url = new URL(request.url)
    const barbershopId = url.searchParams.get('barbershopId')

    let query = admin
      .from('platform_message_inbox')
      .select('id, barbershop_id, channel, direction, sender_name, sender_email, subject, body, read_at, created_at')
      .order('created_at', { ascending: false })
      .limit(100)

    if (barbershopId) query = query.eq('barbershop_id', barbershopId)

    const { data, error } = await query
    if (error) throw new Error('Não foi possível carregar a caixa de entrada.')

    return NextResponse.json({ items: data ?? [] })
  } catch (error) {
    const { message, status } = platformErrorResponse(error)
    return NextResponse.json({ error: message }, { status })
  }
}

export async function PATCH(request: Request) {
  try {
    const { admin, user, adminRow } = await requirePlatformAdmin(request)
    const body = await request.json()
    const id = String(body.id ?? '')
    const read = Boolean(body.read)

    if (!id) return NextResponse.json({ error: 'ID obrigatório.' }, { status: 400 })

    const { error } = await admin
      .from('platform_message_inbox')
      .update({ read_at: read ? new Date().toISOString() : null })
      .eq('id', id)

    if (error) throw new Error('Não foi possível atualizar a mensagem.')

    await logPlatformAction(admin, { id: user.id, email: adminRow.email }, {
      action: read ? 'message.read' : 'message.unread',
      targetType: 'platform_message_inbox',
      targetId: id,
      details: {},
    })

    return NextResponse.json({ ok: true })
  } catch (error) {
    const { message, status } = platformErrorResponse(error)
    return NextResponse.json({ error: message }, { status })
  }
}
