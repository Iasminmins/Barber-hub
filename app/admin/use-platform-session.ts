'use client'

import { useCallback, useEffect, useState } from 'react'

export type Gate = 'checking' | 'anon' | 'granted'

/**
 * Sessao exclusiva da administracao da plataforma.
 * O token fica em cookie httpOnly (o JS nao le), entao aqui so
 * acompanhamos se a sessao esta valida ou nao.
 */
export function usePlatformSession() {
  const [gate, setGate] = useState<Gate>('checking')
  const [adminName, setAdminName] = useState('')

  const refresh = useCallback(async () => {
    try {
      const response = await fetch('/api/admin/session', { cache: 'no-store' })
      const payload = await response.json().catch(() => ({}))
      if (!response.ok || !payload.isPlatformAdmin) {
        setGate('anon')
        return
      }
      setAdminName(payload.admin?.name ?? payload.admin?.email ?? '')
      setGate('granted')
    } catch {
      setGate('anon')
    }
  }, [])

  useEffect(() => {
    void refresh()
  }, [refresh])

  const signIn = useCallback(async (email: string, password: string) => {
    const response = await fetch('/api/admin/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    })
    const payload = await response.json().catch(() => ({}))
    if (!response.ok) throw new Error(payload.error ?? 'Não foi possível entrar.')
    setAdminName(payload.admin?.name ?? payload.admin?.email ?? '')
    setGate('granted')
  }, [])

  const signOut = useCallback(async () => {
    await fetch('/api/admin/logout', { method: 'POST' }).catch(() => undefined)
    setAdminName('')
    setGate('anon')
  }, [])

  // Mantido por compatibilidade: a autenticacao agora e por cookie httpOnly.
  return { gate, adminName, token: '', refresh, signIn, signOut }
}
