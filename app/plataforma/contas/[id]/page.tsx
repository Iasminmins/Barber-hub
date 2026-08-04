import type { Metadata } from 'next'
import { ContaClient } from './conta-client'

export const metadata: Metadata = {
  title: 'Detalhe da conta · Administração',
  robots: { index: false, follow: false },
}

export const dynamic = 'force-dynamic'

export default async function ContaPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  return <ContaClient tenantId={id} />
}
