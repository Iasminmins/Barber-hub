'use client'

import Link from 'next/link'
import { CalendarDays, ChevronLeft, ChevronRight, KeyRound, Mail, Pencil, Phone, Plus, Save, Trash2, Trophy, UserCheck, UserX, Users } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { Avatar } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Button, buttonVariants } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Dialog, DialogHeader } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select } from '@/components/ui/select'
import { PageHeader } from '@/components/page-header'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { useAppData } from '@/components/data/app-data-provider'
import { formatCurrency, formatPercent } from '@/lib/format'
import { isBarberRole } from '@/lib/employees'
import type { Employee } from '@/lib/types'
import { staffPermissionOptions, type StaffPermission } from '@/lib/staff-permissions'

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
      current[rightIndex] = Math.min(
        current[rightIndex - 1] + 1,
        previous[rightIndex] + 1,
        previous[rightIndex - 1] + (left[leftIndex - 1] === right[rightIndex - 1] ? 0 : 1),
      )
    }
    previous.splice(0, previous.length, ...current)
  }
  return previous[right.length]
}

function resolveOrderEmployeeId(order: { employeeId: string; employeeName: string }, employees: Employee[]) {
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

function paidOrderValue(order: ReturnType<typeof useAppData>['orders'][number]) {
  if (order.total > 0) return order.total
  return Math.max(
    0,
    order.items.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0) - order.discount + order.surcharge,
  )
}

function localDateKey(value: string) {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'America/Sao_Paulo',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(new Date(value))
  const part = (type: Intl.DateTimeFormatPartTypes) => parts.find((item) => item.type === type)?.value ?? ''
  return `${part('year')}-${part('month')}-${part('day')}`
}

function orderItemCommissionRate(
  item: ReturnType<typeof useAppData>['orders'][number]['items'][number],
  employee: Employee,
) {
  if (item.name.startsWith('[Assinatura]')) return employee.subscriptionCommission
  return item.type === 'servico' ? employee.serviceCommission : employee.productCommission
}

export default function FuncionariosPage() {
  const appData = useAppData()
  const [employees, setEmployees] = useState(() => appData.employees)
  const [saved, setSaved] = useState(false)
  const [editing, setEditing] = useState<null | { id:string; name:string; role:string; phone:string; email:string; active:string; service:string; product:string; subscription:string }>(null)
  const [accessEditing, setAccessEditing] = useState<Employee | null>(null)
  const [accessEmail, setAccessEmail] = useState('')
  const [accessStatus, setAccessStatus] = useState('')
  const [accessLoading, setAccessLoading] = useState(false)
  const [editStatus, setEditStatus] = useState('')
  const [section, setSection] = useState<'cadastro' | 'equipe' | 'semanal'>('equipe')
  const [reportPeriod, setReportPeriod] = useState<'diario' | 'semanal'>('semanal')
  const [weekOffset, setWeekOffset] = useState(0)
  const [dayOffset, setDayOffset] = useState(0)
  const [accessForm, setAccessForm] = useState<{ employeeId:string; email:string; password:string; confirmPassword:string; permissions:StaffPermission[] }>({ employeeId:'', email:'', password:'', confirmPassword:'', permissions:['dashboard','agenda'] })
  const [newEmployeeStatus, setNewEmployeeStatus] = useState('')
  const [creatingEmployee, setCreatingEmployee] = useState(false)
  const commissions = appData.commissions
  const currentMonth = new Date().toISOString().slice(0, 7)
  const paidOrdersWithEmployee = useMemo(() => appData.orders
    .filter((order) => order.status === 'paga' && order.createdAt.slice(0, 7) === currentMonth)
    .map((order) => ({
      order,
      resolvedEmployeeId: resolveOrderEmployeeId(order, employees),
      value: paidOrderValue(order),
    })), [appData.orders, currentMonth, employees])
  const employeeValues = useMemo(() => new Map(employees.map((employee) => {
    const paidOrders = paidOrdersWithEmployee.filter((item) => item.resolvedEmployeeId === employee.id)
    const revenue = paidOrders.reduce((sum, item) => sum + item.value, 0)
    const services = paidOrders.reduce(
      (sum, item) => sum + item.order.items.filter((orderItem) => orderItem.type === 'servico').reduce((itemSum, orderItem) => itemSum + orderItem.quantity, 0),
      0,
    )
    const orderCommission = paidOrders.reduce((sum, item) => sum + item.order.items.reduce(
      (itemSum, orderItem) => itemSum + orderItem.quantity * orderItem.unitPrice
        * orderItemCommissionRate(orderItem, employee) / 100,
      0,
    ), 0)
    const subscriptionCommission = commissions
      .filter((item) => item.employeeId === employee.id && item.origin === 'assinatura' && item.date.slice(0, 7) === currentMonth)
      .reduce((sum, item) => sum + item.amount, 0)
    return [employee.id, { revenue, services, commission: orderCommission + subscriptionCommission }]
  })), [commissions, currentMonth, employees, paidOrdersWithEmployee])
  const ranking = employees.map((employee) => ({
    id: employee.id,
    name: employee.name,
    color: employee.avatarColor,
    services: employeeValues.get(employee.id)?.services ?? 0,
    revenue: employeeValues.get(employee.id)?.revenue ?? 0,
  })).sort((a, b) => b.revenue - a.revenue)
  const pending = [...employeeValues.values()].reduce((sum, item) => sum + item.commission, 0)
  const totalRevenue = [...employeeValues.values()].reduce((sum, item) => sum + item.revenue, 0)
  const attributedPaidOrders = paidOrdersWithEmployee.filter((item) => item.resolvedEmployeeId).length

  const activeEmployees = useMemo(() => employees.filter((e) => e.active), [employees])
  const weekRange = useMemo(() => {
    const start = new Date()
    start.setHours(0, 0, 0, 0)
    start.setDate(start.getDate() - start.getDay() + weekOffset * 7)
    const end = new Date(start)
    end.setDate(end.getDate() + 6)
    const key = (date: Date) => `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
    return { start: key(start), end: key(end), startDate: start, endDate: end }
  }, [weekOffset])
  const dayRange = useMemo(() => {
    const date = new Date()
    date.setHours(0, 0, 0, 0)
    date.setDate(date.getDate() + dayOffset)
    const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
    return { start: key, end: key, startDate: date, endDate: date }
  }, [dayOffset])
  const reportRange = reportPeriod === 'diario' ? dayRange : weekRange
  const reportPaidOrders = useMemo(() => appData.orders
    .filter((order) => {
      const orderDate = localDateKey(order.createdAt)
      return order.status === 'paga' && orderDate >= reportRange.start && orderDate <= reportRange.end
    })
    .map((order) => ({
      order,
      resolvedEmployeeId: resolveOrderEmployeeId(order, employees),
      value: paidOrderValue(order),
    })), [appData.orders, employees, reportRange])
  const reportValues = useMemo(() => new Map(employees.map((employee) => {
    const orders = reportPaidOrders.filter((item) => item.resolvedEmployeeId === employee.id)
    const revenue = orders.reduce((sum, item) => sum + item.value, 0)
    const salesCommission = orders.reduce((sum, item) => sum + item.order.items.reduce(
      (itemSum, orderItem) => itemSum + orderItem.quantity * orderItem.unitPrice
        * orderItemCommissionRate(orderItem, employee) / 100,
      0,
    ), 0)
    const subscriptionCommission = commissions
      .filter((item) => item.employeeId === employee.id && item.origin === 'assinatura' && item.date >= reportRange.start && item.date <= reportRange.end)
      .reduce((sum, item) => sum + item.amount, 0)
    const paid = commissions
      .filter((item) => item.employeeId === employee.id && item.status === 'paga' && item.date >= reportRange.start && item.date <= reportRange.end)
      .reduce((sum, item) => sum + item.amount, 0)
    const generated = salesCommission + subscriptionCommission
    return [employee.id, { revenue, generated, paid, pending: Math.max(0, generated - paid), orders: orders.length }]
  })), [commissions, employees, reportPaidOrders, reportRange])
  const reportRevenue = [...reportValues.values()].reduce((sum, item) => sum + item.revenue, 0)
  const reportGenerated = [...reportValues.values()].reduce((sum, item) => sum + item.generated, 0)
  const reportPaid = [...reportValues.values()].reduce((sum, item) => sum + item.paid, 0)
  const reportPending = [...reportValues.values()].reduce((sum, item) => sum + item.pending, 0)
  const reportEmployees = employees
    .map((employee) => ({ employee, values: reportValues.get(employee.id)! }))
    .sort((left, right) => right.values.revenue - left.values.revenue)

  useEffect(() => {
    setEmployees(appData.employees)
  }, [appData.employees])

  async function createPlatformAccess() {
    if (appData.member.role !== 'owner') {
      setNewEmployeeStatus('Somente o proprietário pode criar acessos.')
      return
    }
    if (!accessForm.employeeId) {
      setNewEmployeeStatus('Selecione um funcionário já cadastrado.')
      return
    }
    if (!accessForm.email.trim()) {
      setNewEmployeeStatus('Informe o e-mail para criar o acesso.')
      return
    }
    if (accessForm.password.length < 8) {
      setNewEmployeeStatus('A senha deve ter pelo menos 8 caracteres.')
      return
    }
    if (accessForm.password !== accessForm.confirmPassword) {
      setNewEmployeeStatus('As senhas não coincidem.')
      return
    }

    setCreatingEmployee(true)
    setNewEmployeeStatus('')
    const { createBrowserSupabaseClient } = await import('@/lib/supabase/client')
    const { data: sessionData } = await createBrowserSupabaseClient().auth.getSession()
    const response = await fetch('/api/staff-access', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${sessionData.session?.access_token ?? ''}`,
      },
      body: JSON.stringify({
        employeeId: accessForm.employeeId,
        email: accessForm.email.trim(),
        password: accessForm.password,
        permissions:accessForm.permissions,
        enabled: true,
      }),
    })
    const payload = await response.json()
    if (!response.ok) {
      setCreatingEmployee(false)
      setNewEmployeeStatus(payload.error ?? 'Não foi possível criar o acesso.')
      return
    }

    await appData.refresh()
    setCreatingEmployee(false)
    setAccessForm({ employeeId:'', email:'', password:'', confirmPassword:'', permissions:['dashboard','agenda'] })
    setNewEmployeeStatus('Acesso criado com sucesso.')
  }

  async function deleteEmployee(id: string) {
    if (appData.member.role !== 'owner' && appData.member.role !== 'manager') { window.alert('Sem permissão para excluir funcionários.'); return }
    if (!window.confirm('Excluir este funcionário?')) return
    const result = await appData.deleteRecord('employees', id)
    if (result.error) { window.alert(result.error); return }
    setEmployees((current) => current.filter((employee) => employee.id !== id))
    setSaved(false)
  }

  async function saveEmployee() {
    if (!editing) return
    if (appData.member.role !== 'owner' && appData.member.role !== 'manager') { setEditStatus('Sem permissão para editar funcionários.'); return }
    if (!editing.name.trim()) { setEditStatus('Informe o nome.'); return }
    const service = Number(editing.service), product = Number(editing.product), subscription = Number(editing.subscription)
    if ([service, product, subscription].some((value) => !Number.isFinite(value) || value < 0 || value > 100)) { setEditStatus('As comissões devem estar entre 0% e 100%.'); return }
    const result = await appData.updateRecord('employees', editing.id, { name:editing.name.trim(), role:editing.role, phone:editing.phone.trim()||null, email:editing.email.trim()||null, active:editing.active==='true', service_commission:service, product_commission:product, subscription_commission:subscription })
    if (result.error) { setEditStatus(result.error); return }
    setEmployees((current) => current.map((employee) => employee.id === editing.id ? { ...employee, name:editing.name.trim(), role:editing.role, phone:editing.phone.trim(), email:editing.email.trim(), active:editing.active==='true', serviceCommission:service, productCommission:product, subscriptionCommission:subscription } : employee))
    setEditing(null); setSaved(true)
  }

  function openAccess(employee: Employee) {
    setAccessStatus('')
    setAccessEmail(employee.email)
    setAccessEditing(employee)
  }

  async function updateAccess(enabled: boolean) {
    if (!accessEditing) return
    setAccessLoading(true)
    setAccessStatus('')
    const { createBrowserSupabaseClient } = await import('@/lib/supabase/client')
    const { data: sessionData } = await createBrowserSupabaseClient().auth.getSession()
    const response = await fetch('/api/staff-access', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${sessionData.session?.access_token ?? ''}`,
      },
      body: JSON.stringify({ employeeId: accessEditing.id, email: accessEmail, enabled }),
    })
    const payload = await response.json()
    setAccessLoading(false)
    if (!response.ok) {
      setAccessStatus(payload.error ?? 'Não foi possível atualizar o acesso.')
      return
    }
    setAccessStatus(enabled
      ? payload.invited ? 'Convite enviado. O barbeiro deve criar a senha pelo e-mail.' : 'Acesso ativado.'
      : 'Acesso desativado.')
    await appData.refresh()
  }

  return (
    <div>
      <PageHeader
        title="Funcionários"
        description="Equipe, comissões, desempenho e permissões operacionais."
      >
        {saved ? <span className="text-sm font-medium text-success">Alterações salvas</span> : null}
        <Button variant="outline" size="sm" onClick={() => setSaved(true)}>
          <Save className="size-4" />
          Salvar
        </Button>
        <Link href="/funcionarios/novo" className={buttonVariants({ variant: 'gold', size: 'sm' })}>
          <Plus className="size-4" />
          Novo funcionário
        </Link>
      </PageHeader>

      <div className="mb-4 grid grid-cols-1 gap-2 rounded-xl bg-muted p-1 sm:grid-cols-3">
        <button
          type="button"
          onClick={() => setSection('cadastro')}
          className={`flex items-center justify-center gap-2 rounded-lg px-3 py-2.5 text-sm font-semibold transition-colors ${section === 'cadastro' ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}
        >
          <KeyRound className="size-4" /> Acessos à plataforma
        </button>
        <button
          type="button"
          onClick={() => setSection('equipe')}
          className={`flex items-center justify-center gap-2 rounded-lg px-3 py-2.5 text-sm font-semibold transition-colors ${section === 'equipe' ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}
        >
          <Users className="size-4" /> Equipe
        </button>
        <button
          type="button"
          onClick={() => setSection('semanal')}
          className={`flex items-center justify-center gap-2 rounded-lg px-3 py-2.5 text-sm font-semibold transition-colors ${section === 'semanal' ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}
        >
          <CalendarDays className="size-4" /> Relatórios
        </button>
      </div>

      {section === 'cadastro' ? (
        <Card className="p-5">
          <h2 className="text-lg font-semibold text-foreground">Criar acesso à plataforma</h2>
          <p className="mt-1 text-sm text-muted-foreground">Selecione um funcionário já cadastrado e defina os dados que ele usará para entrar no sistema.</p>
          <div className="mt-5 grid gap-4 sm:grid-cols-2">
            <Field label="Funcionário *">
              <Select
                value={accessForm.employeeId}
                onChange={(event) => {
                  const employee = employees.find((item) => item.id === event.target.value)
                  const member = appData.staffMembers.find((item) => item.employeeId === event.target.value)
                  setAccessForm((current) => ({
                    ...current,
                    employeeId:event.target.value,
                    email:employee?.email ?? '',
                    permissions:member?.permissions ?? ['dashboard','agenda'],
                  }))
                  setNewEmployeeStatus('')
                }}
              >
                <option value="">Selecione o funcionário</option>
                {employees.filter((employee) => employee.active).map((employee) => (
                  <option key={employee.id} value={employee.id}>{employee.name}</option>
                ))}
              </Select>
            </Field>
            <Field label="E-mail de acesso *"><Input type="email" value={accessForm.email} onChange={(event) => setAccessForm((current) => ({ ...current, email:event.target.value }))} placeholder="email@exemplo.com" /></Field>
            <Field label="Senha de acesso *"><Input type="password" value={accessForm.password} onChange={(event) => setAccessForm((current) => ({ ...current, password:event.target.value }))} minLength={8} autoComplete="new-password" placeholder="Mínimo de 8 caracteres" /></Field>
            <Field label="Confirmar senha *"><Input type="password" value={accessForm.confirmPassword} onChange={(event) => setAccessForm((current) => ({ ...current, confirmPassword:event.target.value }))} minLength={8} autoComplete="new-password" placeholder="Repita a senha" /></Field>
          </div>
          <div className="mt-5">
            <Label>O que este funcionário pode visualizar?</Label>
            <div className="mt-2 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
              {staffPermissionOptions.map((permission) => {
                const checked = accessForm.permissions.includes(permission.key)
                const required = permission.key === 'dashboard'
                return (
                  <label key={permission.key} className="flex items-center justify-between rounded-lg border border-border p-3 text-sm">
                    <span>{permission.label}</span>
                    <input
                      type="checkbox"
                      checked={checked}
                      disabled={required}
                      onChange={(event) => setAccessForm((current) => ({
                        ...current,
                        permissions:event.target.checked
                          ? [...current.permissions, permission.key]
                          : current.permissions.filter((item) => item !== permission.key),
                      }))}
                      className="size-4"
                    />
                  </label>
                )
              })}
            </div>
            <p className="mt-2 text-xs text-muted-foreground">Dashboard é obrigatório. Configurações, importação e funcionários permanecem restritos à administração.</p>
          </div>
          {newEmployeeStatus ? <p className="mt-4 rounded-lg bg-muted p-3 text-sm text-foreground">{newEmployeeStatus}</p> : null}
          <div className="mt-5 flex justify-end">
            <Button variant="gold" onClick={createPlatformAccess} disabled={creatingEmployee}>
              <Save className="size-4" /> {creatingEmployee ? 'Criando acesso...' : 'Criar acesso à plataforma'}
            </Button>
          </div>
        </Card>
      ) : null}

      {section === 'semanal' ? (
        <div className="space-y-4">
          <div className="rounded-xl border border-blue-200 bg-blue-50 p-4 text-blue-800">
            <p className="flex items-center gap-2 font-semibold"><CalendarDays className="size-4" /> Período de comissões</p>
            <p className="mt-1 text-sm">
              {reportPeriod === 'diario'
                ? 'Confira as vendas e comissões geradas em um dia específico.'
                : 'As comissões são calculadas de domingo a sábado de cada semana.'}
            </p>
          </div>

          <Card className="p-5">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h2 className="text-lg font-semibold text-foreground">
                  Relatório {reportPeriod === 'diario' ? 'diário' : 'semanal'} da equipe
                </h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  {reportPeriod === 'diario'
                    ? new Intl.DateTimeFormat('pt-BR', { weekday: 'long', day: '2-digit', month: '2-digit', year: 'numeric' }).format(reportRange.startDate)
                    : `${new Intl.DateTimeFormat('pt-BR').format(reportRange.startDate)} – ${new Intl.DateTimeFormat('pt-BR').format(reportRange.endDate)}`}
                </p>
              </div>
              <div className="flex flex-wrap items-center justify-end gap-1">
                <div className="mr-2 flex rounded-md border border-border bg-muted/30 p-0.5">
                  <button
                    type="button"
                    onClick={() => setReportPeriod('diario')}
                    className={`rounded px-3 py-1.5 text-sm font-medium transition-colors ${reportPeriod === 'diario' ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground'}`}
                  >
                    Diário
                  </button>
                  <button
                    type="button"
                    onClick={() => setReportPeriod('semanal')}
                    className={`rounded px-3 py-1.5 text-sm font-medium transition-colors ${reportPeriod === 'semanal' ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground'}`}
                  >
                    Semanal
                  </button>
                </div>
                <Button variant="outline" size="icon-sm" onClick={() => reportPeriod === 'diario' ? setDayOffset((value) => value - 1) : setWeekOffset((value) => value - 1)} aria-label={reportPeriod === 'diario' ? 'Dia anterior' : 'Semana anterior'}>
                  <ChevronLeft className="size-4" />
                </Button>
                <Button variant="outline" size="sm" onClick={() => reportPeriod === 'diario' ? setDayOffset(0) : setWeekOffset(0)}>
                  {reportPeriod === 'diario' ? 'Hoje' : 'Semana atual'}
                </Button>
                <Button variant="outline" size="icon-sm" onClick={() => reportPeriod === 'diario' ? setDayOffset((value) => value + 1) : setWeekOffset((value) => value + 1)} aria-label={reportPeriod === 'diario' ? 'Próximo dia' : 'Próxima semana'}>
                  <ChevronRight className="size-4" />
                </Button>
              </div>
            </div>

            <div className="mt-5 grid grid-cols-2 gap-3 lg:grid-cols-4">
              {[
                ['Comissões pendentes', reportPending, 'text-amber-700'],
                ['Comissões pagas', reportPaid, 'text-emerald-700'],
                ['Comissões geradas', reportGenerated, 'text-foreground'],
                ['Vendas totais', reportRevenue, 'text-foreground'],
              ].map(([label, value, color]) => (
                <div key={String(label)} className="rounded-xl border border-border bg-muted/20 p-4">
                  <p className="text-sm text-muted-foreground">{label}</p>
                  <p className={`mt-1 text-xl font-bold tabular-nums ${color}`}>{formatCurrency(Number(value))}</p>
                </div>
              ))}
            </div>

            <div className="mt-6 border-t border-border pt-5">
              <h3 className="mb-3 flex items-center gap-2 font-semibold"><Users className="size-4" /> Detalhamento por funcionário</h3>
              <div className="space-y-3">
                {reportEmployees.map(({ employee, values }) => (
                  <div key={employee.id} className="flex flex-col gap-4 rounded-xl border border-emerald-200 bg-gradient-to-r from-emerald-50/70 to-blue-50/70 p-4 sm:flex-row sm:items-center">
                    <Avatar name={employee.name} src={employee.avatarUrl} color={employee.avatarColor} className="size-10" />
                    <div className="min-w-0 flex-1">
                      <p className="font-semibold text-foreground">{employee.name}</p>
                      <p className="mt-1 text-sm text-muted-foreground">
                        {values.orders} vendas · Faturamento {formatCurrency(values.revenue)}
                      </p>
                      <p className="mt-2 text-xs text-muted-foreground">
                        Gerada: {formatCurrency(values.generated)} · Paga: {formatCurrency(values.paid)}
                      </p>
                    </div>
                    <div className="border-t border-border pt-3 text-left sm:border-l sm:border-t-0 sm:pl-5 sm:pt-0 sm:text-right">
                      <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">A pagar</p>
                      <p className="mt-1 text-xl font-bold text-emerald-700">{formatCurrency(values.pending)}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </Card>
        </div>
      ) : null}

      <div className={`${section !== 'equipe' ? 'hidden' : ''} mb-4 grid grid-cols-2 gap-3 lg:grid-cols-4`}>
        <Card className="p-4">
          <p className="text-sm text-muted-foreground">Funcionários ativos</p>
          <p className="mt-1 text-2xl font-bold text-foreground">{activeEmployees.length}</p>
        </Card>
        <Card className="p-4">
          <p className="text-sm text-muted-foreground">Vendas pagas no mês</p>
          <p className="mt-1 text-2xl font-bold text-foreground">{attributedPaidOrders}</p>
        </Card>
        <Card className="p-4">
          <p className="text-sm text-muted-foreground">Faturamento do mês</p>
          <p className="mt-1 text-2xl font-bold text-foreground">{formatCurrency(totalRevenue)}</p>
        </Card>
        <Card className="p-4">
          <p className="text-sm text-muted-foreground">Comissões do mês</p>
          <p className="mt-1 text-2xl font-bold text-foreground">{formatCurrency(pending)}</p>
        </Card>
      </div>

      <Card className={`${section !== 'equipe' ? 'hidden' : ''} mb-4 p-5`}>
        <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
          <div>
            <h3 className="flex items-center gap-2 font-semibold text-foreground">
              <Trophy className="size-4 text-gold-foreground" />
              Ranking do mês
            </h3>
            <p className="mt-1 text-sm text-muted-foreground">Faturamento, serviços e comissão de cada integrante no mês atual.</p>
          </div>
          <span className="text-sm font-semibold text-foreground">Total {formatCurrency(totalRevenue)}</span>
        </div>
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {ranking.map((item, index) => {
            const values = employeeValues.get(item.id)
            return (
              <div key={item.id} className="rounded-xl border border-border bg-muted/20 p-4">
                <div className="flex items-center gap-3">
                  <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">{index + 1}</span>
                  <Avatar name={item.name} color={item.color} className="size-10" />
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-semibold text-foreground">{item.name}</p>
                    <p className="text-xs text-muted-foreground">{item.services} serviços vendidos</p>
                  </div>
                </div>
                <div className="mt-4 grid grid-cols-2 gap-3 border-t border-border pt-3">
                  <div>
                    <p className="text-xs text-muted-foreground">Vendeu</p>
                    <p className="mt-0.5 text-lg font-bold tabular-nums text-foreground">{formatCurrency(item.revenue)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Comissão</p>
                    <p className="mt-0.5 text-lg font-bold tabular-nums text-emerald-700">{formatCurrency(values?.commission ?? 0)}</p>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </Card>

      <Card className={`${section !== 'equipe' ? 'hidden' : ''} w-full overflow-hidden`}>
          <Table className="min-w-[1180px]">
            <TableHeader>
              <TableRow>
                <TableHead>Funcionário</TableHead>
                <TableHead>Contato</TableHead>
                <TableHead className="text-right">Serviços</TableHead>
                <TableHead className="text-right">Produtos</TableHead>
                <TableHead className="text-right">Assinaturas</TableHead>
                <TableHead className="text-right">Faturamento</TableHead>
                <TableHead className="text-right">Comissão</TableHead>
                <TableHead>Acesso</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {employees.map((employee) => (
                <TableRow key={employee.id}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <Avatar name={employee.name} src={employee.avatarUrl} color={employee.avatarColor} />
                      <div>
                        <p className="font-medium text-foreground">{employee.name}</p>
                        <p className="text-xs text-muted-foreground">{employee.role}</p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="space-y-1 text-sm text-muted-foreground">
                      <p className="flex items-center gap-2"><Phone className="size-3.5" />{employee.phone}</p>
                      <p className="flex items-center gap-2"><Mail className="size-3.5" />{employee.email}</p>
                    </div>
                  </TableCell>
                  <TableCell className="text-right tabular-nums">{formatPercent(employee.serviceCommission)}</TableCell>
                  <TableCell className="text-right tabular-nums">{formatPercent(employee.productCommission)}</TableCell>
                  <TableCell className="text-right tabular-nums">{formatPercent(employee.subscriptionCommission)}</TableCell>
                  <TableCell className="text-right font-semibold tabular-nums">{formatCurrency(employeeValues.get(employee.id)?.revenue ?? 0)}</TableCell>
                  <TableCell className="text-right font-semibold tabular-nums text-emerald-700">{formatCurrency(employeeValues.get(employee.id)?.commission ?? 0)}</TableCell>
                  <TableCell>
                    {appData.staffMembers.some((member) => member.employeeId === employee.id && member.active)
                      ? <Badge variant="success">Liberado</Badge>
                      : <Badge variant="secondary">Sem acesso</Badge>}
                  </TableCell>
                  <TableCell>
                    <Badge variant={employee.active ? 'success' : 'secondary'}>{employee.active ? 'Ativo' : 'Inativo'}</Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="inline-flex gap-1">
                      <Button variant="ghost" size="icon-sm" aria-label={`Editar ${employee.name}`} onClick={() => { setEditStatus(''); setEditing({ id:employee.id, name:employee.name, role:employee.role, phone:employee.phone, email:employee.email, active:String(employee.active), service:String(employee.serviceCommission), product:String(employee.productCommission), subscription:String(employee.subscriptionCommission) }) }}><Pencil className="size-4" /></Button>
                      {appData.member.role === 'owner' && isBarberRole(employee.role) ? <Button variant="ghost" size="icon-sm" aria-label={`Gerenciar acesso de ${employee.name}`} onClick={() => openAccess(employee)}><KeyRound className="size-4" /></Button> : null}
                      <Button variant="ghost" size="icon-sm" aria-label={`Excluir ${employee.name}`} onClick={() => deleteEmployee(employee.id)}><Trash2 className="size-4" /></Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
      </Card>
      <Dialog open={Boolean(editing)} onClose={() => setEditing(null)} className="sm:max-w-2xl">
        {editing ? <><DialogHeader title="Editar funcionário" description="Corrija os dados, função, status e comissões." /><div className="grid gap-4 sm:grid-cols-2">
          <Field label="Nome"><Input value={editing.name} onChange={e=>setEditing({...editing,name:e.target.value})}/></Field>
          <Field label="Função"><Select value={editing.role} onChange={e=>setEditing({...editing,role:e.target.value})}><option value="barber">Barbeiro</option><option value="manager">Gerente</option><option value="reception">Recepção</option></Select></Field>
          <Field label="E-mail"><Input type="email" value={editing.email} onChange={e=>setEditing({...editing,email:e.target.value})}/></Field>
          <Field label="Telefone"><Input value={editing.phone} onChange={e=>setEditing({...editing,phone:e.target.value})}/></Field>
          <Field label="Status"><Select value={editing.active} onChange={e=>setEditing({...editing,active:e.target.value})}><option value="true">Ativo</option><option value="false">Inativo</option></Select></Field>
          <Field label="Comissão em serviços (%)"><Input type="number" min="0" max="100" value={editing.service} onChange={e=>setEditing({...editing,service:e.target.value})}/></Field>
          <Field label="Comissão em produtos (%)"><Input type="number" min="0" max="100" value={editing.product} onChange={e=>setEditing({...editing,product:e.target.value})}/></Field>
          <Field label="Comissão em assinaturas (%)"><Input type="number" min="0" max="100" value={editing.subscription} onChange={e=>setEditing({...editing,subscription:e.target.value})}/></Field>
        </div>{editStatus?<p className="mt-4 text-sm text-destructive">{editStatus}</p>:null}<div className="mt-5 flex justify-end gap-2"><Button variant="outline" onClick={()=>setEditing(null)}>Cancelar</Button><Button variant="gold" onClick={saveEmployee}><Save className="size-4"/>Salvar alterações</Button></div></>:null}
      </Dialog>
      <Dialog open={Boolean(accessEditing)} onClose={() => setAccessEditing(null)} className="sm:max-w-lg">
        {accessEditing ? <>
          <DialogHeader
            title={`Acesso de ${accessEditing.name}`}
            description="O barbeiro verá somente a própria agenda, faturamento e comissão. A conta do proprietário não será alterada."
          />
          <Field label="E-mail para acesso">
            <Input type="email" value={accessEmail} onChange={(event) => setAccessEmail(event.target.value)} placeholder="barbeiro@email.com" />
          </Field>
          {accessStatus ? <p className="mt-3 rounded-md bg-muted p-3 text-sm">{accessStatus}</p> : null}
          <div className="mt-5 flex flex-wrap justify-end gap-2">
            {appData.staffMembers.some((member) => member.employeeId === accessEditing.id && member.active) ? (
              <Button variant="destructive" disabled={accessLoading} onClick={() => updateAccess(false)}>
                <UserX className="size-4" /> Desativar acesso
              </Button>
            ) : (
              <Button variant="gold" disabled={accessLoading || !accessEmail.trim()} onClick={() => updateAccess(true)}>
                <UserCheck className="size-4" /> {accessLoading ? 'Enviando...' : 'Criar acesso e convidar'}
              </Button>
            )}
          </div>
        </> : null}
      </Dialog>
    </div>
  )
}

function Field({label,children}:{label:string;children:React.ReactNode}) { return <div className="space-y-2"><Label>{label}</Label>{children}</div> }
