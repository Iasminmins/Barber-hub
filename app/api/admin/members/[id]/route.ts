import { NextResponse } from 'next/server'
import { requirePlatformAdmin, platformErrorResponse, logPlatformAction } from '@/lib/platform-admin'

export const dynamic = 'force-dynamic'

/** Suspende ou reativa o acesso de um usuario dentro de uma barbearia. */
export async function PATCH(request: Request, ctx: { params: Promise<{ id: string }> }) {
  try {
    const { admin, user, adminRow } = await requirePlatformAdmin(request)
    const { id } = await ctx.params
    const body = await request.json().catch(() => ({}))
    if (typeof body.active !== 'boolean') throw new Error('Informe o novo estado do acesso.')

    const { data: member } = await admin
      .from('members')
      .select('id, name, email, role, user_id, barbershop_id')
      .eq('id', id)
      .maybeSingle()
    if (!member) throw new Error('Usuário não encontrado.')
    if (member.user_id === user.id) throw new Error('Você não pode suspender o seu próprio acesso.')

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

    const { data: updated, error } = await admin
      .from('members')
      .update({ active: body.active, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select('id, name, email, role, active')
      .maybeSingle()
    if (error || !updated) throw new Error('Não foi possível atualizar o acesso.')

    await logPlatformAction(admin, { id: user.id, email: adminRow.email }, {
      action: body.active ? 'member.reactivate' : 'member.suspend',
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
