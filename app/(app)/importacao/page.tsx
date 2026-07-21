'use client'

import { useRef, useState } from 'react'
import { Download, FileSpreadsheet, Lock, Upload } from 'lucide-react'
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
  const { barbershop, member, clients, catalog, employees, imports: databaseImports, insertMany, insertRecord } = useAppData()
  const fileRef = useRef<HTMLInputElement>(null)
  const [message, setMessage] = useState('')
  const currentPlan = getSaasPlan(barbershop.plan)
  const canImport = canUsePlanFeature(barbershop.plan, 'importExport')
  const imports = [...databaseImports].sort((a, b) => b.createdAt.localeCompare(a.createdAt))
  const totalRows = imports.reduce((sum, item) => sum + item.totalRows, 0)
  const importedRows = imports.reduce((sum, item) => sum + item.importedRows, 0)
  const errorRows = imports.reduce((sum, item) => sum + item.errorRows, 0)
  function downloadTemplate() {
    const content = '\uFEFFtipo,nome,telefone,email,categoria,preco,custo,comissao,duracao,estoque\ncliente,João Silva,11999999999,joao@email.com,,,,,,\nservico,Corte,,,Cabelo,50,0,40,45,\nproduto,Pomada,,,Finalização,35,18,10,,20'
    const url = URL.createObjectURL(new Blob([content], { type:'text/csv;charset=utf-8' }))
    const link = document.createElement('a'); link.href=url; link.download='modelo-barberhub.csv'; link.click(); URL.revokeObjectURL(url)
  }
  function exportData() {
    const escape = (value: unknown) => `"${String(value ?? '').replace(/"/g, '""')}"`
    const rows = [
      ['tipo','nome','telefone','email','categoria','preco','custo','comissao','duracao','estoque'],
      ...clients.map(item=>['cliente',item.name,item.phone,item.email,'','','','','','']),
      ...catalog.map(item=>[item.type,item.name,'','',item.category,item.price,item.cost,item.commission,item.durationMin??'',item.stock??'']),
      ...employees.map(item=>['funcionario',item.name,item.phone,item.email,item.role,'','','','','']),
    ]
    const content='\uFEFF'+rows.map(row=>row.map(escape).join(',')).join('\n'); const url=URL.createObjectURL(new Blob([content],{type:'text/csv;charset=utf-8'})); const link=document.createElement('a');link.href=url;link.download=`barberhub-${new Date().toISOString().slice(0,10)}.csv`;link.click();URL.revokeObjectURL(url)
  }
  function parseLine(line:string){const values:string[]=[];let value='';let quoted=false;for(let i=0;i<line.length;i++){const char=line[i];if(char==='"'&&quoted&&line[i+1]==='"'){value+='"';i++}else if(char==='"'){quoted=!quoted}else if(char===','&&!quoted){values.push(value.trim());value=''}else value+=char}values.push(value.trim());return values}
  async function importCsv(event: React.ChangeEvent<HTMLInputElement>) {
    const file=event.target.files?.[0]; if(!file)return; setMessage('Importando...')
    const lines=(await file.text()).replace(/^\uFEFF/,'').split(/\r?\n/).filter(Boolean); const headers=parseLine(lines.shift()??'').map(x=>x.trim().toLowerCase())
    const rows=lines.map(line=>{const values=parseLine(line);return Object.fromEntries(headers.map((h,i)=>[h,values[i]??'']))})
    const clients=rows.filter(r=>r.tipo==='cliente').map(r=>({barbershop_id:barbershop.id,name:r.nome,phone:r.telefone||null,email:r.email||null}))
    const catalog=rows.filter(r=>r.tipo==='produto'||r.tipo==='servico').map(r=>({barbershop_id:barbershop.id,type:r.tipo,name:r.nome,category:r.categoria||null,price:Number(r.preco.replace(',','.'))||0,cost:Number(r.custo.replace(',','.'))||0,commission:Number(r.comissao)||0,duration_min:r.tipo==='servico'?Number(r.duracao)||40:null,stock:r.tipo==='produto'?Number(r.estoque)||0:null,active:true}))
    const staff=rows.filter(r=>r.tipo==='funcionario').map(r=>({barbershop_id:barbershop.id,name:r.nome,phone:r.telefone||null,email:r.email||null,role:r.categoria||'barber',active:true}))
    let imported=0; let error=''; if(clients.length){const r=await insertMany('clients',clients);if(r.error)error=r.error;else imported+=clients.length} if(catalog.length&&!error){const r=await insertMany('catalog_items',catalog);if(r.error)error=r.error;else imported+=catalog.length} if(staff.length&&!error){const r=await insertMany('employees',staff);if(r.error)error=r.error;else imported+=staff.length}
    await insertRecord('import_records',{barbershop_id:barbershop.id,entity:catalog.length?'produtos':'clientes',file_name:file.name,total_rows:rows.length,imported_rows:imported,error_rows:rows.length-imported,status:error?'com_erros':'concluida',created_by:member.name})
    setMessage(error||`${imported} registros importados.`); event.target.value=''
  }

  return (
    <div>
      <PageHeader
        title="Importar / Exportar"
        description="Migração de dados, histórico de importações e arquivos de apoio."
      >
        <Button variant="outline" size="sm" disabled={!canImport} onClick={downloadTemplate}>
          <Download className="size-4" />
          Baixar modelo
        </Button>
        <Button variant="outline" size="sm" disabled={!canImport} onClick={exportData}><Download className="size-4" />Exportar dados</Button>
        <input ref={fileRef} type="file" accept=".csv,text/csv" className="hidden" onChange={importCsv} />
        <Button variant="gold" size="sm" disabled={!canImport} onClick={()=>fileRef.current?.click()}>
          {canImport ? <Upload className="size-4" /> : <Lock className="size-4" />}
          {canImport ? 'Importar CSV' : 'Plano Pro'}
        </Button>
      </PageHeader>
      {message ? <p className="mb-4 text-sm font-medium">{message}</p> : null}

      {!canImport ? (
        <Card className="mb-4 border-warning/40 bg-warning/10 p-4">
          <div className="flex gap-3">
            <span className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-warning/20 text-warning-foreground">
              <Lock className="size-5" />
            </span>
            <div>
              <h3 className="font-semibold text-foreground">Importação liberada a partir do Pro</h3>
              <p className="mt-1 text-sm text-muted-foreground">
                O plano {currentPlan.name} mantém a gestão do dia a dia, mas importação/exportação entra nos planos Pro e Premium.
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
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      </div>
    </div>
  )
}
