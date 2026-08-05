import { NextResponse } from 'next/server'
import { requirePlatformAdmin, platformErrorResponse, logPlatformAction } from '@/lib/platform-admin'

export const dynamic = 'force-dynamic'

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { admin } = await requirePlatformAdmin(request)
    const { id } = await params

    const { data: message, error } = await admin
      .from('platform_messages')
      .select('*')
      .eq('id', id)
      .single()

    if (error || !message) return NextResponse.json({ error: 'Mensagem não encontrada.' }, { status: 404 })

    const { data: recipients } = await admin
      .from('platform_message_recipients')
      .select('id, barbershop_id, recipient_name, recipient_email, status, sent_at, error_message')
      .eq('message_id', id)
      .order('created_at')

    return NextResponse.json({ message, recipients: recipients ?? [] })
  } catch (error) {
    const { message, status } = platformErrorResponse(error)
    return NextResponse.json({ error: message }, { status })
  }
}

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { admin, user, adminRow } = await requirePlatformAdmin(request)
    const { id } = await params
    const body = await request.json()

    const { data: existing, error: fetchError } = await admin
      .from('platform_messages')
      .select('id, status')
      .eq('id', id)
      .single()

    if (fetchError || !existing) return NextResponse.json({ error: 'Mensagem não encontrada.' }, { status: 404 })

    if (body.cancel) {
      if (!['draft', 'scheduled', 'queued'].includes(existing.status)) {
        return NextResponse.json({ error: 'Esta mensagem não pode ser cancelada.' }, { status: 400 })
      }

      const { error } = await admin
        .from('platform_messages')
        .update({ status: 'cancelled', updated_at: new Date().toISOString() })
        .eq('id', id)

      if (error) throw new Error('Não foi possível cancelar a mensagem.')

      await admin
        .from('platform_message_recipients')
        .update({ status: 'cancelled' })
        .eq('message_id', id)
        .in('status', ['pending', 'queued'])

      await logPlatformAction(admin, { id: user.id, email: adminRow.email }, {
        action: 'message.cancel',
        targetType: 'platform_message',
        targetId: id,
        details: {},
      })

      return NextResponse.json({ ok: true, status: 'cancelled' })
    }

    return NextResponse.json({ error: 'Ação não suportada.' }, { status: 400 })
  } catch (error) {
    const { message, status } = platformErrorResponse(error)
    return NextResponse.json({ error: message }, { status })
  }
}
