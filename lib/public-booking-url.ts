export function buildPublicBookingUrl(origin: string, slug: string) {
  const cleanOrigin = origin.replace(/\/+$/, '')
  const cleanSlug = slug.trim() || 'slug-publico'

  return `${cleanOrigin}/agendar/${encodeURIComponent(cleanSlug)}`
}
