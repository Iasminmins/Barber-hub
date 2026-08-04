import type { Barbershop, Commission, Employee, Order, OrderItem } from './types'

export interface EmployeeMonthlyStatementInput {
  employeeId: string
  employees: Employee[]
  barbershop: Barbershop
  competence: string
  orders: Order[]
  commissions: Commission[]
}

export interface EmployeeMonthlyStatementOrderItem {
  id: string
  name: string
  type: OrderItem['type']
  origin: 'Serviço' | 'Produto' | 'Assinatura'
  quantity: number
  unitPrice: number
  base: number
  rate: number
  commission: number
}

export interface EmployeeMonthlyStatementOrder {
  id: string
  number: number
  received: number
  discount: number
  surcharge: number
  items: EmployeeMonthlyStatementOrderItem[]
  commission: number
}

export interface EmployeeMonthlyStatement {
  employee: Employee
  barbershop: Barbershop
  competence: string
  services: number
  revenue: number
  subscriptionRevenue: number
  orderCommission: number
  subscriptionCommission: number
  totalCommission: number
  orders: EmployeeMonthlyStatementOrder[]
}

function normalizeEmployeeName(value: string) {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '')
}

function editDistance(left: string, right: string) {
  const previous = Array.from({ length: right.length + 1 }, (_, index) => index)
  for (let leftIndex = 1; leftIndex <= left.length; leftIndex += 1) {
    const current = [leftIndex]
    for (let rightIndex = 1; rightIndex <= right.length; rightIndex += 1) {
      current.push(Math.min(
        current[rightIndex - 1] + 1,
        previous[rightIndex] + 1,
        previous[rightIndex - 1] + (left[leftIndex - 1] === right[rightIndex - 1] ? 0 : 1),
      ))
    }
    previous.splice(0, previous.length, ...current)
  }
  return previous[right.length]
}

function resolveOrderEmployeeId(order: Pick<Order, 'employeeId' | 'employeeName'>, employees: Employee[]) {
  if (order.employeeId && employees.some((employee) => employee.id === order.employeeId)) return order.employeeId
  const orderName = normalizeEmployeeName(order.employeeName)
  if (!orderName || orderName === 'naoatribuido') return ''
  const exact = employees.find((employee) => normalizeEmployeeName(employee.name) === orderName)
  if (exact) return exact.id
  const candidates = employees
    .map((employee) => ({ employee, distance: editDistance(orderName, normalizeEmployeeName(employee.name)) }))
    .sort((left, right) => left.distance - right.distance)
  return candidates[0]?.distance === 1 && candidates[1]?.distance !== 1 ? candidates[0].employee.id : ''
}

function receivedOrderValue(order: Order) {
  if (order.total > 0) return order.total
  return Math.max(
    0,
    order.items.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0) - order.discount + order.surcharge,
  )
}

function commissionRate(item: OrderItem, employee: Employee) {
  if (item.name.startsWith('[Assinatura]')) return employee.subscriptionCommission
  return item.type === 'servico' ? employee.serviceCommission : employee.productCommission
}

function commissionOrigin(item: OrderItem): EmployeeMonthlyStatementOrderItem['origin'] {
  if (item.name.startsWith('[Assinatura]')) return 'Assinatura'
  return item.type === 'servico' ? 'Serviço' : 'Produto'
}

export function buildEmployeeMonthlyStatement(input: EmployeeMonthlyStatementInput): EmployeeMonthlyStatement {
  const employee = input.employees.find((item) => item.id === input.employeeId)
  if (!employee) throw new Error(`Employee not found: ${input.employeeId}`)

  const orders = input.orders
    .filter((order) => order.status === 'paga' && order.createdAt.slice(0, 7) === input.competence)
    .filter((order) => resolveOrderEmployeeId(order, input.employees) === employee.id)
    .map((order) => {
      const received = receivedOrderValue(order)
      const items = order.items.map((item) => {
        const base = item.quantity * item.unitPrice
        const rate = commissionRate(item, employee)
        return {
          id: item.id,
          name: item.name,
          type: item.type,
          origin: commissionOrigin(item),
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          base,
          rate,
          commission: received > 0 ? base * rate / 100 : 0,
        }
      })
      return {
        id: order.id,
        number: order.number,
        received,
        discount: order.discount,
        surcharge: order.surcharge,
        items,
        commission: items.reduce((sum, item) => sum + item.commission, 0),
      }
    })

  const orderCommission = orders.reduce((sum, order) => sum + order.commission, 0)
  const subscriptionCommission = input.commissions
    .filter((commission) => commission.employeeId === employee.id && commission.origin === 'assinatura' && commission.date.slice(0, 7) === input.competence)
    .reduce((sum, commission) => sum + commission.amount, 0)

  return {
    employee,
    barbershop: input.barbershop,
    competence: input.competence,
    services: orders.reduce((sum, order) => sum + order.items
      .filter((item) => item.type === 'servico')
      .reduce((itemSum, item) => itemSum + item.quantity, 0), 0),
    revenue: orders.reduce((sum, order) => sum + order.received, 0),
    subscriptionRevenue: orders
      .filter((order) => order.items.some((item) => item.origin === 'Assinatura'))
      .reduce((sum, order) => sum + order.received, 0),
    orderCommission,
    subscriptionCommission,
    totalCommission: orderCommission + subscriptionCommission,
    orders,
  }
}
