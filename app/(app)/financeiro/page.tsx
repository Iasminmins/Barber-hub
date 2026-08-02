'use client'

import { ArrowDownCircle, ArrowUpCircle, Download, Pencil, Plus, Trash2, Wallet } from 'lucide-react'
import * as React from 'react'
import { PageHeader } from '@/components/page-header'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Dialog, DialogHeader } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select } from '@/components/ui/select'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { useAppData } from '@/components/data/app-data-provider'
import { formatCurrency, formatDate } from '@/lib/format'
import { downloadExcelWorkbook } from '@/lib/spreadsheet-export'
import type { FinancialEntry, FinancialType, Order, PaymentMethod } from '@/lib/types'

const METHOD_LABEL: Record<string, string> = { dinheiro: 'Dinheiro', pix: 'Pix', credito: 'Crédito', debito: 'Débito', outro: 'Outro' }
const CATEGORIES = ['Aluguel', 'Materiais', 'Folha e comissões', 'Impostos', 'Marketing', 'Serviços', 'Produtos', 'Assinaturas', 'Manutenção', 'Outros']
const emptyForm = () => ({ type: 'saida' as FinancialType, description: '', category: 'Materiais', method: 'pix' as PaymentMethod, amount: '', date: new Date().toISOString().slice(0, 10) })
const orderFinanceDescription = (number: number) => `Comanda #${number}`

export default function FinanceiroPage() {
  const { barbershop, financialEntries, orders, insertRecord, updateRecord, deleteRecord } = useAppData()
  const [form, setForm] = React.useState(emptyForm)
  const [editing, setEditing] = React.useState<FinancialEntry | null>(null)
  const [deleting, setDeleting] = React.useState<FinancialEntry | null>(null)
  const [open, setOpen] = React.useState(false)
  const [saving, setSaving] = React.useState(false)
  const [message, setMessage] = React.useState('')

  const registeredOrderEntries = new Set(financialEntries.filter((entry) => entry.category === 'Comandas').map((entry) => entry.description))
  const orderEntries: FinancialEntry[] = orders.filter((order) => order.status === 'paga' && order.total > 0)
    .filter((order) => !registeredOrderEntries.has(orderFinanceDescription(order.number)))
    .map((order: Order) => ({ id: `order-${order.id}`, barbershopId: order.barbershopId, orderId: order.id, type: 'entrada', category: 'Comandas', description: orderFinanceDescription(order.number), amount: order.total, method: order.method, date: order.createdAt.slice(0, 10) }))
  const entries = [...financialEntries, ...orderEntries].sort((a, b) => b.date.localeCompare(a.date))
  const income = entries.filter((entry) => entry.type === 'entrada').reduce((sum, entry) => sum + entry.amount, 0)
  const outcome = entries.filter((entry) => entry.type === 'saida').reduce((sum, entry) => sum + entry.amount, 0)
  const balance = income - outcome
  const byMethod = Object.entries(METHOD_LABEL).map(([method, label]) => ({ method: label, value: entries.filter((entry) => entry.type === 'entrada' && entry.method === method).reduce((sum, entry) => sum + entry.amount, 0) }))
  const methodTotal = byMethod.reduce((sum, item) => sum + item.value, 0)

  function startCreate(type: FinancialType = 'saida') { setEditing(null); setForm({ ...emptyForm(), type }); setMessage(''); setOpen(true) }
  function startEdit(entry: FinancialEntry) {
    setEditing(entry)
    setForm({ type: entry.type, description: entry.description, category: entry.category, method: entry.method ?? 'outro', amount: String(entry.amount).replace('.', ','), date: entry.date })
    setMessage(''); setOpen(true)
  }
  async function saveEntry(event: React.FormEvent) {
    event.preventDefault()
    const amount = Number(form.amount.replace(/\./g, '').replace(',', '.'))
    if (!form.description.trim() || !Number.isFinite(amount) || amount <= 0) { setMessage('Preencha a descrição e informe um valor maior que zero.'); return }
    setSaving(true); setMessage('')
    const values = { barbershop_id: barbershop.id, type: form.type, description: form.description.trim(), category: form.category, method: form.method, amount, date: form.date }
    const result = editing ? await updateRecord('financial_entries', editing.id, values) : await insertRecord('financial_entries', values)
    setSaving(false)
    if (result.error) { setMessage(result.error); return }
    setOpen(false)
  }
  async function confirmDelete() {
    if (!deleting) return
    setSaving(true)
    const result = await deleteRecord('financial_entries', deleting.id)
    setSaving(false)
    if (result.error) { setMessage(result.error); return }
    setDeleting(null)
  }
  function exportFinance() {
    downloadExcelWorkbook(`financeiro-${barbershop.name.toLowerCase().replace(/[^a-z0-9]+/g, '-')}-${new Date().toISOString().slice(0, 10)}`, [
      { name: 'Resumo', title: 'Resumo financeiro', subtitle: barbershop.name, columns: [{ key: 'indicador', label: 'Indicador', width: 170 }, { key: 'valor', label: 'Valor', width: 110, kind: 'currency' }], rows: [{ indicador: 'Entradas', valor: income }, { indicador: 'Saídas', valor: -outcome }, { indicador: 'Saldo', valor: balance }] },
      { name: 'Lançamentos', title: 'Lançamentos financeiros', subtitle: `${barbershop.name} • ${entries.length} registros`, columns: [{ key: 'data', label: 'Data', width: 85, kind: 'date' }, { key: 'tipo', label: 'Tipo', width: 75 }, { key: 'descricao', label: 'Descrição', width: 220 }, { key: 'categoria', label: 'Categoria', width: 130 }, { key: 'metodo', label: 'Método', width: 90 }, { key: 'valor', label: 'Valor', width: 100, kind: 'currency' }], rows: entries.map((entry) => ({ data: entry.date, tipo: entry.type === 'entrada' ? 'Entrada' : 'Saída', descricao: entry.description, categoria: entry.category, metodo: entry.method ? METHOD_LABEL[entry.method] : 'A definir', valor: entry.type === 'entrada' ? entry.amount : -entry.amount })) },
    ])
  }

  return <div>
    <PageHeader title="Financeiro" description="Fluxo de caixa, entradas, saídas e distribuição por método de pagamento.">
      <Button variant="outline" size="sm" onClick={exportFinance}><Download className="size-4" />Exportar Excel</Button>
      <Button size="sm" onClick={() => startCreate('saida')}><Plus className="size-4" />Novo lançamento</Button>
    </PageHeader>

    <div className="mb-4 grid grid-cols-2 gap-3 lg:grid-cols-4">
      {[['Entradas', income, 'text-success'], ['Saídas', outcome, 'text-destructive'], ['Saldo', balance, 'text-foreground']].map(([label, value, color]) => <Card key={String(label)} className="p-4"><p className="text-sm text-muted-foreground">{label}</p><p className={`mt-1 text-2xl font-bold ${color}`}>{formatCurrency(Number(value))}</p></Card>)}
      <Card className="p-4"><p className="text-sm text-muted-foreground">Lançamentos</p><p className="mt-1 text-2xl font-bold text-foreground">{entries.length}</p></Card>
    </div>

    <div className="grid gap-4 lg:grid-cols-[1fr_320px]">
      <Card className="overflow-hidden">
        <Table><TableHeader><TableRow><TableHead>Data</TableHead><TableHead>Descrição</TableHead><TableHead>Categoria</TableHead><TableHead>Método</TableHead><TableHead>Tipo</TableHead><TableHead className="text-right">Valor</TableHead><TableHead className="w-24 text-right">Ações</TableHead></TableRow></TableHeader>
          <TableBody>{entries.length ? entries.map((entry) => {
            const automatic = Boolean(entry.orderId) || entry.id.startsWith('order-')
            return <TableRow key={entry.id}><TableCell className="text-muted-foreground">{formatDate(entry.date)}</TableCell><TableCell className="font-medium text-foreground">{entry.description}</TableCell><TableCell>{entry.category}</TableCell><TableCell className="text-muted-foreground">{entry.method ? METHOD_LABEL[entry.method] : 'A definir'}</TableCell><TableCell><Badge variant={entry.type === 'entrada' ? 'success' : 'destructive'}>{entry.type === 'entrada' ? 'Entrada' : 'Saída'}</Badge></TableCell><TableCell className="text-right font-semibold tabular-nums">{entry.type === 'entrada' ? '+' : '-'}{formatCurrency(entry.amount)}</TableCell><TableCell><div className="flex justify-end gap-1">{automatic ? <span className="text-xs text-muted-foreground" title="Gerado automaticamente pela comanda">Automático</span> : <><Button variant="ghost" size="icon-sm" aria-label="Editar lançamento" onClick={() => startEdit(entry)}><Pencil className="size-4" /></Button><Button variant="ghost" size="icon-sm" aria-label="Excluir lançamento" className="text-destructive" onClick={() => { setMessage(''); setDeleting(entry) }}><Trash2 className="size-4" /></Button></>}</div></TableCell></TableRow>
          }) : <TableRow><TableCell colSpan={7} className="h-40 text-center"><p className="font-medium text-foreground">Nenhum lançamento ainda</p><p className="mt-1 text-sm text-muted-foreground">Registre uma entrada ou saída para começar seu fluxo de caixa.</p><Button className="mt-4" size="sm" onClick={() => startCreate()}><Plus className="size-4" />Adicionar lançamento</Button></TableCell></TableRow>}</TableBody>
        </Table>
      </Card>
      <Card className="p-5"><h3 className="mb-4 flex items-center gap-2 font-semibold"><Wallet className="size-4 text-muted-foreground" />Métodos de pagamento</h3><div className="space-y-4">{byMethod.map((item) => <div key={item.method}><div className="mb-1 flex justify-between gap-3 text-sm"><span className="font-medium">{item.method}</span><span className="tabular-nums text-muted-foreground">{formatCurrency(item.value)}</span></div><div className="h-2 overflow-hidden rounded-full bg-muted"><div className="h-full rounded-full bg-primary" style={{ width: `${methodTotal > 0 ? (item.value / methodTotal) * 100 : 0}%` }} /></div></div>)}</div><div className="mt-5 grid grid-cols-2 gap-3 border-t pt-4"><button onClick={() => startCreate('entrada')} className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"><ArrowUpCircle className="size-4 text-success" />Entrada</button><button onClick={() => startCreate('saida')} className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"><ArrowDownCircle className="size-4 text-destructive" />Saída</button></div></Card>
    </div>

    <Dialog open={open} onClose={() => setOpen(false)}><DialogHeader title={editing ? 'Editar lançamento' : 'Novo lançamento'} description="Registre entradas e despesas manuais no caixa da barbearia." /><form onSubmit={saveEntry} className="space-y-4"><div className="grid grid-cols-2 gap-3"><div><Label htmlFor="finance-type">Tipo</Label><Select id="finance-type" className="mt-1.5" value={form.type} onChange={(event) => setForm({ ...form, type: event.target.value as FinancialType })}><option value="entrada">Entrada</option><option value="saida">Saída</option></Select></div><div><Label htmlFor="finance-date">Data</Label><Input id="finance-date" className="mt-1.5" type="date" required value={form.date} onChange={(event) => setForm({ ...form, date: event.target.value })} /></div></div><div><Label htmlFor="finance-description">Descrição</Label><Input id="finance-description" className="mt-1.5" required placeholder="Ex.: aluguel mensal" value={form.description} onChange={(event) => setForm({ ...form, description: event.target.value })} /></div><div className="grid grid-cols-2 gap-3"><div><Label htmlFor="finance-category">Categoria</Label><Select id="finance-category" className="mt-1.5" value={form.category} onChange={(event) => setForm({ ...form, category: event.target.value })}>{CATEGORIES.map((category) => <option key={category}>{category}</option>)}</Select></div><div><Label htmlFor="finance-method">Método</Label><Select id="finance-method" className="mt-1.5" value={form.method} onChange={(event) => setForm({ ...form, method: event.target.value as PaymentMethod })}>{Object.entries(METHOD_LABEL).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</Select></div></div><div><Label htmlFor="finance-amount">Valor</Label><Input id="finance-amount" className="mt-1.5" inputMode="decimal" required placeholder="0,00" value={form.amount} onChange={(event) => setForm({ ...form, amount: event.target.value })} /></div>{message ? <p className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">{message}</p> : null}<div className="flex justify-end gap-2"><Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancelar</Button><Button type="submit" disabled={saving}>{saving ? 'Salvando...' : editing ? 'Salvar alterações' : 'Adicionar lançamento'}</Button></div></form></Dialog>
    <Dialog open={Boolean(deleting)} onClose={() => setDeleting(null)}><DialogHeader title="Excluir lançamento?" description="O registro será removido do fluxo de caixa. Esta ação não pode ser desfeita." />{deleting ? <div className="rounded-lg border bg-muted/40 p-3"><p className="font-medium">{deleting.description}</p><p className="mt-1 text-sm text-muted-foreground">{formatDate(deleting.date)} • {formatCurrency(deleting.amount)}</p></div> : null}{message ? <p className="mt-3 rounded-md bg-destructive/10 p-3 text-sm text-destructive">{message}</p> : null}<div className="mt-5 flex justify-end gap-2"><Button variant="outline" onClick={() => setDeleting(null)}>Cancelar</Button><Button variant="destructive" disabled={saving} onClick={confirmDelete}>{saving ? 'Excluindo...' : 'Excluir lançamento'}</Button></div></Dialog>
  </div>
}
