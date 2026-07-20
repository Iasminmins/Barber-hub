'use client'

import Link from 'next/link'
import { Mail, Pencil, Phone, Plus, Save, Scissors, Trash2, Trophy } from 'lucide-react'
import { useMemo, useState } from 'react'
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

export default function FuncionariosPage() {
  const appData = useAppData()
  const [employees, setEmployees] = useState(() => appData.employees)
  const [saved, setSaved] = useState(false)
  const [editing, setEditing] = useState<null | { id:string; name:string; role:string; phone:string; email:string; active:string; service:string; product:string; subscription:string }>(null)
  const [editStatus, setEditStatus] = useState('')
  const commissions = appData.commissions
  const ranking = employees.map((employee) => ({
    name: employee.name,
    services: commissions.filter((item) => item.employeeId === employee.id && item.origin === 'servico').length,
    revenue: commissions.filter((item) => item.employeeId === employee.id).reduce((sum, item) => sum + item.base, 0),
  })).sort((a, b) => b.revenue - a.revenue)
  const pending = commissions
    .filter((c) => c.status === 'pendente')
    .reduce((sum, commission) => sum + commission.amount, 0)

  const activeEmployees = useMemo(() => employees.filter((e) => e.active), [employees])

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

      <div className="mb-4 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Card className="p-4">
          <p className="text-sm text-muted-foreground">Funcionários ativos</p>
          <p className="mt-1 text-2xl font-bold text-foreground">{activeEmployees.length}</p>
        </Card>
        <Card className="p-4">
          <p className="text-sm text-muted-foreground">Barbeiros ativos</p>
          <p className="mt-1 text-2xl font-bold text-foreground">
            {activeEmployees.filter((e) => isBarberRole(e.role)).length}
          </p>
        </Card>
        <Card className="p-4">
          <p className="text-sm text-muted-foreground">Comissões pendentes</p>
          <p className="mt-1 text-2xl font-bold text-foreground">{formatCurrency(pending)}</p>
        </Card>
        <Card className="p-4">
          <p className="text-sm text-muted-foreground">Top faturamento</p>
          <p className="mt-1 truncate text-2xl font-bold text-foreground">{ranking[0]?.name}</p>
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-[1fr_340px]">
        <Card className="overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Funcionário</TableHead>
                <TableHead>Contato</TableHead>
                <TableHead className="text-right">Serviços</TableHead>
                <TableHead className="text-right">Produtos</TableHead>
                <TableHead className="text-right">Assinaturas</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {employees.map((employee) => (
                <TableRow key={employee.id}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <Avatar name={employee.name} />
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
                  <TableCell>
                    <Badge variant={employee.active ? 'success' : 'secondary'}>{employee.active ? 'Ativo' : 'Inativo'}</Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="inline-flex gap-1">
                      <Button variant="ghost" size="icon-sm" aria-label={`Editar ${employee.name}`} onClick={() => { setEditStatus(''); setEditing({ id:employee.id, name:employee.name, role:employee.role, phone:employee.phone, email:employee.email, active:String(employee.active), service:String(employee.serviceCommission), product:String(employee.productCommission), subscription:String(employee.subscriptionCommission) }) }}><Pencil className="size-4" /></Button>
                      <Button variant="ghost" size="icon-sm" aria-label={`Excluir ${employee.name}`} onClick={() => deleteEmployee(employee.id)}><Trash2 className="size-4" /></Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>

        <Card className="p-5">
          <h3 className="mb-4 flex items-center gap-2 font-semibold text-foreground">
            <Trophy className="size-4 text-gold-foreground" />
            Ranking do mês
          </h3>
          <div className="space-y-4">
            {ranking.map((item, index) => (
              <div key={item.name} className="flex items-center gap-3">
                <span className="flex size-7 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">{index + 1}</span>
                <span className="flex size-9 items-center justify-center rounded-lg bg-muted text-muted-foreground">
                  {index === 0 ? <Trophy className="size-4" /> : <Scissors className="size-4" />}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-foreground">{item.name}</p>
                  <p className="text-xs text-muted-foreground">{item.services} serviços</p>
                </div>
                <span className="font-semibold tabular-nums text-foreground">{formatCurrency(item.revenue)}</span>
              </div>
            ))}
          </div>
        </Card>
      </div>
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
    </div>
  )
}

function Field({label,children}:{label:string;children:React.ReactNode}) { return <div className="space-y-2"><Label>{label}</Label>{children}</div> }
