type SearchableOrder = {
  number: number
  clientName: string
  employeeName: string
  method?: string | null
  status: string
  items: { name: string }[]
}

type OrderSearchLabels = {
  methods?: Record<string, string>
  statuses?: Record<string, string>
}

function normalizeSearchValue(value: unknown) {
  return String(value ?? '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim()
}

export function filterOrdersBySearch<T extends SearchableOrder>(
  orders: T[],
  search: string,
  labels: OrderSearchLabels = {},
) {
  const query = normalizeSearchValue(search)
  if (!query) return orders

  return orders.filter((order) => {
    const values = [
      order.number,
      order.clientName,
      order.employeeName,
      order.method,
      order.status,
      order.method ? labels.methods?.[order.method] : '',
      labels.statuses?.[order.status],
      ...order.items.map((item) => item.name),
    ]

    return values.some((value) => normalizeSearchValue(value).includes(query))
  })
}
