import { timingSafeEqual } from 'node:crypto'

export class RequestBodyError extends Error {
  constructor(message: string, readonly status: number) {
    super(message)
  }
}

export async function readLimitedJson<T>(request: Request, maxBytes = 64 * 1024): Promise<T> {
  const contentLength = Number(request.headers.get('content-length') ?? 0)
  if (Number.isFinite(contentLength) && contentLength > maxBytes) {
    throw new RequestBodyError('Requisição muito grande.', 413)
  }

  const raw = await request.text()
  if (new TextEncoder().encode(raw).byteLength > maxBytes) {
    throw new RequestBodyError('Requisição muito grande.', 413)
  }

  try {
    return JSON.parse(raw) as T
  } catch {
    throw new RequestBodyError('JSON inválido.', 400)
  }
}

export function safeTokenEqual(received: string | null, expected: string | undefined) {
  if (!received || !expected) return false
  const receivedBuffer = Buffer.from(received)
  const expectedBuffer = Buffer.from(expected)
  return receivedBuffer.length === expectedBuffer.length && timingSafeEqual(receivedBuffer, expectedBuffer)
}

export function isUuid(value: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value)
}
