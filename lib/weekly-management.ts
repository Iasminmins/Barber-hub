import type { Employee, Order } from '@/lib/types'
import { isBarberRole } from '@/lib/employees'

export interface WeekRange {
  start: string
  end: string
}

export function getWeekRange(dateKey: string): WeekRange {
  const date = new Date(`${dateKey}T12:00:00`)
  const day = date.getDay()
  const mondayOffset = day === 0 ? -6 : 1 - day
  date.setDate(date.getDate() + mondayOffset)
  const start = date.toISOString().slice(0, 10)
  date.setDate(date.getDate() + 6)
  return { start, end: date.toISOString().slice(0, 10) }
}

function insideRange(value: string, range: WeekRange) {
  const key = value.slice(0, 10)
  return key >= range.start && key <= range.end
}

export function buildWeeklyBarberResults(orders: Order[], employees: Employee[], range: WeekRange) {
  const activeBarbers = employees.filter((employee) => employee.active && isBarberRole(employee.role))
  return activeBarbers.map((employee) => {
    const paidOrders = orders.filter(
      (order) => order.status === 'paga' && order.employeeId === employee.id && insideRange(order.createdAt, range),
    )
    const revenue = paidOrders.reduce((total, order) => total + order.total, 0)
    return {
      name: employee.name,
      revenue,
      appointments: paidOrders.length,
      averageTicket: paidOrders.length ? revenue / paidOrders.length : 0,
    }
  })
}
