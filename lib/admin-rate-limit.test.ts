import { describe, expect, it } from 'vitest'
import {
  buildAdminRateLimitLayers,
  checkAdminRateLimit,
  maxRetryAfter,
} from './admin-rate-limit'

describe('admin persistent rate limit', () => {
  it('builds deterministic opaque layers for identity and IP limits', () => {
    const first = buildAdminRateLimitLayers('203.0.113.10', 'Admin@Example.com', 'test-secret')
    const repeated = buildAdminRateLimitLayers('203.0.113.10', 'admin@example.com', 'test-secret')

    expect(first).toEqual(repeated)
    expect(first).toHaveLength(2)
    expect(first.map((layer) => layer.limit)).toEqual([5, 20])
    expect(first.map((layer) => layer.scope)).toEqual(['identity', 'ip'])
    for (const layer of first) {
      expect(layer.key).toMatch(/^[a-f0-9]{64}$/)
      expect(layer.key).not.toContain('203.0.113.10')
      expect(layer.key).not.toContain('admin@example.com')
    }
  })

  it('uses the longest retry delay returned by any layer', () => {
    expect(maxRetryAfter([{ locked: false, retryAfter: 0 }, { locked: true, retryAfter: 418 }])).toBe(418)
    expect(maxRetryAfter([{ locked: false, retryAfter: 0 }])).toBe(0)
  })

  it('blocks when either persistent layer is locked', async () => {
    const layers = buildAdminRateLimitLayers('203.0.113.10', 'admin@example.com', 'test-secret')
    const client = {
      rpc: async (_name: string, args: Record<string, unknown>) => ({
        data: [{ locked: args.p_rate_key === layers[1].key, retry_after: 321 }],
        error: null,
      }),
    }

    await expect(checkAdminRateLimit(client, layers)).resolves.toBe(321)
  })

  it('fails closed when the persistent store is unavailable', async () => {
    const layers = buildAdminRateLimitLayers('203.0.113.10', 'admin@example.com', 'test-secret')
    const client = {
      rpc: async () => ({ data: null, error: { message: 'database unavailable' } }),
    }

    await expect(checkAdminRateLimit(client, layers)).rejects.toThrow('rate limit unavailable')
  })
})
