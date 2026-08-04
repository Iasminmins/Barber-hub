'use client'

import { useState, type FormEvent } from 'react'
import { Loader2, ShieldCheck } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import type { Gate } from './use-platform-session'

type Props = {
  gate: Gate
  onSignIn: (email: string, password: string) => Promise<void>
}

export function AccessGate({ gate, onSignIn }: Props) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  if (gate === 'checking') {
    return (
      <div className="flex min-h-screen items-center justify-center text-muted-foreground">
        <Loader2 className="mr-2 size-4 animate-spin" /> Verificando acesso…
      </div>
    )
  }

  async function submit(event: FormEvent) {
    event.preventDefault()
    setError('')
    if (!email.trim() || !password) {
      setError('Informe e-mail e senha.')
      return
    }
    setLoading(true)
    try {
      await onSignIn(email.trim(), password)
    } catch (signInError) {
      setError(signInError instanceof Error ? signInError.message : 'Não foi possível entrar.')
      setPassword('')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/30 p-6">
      <Card className="w-full max-w-sm p-6">
        <div className="text-center">
          <ShieldCheck className="mx-auto size-8 text-muted-foreground" />
          <h1 className="mt-3 font-semibold">Administração da plataforma</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Área restrita. Entre com suas credenciais de administrador.
          </p>
        </div>

        <form className="mt-6 space-y-4" onSubmit={submit}>
          <div className="space-y-1.5">
            <Label htmlFor="admin-email">E-mail</Label>
            <Input
              id="admin-email"
              type="email"
              autoComplete="username"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              disabled={loading}
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="admin-password">Senha</Label>
            <Input
              id="admin-password"
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              disabled={loading}
            />
          </div>

          {error ? (
            <p className="rounded-md border border-destructive/40 bg-destructive/10 p-2.5 text-sm text-destructive">
              {error}
            </p>
          ) : null}

          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? <Loader2 className="mr-2 size-4 animate-spin" /> : null}
            Entrar
          </Button>
        </form>
      </Card>
    </div>
  )
}
