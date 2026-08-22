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
const PLAN_COLORS = { Solo: '#059669', Starter: '#64748b', Pro: '#1E3A32', Premium: '#C9A227' }

const axisTick = { fontSize: 11, fill: 'var(--color-muted-foreground)' }
const tooltipStyle = { borderRadius: 12, border: '1px solid var(--color-border)', fontSize: 13 }

function formatCurrency(value: number) {
  return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 })
}

function maxOf<T extends Record<string, unknown>>(data: T[], key: keyof T) {
  return data.reduce((max, row) => Math.max(max, Number(row[key]) || 0), 0)
}

function isEmpty<T extends Record<string, unknown>>(data: T[], key: keyof T) {
  return data.length === 0 || maxOf(data, key) === 0
}

/**
 * Escala inteira "fechada" no maior valor. Sem isso o recharts usa 5 ticks fixos e
 * um gráfico com máximo 1 acaba desenhado numa escala de 0 a 4, desperdiçando 3/4 da altura.
 */
function countAxis(max: number) {
  const top = max <= 1 ? 1 : max <= 2 ? 2 : max <= 4 ? 4 : Math.ceil(max / 5) * 5
  return {
    allowDecimals: false,
    domain: [0, top] as [number, number],
    tickCount: top <= 4 ? top + 1 : 6,
  }
}

type AdminChartsProps = {
  charts: NonNullable<Overview['charts']>
  loading?: boolean
}

export function AdminCharts({ charts, loading }: AdminChartsProps) {
  if (loading) {
    return (
      <div className="grid gap-3 sm:gap-4 xl:grid-cols-2">
        {Array.from({ length: 6 }).map((_, i) => (
          <Card key={i} className="pf-skeleton h-56 rounded-xl sm:h-72" />
        ))}
      </div>
    )
  }

  const newShopsAxis = countAxis(maxOf(charts.newBarbershops, 'total'))
  const messagesAxis = countAxis(maxOf(charts.messagesSent, 'total'))
  const plansAxis = countAxis(maxOf(charts.planDistribution, 'value'))

  return (
    <div className="grid gap-3 sm:gap-4 xl:grid-cols-2">
      <ChartCard title="Receita mensal" description="Pagamentos confirmados e MRR estimado">
        {isEmpty(charts.monthlyRevenue, 'receita') ? (
          <ChartEmpty text="Nenhuma receita registrada nos últimos 6 meses." />
        ) : (
          <ChartFrame>
            <AreaChart data={charts.monthlyRevenue} margin={{ top: 4, right: 8, bottom: 0, left: 0 }}>
              <defs>
                <linearGradient id="adminRev" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#C9A227" stopOpacity={0.35} />
                  <stop offset="100%" stopColor="#C9A227" stopOpacity={0.02} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--color-border)" />
              <XAxis dataKey="label" tickLine={false} axisLine={false} tick={axisTick} minTickGap={8} />
              <YAxis tickLine={false} axisLine={false} width={54} tickFormatter={(v) => formatCurrency(Number(v))} tick={axisTick} />
              <Tooltip formatter={(v) => [formatCurrency(Number(v)), 'Receita']} contentStyle={tooltipStyle} />
              <Area type="monotone" dataKey="receita" stroke="#C9A227" strokeWidth={2} fill="url(#adminRev)" />
            </AreaChart>
          </ChartFrame>
        )}
      </ChartCard>

      <ChartCard title="Evolução do MRR" description="Receita recorrente contratada">
        {isEmpty(charts.mrrEvolution, 'mrr') ? (
          <ChartEmpty text="Nenhuma assinatura ativa gerando receita recorrente." />
        ) : (
          <ChartFrame>
            <AreaChart data={charts.mrrEvolution} margin={{ top: 4, right: 8, bottom: 0, left: 0 }}>
              <defs>
                <linearGradient id="adminMrr" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#1E3A32" stopOpacity={0.3} />
                  <stop offset="100%" stopColor="#1E3A32" stopOpacity={0.02} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--color-border)" />
              <XAxis dataKey="label" tickLine={false} axisLine={false} tick={axisTick} minTickGap={8} />
              <YAxis tickLine={false} axisLine={false} width={54} tickFormatter={(v) => formatCurrency(Number(v))} tick={axisTick} />
              <Tooltip formatter={(v) => [formatCurrency(Number(v)), 'MRR']} contentStyle={tooltipStyle} />
              <Area type="monotone" dataKey="mrr" stroke="#1E3A32" strokeWidth={2} fill="url(#adminMrr)" />
            </AreaChart>
          </ChartFrame>
        )}
      </ChartCard>

      <ChartCard title="Novas barbearias" description="Cadastros por período">
        {isEmpty(charts.newBarbershops, 'total') ? (
          <ChartEmpty text="Nenhum cadastro novo nos últimos 6 meses." />
        ) : (
          <ChartFrame>
            <BarChart data={charts.newBarbershops} margin={{ top: 4, right: 8, bottom: 0, left: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--color-border)" />
              <XAxis dataKey="label" tickLine={false} axisLine={false} tick={axisTick} minTickGap={8} />
              <YAxis {...newShopsAxis} tickLine={false} axisLine={false} width={24} tick={axisTick} />
              <Tooltip contentStyle={tooltipStyle} />
              <Bar dataKey="total" fill="#1E3A32" radius={[6, 6, 0, 0]} maxBarSize={40} />
            </BarChart>
          </ChartFrame>
        )}
      </ChartCard>

      <ChartCard title="Mensagens enviadas" description="Volume de mensagens registradas por mês">
        {isEmpty(charts.messagesSent, 'total') ? (
          <ChartEmpty text="Nenhuma mensagem enviada pela plataforma ainda." />
        ) : (
          <ChartFrame>
            <LineChart data={charts.messagesSent} margin={{ top: 4, right: 8, bottom: 0, left: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--color-border)" />
              <XAxis dataKey="label" tickLine={false} axisLine={false} tick={axisTick} minTickGap={8} />
              <YAxis {...messagesAxis} tickLine={false} axisLine={false} width={24} tick={axisTick} />
              <Tooltip contentStyle={tooltipStyle} />
              <Line type="monotone" dataKey="total" stroke="#C9A227" strokeWidth={2.5} dot={{ r: 3, fill: '#C9A227' }} />
            </LineChart>
          </ChartFrame>
        )}
      </ChartCard>

      <ChartCard
        title="Conversão teste → assinatura"
        description={`${charts.conversion.rate}% · ${charts.conversion.converted} convertidas de ${charts.conversion.trialing + charts.conversion.converted} elegíveis`}
      >
        <div className="flex h-[150px] items-center justify-center gap-8 sm:h-[220px]">
          <div className="text-center">
            <p className="text-3xl font-medium tabular-nums text-primary sm:text-4xl">{charts.conversion.rate}%</p>
            <p className="mt-1 text-[11px] uppercase tracking-wide text-muted-foreground">Taxa de conversão</p>
          </div>
          <div className="space-y-1.5 text-[13px]">
            <p><span className="font-medium tabular-nums">{charts.conversion.trialing}</span> em teste</p>
            <p><span className="font-medium tabular-nums text-primary">{charts.conversion.converted}</span> assinantes</p>
          </div>
        </div>
      </ChartCard>

      <ChartCard title="Distribuição por plano" description="Comparativo Starter, Pro e Premium">
        {isEmpty(charts.planDistribution, 'value') ? (
          <ChartEmpty text="Nenhuma barbearia cadastrada." />
        ) : (
          <ChartFrame>
            <BarChart data={charts.planDistribution} margin={{ top: 4, right: 8, bottom: 0, left: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--color-border)" />
              <XAxis dataKey="name" tickLine={false} axisLine={false} tick={axisTick} />
              <YAxis {...plansAxis} tickLine={false} axisLine={false} width={24} tick={axisTick} />
              <Tooltip contentStyle={tooltipStyle} />
              <Bar dataKey="value" radius={[6, 6, 0, 0]} maxBarSize={56}>
                {charts.planDistribution.map((entry) => (
                  <Cell key={entry.name} fill={PLAN_COLORS[entry.name as keyof typeof PLAN_COLORS] ?? CHART_COLORS[0]} />
                ))}
              </Bar>
            </BarChart>
          </ChartFrame>
        )}
      </ChartCard>

      <ChartCard title="Status das contas" description="Teste, ativa, atrasada e cancelada">
        {isEmpty(charts.statusDistribution, 'value') ? (
          <ChartEmpty text="Nenhuma conta para distribuir por status." />
        ) : (
          <ChartFrame>
            <PieChart>
              <Pie
                data={charts.statusDistribution}
                dataKey="value"
                nameKey="name"
                cx="50%"
                cy="45%"
                innerRadius="52%"
                outerRadius="80%"
                paddingAngle={3}
              >
                {charts.statusDistribution.map((entry, index) => (
                  <Cell key={entry.key} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                ))}
              </Pie>
              <Tooltip contentStyle={tooltipStyle} />
              <Legend wrapperStyle={{ fontSize: 12 }} />
            </PieChart>
          </ChartFrame>
        )}
      </ChartCard>
    </div>
  )
}

/** Área do gráfico: altura menor no mobile, para caber mais de um card por tela. */
function ChartFrame({ children }: { children: React.ReactElement }) {
  return (
    <div className="h-[180px] sm:h-[240px]">
      <ResponsiveContainer width="100%" height="100%">
        {children}
      </ResponsiveContainer>
    </div>
  )
}

function ChartEmpty({ text }: { text: string }) {
  return (
    <div className="flex h-[104px] items-center justify-center rounded-lg border border-dashed border-border/60 px-4 text-center text-[13px] text-muted-foreground sm:h-[140px]">
      {text}
    </div>
  )
}

function ChartCard({ title, description, children }: { title: string; description: string; children: React.ReactNode }) {
  return (
    <Card className="pf-card-lift rounded-xl border-border/60 p-4 sm:p-5">
      <div className="mb-3 sm:mb-4">
        <h3 className="text-sm font-medium text-foreground">{title}</h3>
        <p className="text-[13px] text-muted-foreground">{description}</p>
      </div>
      {children}
    </Card>
  )
}
