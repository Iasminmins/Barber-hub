import type { LucideIcon } from 'lucide-react'
import {
  ArrowLeftRight,
  BarChart3,
  Building2,
  CalendarDays,
  ClipboardCheck,
  CreditCard,
  MessageSquareQuote,
  HelpCircle,
  LayoutDashboard,
  Scissors,
  Settings,
  ShoppingCart,
  UserCog,
  Users,
  Wallet,
  Receipt,
} from 'lucide-react'

export interface NavItem {
  label: string
  href: string
  icon: LucideIcon
  managementOnly?: boolean
}

export interface NavGroup {
  title: string
  items: NavItem[]
}

export const navGroups: NavGroup[] = [
  {
    title: 'Operação',
    items: [
      { label: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
      { label: 'Agenda', href: '/agenda', icon: CalendarDays },
      { label: 'Comandas / PDV', href: '/comandas', icon: ShoppingCart },
    ],
  },
  {
    title: 'Cadastros',
    items: [
      { label: 'Clientes', href: '/clientes', icon: Users },
      { label: 'Produtos & Serviços', href: '/catalogo', icon: Scissors },
      { label: 'Assinaturas', href: '/assinaturas', icon: CreditCard },
      { label: 'Funcionários', href: '/funcionarios', icon: UserCog },
    ],
  },
  {
    title: 'Gestão',
    items: [
      { label: 'Financeiro', href: '/financeiro', icon: Wallet },
      { label: 'Gastos', href: '/gastos', icon: Receipt },
      { label: 'Gestão semanal', href: '/gestao-semanal', icon: ClipboardCheck, managementOnly: true },
      { label: 'Avaliações', href: '/avaliacoes', icon: MessageSquareQuote, managementOnly: true },
      { label: 'Relatórios', href: '/relatorios', icon: BarChart3, managementOnly: true },
      { label: 'Importar / Exportar', href: '/importacao', icon: ArrowLeftRight },
      { label: 'Minha rede', href: '/rede', icon: Building2, managementOnly: true },
      { label: 'Como funciona', href: '/como-funciona', icon: HelpCircle },
      { label: 'Configurações', href: '/configuracoes', icon: Settings },
    ],
  },
]

export const allNavItems = navGroups.flatMap((g) => g.items)
