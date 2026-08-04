'use client'
import * as React from 'react'
import { Button } from '@/components/ui/button'

export default function AppError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  React.useEffect(() => {
    console.error('Erro não tratado em uma tela interna', { digest: error.digest, error })
  }, [error])

  return <main className="grid min-h-[60vh] place-items-center p-6 text-center"><div><h1 className="text-xl font-bold">Não foi possível abrir esta tela</h1><p className="mt-2 max-w-lg text-sm text-muted-foreground">Seus dados continuam seguros. Tente novamente em alguns instantes.</p><Button className="mt-4" onClick={reset}>Tentar novamente</Button>{error.digest ? <p className="mt-3 text-xs text-muted-foreground">Código: {error.digest}</p> : null}</div></main>
}
