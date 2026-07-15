'use client'

import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { formatCurrency } from '@/lib/format'

interface Point {
  label: string
  receita: number
  comandas: number
}

export function RevenueChart({ data }: { data: Point[] }) {
  return (
    <ResponsiveContainer width="100%" height={260}>
      <AreaChart data={data} margin={{ top: 8, right: 8, left: -12, bottom: 0 }}>
        <defs>
          <linearGradient id="revFill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="var(--color-primary)" stopOpacity={0.28} />
            <stop offset="100%" stopColor="var(--color-primary)" stopOpacity={0.02} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" vertical={false} />
        <XAxis
          dataKey="label"
          tickLine={false}
          axisLine={false}
          tick={{ fill: 'var(--color-muted-foreground)', fontSize: 12 }}
        />
        <YAxis
          tickLine={false}
          axisLine={false}
          width={60}
          tick={{ fill: 'var(--color-muted-foreground)', fontSize: 12 }}
          tickFormatter={(v) => `R$${v / 1000}k`}
        />
        <Tooltip
          cursor={{ stroke: 'var(--color-border)' }}
          contentStyle={{
            borderRadius: 10,
            border: '1px solid var(--color-border)',
            background: 'var(--color-popover)',
            color: 'var(--color-popover-foreground)',
            fontSize: 13,
          }}
          formatter={(value, name) =>
            name === 'receita'
              ? [formatCurrency(Number(value ?? 0)), 'Receita']
              : [Number(value ?? 0), 'Comandas']
          }
        />
        <Area
          type="monotone"
          dataKey="receita"
          stroke="var(--color-primary)"
          strokeWidth={2.5}
          fill="url(#revFill)"
        />
      </AreaChart>
    </ResponsiveContainer>
  )
}
