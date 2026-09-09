'use client'

import * as React from 'react'
import { Star } from 'lucide-react'
import { PageHeader } from '@/components/page-header'
import { Card } from '@/components/ui/card'
import { Select } from '@/components/ui/select'
import { useAppData } from '@/components/data/app-data-provider'

function Stars({ value }: { value: number }) {
  return <span className="inline-flex gap-0.5" aria-label={`${value} de 5 estrelas`}>{[1, 2, 3, 4, 5].map((item) => <Star key={item} className={`size-4 ${item <= value ? 'fill-amber-400 text-amber-500' : 'text-muted-foreground'}`} />)}</span>
}

export default function ReviewsPage() {
  const { customerReviews } = useAppData()
  const [employee, setEmployee] = React.useState('todos')
  const [rating, setRating] = React.useState('todas')
  const [period, setPeriod] = React.useState('90')
  const employees = Array.from(new Set(customerReviews.map((review) => review.employeeName))).sort()
  const cutoff = new Date(); cutoff.setDate(cutoff.getDate() - Number(period))
  const filtered = customerReviews.filter((review) => {
    const matchesEmployee = employee === 'todos' || review.employeeName === employee
    const matchesRating = rating === 'todas' || review.rating === Number(rating)
    const matchesPeriod = new Date(review.createdAt) >= cutoff
    return matchesEmployee && matchesRating && matchesPeriod
  })
  const average = filtered.length ? filtered.reduce((total, review) => total + review.rating, 0) / filtered.length : 0
  const recommended = filtered.length ? Math.round((filtered.filter((review) => review.wouldRecommend).length / filtered.length) * 100) : 0

  return <div className="space-y-5"><PageHeader title="Avaliações" description="Veja o que os clientes estão dizendo sobre os atendimentos da sua barbearia." /><div className="grid gap-3 sm:grid-cols-3"><Card className="p-4"><p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Média geral</p><p className="mt-2 text-3xl font-bold">{average.toFixed(1)}</p><Stars value={Math.round(average)} /></Card><Card className="p-4"><p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Avaliações recebidas</p><p className="mt-2 text-3xl font-bold">{filtered.length}</p><p className="text-xs text-muted-foreground">no período selecionado</p></Card><Card className="p-4"><p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Recomendariam</p><p className="mt-2 text-3xl font-bold">{recommended}%</p><p className="text-xs text-muted-foreground">dos clientes avaliadores</p></Card></div><Card className="p-4"><div className="grid gap-3 md:grid-cols-3"><label className="text-sm font-medium">Período<Select value={period} onChange={(event) => setPeriod(event.target.value)} className="mt-1"><option value="30">Últimos 30 dias</option><option value="90">Últimos 90 dias</option><option value="365">Último ano</option></Select></label><label className="text-sm font-medium">Profissional<Select value={employee} onChange={(event) => setEmployee(event.target.value)} className="mt-1"><option value="todos">Todos</option>{employees.map((name) => <option key={name}>{name}</option>)}</Select></label><label className="text-sm font-medium">Nota<Select value={rating} onChange={(event) => setRating(event.target.value)} className="mt-1"><option value="todas">Todas as notas</option>{[5, 4, 3, 2, 1].map((value) => <option key={value} value={value}>{value} estrelas</option>)}</Select></label></div></Card><div className="space-y-3">{filtered.map((review) => <Card key={review.id} className="p-4"><div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between"><div><div className="flex items-center gap-3"><p className="font-semibold">{review.clientName}</p><Stars value={review.rating} /></div><p className="mt-1 text-sm text-muted-foreground">{review.serviceName} · {review.employeeName}</p></div><time className="text-xs text-muted-foreground">{new Intl.DateTimeFormat('pt-BR', { dateStyle: 'medium' }).format(new Date(review.createdAt))}</time></div><div className="mt-3 grid gap-2 text-sm sm:grid-cols-3"><p><span className="text-muted-foreground">Serviço:</span> {review.serviceRating}/5</p><p><span className="text-muted-foreground">Ambiente:</span> {review.environmentRating}/5</p><p><span className="text-muted-foreground">Recomendaria:</span> {review.wouldRecommend ? 'Sim' : 'Não'}</p></div>{review.comment ? <p className="mt-3 rounded-lg bg-muted/60 p-3 text-sm">“{review.comment}”</p> : null}</Card>)}{filtered.length === 0 ? <Card className="p-8 text-center text-sm text-muted-foreground">Nenhuma avaliação encontrada com esses filtros.</Card> : null}</div></div>
}
