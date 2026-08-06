import { NextResponse } from 'next/server'
import { asaasRequest } from '@/lib/asaas'
import { getBillingContext } from '@/lib/billing-auth'
import { createAdminSupabaseClient } from '@/lib/supabase/server'

/**
 * Cancelamento da assinatura do BarberHub pelo próprio proprietário.
 *
 * Regras de segurança adotadas aqui:
 *
 * - `getBillingContext` já garante que apenas o papel `owner` chega até aqui.
 * - O Asaas é chamado ANTES do banco. Se o gateway recusar, nada é gravado —
 *   nunca marcamos como cancelado sem confirmação de quem cobra.
 * - O update toca UMA coluna (`billing_status`) de UMA linha, filtrada por id.
 *   Nenhum dado operacional é apagado: agenda, clientes, comandas, produtos e
 *   financeiro permanecem intactos.
 * - `next_billing_date` NÃO é alterado: é ele que mantém o acesso liberado até
 *   o fim do período já pago (ver `getBillingState` em billing-notice.tsx).
 */
export async function DELETE(request: Request) {
  try {
    const { barbershop } = await getBillingContext(request)

    if (barbershop.billing_status === 'canceled') {
      return NextResponse.json({ message: 'Esta assinatura já está cancelada.' })
    }

    // Só há chamada ao gateway se existir assinatura de fato criada lá.
    if (barbershop.asaas_subscription_id) {
      await asaasRequest(`/subscriptions/${barbershop.asaas_subscription_id}`, {
        method: 'DELETE',
      })
    }

    const supabase = createAdminSupabaseClient()
    const { error } = await supabase
      .from('barbershops')
      .update({ billing_status: 'canceled' })
      .eq('id', barbershop.id)

    if (error) throw new Error(error.message)

    const accessUntil =
      barbershop.billing_status === 'trialing'
        ? barbershop.trial_ends_at
        : barbershop.next_billing_date

    return NextResponse.json({
      status: 'canceled',
      accessUntil: accessUntil ?? null,
      message: accessUntil
        ? 'Assinatura cancelada. O acesso continua até o fim do período já contratado.'
        : 'Assinatura cancelada.',
    })
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Não foi possível cancelar a assinatura.' },
      { status: 400 },
    )
  }
}
