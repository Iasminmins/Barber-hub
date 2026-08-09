import { NextResponse } from 'next/server'
import { requirePlatformAdmin, platformErrorResponse } from '@/lib/platform-admin'
import { getMessageProvider, StubMessageProvider, type MessageChannel } from '@/lib/platform-messaging'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

const MESSAGE_CHANNELS: { key: MessageChannel; label: string; hint: string }[] = [
  { key: 'whatsapp', label: 'WhatsApp', hint: 'Envio manual pelo WhatsApp Web segue disponível na Central de mensagens.' },
  { key: 'email', label: 'E-mail', hint: 'Necessário para disparos em massa por e-mail.' },
  { key: 'sms', label: 'SMS', hint: 'Canal opcional, com custo por mensagem.' },
]

/** Status somente-leitura das integrações da plataforma (sem expor credenciais). */
export async function GET(request: Request) {
  try {
    const { adminRow } = await requirePlatformAdmin(request)

    const asaasKey = process.env.ASAAS_API_KEY ?? ''
    const asaasUrl = process.env.ASAAS_API_URL ?? ''
    const asaasSandbox = !asaasUrl || asaasUrl.includes('sandbox')

    const integrations = [
      {
        key: 'asaas',
        label: 'Asaas',
        category: 'Pagamentos',
        configured: Boolean(asaasKey),
        detail: asaasKey ? (asaasSandbox ? 'Ambiente sandbox' : 'Ambiente de produção') : null,
        hint: 'Responsável por assinaturas, cobranças e status financeiro das barbearias.',
      },
      ...MESSAGE_CHANNELS.map((channel) => ({
        key: channel.key,
        label: channel.label,
        category: 'Mensageria',
        configured: !(getMessageProvider(channel.key) instanceof StubMessageProvider),
        detail: null,
        hint: channel.hint,
      })),
    ]

    return NextResponse.json({
      admin: { name: adminRow.name ?? adminRow.email, email: adminRow.email },
      platform: {
        name: 'Barber Hub',
        baseUrl: process.env.NEXT_PUBLIC_APP_URL ?? null,
        environment: process.env.NODE_ENV === 'production' ? 'Produção' : 'Desenvolvimento',
        supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL ?? null,
      },
      integrations,
    })
  } catch (error) {
    const { message, status } = platformErrorResponse(error)
    return NextResponse.json({ error: message }, { status })
  }
}
