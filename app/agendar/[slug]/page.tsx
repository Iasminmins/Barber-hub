import { PublicBookingClient } from './public-booking-client'

export default async function PublicBookingPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  return <PublicBookingClient slug={slug} />
}
