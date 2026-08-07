import type { Metadata } from 'next'
import { CouponsClient } from './coupons-client'

export const metadata: Metadata = {
  title: 'Cupons e cortesias · Barber Hub',
  robots: { index: false, follow: false },
}

export const dynamic = 'force-dynamic'

export default function CortesiasPage() {
  return <CouponsClient />
}
