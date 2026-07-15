import { Badge, type BadgeProps } from '@/components/ui/badge'

type Variant = NonNullable<BadgeProps['variant']>

const MAP: Record<string, { label: string; variant: Variant }> = {
  // Agendamentos
  agendado: { label: 'Agendado', variant: 'secondary' },
  confirmado: { label: 'Confirmado', variant: 'default' },
  chegou: { label: 'Chegou', variant: 'gold' },
  concluido: { label: 'Concluído', variant: 'success' },
  cancelado: { label: 'Cancelado', variant: 'destructive' },
  faltou: { label: 'Faltou', variant: 'warning' },
  // Comandas
  aberta: { label: 'Aberta', variant: 'gold' },
  paga: { label: 'Paga', variant: 'success' },
  pendente: { label: 'Pendente', variant: 'warning' },
  cancelada: { label: 'Cancelada', variant: 'destructive' },
  // Assinaturas
  ativo: { label: 'Ativo', variant: 'success' },
  vencendo: { label: 'Vencendo', variant: 'warning' },
  vencido: { label: 'Vencido', variant: 'destructive' },
  // Importações
  concluida: { label: 'Concluída', variant: 'success' },
  com_erros: { label: 'Com erros', variant: 'warning' },
  processando: { label: 'Processando', variant: 'default' },
  desfeita: { label: 'Desfeita', variant: 'secondary' },
  // Comissões
  paga_com: { label: 'Paga', variant: 'success' },
}

export function StatusBadge({ status }: { status: string }) {
  const config = MAP[status] ?? { label: status, variant: 'secondary' as Variant }
  return <Badge variant={config.variant}>{config.label}</Badge>
}
