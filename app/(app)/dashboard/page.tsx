import { DashboardClient } from './dashboard-client'
import {
  getAppointments,
  getCatalog,
  getClients,
  getCommissions,
  getEmployees,
  getFinancialEntries,
  getOrders,
  getSubscriptions,
} from '@/lib/data'

export default function DashboardPage() {
  return (
    <DashboardClient
      appointments={getAppointments()}
      catalog={getCatalog()}
      clients={getClients()}
      commissions={getCommissions()}
      employees={getEmployees()}
      financialEntries={getFinancialEntries()}
      orders={getOrders()}
      subscriptions={getSubscriptions()}
    />
  )
}
