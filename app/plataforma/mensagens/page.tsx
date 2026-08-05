import type { Metadata } from 'next'
import { Suspense } from 'react'
import { MessagesClient } from './messages-client'

export const metadata: Metadata = {
  title: 'Central de Mensagens · Barber Hub',
  robots: { index: false, follow: false },
}

export const dynamic = 'force-dynamic'

export default function MessagesPage() {
  return (
    <Suspense fallback={<div className="flex min-h-screen items-center justify-center text-sm text-muted-foreground">Carregando…</div>}>
      <MessagesClient />
    </Suspense>
  )
}
