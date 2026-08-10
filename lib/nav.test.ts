import { describe, expect, test } from 'vitest'
import { allNavItems } from './nav'

describe('navigation', () => {
  test('shows how the platform works in the app navigation', () => {
    expect(allNavItems).toContainEqual(
      expect.objectContaining({
        label: 'Como funciona',
        href: '/como-funciona',
      }),
    )
  })

  test('keeps the how it works page available to non-management staff', () => {
    const howItWorks = allNavItems.find((item) => item.href === '/como-funciona')

    expect(howItWorks).not.toHaveProperty('managementOnly')
  })
})
