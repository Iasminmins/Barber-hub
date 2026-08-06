import { CalendarDays, Package, Receipt, TrendingUp, Users } from 'lucide-react'
import type { ProductTourId } from '@/lib/landing-content'
import { DEMO_AGENDA, DEMO_LOW_STOCK, DEMO_REVENUE_BARS } from '@/lib/landing-content'
import { cn } from '@/lib/utils'

const STATUS_STYLES: Record<string, string> = {
  Confirmado: 'bg-lp-green-500/14 text-lp-green-500',
  Aguardando: 'bg-lp-amber-500/18 text-lp-gold-600',
  'Em atendimento': 'bg-lp-ink-700/10 text-lp-ink-700',
}

const HEADERS: Record<ProductTourId, { title: string; subtitle: string; icon: typeof Users }> = {
  agenda: { title: 'Agenda', subtitle: 'Terça, 12 de agosto', icon: CalendarDays },
  comandas: { title: 'Comandas', subtitle: '2 abertas • 14 fechadas hoje', icon: Receipt },
  clientes: { title: 'Clientes', subtitle: '482 cadastrados', icon: Users },
  estoque: { title: 'Estoque', subtitle: '3 produtos em alerta', icon: Package },
  financeiro: { title: 'Financeiro', subtitle: 'Agosto de 2026', icon: TrendingUp },
}

/**
 * Tela simplificada do sistema exibida em cada aba do tour.
 * Usa a mesma linguagem visual do dashboard do hero: mesma paleta, mesmos
 * cards, mesmos badges de status.
 */
export function TourScreen({ id }: { id: ProductTourId }) {
  const header = HEADERS[id]

  return (
    <div
      aria-hidden="true"
      className="overflow-hidden rounded-xl border border-lp-cream-3 bg-white"
      style={{ boxShadow: 'var(--lp-shadow-card)' }}
    >
      <div className="flex items-center gap-2.5 border-b border-lp-cream-3 bg-lp-cream px-4 py-3">
        <span className="flex size-7 items-center justify-center rounded-lg bg-lp-ink-900 text-lp-cream">
          <header.icon className="size-3.5" />
        </span>
        <span className="leading-tight">
          <span className="block text-[13px] font-bold text-lp-ink-900">{header.title}</span>
          <span className="block text-[10.5px] text-lp-slate">{header.subtitle}</span>
        </span>
      </div>
      <div className="p-4">{renderBody(id)}</div>
    </div>
  )
}

function Linha({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-3 rounded-lg border border-lp-cream-3 px-3 py-2.5">
      {children}
    </div>
  )
}

function renderBody(id: ProductTourId) {
  if (id === 'agenda') {
    return (
      <div className="space-y-2">
        {DEMO_AGENDA.map((item) => (
          <Linha key={item.time}>
            <span className="w-10 shrink-0 text-[12px] font-bold text-lp-ink-900">{item.time}</span>
            <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-lp-ink-900/8 text-[10px] font-bold text-lp-ink-800">
              {item.initials}
            </span>
            <span className="min-w-0 flex-1 leading-tight">
              <span className="block truncate text-[12.5px] font-medium text-lp-ink-900">
                {item.client}
              </span>
              <span className="block truncate text-[10.5px] text-lp-slate">
                {item.service} • {item.professional}
              </span>
            </span>
            <span
              className={cn(
                'shrink-0 rounded-md px-2 py-0.5 text-[9.5px] font-semibold',
                STATUS_STYLES[item.status],
              )}
            >
              {item.status}
            </span>
          </Linha>
        ))}
      </div>
    )
  }

  if (id === 'comandas') {
    return (
      <div className="space-y-2">
        {[
          ['Anderson Lima', 'Corte social + pomada', 'R$ 68,00', 'Aberta'],
          ['Vitor Machado', 'Corte + barba + óleo', 'R$ 125,00', 'Aberta'],
          ['Carlos Henrique', 'Corte degradê', 'R$ 55,00', 'Paga'],
          ['Rafael Costa', 'Barba completa', 'R$ 45,00', 'Paga'],
        ].map(([nome, itens, valor, estado]) => (
          <Linha key={nome}>
            <span className="min-w-0 flex-1 leading-tight">
              <span className="block truncate text-[12.5px] font-medium text-lp-ink-900">{nome}</span>
              <span className="block truncate text-[10.5px] text-lp-slate">{itens}</span>
            </span>
            <span className="shrink-0 text-[12.5px] font-bold text-lp-ink-900">{valor}</span>
            <span
              className={cn(
                'shrink-0 rounded-md px-2 py-0.5 text-[9.5px] font-semibold',
                estado === 'Paga'
                  ? 'bg-lp-green-500/14 text-lp-green-500'
                  : 'bg-lp-amber-500/18 text-lp-gold-600',
              )}
            >
              {estado}
            </span>
          </Linha>
        ))}
      </div>
    )
  }

  if (id === 'clientes') {
    return (
      <div className="space-y-2">
        {[
          ['Lucas Ferreira', 'LF', '6 visitas • Mensal Barba', 'Recorrente'],
          ['Pedro Alves', 'PA', '11 visitas • Corte Ilimitado', 'Recorrente'],
          ['Bruno Tavares', 'BT', 'Última visita há 74 dias', 'Inativo'],
          ['Thiago Nunes', 'TN', '3 visitas • Mensal Completo', 'Recorrente'],
        ].map(([nome, iniciais, info, tag]) => (
          <Linha key={nome}>
            <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-lp-ink-900/8 text-[10px] font-bold text-lp-ink-800">
              {iniciais}
            </span>
            <span className="min-w-0 flex-1 leading-tight">
              <span className="block truncate text-[12.5px] font-medium text-lp-ink-900">{nome}</span>
              <span className="block truncate text-[10.5px] text-lp-slate">{info}</span>
            </span>
            <span
              className={cn(
                'shrink-0 rounded-md px-2 py-0.5 text-[9.5px] font-semibold',
                tag === 'Inativo'
                  ? 'bg-lp-amber-500/18 text-lp-gold-600'
                  : 'bg-lp-green-500/14 text-lp-green-500',
              )}
            >
              {tag}
            </span>
          </Linha>
        ))}
      </div>
    )
  }

  if (id === 'estoque') {
    return (
      <div className="space-y-2">
        {[...DEMO_LOW_STOCK, { name: 'Cera fixadora', left: '18 un.' }].map((produto, index) => (
          <Linha key={produto.name}>
            <span className="min-w-0 flex-1 truncate text-[12.5px] font-medium text-lp-ink-900">
              {produto.name}
            </span>
            <span className="h-1.5 w-24 shrink-0 overflow-hidden rounded-full bg-lp-cream-3">
              <span
                className={cn(
                  'block h-full rounded-full',
                  index < 3 ? 'bg-lp-amber-500' : 'bg-lp-green-500',
                )}
                style={{ width: index < 3 ? `${14 + index * 8}%` : '78%' }}
              />
            </span>
            <span
              className={cn(
                'w-14 shrink-0 rounded-md px-2 py-0.5 text-center text-[9.5px] font-semibold',
                index < 3
                  ? 'bg-lp-amber-500/18 text-lp-gold-600'
                  : 'bg-lp-green-500/14 text-lp-green-500',
              )}
            >
              {produto.left}
            </span>
          </Linha>
        ))}
      </div>
    )
  }

  // financeiro
  return (
    <div className="space-y-3">
      <div className="grid grid-cols-3 gap-2">
        {[
          ['Receita', 'R$ 18.640'],
          ['Comissões', 'R$ 5.212'],
          ['Resultado', 'R$ 9.874'],
        ].map(([rotulo, valor]) => (
          <div key={rotulo} className="rounded-lg border border-lp-cream-3 px-3 py-2.5">
            <p className="text-[10.5px] text-lp-slate">{rotulo}</p>
            <p className="mt-1 text-[15px] font-bold text-lp-ink-900">{valor}</p>
          </div>
        ))}
      </div>
      <div className="rounded-lg border border-lp-cream-3 p-3">
        <p className="mb-2.5 text-[11.5px] font-semibold text-lp-ink-900">Receita por dia</p>
        <div className="flex h-20 items-end gap-1.5">
          {DEMO_REVENUE_BARS.map((bar, index) => (
            <span
              key={bar.day}
              className={cn('flex-1 rounded-t-[2px]', index === 8 ? 'bg-lp-gold-500' : 'bg-lp-ink-700')}
              style={{ height: `${bar.height}%` }}
            />
          ))}
        </div>
      </div>
      <div className="space-y-2">
        {[
          ['Diego Martins', '42 atendimentos', 'R$ 2.180'],
          ['Bruno Tavares', '35 atendimentos', 'R$ 1.746'],
        ].map(([nome, qtd, comissao]) => (
          <Linha key={nome}>
            <span className="min-w-0 flex-1 leading-tight">
              <span className="block truncate text-[12.5px] font-medium text-lp-ink-900">{nome}</span>
              <span className="block text-[10.5px] text-lp-slate">{qtd}</span>
            </span>
            <span className="shrink-0 text-[12.5px] font-bold text-lp-ink-900">{comissao}</span>
          </Linha>
        ))}
      </div>
    </div>
  )
}
