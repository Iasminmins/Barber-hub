const DEFAULT_ASAAS_URL = 'https://api-sandbox.asaas.com/v3'

export type AsaasErrorDetail = { code?: string; description?: string }
type AsaasError = { errors?: AsaasErrorDetail[] }

export class AsaasApiError extends Error {
  errors: AsaasErrorDetail[]
  constructor(message: string, errors: AsaasErrorDetail[]) {
    super(message)
    this.name = 'AsaasApiError'
    this.errors = errors
  }
}

const STALE_LINK_PATTERNS = [/cliente removido/i, /assinatura.*não pode ser atualizada/i]

/** O Asaas apaga a assinatura junto com o cliente removido; esses erros sinalizam que o `asaas_customer_id`/`asaas_subscription_id` salvos estão obsoletos. */
export function isStaleAsaasLinkError(error: unknown): boolean {
  return error instanceof AsaasApiError
    && error.errors.some((detail) => STALE_LINK_PATTERNS.some((pattern) => pattern.test(detail.description ?? '')))
}

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
    const errors = body.errors ?? []
    const message = errors.map((error) => error.description).filter(Boolean).join(' ') || 'O Asaas recusou a operação.'
    throw new AsaasApiError(message, errors)
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
  value?: number
}

export type AsaasSubscription = { id: string; nextDueDate?: string }
