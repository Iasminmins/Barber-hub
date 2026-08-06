import { createHash } from 'crypto'

const GRAPH_API_VERSION = 'v21.0'

function hashValue(value: string) {
  return createHash('sha256').update(value.trim().toLowerCase()).digest('hex')
}

export async function sendMetaPurchaseEvent({
  barbershopId,
  value,
  eventId,
}: {
  barbershopId: string
  value: number
  eventId: string
}) {
  const pixelId = process.env.NEXT_PUBLIC_META_PIXEL_ID
  const accessToken = process.env.META_CONVERSIONS_API_TOKEN
  if (!pixelId || !accessToken) return

  const body = {
    data: [
      {
        event_name: 'Purchase',
        event_time: Math.floor(Date.now() / 1000),
        event_id: eventId,
        action_source: 'system_generated',
        user_data: {
          external_id: hashValue(barbershopId),
        },
        custom_data: {
          value,
          currency: 'BRL',
        },
      },
    ],
  }

  try {
    const response = await fetch(
      `https://graph.facebook.com/${GRAPH_API_VERSION}/${pixelId}/events?access_token=${accessToken}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      },
    )
    if (!response.ok) {
      console.error('Meta Conversions API error', await response.text())
    }
  } catch (error) {
    console.error('Meta Conversions API request failed', error)
  }
}
