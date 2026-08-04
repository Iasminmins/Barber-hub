'use client'

import * as React from 'react'
import { Button } from '@/components/ui/button'

export default function RootError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  React.useEffect(() => {
    console.error('Erro não tratado na aplicação', { digest: error.digest, error })
  }, [error])

  return (
    <main className="grid min-h-screen place-items-center bg-background p-6 text-center">
      <div className="max-w-md rounded-2xl border border-border bg-card p-8 shadow-sm">
        <h1 className="text-xl font-bold">Não foi possível abrir esta área</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Seus dados continuam seguros. Tente carregar novamente; se o problema continuar, volte ao início.
        </p>
        <div className="mt-5 flex flex-wrap justify-center gap-2">
          <Button onClick={reset}>Tentar novamente</Button>
          <Button variant="outline" onClick={() => window.location.assign('/dashboard')}>Voltar ao painel</Button>
        </div>
        {error.digest ? <p className="mt-4 text-xs text-muted-foreground">Código: {error.digest}</p> : null}
      </div>
    </main>
  )
}
