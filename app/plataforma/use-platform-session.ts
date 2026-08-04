'use client'

import { useCallback, useEffect, useState } from 'react'

export type Gate = 'checking' | 'anon' | 'granted'

export function usePlatformSession() {
  const [gate, setGate] = useState<Gate>('checking')
  const [adminName, setAdminName] = useState('')
  const refresh = useCallback(async () => {
    try {
      const response = await fetch('/api/admin/session', { cache: 'no-store' })
      const payload = await response.json().catch(() => ({}))
      if (!response.ok || !payload.isPlatformAdmin) { setGate('anon'); return }
      setAdminName(payload.admin?.name ?? payload.admin?.email ?? '')
      setGate('granted')
    } catch { setGate('anon') }
  }, [])
  useEffect(() => { void refresh() }, [refresh])
  const signOut = useCallback(async () => {
    await fetch('/api/admin/logout', { method: 'POST' }).catch(() => undefined)
    setAdminName(''); setGate('anon')
  }, [])
  return { gate, adminName, token: '', refresh, signOut }
}
