import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

const RESEND_ENDPOINT = 'https://api.resend.com/emails'

function escapeHtml(value: string) {
  return value.replace(/[&<>"']/g, (character) => {
    const entities: Record<string, string> = {
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#039;',
    }

    return entities[character]
  })
}

function welcomeEmailHtml(ownerName: string) {
  const safeName = escapeHtml(ownerName)

  return `<!doctype html>
<html lang="pt-BR">
  <head><meta charset="utf-8"><meta name="viewport" content="width=device-width"></head>
  <body style="margin:0;background:#f4f5f7;font-family:Arial,Helvetica,sans-serif;color:#17201b">
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#f4f5f7;padding:32px 12px">
      <tr><td align="center">
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:600px;background:#ffffff;border:1px solid #e4e8e5;border-radius:16px;overflow:hidden">
          <tr><td style="background:#123d2b;padding:28px 32px;color:#ffffff">
            <div style="font-size:24px;font-weight:700">MeuBarberHub</div>
            <div style="margin-top:6px;font-size:14px;color:#d8e9df">Gestão profissional para sua barbearia</div>
          </td></tr>
          <tr><td style="padding:34px 32px">
            <h1 style="margin:0 0 16px;font-size:26px;line-height:1.25;color:#17201b">Bem-vindo ao MeuBarberHub, ${safeName}!</h1>
            <p style="margin:0 0 16px;font-size:16px;line-height:1.65;color:#4d5751">Sua conta foi criada com sucesso e sua barbearia já está pronta para ser configurada.</p>
            <p style="margin:0 0 26px;font-size:16px;line-height:1.65;color:#4d5751">Você pode começar cadastrando sua equipe, seus serviços e os horários de atendimento.</p>
            <a href="https://meubarberhub.com.br/dashboard" style="display:inline-block;background:#c79a36;color:#17201b;text-decoration:none;font-size:16px;font-weight:700;padding:14px 24px;border-radius:9px">Acessar meu painel</a>
            <p style="margin:28px 0 0;font-size:13px;line-height:1.6;color:#79827d">Se você não criou esta conta, responda a este e-mail para que possamos ajudar.</p>
          </td></tr>
          <tr><td style="border-top:1px solid #e8ebe9;padding:20px 32px;font-size:12px;color:#7b847f">© MeuBarberHub — meubarberhub.com.br</td></tr>
        </table>
      </td></tr>
    </table>
  </body>
</html>`
}

export async function POST(request: Request) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  const resendApiKey = process.env.RESEND_API_KEY
  const authorization = request.headers.get('authorization')
  const accessToken = authorization?.match(/^Bearer\s+(.+)$/i)?.[1]

  if (!supabaseUrl || !supabaseAnonKey || !resendApiKey) {
    return NextResponse.json({ error: 'Email service is not configured.' }, { status: 503 })
  }

  if (!accessToken) {
    return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 })
  }

  const supabase = createClient(supabaseUrl, supabaseAnonKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  })
  const { data, error } = await supabase.auth.getUser(accessToken)
  const user = data.user

  if (error || !user?.email) {
    return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 })
  }

  const ownerName =
    typeof user.user_metadata?.owner_name === 'string' && user.user_metadata.owner_name.trim()
      ? user.user_metadata.owner_name.trim()
      : 'empreendedor'

  const response = await fetch(RESEND_ENDPOINT, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${resendApiKey}`,
      'Content-Type': 'application/json',
      'Idempotency-Key': `welcome-user-${user.id}`,
    },
    body: JSON.stringify({
      from: 'MeuBarberHub <no-reply@meubarberhub.com.br>',
      to: [user.email],
      subject: 'Bem-vindo ao MeuBarberHub!',
      html: welcomeEmailHtml(ownerName),
    }),
  })

  if (!response.ok) {
    return NextResponse.json({ error: 'Email could not be sent.' }, { status: 502 })
  }

  return NextResponse.json({ sent: true })
}
