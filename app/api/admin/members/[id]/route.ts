import { NextResponse } from 'next/server'
import { requirePlatformAdmin, platformErrorResponse, logPlatformAction } from '@/lib/platform-admin'

export const dynamic = 'force-dynamic'

/** Suspende/reativa o acesso de um usuario e/ou atualiza o telefone de contato (WhatsApp). */
export async function PATCH(request: Request, ctx: { params: Promise<{ id: string }> }) {
  try {
    const { admin, user, adminRow } = await requirePlatformAdmin(request)
    const { id } = await ctx.params
    const body = await request.json().catch(() => ({}))

    const hasActive = typeof body.active === 'boolean'
    const hasPhone = typeof body.phone === 'string' || body.phone === null
    if (!hasActive && !hasPhone) throw new Error('Informe o campo a ser atualizado.')

    const { data: member } = await admin
      .from('members')
      .select('id, name, email, role, user_id, barbershop_id')
      .eq('id', id)
      .maybeSingle()
    if (!member) throw new Error('Usuário não encontrado.')

    const patch: Record<string, unknown> = { updated_at: new Date().toISOString() }

    if (hasActive) {
      if (member.user_id === user.id && body.active === false) throw new Error('Você não pode suspender o seu próprio acesso.')
      if (member.role === 'owner' && body.active === false) {
        const { count } = await admin
          .from('members')
          .select('id', { count: 'exact', head: true })
          .eq('barbershop_id', member.barbershop_id)
          .eq('role', 'owner')
          .eq('active', true)
        if ((count ?? 0) <= 1) {
          throw new Error('Esta conta ficaria sem nenhum proprietário ativo.')
        }
      }
      patch.active = body.active
    }

    if (hasPhone) {
      const phone = typeof body.phone === 'string' ? body.phone.trim() : null
      patch.phone = phone || null
    }

    const { data: updated, error } = await admin
      .from('members')
      .update(patch)
      .eq('id', id)
      .select('id, name, email, role, active, phone')
      .maybeSingle()
    if (error || !updated) throw new Error('Não foi possível atualizar o usuário.')

    await logPlatformAction(admin, { id: user.id, email: adminRow.email }, {
      action: hasActive ? (body.active ? 'member.reactivate' : 'member.suspend') : 'member.update_phone',
      targetType: 'member',
      targetId: id,
      details: { email: member.email, role: member.role, barbershopId: member.barbershop_id },
    })

    return NextResponse.json({ member: updated })
  } catch (error) {
    const { message, status } = platformErrorResponse(error)
    return NextResponse.json({ error: message }, { status })
  }
}
