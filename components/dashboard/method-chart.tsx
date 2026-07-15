'use client'

import { Bar, BarChart, Cell, ResponsiveContainer, Tooltip, XAxis } from 'recharts'
import { formatCurrency } from '@/lib/format'

interface Point {
  method: string
  value: number
}

const COLORS = [
  'var(--color-primary)',
  'var(--color-gold)',
  'var(--color-chart-3)',
  'var(--color-chart-4)',
  'var(--color-chart-5)',
]

export function MethodChart({ data }: { data: Point[] }) {
  return (
    <ResponsiveContainer width="100%" height={220}>
      <BarChart data={data} margin={{ top: 8, right: 8, left: 8, bottom: 0 }}>
        <XAxis
          dataKey="method"
          tickLine={false}
          axisLine={false}
          tick={{ fill: 'var(--color-muted-foreground)', fontSize: 12 }}
        />
        <Tooltip
          cursor={{ fill: 'var(--color-muted)' }}
          contentStyle={{
            borderRadius: 10,
            border: '1px solid var(--color-border)',
            background: 'var(--color-popover)',
            color: 'var(--color-popover-foreground)',
            fontSize: 13,
          }}
          formatter={(value) => [formatCurrency(Number(value ?? 0)), 'Receita']}
        />
        <Bar dataKey="value" radius={[6, 6, 0, 0]} maxBarSize={48}>
          {data.map((_, i) => (
            <Cell key={i} fill={COLORS[i % COLORS.length]} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  )
}
