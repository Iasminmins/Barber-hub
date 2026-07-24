import { NextResponse } from 'next/server'
import { createAdminSupabaseClient, createAuthenticatedServerClient } from '@/lib/supabase/server'

function bearerToken(request: Request) {
  const authorization = request.headers.get('authorization') ?? ''
  return authorization.startsWith('Bearer ') ? authorization.slice(7) : ''
}

export async function POST(request: Request) {
  try {
    const token = bearerToken(request)
    if (!token) return NextResponse.json({ error: 'Sessão inválida.' }, { status: 401 })

    const authenticated = createAuthenticatedServerClient(token)
    const { data: userData, error: userError } = await authenticated.auth.getUser()
    if (userError || !userData.user) {
      return NextResponse.json({ error: 'Sessão inválida.' }, { status: 401 })
    }

    const { data: ownerMembership } = await authenticated
      .from('members')
      .select('barbershop_id, role, active')
      .eq('user_id', userData.user.id)
      .eq('active', true)
      .single()

    if (!ownerMembership || ownerMembership.role !== 'owner') {
      return NextResponse.json({ error: 'Somente o proprietário pode gerenciar acessos.' }, { status: 403 })
    }

    const body = await request.json() as { employeeId?: string; email?: string; enabled?: boolean }
    const employeeId = String(body.employeeId ?? '')
    const email = String(body.email ?? '').trim().toLowerCase()
    if (!employeeId) return NextResponse.json({ error: 'Funcionário inválido.' }, { status: 400 })

    const admin = createAdminSupabaseClient()
    const { data: employee } = await admin
      .from('employees')
      .select('id, name, email, role, active')
      .eq('id', employeeId)
      .eq('barbershop_id', ownerMembership.barbershop_id)
      .single()

    if (!employee) return NextResponse.json({ error: 'Funcionário não encontrado.' }, { status: 404 })

    const { data: existingMember } = await admin
      .from('members')
      .select('id, user_id, active')
      .eq('barbershop_id', ownerMembership.barbershop_id)
      .eq('employee_id', employee.id)
      .maybeSingle()

    if (body.enabled === false) {
      if (existingMember) {
        const { error } = await admin.from('members').update({ active: false }).eq('id', existingMember.id)
        if (error) throw error
      }
      return NextResponse.json({ active: false })
    }

    if (!email || !email.includes('@')) {
      return NextResponse.json({ error: 'Informe um e-mail válido para enviar o convite.' }, { status: 400 })
    }

    if (existingMember) {
      const { error } = await admin
        .from('members')
        .update({ active: true, email, name: employee.name, role: 'barber' })
        .eq('id', existingMember.id)
      if (error) throw error
      return NextResponse.json({ active: true, invited: false })
    }

    const configuredSiteUrl = process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, '')
    const requestOrigin = new URL(request.url).origin
    const { data: inviteData, error: inviteError } = await admin.auth.admin.inviteUserByEmail(email, {
      redirectTo: `${configuredSiteUrl || requestOrigin}/atualizar-senha`,
      data: { name: employee.name },
    })
    if (inviteError || !inviteData.user) {
      return NextResponse.json({ error: inviteError?.message ?? 'Não foi possível enviar o convite.' }, { status: 400 })
    }

    const { error: memberError } = await admin.from('members').insert({
      barbershop_id: ownerMembership.barbershop_id,
      employee_id: employee.id,
      user_id: inviteData.user.id,
      name: employee.name,
      email,
      role: 'barber',
      active: true,
    })
    if (memberError) {
      await admin.auth.admin.deleteUser(inviteData.user.id)
      throw memberError
    }

    if (employee.email !== email) {
      await admin.from('employees').update({ email }).eq('id', employee.id)
    }

    return NextResponse.json({ active: true, invited: true })
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Não foi possível gerenciar o acesso.' },
      { status: 500 },
    )
  }
}
