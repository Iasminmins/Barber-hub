import { NovaComandaClient } from './nova-comanda-client'
import { getActiveBarbershop, getCatalog, getClients, getEmployees, getOrders } from '@/lib/data'

export default function NovaComandaPage() {
  const barbershop = getActiveBarbershop()
  const clients = getClients()
  const employees = getEmployees().filter((employee) => employee.active)
  const items = getCatalog().filter((item) => item.active)
  const orderNumbers = getOrders().map((order) => order.number)
  const nextOrderNumber = orderNumbers.length > 0 ? Math.max(...orderNumbers) + 1 : 1

  return (
    <NovaComandaClient
      barbershopId={barbershop.id}
      clients={clients}
      employees={employees}
      items={items}
      nextOrderNumber={nextOrderNumber}
    />
  )
}
