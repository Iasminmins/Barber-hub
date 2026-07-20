'use client'
import { Button } from '@/components/ui/button'

export default function AppError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return <main className="grid min-h-[60vh] place-items-center p-6 text-center"><div><h1 className="text-xl font-bold">Não foi possível abrir esta tela</h1><p className="mt-2 max-w-lg text-sm text-muted-foreground">{error.message || 'Tente novamente em alguns instantes.'}</p><Button className="mt-4" onClick={reset}>Tentar novamente</Button></div></main>
}
