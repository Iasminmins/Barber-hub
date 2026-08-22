import type { Client } from '@/lib/types'

export function selectClientSearchOption(client: Client) {
  return {
    clientId: client.id,
    clientQuery: client.name,
    isClientSearchOpen: false,
  }
}
