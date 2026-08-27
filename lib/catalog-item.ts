const catalogImageTypes = new Set(['image/jpeg', 'image/png', 'image/webp', 'image/svg+xml'])
export const catalogImageMaxBytes = 2 * 1024 * 1024

export function isCatalogImageFile(file: File) {
  return catalogImageTypes.has(file.type) && file.size <= catalogImageMaxBytes
}

export function getCatalogImagePath(barbershopId: string, itemId: string, file: File) {
  const extension = file.name.split('.').pop()?.toLowerCase().replace(/[^a-z0-9]/g, '') || 'png'
  return `${barbershopId}/catalog/${itemId}-${Date.now().toString(36)}.${extension}`
}

export function getCatalogImageStoragePath(imageUrl: string) {
  const marker = '/storage/v1/object/public/barbershop-assets/'
  const index = imageUrl.indexOf(marker)
  if (index < 0) return null
  return decodeURIComponent(imageUrl.slice(index + marker.length)).replace(/^\/+|\/+$/g, '') || null
}
