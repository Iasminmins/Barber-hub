import { NextResponse } from 'next/server'
import { asaasRequest } from '@/lib/asaas'
import { requirePlatformAdmin, platformErrorResponse } from '@/lib/platform-admin'

export const dynamic = 'force-dynamic'

type PaymentRow = {
  id: string
  value?: number
  netValue?: number
  status?: string
  billingType?: string
  dueDate?: string
  paymentDate?: string
  description?: string
  invoiceUrl?: string
}

export async function GET(request: Request, ctx: { params: Promise<{ id: string }> }) {
  try {
    const { admin } = await requirePlatformAdmin(request)
    const { id } = await ctx.params

    const { data: shop } = await admin
      .from('barbershops')
      .select('id, asaas_customer_id')
      .eq('id', id)
      .maybeSingle()
    if (!shop) throw new Error('Conta não encontrada.')

    if (!shop.asaas_customer_id) {
      return NextResponse.json({ payments: [], note: 'Conta ainda não possui cadastro de cobrança no Asaas.' })
    }

    if (!process.env.ASAAS_API_KEY) {
      return NextResponse.json({ payments: [], note: 'ASAAS_API_KEY não configurada neste ambiente.' })
    }

    const result = await asaasRequest<{ data?: PaymentRow[] }>(
      `/payments?customer=${encodeURIComponent(shop.asaas_customer_id)}&limit=20&order=desc`,
    )

    const payments = (result.data ?? []).map((payment) => ({
      id: payment.id,
      value: payment.value ?? 0,
      status: payment.status ?? '—',
      billingType: payment.billingType ?? '—',
      dueDate: payment.dueDate ?? null,
      paymentDate: payment.paymentDate ?? null,
      description: payment.description ?? null,
      invoiceUrl: payment.invoiceUrl ?? null,
    }))

    return NextResponse.json({ payments })
  } catch (error) {
    const { message, status } = platformErrorResponse(error)
    return NextResponse.json({ payments: [], error: message }, { status })
  }
}
