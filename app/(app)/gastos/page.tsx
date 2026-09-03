'use client'

import { Pencil, Plus, Receipt, Trash2 } from 'lucide-react'
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
import { getExpenseEntries, getExpenseTotal } from '@/lib/expense-entries'
import { formatCurrency, formatDate } from '@/lib/format'
import type { FinancialEntry, PaymentMethod } from '@/lib/types'

const METHOD_LABEL: Record<PaymentMethod, string> = { dinheiro: 'Dinheiro', pix: 'Pix', credito: 'Crédito', debito: 'Débito', outro: 'Outro' }
const CATEGORIES = ['Aluguel', 'Materiais', 'Folha e comissões', 'Impostos', 'Marketing', 'Serviços', 'Produtos', 'Assinaturas', 'Manutenção', 'Outros']
const newForm = () => ({ description: '', category: 'Materiais', method: 'pix' as PaymentMethod, amount: '', date: new Date().toISOString().slice(0, 10) })

export default function GastosPage() {
  const { barbershop, member, financialEntries, insertRecord, updateRecord, deleteRecord } = useAppData()
  const [form, setForm] = React.useState(newForm)
  const [editing, setEditing] = React.useState<FinancialEntry | null>(null)
  const [deleting, setDeleting] = React.useState<FinancialEntry | null>(null)
  const [open, setOpen] = React.useState(false)
  const [saving, setSaving] = React.useState(false)
  const [message, setMessage] = React.useState('')
  const entries = getExpenseEntries(financialEntries)
  const total = getExpenseTotal(financialEntries)
  const canManage = member.role === 'owner' || member.role === 'manager'

  function startCreate() { setEditing(null); setForm(newForm()); setMessage(''); setOpen(true) }
  function startEdit(entry: FinancialEntry) {
    setEditing(entry)
    setForm({ description: entry.description, category: entry.category, method: entry.method ?? 'outro', amount: String(entry.amount).replace('.', ','), date: entry.date })
    setMessage(''); setOpen(true)
  }
  async function saveExpense(event: React.FormEvent) {
    event.preventDefault()
    const amount = Number(form.amount.replace(/\./g, '').replace(',', '.'))
    if (!form.description.trim() || !Number.isFinite(amount) || amount <= 0) { setMessage('Preencha a descrição e informe um valor maior que zero.'); return }
    setSaving(true); setMessage('')
    const values = { barbershop_id: barbershop.id, type: 'saida', description: form.description.trim(), category: form.category, method: form.method, amount, date: form.date }
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

  return <div>
    <PageHeader title="Gastos" description="Registre despesas da barbearia. Elas também aparecem como saídas no Financeiro.">
      <Button size="sm" onClick={startCreate}><Plus className="size-4" />Adicionar gasto</Button>
    </PageHeader>
    <div className="mb-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
      <Card className="p-4"><p className="text-sm text-muted-foreground">Total de gastos</p><p className="mt-1 text-2xl font-bold text-destructive">{formatCurrency(total)}</p></Card>
      <Card className="p-4"><p className="text-sm text-muted-foreground">Lançamentos</p><p className="mt-1 text-2xl font-bold text-foreground">{entries.length}</p></Card>
    </div>
    <Card className="overflow-hidden"><Table><TableHeader><TableRow><TableHead>Data</TableHead><TableHead>Descrição</TableHead><TableHead>Categoria</TableHead><TableHead>Método</TableHead><TableHead className="text-right">Valor</TableHead>{canManage ? <TableHead className="w-24 text-right">Ações</TableHead> : null}</TableRow></TableHeader><TableBody>{entries.length ? entries.map((entry) => <TableRow key={entry.id}><TableCell className="text-muted-foreground">{formatDate(entry.date)}</TableCell><TableCell className="font-medium text-foreground">{entry.description}</TableCell><TableCell><Badge variant="outline">{entry.category}</Badge></TableCell><TableCell className="text-muted-foreground">{entry.method ? METHOD_LABEL[entry.method] : 'A definir'}</TableCell><TableCell className="text-right font-semibold tabular-nums text-destructive">-{formatCurrency(entry.amount)}</TableCell>{canManage ? <TableCell><div className="flex justify-end gap-1"><Button variant="ghost" size="icon-sm" aria-label="Editar gasto" onClick={() => startEdit(entry)}><Pencil className="size-4" /></Button><Button variant="ghost" size="icon-sm" aria-label="Excluir gasto" className="text-destructive" onClick={() => { setMessage(''); setDeleting(entry) }}><Trash2 className="size-4" /></Button></div></TableCell> : null}</TableRow>) : <TableRow><TableCell colSpan={canManage ? 6 : 5} className="h-40 text-center"><Receipt className="mx-auto size-8 text-muted-foreground" /><p className="mt-3 font-medium text-foreground">Nenhum gasto registrado</p><p className="mt-1 text-sm text-muted-foreground">Adicione uma despesa para acompanhar os custos da barbearia.</p><Button className="mt-4" size="sm" onClick={startCreate}><Plus className="size-4" />Adicionar gasto</Button></TableCell></TableRow>}</TableBody></Table></Card>
    <Dialog open={open} onClose={() => setOpen(false)}><DialogHeader title={editing ? 'Editar gasto' : 'Adicionar gasto'} description="O registro será lançado automaticamente como saída no Financeiro." /><form onSubmit={saveExpense} className="space-y-4"><div className="grid grid-cols-2 gap-3"><div><Label htmlFor="expense-date">Data</Label><Input id="expense-date" className="mt-1.5" type="date" required value={form.date} onChange={(event) => setForm({ ...form, date: event.target.value })} /></div><div><Label htmlFor="expense-amount">Valor</Label><Input id="expense-amount" className="mt-1.5" inputMode="decimal" required placeholder="0,00" value={form.amount} onChange={(event) => setForm({ ...form, amount: event.target.value })} /></div></div><div><Label htmlFor="expense-description">Descrição</Label><Input id="expense-description" className="mt-1.5" required placeholder="Ex.: compra de materiais" value={form.description} onChange={(event) => setForm({ ...form, description: event.target.value })} /></div><div className="grid grid-cols-2 gap-3"><div><Label htmlFor="expense-category">Categoria</Label><Select id="expense-category" className="mt-1.5" value={form.category} onChange={(event) => setForm({ ...form, category: event.target.value })}>{CATEGORIES.map((category) => <option key={category}>{category}</option>)}</Select></div><div><Label htmlFor="expense-method">Forma de pagamento</Label><Select id="expense-method" className="mt-1.5" value={form.method} onChange={(event) => setForm({ ...form, method: event.target.value as PaymentMethod })}>{Object.entries(METHOD_LABEL).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</Select></div></div>{message ? <p className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">{message}</p> : null}<div className="flex justify-end gap-2"><Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancelar</Button><Button type="submit" disabled={saving}>{saving ? 'Salvando...' : editing ? 'Salvar alterações' : 'Adicionar gasto'}</Button></div></form></Dialog>
    <Dialog open={Boolean(deleting)} onClose={() => setDeleting(null)}><DialogHeader title="Excluir gasto?" description="O registro também será removido das saídas do Financeiro." />{deleting ? <div className="rounded-lg border bg-muted/40 p-3"><p className="font-medium">{deleting.description}</p><p className="mt-1 text-sm text-muted-foreground">{formatDate(deleting.date)} • {formatCurrency(deleting.amount)}</p></div> : null}<div className="mt-5 flex justify-end gap-2"><Button variant="outline" onClick={() => setDeleting(null)}>Cancelar</Button><Button variant="destructive" disabled={saving} onClick={confirmDelete}>{saving ? 'Excluindo...' : 'Excluir gasto'}</Button></div></Dialog>
  </div>
}
