'use client'

import type { SpreadsheetSheet } from './spreadsheet-export'
import type { Overview, TenantRow } from '@/app/plataforma/types'

export function buildPlatformReportSheets(overview: Overview, tenants: TenantRow[] = []): SpreadsheetSheet[] {
  const kpis: SpreadsheetSheet = {
    name: 'KPIs',
    title: 'Barber Hub — Resumo executivo',
    columns: [
      { key: 'label', label: 'Indicador', width: 220 },
      { key: 'value', label: 'Valor', width: 140, kind: 'text' },
    ],
    rows: [
      { label: 'Total de barbearias', value: overview.totals.barbershops },
      { label: 'Receita mensal (MRR)', value: overview.revenue.mrr, },
      { label: 'Taxa de inadimplência (%)', value: overview.revenue.delinquencyRate },
      { label: 'Mensagens enviadas', value: overview.totals.messagesSent },
      { label: 'Ticket médio', value: overview.revenue.averageTicket },
      { label: 'Conversão teste → assinatura (%)', value: overview.revenue.conversionRate },
      { label: 'Em teste', value: overview.billing.trialing },
      { label: 'Ativas', value: overview.billing.active },
      { label: 'Em atraso', value: overview.billing.pastDue },
      { label: 'Canceladas', value: overview.billing.canceled },
    ],
  }

  const monthlyRevenue: SpreadsheetSheet = {
    name: 'Receita mensal',
    title: 'Receita mensal (últimos 6 meses)',
    columns: [
      { key: 'label', label: 'Mês', width: 100 },
      { key: 'receita', label: 'Receita', width: 140, kind: 'currency' },
    ],
    rows: (overview.charts?.monthlyRevenue ?? []).map((row) => ({ label: row.label, receita: row.receita })),
  }

  const plans: SpreadsheetSheet = {
    name: 'Planos',
    title: 'Distribuição por plano',
    columns: [
      { key: 'name', label: 'Plano', width: 140 },
      { key: 'value', label: 'Contas', width: 100, kind: 'number' },
    ],
    rows: (overview.charts?.planDistribution ?? []).map((row) => ({ name: row.name, value: row.value })),
  }

  const status: SpreadsheetSheet = {
    name: 'Status',
    title: 'Distribuição por status',
    columns: [
      { key: 'name', label: 'Status', width: 140 },
      { key: 'value', label: 'Contas', width: 100, kind: 'number' },
    ],
    rows: (overview.charts?.statusDistribution ?? []).map((row) => ({ name: row.name, value: row.value })),
  }

  const barbershops: SpreadsheetSheet = {
    name: 'Barbearias',
    title: 'Barbearias listadas',
    columns: [
      { key: 'name', label: 'Barbearia', width: 200 },
      { key: 'plan', label: 'Plano', width: 100 },
      { key: 'billing_status', label: 'Status', width: 120 },
      { key: 'owner', label: 'Responsável', width: 200 },
      { key: 'created_at', label: 'Cadastro', width: 110, kind: 'date' },
    ],
    rows: tenants.map((t) => ({
      name: t.name,
      plan: t.plan,
      billing_status: t.billing_status,
      owner: t.owner?.name ?? '',
      created_at: t.created_at,
    })),
  }

  return [kpis, monthlyRevenue, plans, status, barbershops]
}
