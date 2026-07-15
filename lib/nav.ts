import type { LucideIcon } from 'lucide-react'
import {
  ArrowLeftRight,
  CalendarDays,
  CreditCard,
  LayoutDashboard,
  Scissors,
  Settings,
  ShoppingCart,
  UserCog,
  Users,
  Wallet,
} from 'lucide-react'

export interface NavItem {
  label: string
  href: string
  icon: LucideIcon
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
      { label: 'Importar / Exportar', href: '/importacao', icon: ArrowLeftRight },
      { label: 'Configurações', href: '/configuracoes', icon: Settings },
    ],
  },
]

export const allNavItems = navGroups.flatMap((g) => g.items)
