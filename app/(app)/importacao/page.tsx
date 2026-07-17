'use client'

import { Download, FileSpreadsheet, Lock, RotateCcw, Upload } from 'lucide-react'
import { PageHeader } from '@/components/page-header'
import { StatusBadge } from '@/components/status-badge'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { useAppData } from '@/components/data/app-data-provider'
import { formatDate, formatNumber } from '@/lib/format'
import { canUsePlanFeature, getSaasPlan } from '@/lib/saas-plans'

export default function ImportacaoPage() {
  const { barbershop, imports: databaseImports } = useAppData()
  const currentPlan = getSaasPlan(barbershop.plan)
  const canImport = canUsePlanFeature(barbershop.plan, 'importExport')
  const imports = [...databaseImports].sort((a, b) => b.createdAt.localeCompare(a.createdAt))
  const totalRows = imports.reduce((sum, item) => sum + item.totalRows, 0)
  const importedRows = imports.reduce((sum, item) => sum + item.importedRows, 0)
  const errorRows = imports.reduce((sum, item) => sum + item.errorRows, 0)

  return (
    <div>
      <PageHeader
        title="Importar / Exportar"
        description="Migração de dados, histórico de importações e arquivos de apoio."
      >
        <Button variant="outline" size="sm" disabled={!canImport}>
          <Download className="size-4" />
          Baixar modelo
        </Button>
        <Button variant="gold" size="sm" disabled={!canImport}>
          {canImport ? <Upload className="size-4" /> : <Lock className="size-4" />}
          {canImport ? 'Importar CSV' : 'Plano Pro'}
        </Button>
      </PageHeader>

      {!canImport ? (
        <Card className="mb-4 border-warning/40 bg-warning/10 p-4">
          <div className="flex gap-3">
            <span className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-warning/20 text-warning-foreground">
              <Lock className="size-5" />
            </span>
            <div>
              <h3 className="font-semibold text-foreground">Importação liberada a partir do Pro</h3>
              <p className="mt-1 text-sm text-muted-foreground">
                O plano {currentPlan.name} mantém o sistema completo, mas importação/exportação entra nos planos Pro e Premium.
              </p>
            </div>
          </div>
        </Card>
      ) : null}

      <div className="mb-4 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Card className="p-4">
          <p className="text-sm text-muted-foreground">Arquivos processados</p>
          <p className="mt-1 text-2xl font-bold text-foreground">{imports.length}</p>
        </Card>
        <Card className="p-4">
          <p className="text-sm text-muted-foreground">Linhas lidas</p>
          <p className="mt-1 text-2xl font-bold text-foreground">{formatNumber(totalRows)}</p>
        </Card>
        <Card className="p-4">
          <p className="text-sm text-muted-foreground">Importadas</p>
          <p className="mt-1 text-2xl font-bold text-success">{formatNumber(importedRows)}</p>
        </Card>
        <Card className="p-4">
          <p className="text-sm text-muted-foreground">Com erro</p>
          <p className="mt-1 text-2xl font-bold text-warning-foreground">{formatNumber(errorRows)}</p>
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-[320px_1fr]">
        <Card className="p-5">
          <h3 className="mb-4 font-semibold text-foreground">Fluxo recomendado</h3>
          <div className="space-y-4">
            {[
              ['1', 'Baixar modelo', 'Use os cabeçalhos esperados para clientes, produtos e assinaturas.'],
              ['2', 'Validar arquivo', 'Corrija linhas com documento, telefone ou valores inválidos antes de importar.'],
              ['3', 'Revisar resultado', 'Confira erros e desfaça a importação se notar duplicidade.'],
            ].map(([step, title, description]) => (
              <div key={step} className="flex gap-3">
                <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">
                  {step}
                </span>
                <div>
                  <p className="text-sm font-medium text-foreground">{title}</p>
                  <p className="text-sm text-muted-foreground">{description}</p>
                </div>
              </div>
            ))}
          </div>
        </Card>

        <Card className="overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Arquivo</TableHead>
                <TableHead>Entidade</TableHead>
                <TableHead className="text-right">Linhas</TableHead>
                <TableHead className="text-right">Importadas</TableHead>
                <TableHead className="text-right">Erros</TableHead>
                <TableHead>Criado por</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Ação</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {imports.map((item) => (
                <TableRow key={item.id}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <span className="flex size-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
                        <FileSpreadsheet className="size-4" />
                      </span>
                      <div>
                        <p className="font-medium text-foreground">{item.fileName}</p>
                        <p className="text-xs text-muted-foreground">{formatDate(item.createdAt)}</p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="capitalize text-muted-foreground">{item.entity}</TableCell>
                  <TableCell className="text-right tabular-nums">{formatNumber(item.totalRows)}</TableCell>
                  <TableCell className="text-right tabular-nums text-success">
                    {formatNumber(item.importedRows)}
                  </TableCell>
                  <TableCell className="text-right tabular-nums text-warning-foreground">
                    {formatNumber(item.errorRows)}
                  </TableCell>
                  <TableCell className="text-muted-foreground">{item.createdBy}</TableCell>
                  <TableCell>
                    <StatusBadge status={item.status} />
                  </TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="icon-sm" aria-label="Desfazer importação" disabled={!canImport}>
                      <RotateCcw className="size-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      </div>
    </div>
  )
}
