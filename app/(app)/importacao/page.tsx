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
import { createBrowserSupabaseClient } from '@/lib/supabase/client'
import type { ClientTag } from '@/lib/types'

export default function ImportacaoPage() {
  const { barbershop, member, clients: existingClients, catalog, employees, financialEntries, orders, plans, subscriptions, imports: databaseImports, insertMany, insertRecord } = useAppData()
  const fileRef = useRef<HTMLInputElement>(null)
  const [message, setMessage] = useState('')
  const currentPlan = getSaasPlan(barbershop.plan)
  const canImport = canUsePlanFeature(barbershop.plan, 'importExport')
  const imports = [...databaseImports].sort((a, b) => b.createdAt.localeCompare(a.createdAt))
  const totalRows = imports.reduce((sum, item) => sum + item.totalRows, 0)
  const importedRows = imports.reduce((sum, item) => sum + item.importedRows, 0)
  const errorRows = imports.reduce((sum, item) => sum + item.errorRows, 0)
  const csvHeaders = ['tipo','nome','telefone','email','aniversario','endereco','observacoes','tags','visitas','plano','inicio','expira_em','status','vendedor','metodo','categoria','preco','custo','comissao','duracao','estoque']
  const normalizeHeader = (value: string) => value.trim().toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '')
  const toDate = (value: unknown) => {
    const text = String(value ?? '').trim()
    if (/^\d{4}-\d{2}-\d{2}$/.test(text)) return text
    const match = text.match(/^(\d{1,2})\/(\d{1,2})(?:\/(\d{2,4}))?$/)
    if (!match) return null
    const day = match[1].padStart(2, '0')
    const month = match[2].padStart(2, '0')
    const year = match[3] ? match[3].padStart(4, '20') : '2000'
    return `${year}-${month}-${day}`
  }
  const toNumber = (value: unknown, fallback = 0) => {
    const text = String(value ?? '').trim().replace(/[^\d,.-]/g, '')
    const normalized = text.includes(',') ? text.replace(/\./g, '').replace(',', '.') : text
    const number = Number(normalized)
    return Number.isFinite(number) ? number : fallback
  }
  const toInteger = (value: unknown, fallback = 0) => {
    const match = String(value ?? '').match(/\d+/)
    return match ? Number(match[0]) : fallback
  }
  const toTags = (value: unknown) => String(value ?? '').split(/[|;]/).map((tag) => tag.trim()).filter(Boolean) as ClientTag[]
  const normalizePhone = (value: unknown) => String(value ?? '').replace(/\D/g, '')
  const normalizeName = (value: unknown) => String(value ?? '').trim().toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/\s+/g, ' ')
  const normalizeEmployeeName = (value: unknown) => normalizeName(String(value ?? '').replace(/\s*Barbeiro$/i, ''))
  const mergeTags = (current: ClientTag[], imported: ClientTag[]) => Array.from(new Set([...current, ...imported]))
  const rowType = (row: Record<string, string>) => row.tipo || (row.id_comanda ? 'comanda' : row.plano ? 'assinatura' : row.nome && row.preco ? 'produto' : '')
  const stockValue = (row: Record<string, string>) => row.estoque || row['estoque / duracao'] || row['estoque/duracao'] || row.duracao || ''
  const hasPlanIndicator = (value: unknown) => String(value ?? '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().includes('plano')
  const orderFinanceDescription = (number: number) => `Comanda #${number}`
  const subscriptionStatus = (value: unknown) => String(value ?? '').toUpperCase().includes('VENCIDO') ? 'vencido' : 'ativo'
  const orderStatus = (value: unknown) => {
    const text = String(value ?? '').toLowerCase()
    if (text.includes('paga')) return 'paga'
    if (text.includes('pendente')) return 'pendente'
    if (text.includes('cancel')) return 'cancelada'
    return 'aberta'
  }
  const paymentMethod = (value: unknown) => {
    const text = String(value ?? '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase()
    if (text.includes('pix')) return 'pix'
    if (text.includes('credito')) return 'credito'
    if (text.includes('debito')) return 'debito'
    if (text.includes('dinheiro')) return 'dinheiro'
    return null
  }
  const toDateTime = (value: unknown) => {
    const match = String(value ?? '').match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})(?:,\s*(\d{1,2}):(\d{2}))?/)
    if (!match) return new Date().toISOString()
    const [, day, month, year, hour = '12', minute = '00'] = match
    return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}T${hour.padStart(2, '0')}:${minute}:00`
  }
  function downloadTemplate() {
    const content = '\uFEFF' + [
      csvHeaders.join(','),
      'cliente,Joao Silva,11999999999,joao@email.com,15/04,"Rua Exemplo, 123","Cliente recorrente",recorrente,8,,,,,,,,,,,,',
      'assinatura,Joao Silva,,,,,,,,Plano Corte De Cabelo,20/07/2026,19/08/2026,ATIVO,Otavio,PIX,,,,,,',
      'servico,Corte,,,,,,,,,,,,,,,Cabelo,50,0,40,45,',
      'produto,Pomada,,,,,,,,,,,,,,,Finalizacao,35,18,10,,20',
    ].join('\n')
    const url = URL.createObjectURL(new Blob([content], { type:'text/csv;charset=utf-8' }))
    const link = document.createElement('a'); link.href=url; link.download='modelo-barberhub.csv'; link.click(); URL.revokeObjectURL(url)
  }
  function exportData() {
    const escape = (value: unknown) => `"${String(value ?? '').replace(/"/g, '""')}"`
    const rows = [
      csvHeaders,
      ...existingClients.map(item=>['cliente',item.name,item.phone,item.email,item.birthDate,item.address,item.notes,item.tags.join('|'),item.visits,'','','','','','','','','','','','']),
      ...subscriptions.map(item=>['assinatura',item.clientName,'','','','','','','',item.planName,item.startDate,item.dueDate,item.status,'','','','','','','','']),
      ...catalog.map(item=>[item.type,item.name,'','','','','','','','','','','','','',item.category,item.price,item.cost,item.commission,item.durationMin??'',item.stock??'']),
      ...employees.map(item=>['funcionario',item.name,item.phone,item.email,'','','','','','','','','','','',item.role,'','','','','']),
    ]
    const content='\uFEFF'+rows.map(row=>row.map(escape).join(',')).join('\n'); const url=URL.createObjectURL(new Blob([content],{type:'text/csv;charset=utf-8'})); const link=document.createElement('a');link.href=url;link.download=`barberhub-${new Date().toISOString().slice(0,10)}.csv`;link.click();URL.revokeObjectURL(url)
  }
  async function readCsvFile(file: File) {
    const buffer = await file.arrayBuffer()
    try {
      return new TextDecoder('utf-8', { fatal: true }).decode(buffer)
    } catch {
      return new TextDecoder('windows-1252').decode(buffer)
    }
  }
  function parseLine(line:string, delimiter=','){const values:string[]=[];let value='';let quoted=false;for(let i=0;i<line.length;i++){const char=line[i];if(char==='"'&&quoted&&line[i+1]==='"'){value+='"';i++}else if(char==='"'){quoted=!quoted}else if(char===delimiter&&!quoted){values.push(value.trim());value=''}else value+=char}values.push(value.trim());return values}
  async function importCsv(event: React.ChangeEvent<HTMLInputElement>) {
    const file=event.target.files?.[0]; if(!file)return; setMessage('Importando...')
    const lines=(await readCsvFile(file)).replace(/^\uFEFF/,'').split(/\r?\n/).filter(Boolean); const headerLine=lines.shift()??''; const delimiter=headerLine.includes(';')?';':','; const headers=parseLine(headerLine,delimiter).map(normalizeHeader)
    const rows=lines.map(line=>{const values=parseLine(line,delimiter);return Object.fromEntries(headers.map((h,i)=>[h,values[i]??'']))})
    const importedClients=rows.filter(r=>r.tipo==='cliente').map(r=>({barbershop_id:barbershop.id,name:r.nome,phone:r.telefone||null,email:r.email||null,birth_date:toDate(r.aniversario||r.data_nascimento),address:r.endereco||null,notes:r.observacoes||r.notas||null,tags:toTags(r.tags),visits:toNumber(r.visitas)}))
    const importedCatalog=rows.filter(r=>rowType(r)==='produto'||rowType(r)==='servico').map(r=>({barbershop_id:barbershop.id,type:rowType(r),name:r.nome,category:r.categoria||null,price:toNumber(r.preco),cost:toNumber(r.custo),commission:toNumber(r.comissao),duration_min:rowType(r)==='servico'?toInteger(stockValue(r),40):null,stock:rowType(r)==='produto'?toInteger(stockValue(r)):null,active:true}))
    const importedSubscriptions=rows.filter(r=>rowType(r)==='assinatura').map(r=>({client_name:r.nome,plan_name:r.plano,start_date:toDate(r.inicio),due_date:toDate(r.expira_em||r.vencimento),status:subscriptionStatus(r.status),seller:r.vendedor||'',method:r.metodo||''}))
    const importedOrders=rows.filter(r=>rowType(r)==='comanda').map(r=>({number:toInteger(r.posicao_geral_estimada),client_name:r.cliente || 'Cliente importado',employee_name:String(r.responsavel||'').replace(/\s*Barbeiro$/i,'') || 'Não atribuído',status:orderStatus(r.status),method:paymentMethod(r.pagamento),total:toNumber(r.total),created_at:toDateTime(r.data),quantity:toInteger(r.quantidade_itens,1),source_id:r.id_comanda,plan_client:hasPlanIndicator(r.cliente_indicador_plano),notes:r.observacao||''}))
    const staff=rows.filter(r=>r.tipo==='funcionario').map(r=>({barbershop_id:barbershop.id,name:r.nome,phone:r.telefone||null,email:r.email||null,role:r.categoria||'barber',active:true}))
    const clientsToInsert = []
    const clientsToUpdate = new Map<string, Record<string, unknown>>()
    for (const client of importedClients) {
      const phone = normalizePhone(client.phone)
      const name = normalizeName(client.name)
      const current = existingClients.find((item) => phone ? normalizePhone(item.phone) === phone : normalizeName(item.name) === name)
      if (!current) { clientsToInsert.push(client); continue }
      const previous = clientsToUpdate.get(current.id)
      const previousTags = Array.isArray(previous?.tags) ? previous.tags as ClientTag[] : current.tags
      clientsToUpdate.set(current.id, {
        ...client,
        email: client.email || current.email || null,
        birth_date: client.birth_date || current.birthDate || null,
        address: client.address || current.address || null,
        notes: client.notes || current.notes || null,
        tags: mergeTags(previousTags, client.tags),
        visits: Math.max(current.visits, Number(previous?.visits ?? 0), client.visits),
      })
    }
    const catalogToInsert = []
    const catalogToUpdate = new Map<string, Record<string, unknown>>()
    for (const item of importedCatalog) {
      const current = catalog.find((currentItem) => currentItem.type === item.type && normalizeName(currentItem.name) === normalizeName(item.name))
      if (!current) { catalogToInsert.push(item); continue }
      catalogToUpdate.set(current.id, { ...item, category:item.category || current.category || null, cost:item.cost || current.cost, commission:item.commission || current.commission })
    }
    const duplicateClientRows = Math.max(0, importedClients.length - clientsToUpdate.size - clientsToInsert.length)
    const duplicateCatalogRows = Math.max(0, importedCatalog.length - catalogToUpdate.size - catalogToInsert.length)
    let imported = 0
    let error = ''
    const supabase = createBrowserSupabaseClient()
    const updates = [...clientsToUpdate.entries()]
    for (let i = 0; i < updates.length && !error; i += 25) {
      const batch = updates.slice(i, i + 25)
      setMessage(`Atualizando clientes ${Math.min(i + batch.length, updates.length)} de ${updates.length}...`)
      const results = await Promise.all(batch.map(([id, values]) => supabase.from('clients').update(values).eq('id', id)))
      const failed = results.find((result) => result.error)
      if (failed?.error) error = failed.error.message
      else imported += batch.length
    }
    if (clientsToInsert.length && !error) {
      setMessage(`Criando ${clientsToInsert.length} clientes novos...`)
      const r = await insertMany('clients', clientsToInsert)
      if (r.error) error = r.error
      else imported += clientsToInsert.length
    }
    const catalogUpdates = [...catalogToUpdate.entries()]
    for (let i = 0; i < catalogUpdates.length && !error; i += 25) {
      const batch = catalogUpdates.slice(i, i + 25)
      setMessage(`Atualizando produtos ${Math.min(i + batch.length, catalogUpdates.length)} de ${catalogUpdates.length}...`)
      const results = await Promise.all(batch.map(([id, values]) => supabase.from('catalog_items').update(values).eq('id', id)))
      const failed = results.find((result) => result.error)
      if (failed?.error) error = failed.error.message
      else imported += batch.length
    }
    if (catalogToInsert.length && !error) {
      setMessage(`Criando ${catalogToInsert.length} produtos/serviços...`)
      const r = await insertMany('catalog_items', catalogToInsert)
      if (r.error) error = r.error
      else imported += catalogToInsert.length
    }
    if (staff.length && !error) {
      setMessage(`Importando ${staff.length} funcionários...`)
      const r = await insertMany('employees', staff)
      if (r.error) error = r.error
      else imported += staff.length
    }
    if (importedSubscriptions.length && !error) {
      setMessage(`Importando ${importedSubscriptions.length} assinaturas...`)
      const clientByName = new Map(existingClients.map((client) => [normalizeName(client.name), { id: client.id, name: client.name }]))
      const planByName = new Map(plans.map((plan) => [normalizeName(plan.name), plan]))
      const subscriptionsToInsert = new Map<string, Record<string, unknown>>()
      const subscriptionsToUpdate = new Map<string, Record<string, unknown>>()

      for (const item of importedSubscriptions) {
        let client = clientByName.get(normalizeName(item.client_name))
        if (!client) {
          const clientResult = await supabase
            .from('clients')
            .insert({ barbershop_id: barbershop.id, name: item.client_name, tags: item.status === 'vencido' ? ['inadimplente'] : ['recorrente'] })
            .select('id, name')
            .single()
          if (clientResult.error || !clientResult.data) { error = clientResult.error?.message ?? 'Não foi possível criar cliente da assinatura.'; break }
          client = { id: clientResult.data.id, name: clientResult.data.name }
          clientByName.set(normalizeName(item.client_name), client)
        }

        let plan = planByName.get(normalizeName(item.plan_name))
        if (!plan) {
          const planResult = await supabase
            .from('plans')
            .insert({ barbershop_id: barbershop.id, name: item.plan_name, price: 0, type: 'mensal', description: 'Importado por CSV', active: true, rules: { cycle: 'mensal', cycleDays: 30, includedServices: [] } })
            .select('id, name, price')
            .single()
          if (planResult.error || !planResult.data) { error = planResult.error?.message ?? 'Não foi possível criar plano da assinatura.'; break }
          plan = { id: planResult.data.id, barbershopId: barbershop.id, name: planResult.data.name, price: Number(planResult.data.price), type: 'mensal', description: 'Importado por CSV', active: true, rules: { cycle: 'mensal', cycleDays: 30, includedServices: [] } }
          planByName.set(normalizeName(item.plan_name), plan)
        }

        const current = subscriptions.find((subscription) => normalizeName(subscription.clientName) === normalizeName(item.client_name) && normalizeName(subscription.planName) === normalizeName(item.plan_name))
        const values = { barbershop_id: barbershop.id, plan_id: plan.id, client_id: client.id, plan_name: plan.name, client_name: client.name, price: plan.price, start_date: item.start_date, due_date: item.due_date, status: item.status }
        if (current) subscriptionsToUpdate.set(current.id, values)
        else subscriptionsToInsert.set(`${normalizeName(item.client_name)}|${normalizeName(item.plan_name)}`, values)
      }

      const subscriptionUpdates = [...subscriptionsToUpdate.entries()]
      for (let i = 0; i < subscriptionUpdates.length && !error; i += 25) {
        const batch = subscriptionUpdates.slice(i, i + 25)
        const results = await Promise.all(batch.map(([id, values]) => supabase.from('subscriptions').update(values).eq('id', id)))
        const failed = results.find((result) => result.error)
        if (failed?.error) error = failed.error.message
        else imported += batch.length
      }
      const subscriptionInserts = [...subscriptionsToInsert.values()]
      if (subscriptionInserts.length && !error) {
        const r = await supabase.from('subscriptions').insert(subscriptionInserts)
        if (r.error) error = r.error.message
        else imported += subscriptionInserts.length
      }
      if (!error) imported += Math.max(0, importedSubscriptions.length - subscriptionsToUpdate.size - subscriptionsToInsert.size)
    }
    if (importedOrders.length && !error) {
      setMessage(`Importando ${importedOrders.length} comandas...`)
      const clientByName = new Map(existingClients.map((client) => [normalizeName(client.name), { id: client.id, name: client.name, tags: client.tags }]))
      const employeeByName = new Map(employees.map((employee) => [normalizeEmployeeName(employee.name), { id: employee.id, name: employee.name }]))
      const financeByOrderNumber = new Map(
        financialEntries
          .filter((entry) => entry.category === 'Comandas')
          .map((entry) => {
            const match = entry.description.match(/^Comanda #(\d+)$/)
            return match ? [Number(match[1]), entry] as const : null
          })
          .filter(Boolean) as Array<readonly [number, typeof financialEntries[number]]>,
      )

      for (let i = 0; i < importedOrders.length && !error; i += 25) {
        const batch = importedOrders.slice(i, i + 25)
        setMessage(`Importando comandas ${Math.min(i + batch.length, importedOrders.length)} de ${importedOrders.length}...`)
        for (const item of batch) {
          let client = clientByName.get(normalizeName(item.client_name))
          if (!client) {
            const clientResult = await supabase
              .from('clients')
              .insert({ barbershop_id: barbershop.id, name: item.client_name, tags: item.plan_client ? ['recorrente'] : [] })
              .select('id, name')
              .single()
            if (clientResult.error || !clientResult.data) { error = clientResult.error?.message ?? 'Não foi possível criar cliente da comanda.'; break }
            client = { id: clientResult.data.id, name: clientResult.data.name, tags: item.plan_client ? ['recorrente'] as ClientTag[] : [] }
            clientByName.set(normalizeName(item.client_name), client)
          } else if (item.plan_client && !client.tags.includes('recorrente')) {
            const nextTags = [...client.tags, 'recorrente' as ClientTag]
            const tagResult = await supabase.from('clients').update({ tags: nextTags }).eq('id', client.id)
            if (tagResult.error) { error = tagResult.error.message; break }
            client = { ...client, tags: nextTags }
            clientByName.set(normalizeName(item.client_name), client)
          }

          const current = orders.find((order) => order.number === item.number)
          const employee = employeeByName.get(normalizeEmployeeName(item.employee_name))
          const orderValues = { barbershop_id: barbershop.id, number:item.number, client_id:client.id, client_name:client.name, employee_id:employee?.id ?? null, employee_name:employee?.name ?? item.employee_name, discount:0, surcharge:0, status:item.status, method:item.method, total:item.total, created_at:item.created_at }
          const orderResult = current
            ? await supabase.from('orders').update(orderValues).eq('id', current.id).select('id').single()
            : await supabase.from('orders').insert(orderValues).select('id').single()
          if (orderResult.error || !orderResult.data) { error = orderResult.error?.message ?? 'Não foi possível importar comanda.'; break }

          const financeValues = {
            barbershop_id: barbershop.id,
            type: 'entrada',
            category: 'Comandas',
            description: orderFinanceDescription(item.number),
            amount: item.total,
            method: item.method,
            date: String(item.created_at).slice(0, 10),
          }
          const currentFinance = financeByOrderNumber.get(item.number)
          if (item.status === 'paga' && item.total > 0) {
            const financeResult = currentFinance
              ? await supabase.from('financial_entries').update(financeValues).eq('id', currentFinance.id)
              : await supabase.from('financial_entries').insert(financeValues)
            if (financeResult.error) { error = financeResult.error.message; break }
          } else if (currentFinance) {
            const financeResult = await supabase.from('financial_entries').delete().eq('id', currentFinance.id)
            if (financeResult.error) { error = financeResult.error.message; break }
          }

          if (current) {
            const deleteItems = await supabase.from('order_items').delete().eq('order_id', current.id)
            if (deleteItems.error) { error = deleteItems.error.message; break }
          }
          const orderId = orderResult.data.id
          const quantity = Math.max(1, item.quantity)
          const itemResult = await supabase.from('order_items').insert({
            order_id: orderId,
            barbershop_id: barbershop.id,
            type: 'servico',
            name: item.notes && item.notes !== '-' ? `Itens importados - ${item.notes}` : 'Itens importados',
            quantity,
            unit_price: quantity > 0 ? item.total / quantity : item.total,
          })
          if (itemResult.error) { error = itemResult.error.message; break }
          imported++
        }
      }
    }
    if (!error) imported += duplicateClientRows + duplicateCatalogRows
    const errorCount = Math.max(0, rows.length - imported)
    const entity = importedOrders.length ? 'comandas' : importedSubscriptions.length ? 'assinaturas' : importedCatalog.length ? 'produtos' : 'clientes'
    await insertRecord('import_records',{barbershop_id:barbershop.id,entity,file_name:file.name,total_rows:rows.length,imported_rows:imported,error_rows:errorCount,status:error||errorCount?'com_erros':'concluida',created_by:member.name})
    setMessage(error||`${imported} registros absorvidos pelo CSV.`); event.target.value=''
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
