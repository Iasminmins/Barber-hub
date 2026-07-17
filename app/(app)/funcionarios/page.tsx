'use client'

import Link from 'next/link'
import { Mail, Phone, Plus, Save, Scissors, Trash2, Trophy } from 'lucide-react'
import { useMemo, useState } from 'react'
import { Avatar } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Button, buttonVariants } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
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

export default function FuncionariosPage() {
  const appData = useAppData()
  const [employees, setEmployees] = useState(() => appData.employees)
  const [saved, setSaved] = useState(false)
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

  function deleteEmployee(id: string) {
    setEmployees((current) => current.filter((employee) => employee.id !== id))
    setSaved(false)
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
            {activeEmployees.filter((e) => e.role.toLowerCase().includes('barbeiro')).length}
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
                    <Button variant="ghost" size="icon-sm" aria-label="Excluir funcionário" onClick={() => deleteEmployee(employee.id)}>
                      <Trash2 className="size-4" />
                    </Button>
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
    </div>
  )
}
