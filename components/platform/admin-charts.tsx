'use client'

import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { Card } from '@/components/ui/card'
import type { Overview } from '@/app/plataforma/types'

const CHART_COLORS = ['#1E3A32', '#C9A227', '#64748b', '#dc2626', '#059669']
const PLAN_COLORS = { Starter: '#64748b', Pro: '#1E3A32', Premium: '#C9A227' }

function formatCurrency(value: number) {
  return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 })
}

type AdminChartsProps = {
  charts: NonNullable<Overview['charts']>
  loading?: boolean
}

export function AdminCharts({ charts, loading }: AdminChartsProps) {
  if (loading) {
    return (
      <div className="grid gap-4 lg:grid-cols-2">
        {Array.from({ length: 6 }).map((_, i) => (
          <Card key={i} className="pf-skeleton h-72 rounded-2xl" />
        ))}
      </div>
    )
  }

  return (
    <div className="grid gap-4 xl:grid-cols-2">
      <ChartCard title="Receita mensal" description="Pagamentos confirmados e MRR estimado">
        <ResponsiveContainer width="100%" height={240}>
          <AreaChart data={charts.monthlyRevenue}>
            <defs>
              <linearGradient id="adminRev" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#C9A227" stopOpacity={0.35} />
                <stop offset="100%" stopColor="#C9A227" stopOpacity={0.02} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--color-border)" />
            <XAxis dataKey="label" tickLine={false} axisLine={false} tick={{ fontSize: 12, fill: 'var(--color-muted-foreground)' }} />
            <YAxis tickLine={false} axisLine={false} width={56} tickFormatter={(v) => formatCurrency(Number(v))} tick={{ fontSize: 11, fill: 'var(--color-muted-foreground)' }} />
            <Tooltip formatter={(v) => [formatCurrency(Number(v)), 'Receita']} contentStyle={{ borderRadius: 12, border: '1px solid var(--color-border)' }} />
            <Area type="monotone" dataKey="receita" stroke="#C9A227" strokeWidth={2} fill="url(#adminRev)" />
          </AreaChart>
        </ResponsiveContainer>
      </ChartCard>

      <ChartCard title="Evolução do MRR" description="Receita recorrente contratada">
        <ResponsiveContainer width="100%" height={240}>
          <AreaChart data={charts.mrrEvolution}>
            <defs>
              <linearGradient id="adminMrr" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#1E3A32" stopOpacity={0.3} />
                <stop offset="100%" stopColor="#1E3A32" stopOpacity={0.02} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--color-border)" />
            <XAxis dataKey="label" tickLine={false} axisLine={false} tick={{ fontSize: 12, fill: 'var(--color-muted-foreground)' }} />
            <YAxis tickLine={false} axisLine={false} width={56} tickFormatter={(v) => formatCurrency(Number(v))} tick={{ fontSize: 11, fill: 'var(--color-muted-foreground)' }} />
            <Tooltip formatter={(v) => [formatCurrency(Number(v)), 'MRR']} contentStyle={{ borderRadius: 12, border: '1px solid var(--color-border)' }} />
            <Area type="monotone" dataKey="mrr" stroke="#1E3A32" strokeWidth={2} fill="url(#adminMrr)" />
          </AreaChart>
        </ResponsiveContainer>
      </ChartCard>

      <ChartCard title="Novas barbearias" description="Cadastros por período">
        <ResponsiveContainer width="100%" height={240}>
          <BarChart data={charts.newBarbershops}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--color-border)" />
            <XAxis dataKey="label" tickLine={false} axisLine={false} tick={{ fontSize: 12, fill: 'var(--color-muted-foreground)' }} />
            <YAxis allowDecimals={false} tickLine={false} axisLine={false} tick={{ fontSize: 11, fill: 'var(--color-muted-foreground)' }} />
            <Tooltip contentStyle={{ borderRadius: 12, border: '1px solid var(--color-border)' }} />
            <Bar dataKey="total" fill="#1E3A32" radius={[6, 6, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </ChartCard>

      <ChartCard title="Mensagens enviadas" description="Volume de mensagens registradas por mês">
        <ResponsiveContainer width="100%" height={240}>
          <LineChart data={charts.messagesSent}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--color-border)" />
            <XAxis dataKey="label" tickLine={false} axisLine={false} tick={{ fontSize: 12, fill: 'var(--color-muted-foreground)' }} />
            <YAxis allowDecimals={false} tickLine={false} axisLine={false} tick={{ fontSize: 11, fill: 'var(--color-muted-foreground)' }} />
            <Tooltip contentStyle={{ borderRadius: 12, border: '1px solid var(--color-border)' }} />
            <Line type="monotone" dataKey="total" stroke="#C9A227" strokeWidth={2.5} dot={{ r: 3, fill: '#C9A227' }} />
          </LineChart>
        </ResponsiveContainer>
      </ChartCard>

      <ChartCard
        title="Conversão teste → assinatura"
        description={`${charts.conversion.rate}% · ${charts.conversion.converted} convertidas de ${charts.conversion.trialing + charts.conversion.converted} elegíveis`}
      >
        <div className="flex h-[240px] items-center justify-center gap-8">
          <div className="text-center">
            <p className="text-4xl font-bold text-primary">{charts.conversion.rate}%</p>
            <p className="mt-1 text-sm text-muted-foreground">Taxa de conversão</p>
          </div>
          <div className="space-y-2 text-sm">
            <p><span className="font-medium">{charts.conversion.trialing}</span> em teste</p>
            <p><span className="font-medium text-emerald-600">{charts.conversion.converted}</span> assinantes</p>
          </div>
        </div>
      </ChartCard>

      <ChartCard title="Distribuição por plano" description="Comparativo Starter, Pro e Premium">
        <ResponsiveContainer width="100%" height={240}>
          <BarChart data={charts.planDistribution}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--color-border)" />
            <XAxis dataKey="name" tickLine={false} axisLine={false} tick={{ fontSize: 12, fill: 'var(--color-muted-foreground)' }} />
            <YAxis allowDecimals={false} tickLine={false} axisLine={false} tick={{ fontSize: 11, fill: 'var(--color-muted-foreground)' }} />
            <Tooltip contentStyle={{ borderRadius: 12, border: '1px solid var(--color-border)' }} />
            <Bar dataKey="value" radius={[6, 6, 0, 0]}>
              {charts.planDistribution.map((entry) => (
                <Cell key={entry.name} fill={PLAN_COLORS[entry.name as keyof typeof PLAN_COLORS] ?? CHART_COLORS[0]} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </ChartCard>

      <ChartCard title="Status das contas" description="Teste, ativa, atrasada e cancelada">
        <ResponsiveContainer width="100%" height={240}>
          <PieChart>
            <Pie data={charts.statusDistribution} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={52} outerRadius={80} paddingAngle={3}>
              {charts.statusDistribution.map((entry, index) => (
                <Cell key={entry.key} fill={CHART_COLORS[index % CHART_COLORS.length]} />
              ))}
            </Pie>
            <Tooltip contentStyle={{ borderRadius: 12, border: '1px solid var(--color-border)' }} />
            <Legend />
          </PieChart>
        </ResponsiveContainer>
      </ChartCard>
    </div>
  )
}

function ChartCard({ title, description, children }: { title: string; description: string; children: React.ReactNode }) {
  return (
    <Card className="pf-card-lift rounded-2xl border-border/70 p-5">
      <div className="mb-4">
        <h3 className="font-semibold text-foreground">{title}</h3>
        <p className="text-sm text-muted-foreground">{description}</p>
      </div>
      {children}
    </Card>
  )
}
