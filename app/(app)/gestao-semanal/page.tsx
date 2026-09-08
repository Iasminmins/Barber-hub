'use client'

import * as React from 'react'
import { Check, ChevronLeft, ChevronRight, Save } from 'lucide-react'
import { PageHeader } from '@/components/page-header'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Select } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { useAppData } from '@/components/data/app-data-provider'
import { buildWeeklyBarberResults, getWeekRange, type WeekRange } from '@/lib/weekly-management'
import { formatCurrency } from '@/lib/format'

const checklistItems = ['Preparar a bancada', 'Higienizar ferramentas', 'Seguir o padrão Duke', 'Oferecer serviço/produto complementar', 'Confirmar cadastro e retorno', 'Limpar e organizar no fechamento']
const cadastroItems = ['Nome completo', 'Telefone / WhatsApp válido', 'Data de nascimento', 'Serviço e profissional registrados', 'Autorização para mensagens']

function dateLabel(value: string) {
  return new Intl.DateTimeFormat('pt-BR', { day: '2-digit', month: 'short' }).format(new Date(`${value}T12:00:00`)).replace('.', '')
}

function SectionTitle({ number, title }: { number: string; title: string }) {
  return <div className="flex items-center gap-2 bg-gold px-3 py-2 text-xs font-bold uppercase tracking-wide text-gold-foreground"><span className="flex size-5 items-center justify-center rounded-full bg-black/10 text-[10px]">{number}</span>{title}</div>
}

function EditableCell({ value = '', onChange, placeholder, type = 'text' }: { value?: string; onChange?: (value: string) => void; placeholder?: string; type?: string }) {
  return <Input type={type} {...(onChange ? { value, onChange: (event) => onChange(event.target.value) } : { defaultValue: value })} placeholder={placeholder} className="h-8 border-0 bg-transparent px-2 shadow-none focus-visible:ring-1" />
}

export default function WeeklyManagementPage() {
  const { orders, employees, financialEntries } = useAppData()
  const [selectedDate, setSelectedDate] = React.useState(() => new Date().toISOString().slice(0, 10))
  const [saved, setSaved] = React.useState(false)
  const [checklist, setChecklist] = React.useState<Record<string, string[]>>({})
  const [notes, setNotes] = React.useState('')
  const range: WeekRange = getWeekRange(selectedDate)
  const results = buildWeeklyBarberResults(orders, employees, range)
  const paidOrders = orders.filter((order) => order.status === 'paga' && order.createdAt.slice(0, 10) >= range.start && order.createdAt.slice(0, 10) <= range.end)
  const revenue = paidOrders.reduce((sum, order) => sum + order.total, 0) + financialEntries.filter((entry) => entry.type === 'entrada' && !entry.orderId && entry.date >= range.start && entry.date <= range.end).reduce((sum, entry) => sum + entry.amount, 0)
  const previousRange = getWeekRange(new Date(new Date(`${selectedDate}T12:00:00`).getTime() - 7 * 86400000).toISOString().slice(0, 10))
  const previousRevenue = orders.filter((order) => order.status === 'paga' && order.createdAt.slice(0, 10) >= previousRange.start && order.createdAt.slice(0, 10) <= previousRange.end).reduce((sum, order) => sum + order.total, 0)
  const variation = previousRevenue ? ((revenue - previousRevenue) / previousRevenue) * 100 : 0

  function moveWeek(days: number) {
    const next = new Date(`${selectedDate}T12:00:00`)
    next.setDate(next.getDate() + days)
    setSelectedDate(next.toISOString().slice(0, 10))
    setSaved(false)
  }

  function toggleChecklist(barber: string, item: string) {
    setChecklist((current) => {
      const values = current[barber] ?? []
      return { ...current, [barber]: values.includes(item) ? values.filter((value) => value !== item) : [...values, item] }
    })
  }

  return (
    <div className="space-y-5 pb-8">
      <PageHeader title="Gestão semanal" description="Acompanhe os números, a execução e os próximos passos da sua barbearia.">
        <div className="flex items-center gap-1 rounded-lg border bg-card p-1 shadow-sm">
          <Button variant="ghost" size="icon" className="size-8" onClick={() => moveWeek(-7)} aria-label="Semana anterior"><ChevronLeft className="size-4" /></Button>
          <input type="date" value={selectedDate} onChange={(event) => setSelectedDate(event.target.value)} className="h-8 w-32 bg-transparent text-center text-sm font-medium outline-none" />
          <Button variant="ghost" size="icon" className="size-8" onClick={() => moveWeek(7)} aria-label="Próxima semana"><ChevronRight className="size-4" /></Button>
        </div>
        <Button onClick={() => { setSaved(true); setTimeout(() => setSaved(false), 2500) }}><Save className="size-4" />{saved ? 'Salvo' : 'Salvar gestão'}</Button>
      </PageHeader>

      <div className="rounded-lg border border-gold/40 bg-gold/10 px-4 py-3 text-sm text-foreground"><span className="font-semibold">Semana de {dateLabel(range.start)} a {dateLabel(range.end)}</span><span className="ml-2 text-muted-foreground">· preencha a rotina e revise os resultados toda segunda-feira.</span></div>

      <Card className="overflow-hidden"><SectionTitle number="1" title="Comparativo financeiro da última semana" /><div className="overflow-x-auto"><table className="w-full min-w-[720px] text-sm"><thead className="bg-foreground text-background"><tr><th className="p-2 text-left font-semibold">Indicador</th><th className="p-2 text-right font-semibold">Semana atual</th><th className="p-2 text-right font-semibold">Semana anterior</th><th className="p-2 text-right font-semibold">Variação</th></tr></thead><tbody className="divide-y divide-border"><tr><td className="p-2 font-medium">Faturamento total</td><td className="p-2 text-right font-semibold">{formatCurrency(revenue)}</td><td className="p-2 text-right text-muted-foreground">{formatCurrency(previousRevenue)}</td><td className={`p-2 text-right font-medium ${variation >= 0 ? 'text-success-foreground' : 'text-destructive'}`}>{variation >= 0 ? '+' : ''}{variation.toFixed(1)}%</td></tr><tr><td className="p-2">Atendimentos pagos</td><td className="p-2 text-right">{paidOrders.length}</td><td className="p-2 text-right text-muted-foreground">—</td><td className="p-2 text-right text-muted-foreground">—</td></tr><tr><td className="p-2">Ticket médio</td><td className="p-2 text-right">{formatCurrency(paidOrders.length ? revenue / paidOrders.length : 0)}</td><td className="p-2 text-right text-muted-foreground">—</td><td className="p-2 text-right text-muted-foreground">—</td></tr></tbody></table></div></Card>

      <Card className="overflow-hidden"><SectionTitle number="2" title="Resultado dos barbeiros" /><div className="overflow-x-auto"><table className="w-full min-w-[700px] text-sm"><thead className="bg-foreground text-background"><tr><th className="p-2 text-left">Profissional</th><th className="p-2 text-right">Faturamento</th><th className="p-2 text-right">Atendimentos</th><th className="p-2 text-right">Ticket médio</th><th className="p-2 text-left">Observação / ação necessária</th></tr></thead><tbody className="divide-y divide-border">{results.map((barber) => <tr key={barber.name}><td className="p-2 font-medium">{barber.name}</td><td className="p-2 text-right">{formatCurrency(barber.revenue)}</td><td className="p-2 text-right">{barber.appointments}</td><td className="p-2 text-right">{formatCurrency(barber.averageTicket)}</td><td className="min-w-64 p-1"><EditableCell placeholder="Registrar observação..." /></td></tr>)}{results.length === 0 ? <tr><td colSpan={5} className="p-5 text-center text-muted-foreground">Cadastre barbeiros ativos para acompanhar este bloco.</td></tr> : null}</tbody></table></div></Card>

      <Card className="overflow-hidden"><SectionTitle number="3" title="Execuções diárias dos barbeiros" /><div className="overflow-x-auto"><table className="w-full min-w-[760px] text-sm"><thead className="bg-foreground text-background"><tr><th className="w-64 p-2 text-left">Procedimento diário</th>{results.map((barber) => <th key={barber.name} className="p-2 text-left">{barber.name}</th>)}<th className="p-2 text-left">Observação</th></tr></thead><tbody className="divide-y divide-border">{checklistItems.map((item) => <tr key={item}><td className="p-2 font-medium">{item}</td>{results.map((barber) => <td key={barber.name} className="p-2"><button type="button" onClick={() => toggleChecklist(barber.name, item)} className={`inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs font-semibold transition-colors ${(checklist[barber.name] ?? []).includes(item) ? 'bg-success/20 text-success-foreground' : 'bg-muted text-muted-foreground'}`}>{(checklist[barber.name] ?? []).includes(item) ? <Check className="size-3" /> : null}{(checklist[barber.name] ?? []).includes(item) ? 'OK' : 'Pendente'}</button></td>)}<td className="min-w-48 p-1"><EditableCell placeholder="Detalhar..." /></td></tr>)}</tbody></table></div></Card>

      <div className="grid gap-5 xl:grid-cols-2"><Card className="overflow-hidden"><SectionTitle number="4" title="Melhorias e estrutura" /><div className="overflow-x-auto"><table className="w-full min-w-[600px] text-sm"><thead className="bg-foreground text-background"><tr><th className="p-2 text-left">Melhoria necessária</th><th className="p-2">Prioridade</th><th className="p-2">Responsável</th><th className="p-2">Prazo</th></tr></thead><tbody>{Array.from({ length: 4 }, (_, index) => <tr key={index} className="border-b"><td><EditableCell placeholder="Ex.: trocar cadeira..." /></td><td className="p-1"><Select defaultValue="Média" className="h-8"><option>Alta</option><option>Média</option><option>Baixa</option></Select></td><td><EditableCell /></td><td><EditableCell type="date" /></td></tr>)}</tbody></table></div></Card>

      <Card className="overflow-hidden"><SectionTitle number="5" title="Qualidade dos cadastros" /><div className="overflow-x-auto"><table className="w-full min-w-[560px] text-sm"><thead className="bg-foreground text-background"><tr><th className="p-2 text-left">Item do cadastro</th><th className="p-2 text-right">Verificados</th><th className="p-2 text-right">Corretos</th><th className="p-2 text-right">Qualidade</th></tr></thead><tbody>{cadastroItems.map((item) => <tr key={item} className="border-b"><td className="p-2 font-medium">{item}</td><td><EditableCell value="0" /></td><td><EditableCell value="0" /></td><td className="p-2 text-right text-muted-foreground">0,0%</td></tr>)}</tbody></table></div></Card></div>

      <Card className="overflow-hidden"><SectionTitle number="6" title="Plano de ação" /><div className="grid gap-4 p-4 sm:grid-cols-2"><label className="text-sm font-medium">Ação principal<Textarea className="mt-1 min-h-24" placeholder="Qual é a prioridade da próxima semana?" /></label><label className="text-sm font-medium">Como medir<Textarea className="mt-1 min-h-24" placeholder="Ex.: aumentar ticket médio em 10%" /></label></div></Card>

      <Card className="overflow-hidden"><SectionTitle number="7" title="Resumo e observações gerais" /><div className="grid gap-4 p-4 md:grid-cols-2"><label className="text-sm font-medium">Principal problema<textarea value={notes} onChange={(event) => setNotes(event.target.value)} className="mt-1 min-h-24 w-full rounded-md border border-input bg-card p-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring/40" placeholder="O que precisa de atenção?" /></label><label className="text-sm font-medium">Meta da próxima semana<Textarea className="mt-1 min-h-24" placeholder="Defina uma meta objetiva" /></label></div></Card>
    </div>
  )
}
