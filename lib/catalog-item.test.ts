import { describe, expect, it } from 'vitest'
import { getCatalogImagePath, isCatalogImageFile } from './catalog-item'

describe('catalog item images', () => {
  it('accepts supported image files within the upload limit', () => {
    expect(isCatalogImageFile(new File(['image'], 'produto.webp', { type: 'image/webp' }))).toBe(true)
    expect(isCatalogImageFile(new File(['image'], 'servico.jpg', { type: 'image/jpeg' }))).toBe(true)
  })

  it('rejects unsupported or oversized files', () => {
    expect(isCatalogImageFile(new File(['text'], 'produto.pdf', { type: 'application/pdf' }))).toBe(false)
    expect(isCatalogImageFile(new File(['x'.repeat(2_100_000)], 'produto.png', { type: 'image/png' }))).toBe(false)
  })

  it('builds an isolated storage path for each catalog item', () => {
    const path = getCatalogImagePath('shop-1', 'item-1', new File(['image'], 'Minha Foto.PNG', { type: 'image/png' }))
    expect(path).toMatch(/^shop-1\/catalog\/item-1-[a-z0-9]+\.png$/)
  })
})
