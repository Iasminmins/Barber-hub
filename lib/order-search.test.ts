import { describe, expect, it } from 'vitest'
import { filterOrdersBySearch } from './order-search'

const orders = [
  {
    number: 2553,
    clientName: 'Wander Barbeto Sathler',
    employeeName: 'Evandro',
    method: 'pix',
    status: 'paga',
    items: [{ name: 'Corte de Cabelo' }],
  },
  {
    number: 2552,
    clientName: 'João Victor',
    employeeName: 'Carlos',
    method: 'credito',
    status: 'pendente',
    items: [{ name: 'Barba' }],
  },
]

describe('filterOrdersBySearch', () => {
  it('finds orders by number, client, item, or employee', () => {
    expect(filterOrdersBySearch(orders, '2553')).toHaveLength(1)
    expect(filterOrdersBySearch(orders, 'wander')).toHaveLength(1)
    expect(filterOrdersBySearch(orders, 'corte')).toHaveLength(1)
    expect(filterOrdersBySearch(orders, 'joao')).toHaveLength(1)
  })

  it('also searches translated payment and status labels', () => {
    expect(filterOrdersBySearch(orders, 'crédito', {
      methods: { credito: 'Crédito' },
      statuses: { pendente: 'Pendente' },
    })).toHaveLength(1)
    expect(filterOrdersBySearch(orders, 'pendente', {
      statuses: { pendente: 'Pendente' },
    })).toHaveLength(1)
  })

  it('returns all orders when the search is empty', () => {
    expect(filterOrdersBySearch(orders, '')).toEqual(orders)
  })
})
