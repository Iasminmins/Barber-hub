'use client'

import { DashboardClient } from './dashboard-client'
import { useAppData } from '@/components/data/app-data-provider'

export default function DashboardPage() {
  const { appointments, catalog, clients, commissions, employees, financialEntries, orders, subscriptions } = useAppData()
  return (
    <DashboardClient
      appointments={appointments}
      catalog={catalog}
      clients={clients}
      commissions={commissions}
      employees={employees}
      financialEntries={financialEntries}
      orders={orders}
      subscriptions={subscriptions}
    />
  )
}
