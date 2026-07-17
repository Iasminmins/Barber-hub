'use client'

import { NovaComandaClient } from './nova-comanda-client'
import { useAppData } from '@/components/data/app-data-provider'

export default function NovaComandaPage() {
  const { barbershop, catalog, clients, employees: databaseEmployees, orders } = useAppData()
  const employees = databaseEmployees.filter((employee) => employee.active)
  const items = catalog.filter((item) => item.active)
  const orderNumbers = orders.map((order) => order.number)
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
