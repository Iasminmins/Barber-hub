const DEFAULT_ASAAS_URL = 'https://api-sandbox.asaas.com/v3'

type AsaasError = { errors?: Array<{ description?: string }> }

export async function asaasRequest<T>(path: string, init?: RequestInit): Promise<T> {
  const apiKey = process.env.ASAAS_API_KEY
  if (!apiKey) throw new Error('A integração com o Asaas ainda não foi configurada.')

  const response = await fetch(`${process.env.ASAAS_API_URL ?? DEFAULT_ASAAS_URL}${path}`, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      access_token: apiKey,
      'User-Agent': 'BarberHub',
      ...init?.headers,
    },
    cache: 'no-store',
  })

  const body = (await response.json().catch(() => ({}))) as T & AsaasError
  if (!response.ok) {
    const message = body.errors?.map((error) => error.description).filter(Boolean).join(' ') || 'O Asaas recusou a operação.'
    throw new Error(message)
  }
  return body
}

export type AsaasPayment = {
  id: string
  invoiceUrl?: string
  bankSlipUrl?: string
  dueDate?: string
  status?: string
  subscription?: string
  externalReference?: string
}

export type AsaasSubscription = { id: string; nextDueDate?: string }
