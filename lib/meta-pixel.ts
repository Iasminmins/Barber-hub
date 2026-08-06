declare global {
  interface Window {
    fbq?: (...args: unknown[]) => void
  }
}

export function trackMetaEvent(event: string, params?: Record<string, unknown>, eventId?: string) {
  if (typeof window === 'undefined' || typeof window.fbq !== 'function') return
  if (eventId) {
    window.fbq('track', event, params ?? {}, { eventID: eventId })
  } else {
    window.fbq('track', event, params)
  }
}
