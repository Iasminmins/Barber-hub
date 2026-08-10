import Link from 'next/link'
import {
  ArrowRight,
  BarChart3,
  CalendarDays,
  CheckCircle2,
  ClipboardList,
  CreditCard,
  ExternalLink,
  Link2,
  MessageCircle,
  Scissors,
  Settings,
  ShoppingCart,
  Users,
} from 'lucide-react'
import { PageHeader } from '@/components/page-header'
import { Badge } from '@/components/ui/badge'
import { buttonVariants } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { buildSupportWhatsAppUrl } from '@/lib/support-contact'
import { cn } from '@/lib/utils'

const platformFlow = [
  {
    title: 'Configure sua barbearia',
    description: 'Ajuste dados da unidade, logo, cor da marca, horários, funcionários, fotos da equipe, serviços e formas de pagamento antes de abrir a rotina.',
    href: '/configuracoes',
    action: 'Abrir configurações',
    icon: Settings,
  },
  {
    title: 'Receba agendamentos',
    description: 'Use a agenda interna para marcar horários e compartilhe o link público para os clientes escolherem um atendimento.',
    href: '/agenda',
    action: 'Ir para agenda',
    icon: CalendarDays,
  },
  {
    title: 'Atenda e controle comandas',
    description: 'Abra a comanda do cliente, registre serviços e produtos, acompanhe valores e finalize o pagamento.',
    href: '/comandas',
    action: 'Ver comandas',
    icon: ShoppingCart,
  },
  {
    title: 'Acompanhe o financeiro',
    description: 'Confira entradas, formas de pagamento, vendas e movimentações para entender o resultado do dia.',
    href: '/financeiro',
    action: 'Abrir financeiro',
    icon: CreditCard,
  },
  {
    title: 'Gerencie clientes e equipe',
    description: 'Mantenha cadastros organizados, permissões corretas e histórico dos clientes sempre acessível.',
    href: '/clientes',
    action: 'Ver clientes',
    icon: Users,
  },
  {
    title: 'Analise os resultados',
    description: 'Use relatórios para acompanhar faturamento, atendimentos, desempenho da equipe e crescimento da barbearia.',
    href: '/relatorios',
    action: 'Abrir relatórios',
    icon: BarChart3,
  },
]

const firstSteps = [
  'Enviar logo da barbearia',
  'Cadastrar serviços e produtos',
  'Cadastrar funcionários',
  'Adicionar fotos dos funcionários',
  'Configurar horários da agenda',
  'Divulgar o link público de agendamento',
]

const quickGuides = [
  {
    title: 'Agenda',
    description: 'Organize horários, encaixes e atendimentos por profissional.',
    href: '/agenda',
    icon: CalendarDays,
  },
  {
    title: 'Catálogo',
    description: 'Cadastre cortes, pacotes, produtos e valores usados nas comandas.',
    href: '/catalogo',
    icon: Scissors,
  },
  {
    title: 'Comandas',
    description: 'Controle o atendimento do cliente do início ao fechamento.',
    href: '/comandas',
    icon: ClipboardList,
  },
]

const publicLinkSteps = [
  'Entre em Configurações e abra a aba Tela inicial.',
  'No campo Slug público, escolha o nome que vai aparecer no final do link.',
  'Salve as alterações para atualizar o endereço público da barbearia.',
  'Abra a Agenda e copie o link de agendamento para enviar aos clientes.',
]

const supportUrl = buildSupportWhatsAppUrl('Olá, preciso de ajuda para entender como funciona o BarberHub.')

export default function ComoFuncionaPage() {
  return (
    <div>
      <PageHeader
        title="Como funciona"
        description="Um guia rápido para entender a rotina do BarberHub e saber por onde começar."
      >
        <a
          href={supportUrl}
          target="_blank"
          rel="noopener noreferrer"
          className={buttonVariants({ variant: 'gold', size: 'sm' })}
        >
          <MessageCircle className="size-4" />
          Tirar dúvida
        </a>
        <Link href="/dashboard" className={buttonVariants({ variant: 'outline', size: 'sm' })}>
          Ir para dashboard
          <ArrowRight className="size-4" />
        </Link>
      </PageHeader>

      <div className="space-y-5">
        <section className="rounded-lg border border-border bg-card p-5">
          <Badge variant="secondary">Primeiros passos</Badge>
          <h2 className="mt-3 text-xl font-bold text-foreground">
            O BarberHub acompanha a barbearia do agendamento ao resultado.
          </h2>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-muted-foreground">
            Comece configurando a operação, receba agendamentos, registre comandas e acompanhe os números da empresa em um só lugar.
          </p>
          <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {firstSteps.map((step) => (
              <div key={step} className="flex items-center gap-3 rounded-md border border-border bg-muted/25 p-3">
                <CheckCircle2 className="size-5 shrink-0 text-success" />
                <span className="text-sm font-medium text-foreground">{step}</span>
              </div>
            ))}
          </div>
        </section>

        <section className="grid gap-4 lg:grid-cols-2">
          {platformFlow.map((item, index) => {
            const Icon = item.icon
            return (
              <Card key={item.title} className="p-5">
                <div className="flex items-start gap-4">
                  <div className="flex size-10 shrink-0 items-center justify-center rounded-md bg-primary/10 text-primary">
                    <Icon className="size-5" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                      Passo {index + 1}
                    </p>
                    <h3 className="mt-1 text-base font-bold text-foreground">{item.title}</h3>
                    <p className="mt-2 text-sm leading-6 text-muted-foreground">{item.description}</p>
                    <Link
                      href={item.href}
                      className={cn(buttonVariants({ variant: 'ghost', size: 'sm' }), 'mt-3 px-0')}
                    >
                      {item.action}
                      <ExternalLink className="size-4" />
                    </Link>
                  </div>
                </div>
              </Card>
            )
          })}
        </section>

        <section className="grid gap-4 xl:grid-cols-[1fr_360px]">
          <Card className="p-5">
            <div className="flex items-start gap-4">
              <div className="flex size-10 shrink-0 items-center justify-center rounded-md bg-primary/10 text-primary">
                <Link2 className="size-5" />
              </div>
              <div className="min-w-0 flex-1">
                <Badge variant="secondary">Link público</Badge>
                <h2 className="mt-3 text-lg font-bold text-foreground">Como configurar o link de agendamento</h2>
                <p className="mt-2 text-sm leading-6 text-muted-foreground">
                  O link público é o endereço que o cliente usa para marcar horário sozinho. Ele fica no formato{' '}
                  <span className="font-mono text-foreground">/agendar/nome-da-barbearia</span> e usa o slug público
                  salvo nas configurações.
                </p>
                <div className="mt-5 space-y-3">
                  {publicLinkSteps.map((step, index) => (
                    <div key={step} className="flex gap-3 rounded-md border border-border bg-muted/25 p-3">
                      <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground">
                        {index + 1}
                      </span>
                      <p className="text-sm leading-6 text-foreground">{step}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </Card>

          <Card className="p-5">
            <h3 className="font-bold text-foreground">Onde mexer</h3>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">
              Primeiro ajuste o slug público. Depois vá para a agenda para copiar e divulgar o link.
            </p>
            <div className="mt-5 space-y-2">
              <Link
                href="/configuracoes"
                className={cn(buttonVariants({ variant: 'outline', size: 'sm' }), 'w-full justify-between')}
              >
                Configurar slug público
                <Settings className="size-4" />
              </Link>
              <Link
                href="/agenda"
                className={cn(buttonVariants({ variant: 'default', size: 'sm' }), 'w-full justify-between')}
              >
                Copiar link na agenda
                <CalendarDays className="size-4" />
              </Link>
            </div>
            <div className="mt-4 rounded-md border border-border bg-muted/25 p-3 text-xs leading-5 text-muted-foreground">
              Dica: use um slug curto, fácil de falar e parecido com o nome da barbearia. Evite espaços e acentos.
            </div>
          </Card>
        </section>

        <section>
          <h2 className="mb-3 text-lg font-bold text-foreground">Guias rápidos</h2>
          <div className="grid gap-4 lg:grid-cols-3">
            {quickGuides.map((guide) => {
              const Icon = guide.icon
              return (
                <Link
                  key={guide.title}
                  href={guide.href}
                  className="rounded-lg border border-border bg-card p-5 transition-colors hover:bg-muted/35"
                >
                  <Icon className="size-5 text-primary" />
                  <h3 className="mt-3 font-bold text-foreground">{guide.title}</h3>
                  <p className="mt-2 text-sm leading-6 text-muted-foreground">{guide.description}</p>
                </Link>
              )
            })}
          </div>
        </section>
      </div>
    </div>
  )
}
