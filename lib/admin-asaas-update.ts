export type AsaasSubscriptionPayment = {
  id: string
  dueDate?: string
  status?: string
}

type BillingUpdateInput = {
  currentPlan: string
  requestedPlan?: string
  currentNextBillingDate?: string | null
  requestedNextBillingDate?: string
  requestedPlanDetails?: {
    value: number
    description: string
  }
  payments: AsaasSubscriptionPayment[]
}

type BillingUpdatePlan = {
  subscriptionUpdate: Record<string, unknown>
  paymentUpdate?: {
    id: string
    dueDate: string
  }
}

const EDITABLE_PAYMENT_STATUSES = new Set(['PENDING', 'OVERDUE'])

export function buildAsaasBillingUpdate(input: BillingUpdateInput): BillingUpdatePlan {
  const subscriptionUpdate: Record<string, unknown> = {}
  const planChanged = Boolean(input.requestedPlan && input.requestedPlan !== input.currentPlan)

  if (planChanged && input.requestedPlanDetails) {
    Object.assign(subscriptionUpdate, {
      value: input.requestedPlanDetails.value,
      cycle: 'MONTHLY',
      description: input.requestedPlanDetails.description,
      updatePendingPayments: true,
    })
  }

  const dateChanged = Boolean(
    input.requestedNextBillingDate
      && input.requestedNextBillingDate !== input.currentNextBillingDate,
  )
  if (!dateChanged || !input.requestedNextBillingDate) return { subscriptionUpdate }

  const editablePayments = input.payments
    .filter((payment) => payment.id && payment.dueDate && EDITABLE_PAYMENT_STATUSES.has(payment.status ?? ''))
    .sort((left, right) => (left.dueDate ?? '').localeCompare(right.dueDate ?? ''))
  const payment = editablePayments.find((item) => item.dueDate === input.currentNextBillingDate)
    ?? editablePayments[0]

  if (payment) {
    return {
      subscriptionUpdate,
      paymentUpdate: { id: payment.id, dueDate: input.requestedNextBillingDate },
    }
  }

  subscriptionUpdate.nextDueDate = input.requestedNextBillingDate
  return { subscriptionUpdate }
}
