import {
  AlertTriangle,
  ArrowUpRight,
  BarChart3,
  CalendarDays,
  LayoutDashboard,
  Package,
  Receipt,
  Scissors,
  Search,
  Settings,
  Users,
  Wallet,
} from 'lucide-react'
import {
  DEMO_AGENDA,
  DEMO_EXPIRING_PLANS,
  DEMO_LOW_STOCK,
  DEMO_METRICS,
  DEMO_OPEN_TABS,
  DEMO_REVENUE_BARS,
} from '@/lib/landing-content'
import { cn } from '@/lib/utils'

/**
 * Interface real do MeuBarberHub renderizada em HTML dentro da tela do
 * notebook. É desenhada numa largura-base fixa (`BASE_WIDTH`) e reduzida por
 * `scale` pelo componente que a hospeda, o que mantém a legibilidade e evita
 * qualquer layout shift quando a viewport muda.
 */
export const DASHBOARD_BASE_WIDTH = 1180
export const DASHBOARD_BASE_HEIGHT = 738

const NAV = [
  { label: 'Painel', icon: LayoutDashboard, active: true },
  { label: 'Agenda', icon: CalendarDays, active: false },
  { label: 'Comandas', icon: Receipt, active: false },
  { label: 'Clientes', icon: Users, active: false },
  { label: 'Estoque', icon: Package, active: false },
  { label: 'Financeiro', icon: Wallet, active: false },
  { label: 'Relatórios', icon: BarChart3, active: false },
]

const STATUS_STYLES: Record<string, string> = {
  Confirmado: 'bg-lp-green-500/12 text-lp-green-500',
  Aguardando: 'bg-lp-amber-500/16 text-lp-gold-600',
  'Em atendimento': 'bg-lp-ink-700/10 text-lp-ink-700',
}

export function DashboardPreview({ animate = true }: { animate?: boolean }) {
  return (
    <div
      aria-hidden="true"
      className="flex select-none bg-lp-cream-2 font-sans text-lp-graphite"
      style={{ width: DASHBOARD_BASE_WIDTH, height: DASHBOARD_BASE_HEIGHT }}
    >
      {/* Sidebar */}
      <aside className="flex w-[212px] shrink-0 flex-col bg-lp-ink-900 px-4 py-5 text-lp-cream">
        <div className="mb-7 flex items-center gap-2.5 px-1">
          <span className="flex size-8 items-center justify-center rounded-lg bg-lp-gold-500 text-lp-gold-ink">
            <Scissors className="size-4" />
          </span>
          <div className="leading-tight">
            <p className="text-[13px] font-bold">MeuBarberHub</p>
            <p className="text-[10px] text-lp-cream/50">Barbearia Central</p>
          </div>
        </div>

        <nav className="flex flex-col gap-0.5">
          {NAV.map((item) => (
            <span
              key={item.label}
              className={cn(
                'flex items-center gap-2.5 rounded-lg px-3 py-2 text-[12.5px] font-medium',
                item.active
                  ? 'bg-lp-cream/12 text-lp-cream'
                  : 'text-lp-cream/55',
              )}
            >
              <item.icon className="size-[15px]" />
              {item.label}
            </span>
          ))}
        </nav>

        <div className="mt-auto rounded-xl bg-lp-cream/[0.07] p-3">
          <p className="text-[11px] font-semibold text-lp-gold-400">Plano Pro</p>
          <p className="mt-1 text-[10px] leading-4 text-lp-cream/50">
            8 usuários • 1 unidade
          </p>
        </div>
      </aside>

      {/* Conteúdo */}
      <div className="flex min-w-0 flex-1 flex-col">
        {/* Topbar */}
        <header className="flex items-center justify-between border-b border-lp-cream-3 bg-lp-cream px-6 py-3.5">
          <div>
            <p className="text-[15px] font-bold text-lp-ink-900">Painel da barbearia</p>
            <p className="text-[11px] text-lp-slate">Agosto de 2026 • atualizado agora</p>
          </div>
          <div className="flex items-center gap-2.5">
            <span className="flex items-center gap-2 rounded-lg border border-lp-cream-3 bg-white px-2.5 py-1.5 text-[11px] text-lp-slate">
              <Search className="size-3.5" />
              Buscar cliente
            </span>
            <span className="flex overflow-hidden rounded-lg border border-lp-cream-3 text-[11px]">
              <span className="bg-white px-2.5 py-1.5 text-lp-slate">Hoje</span>
              <span className="bg-white px-2.5 py-1.5 text-lp-slate">Semana</span>
              <span className="bg-lp-ink-900 px-2.5 py-1.5 font-semibold text-lp-cream">Mês</span>
            </span>
            <span className="flex size-8 items-center justify-center rounded-full bg-lp-ink-900 text-[11px] font-bold text-lp-cream">
              DM
            </span>
            <Settings className="size-4 text-lp-slate" />
          </div>
        </header>

        <div className="flex-1 space-y-3.5 overflow-hidden p-5">
          {/* Métricas */}
          <div className="grid grid-cols-4 gap-3.5">
            {DEMO_METRICS.map((metric) => (
              <div
                key={metric.label}
                className="rounded-xl border border-lp-cream-3 bg-white p-3.5 shadow-[0_1px_2px_rgba(16,40,32,0.04)]"
              >
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-medium text-lp-slate">{metric.label}</span>
                  <metric.icon className="size-3.5 text-lp-ink-600" />
                </div>
                <p className="mt-2.5 text-[22px] font-bold leading-none tracking-tight text-lp-ink-900">
                  {metric.value}
                </p>
                <p className="mt-2 flex items-center gap-1 text-[10.5px] font-semibold text-lp-green-500">
                  <ArrowUpRight className="size-3" />
                  {metric.delta}
                  <span className="font-normal text-lp-slate">vs. mês anterior</span>
                </p>
              </div>
            ))}
          </div>

          {/* Gráfico + agenda */}
          <div className="grid grid-cols-[1.45fr_1fr] gap-3.5">
            <div className="rounded-xl border border-lp-cream-3 bg-white p-4">
              <div className="mb-3 flex items-start justify-between">
                <div>
                  <p className="text-[13px] font-semibold text-lp-ink-900">Faturamento do mês</p>
                  <p className="text-[10.5px] text-lp-slate">Receita por dia • agosto</p>
                </div>
                <p className="text-[13px] font-bold text-lp-ink-900">R$ 18.640</p>
              </div>
              <div className="flex h-[132px] items-end gap-[7px]">
                {DEMO_REVENUE_BARS.map((bar, index) => (
                  <span key={bar.day} className="flex flex-1 flex-col items-center gap-1.5">
                    <span
                      className={cn(
                        'w-full rounded-t-[3px] bg-lp-ink-700',
                        animate && 'lp-bar',
                        index === 8 && 'bg-lp-gold-500',
                      )}
                      style={{
                        height: `${bar.height}%`,
                        animationDelay: animate ? `${950 + index * 45}ms` : undefined,
                      }}
                    />
                    <span className="text-[8.5px] text-lp-slate">{bar.day}</span>
                  </span>
                ))}
              </div>
            </div>

            <div className="rounded-xl border border-lp-cream-3 bg-white p-4">
              <div className="mb-3 flex items-center justify-between">
                <p className="text-[13px] font-semibold text-lp-ink-900">Agenda de hoje</p>
                <span className="rounded-md bg-lp-cream-2 px-2 py-0.5 text-[10px] text-lp-slate">
                  12 horários
                </span>
              </div>
              <div className="space-y-2">
                {DEMO_AGENDA.map((item) => (
                  <div key={item.time} className="flex items-center gap-2.5">
                    <span className="w-[38px] shrink-0 text-[11px] font-semibold text-lp-ink-900">
                      {item.time}
                    </span>
                    <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-lp-ink-900/8 text-[9.5px] font-bold text-lp-ink-800">
                      {item.initials}
                    </span>
                    <span className="min-w-0 flex-1 leading-tight">
                      <span className="block truncate text-[11.5px] font-medium text-lp-ink-900">
                        {item.client}
                      </span>
                      <span className="block truncate text-[10px] text-lp-slate">{item.service}</span>
                    </span>
                    <span
                      className={cn(
                        'shrink-0 rounded-md px-1.5 py-0.5 text-[9px] font-semibold',
                        STATUS_STYLES[item.status],
                      )}
                    >
                      {item.status}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Painéis de atenção */}
          <div className="grid grid-cols-3 gap-3.5">
            <div className="rounded-xl border border-lp-cream-3 bg-white p-4">
              <p className="mb-2.5 text-[12px] font-semibold text-lp-ink-900">
                Planos próximos do vencimento
              </p>
              <div className="space-y-2">
                {DEMO_EXPIRING_PLANS.map((plan) => (
                  <div key={plan.name} className="flex items-center justify-between gap-2">
                    <span className="min-w-0 leading-tight">
                      <span className="block truncate text-[11px] font-medium text-lp-ink-900">
                        {plan.name}
                      </span>
                      <span className="block truncate text-[9.5px] text-lp-slate">{plan.plan}</span>
                    </span>
                    <span className="shrink-0 text-[9.5px] font-semibold text-lp-gold-600">
                      {plan.due}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-xl border border-lp-cream-3 bg-white p-4">
              <p className="mb-2.5 flex items-center gap-1.5 text-[12px] font-semibold text-lp-ink-900">
                <AlertTriangle className="size-3.5 text-lp-amber-500" />
                Produtos com estoque baixo
              </p>
              <div className="space-y-2">
                {DEMO_LOW_STOCK.map((product) => (
                  <div key={product.name} className="flex items-center justify-between gap-2">
                    <span className="truncate text-[11px] text-lp-ink-900">{product.name}</span>
                    <span className="shrink-0 rounded-md bg-lp-amber-500/14 px-1.5 py-0.5 text-[9.5px] font-semibold text-lp-gold-600">
                      {product.left}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-xl border border-lp-cream-3 bg-white p-4">
              <p className="mb-2.5 text-[12px] font-semibold text-lp-ink-900">Comandas pendentes</p>
              <div className="space-y-2">
                {DEMO_OPEN_TABS.map((tab) => (
                  <div key={tab.client} className="flex items-center justify-between gap-2">
                    <span className="min-w-0 leading-tight">
                      <span className="block truncate text-[11px] font-medium text-lp-ink-900">
                        {tab.client}
                      </span>
                      <span className="block text-[9.5px] text-lp-slate">{tab.items}</span>
                    </span>
                    <span className="shrink-0 text-[11px] font-bold text-lp-ink-900">{tab.value}</span>
                  </div>
                ))}
              </div>
              <p className="mt-3 rounded-lg bg-lp-ink-900 px-2.5 py-1.5 text-center text-[10px] font-semibold text-lp-cream">
                Fechar caixa do dia
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
