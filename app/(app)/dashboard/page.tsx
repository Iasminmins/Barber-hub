'use client'

import { DashboardClient } from './dashboard-client'
import { useAppData } from '@/components/data/app-data-provider'

export default function DashboardPage() {
  const { appointments, barbershop, catalog, clients, commissions, employees, financialEntries, imports, member, orders, subscriptions } = useAppData()
  return (
    <DashboardClient
      appointments={appointments}
      catalog={catalog}
      clients={clients}
      commissions={commissions}
      employees={employees}
      financialEntries={financialEntries}
      imports={imports}
      orders={orders}
      subscriptions={subscriptions}
      lowStockThreshold={barbershop.agendaSettings.lowStockAlert}
      isBarber={member.role === 'barber'}
    />
  )
}
