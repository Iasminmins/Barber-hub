import Link from 'next/link'
import {
  ArrowRight,
  BadgeDollarSign,
  BarChart3,
  BellRing,
  CalendarDays,
  CheckCircle2,
  CreditCard,
  ExternalLink,
  Mail,
  MessageCircle,
  Receipt,
  Scissors,
  ShieldCheck,
  Sparkles,
  Users,
} from 'lucide-react'
import { buttonVariants } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import {
  FREE_TRIAL_DESCRIPTION,
  FREE_TRIAL_LABEL,
  planComparisonRows as comparisonRows,
  saasPlans as plans,
} from '@/lib/saas-plans'
import { cn } from '@/lib/utils'

const features = [
  {
    title: 'Agenda inteligente',
    description: 'Controle horários, confirmações, faltas e encaixes sem perder a visão do dia.',
    icon: CalendarDays,
  },
  {
    title: 'Comandas e PDV',
    description: 'Venda serviços, produtos, combos e feche pagamentos em poucos cliques.',
    icon: Receipt,
  },
  {
    title: 'Planos recorrentes',
    description: 'Crie assinaturas, pacotes e créditos com alerta de vencimento automático.',
    icon: CreditCard,
  },
  {
    title: 'Clientes no radar',
    description: 'Veja aniversários, inativos, inadimplentes, preferências e histórico completo.',
    icon: Users,
  },
  {
    title: 'Financeiro claro',
    description: 'Acompanhe receita, ticket médio, comissões, entradas e saídas por período.',
    icon: BarChart3,
  },
  {
    title: 'Alertas operacionais',
    description: 'Receba avisos de estoque baixo, planos vencendo e comandas pendentes.',
    icon: BellRing,
  },
]

const proof = [
  { value: 'PDV', label: 'comandas e pagamentos no balcão' },
  { value: 'CRM', label: 'histórico e retorno de clientes' },
  { value: 'BI', label: 'indicadores prontos para ação' },
]

const painPoints = [
  'Agenda espalhada entre WhatsApp, papel e memória da equipe.',
  'Comandas abertas sem controle claro do que foi pago ou ficou pendente.',
  'Clientes recorrentes sem histórico, preferências ou lembrete de retorno.',
  'Produtos acabam no estoque antes de alguém perceber.',
]

const modules = [
  {
    title: 'Atendimento',
    text: 'Agenda, cliente, serviço, barbeiro responsável e status do horário em uma rotina simples.',
    icon: CalendarDays,
  },
  {
    title: 'Vendas',
    text: 'Comandas com serviços, produtos, descontos, pagamento e ticket médio por período.',
    icon: BadgeDollarSign,
  },
  {
    title: 'Recorrência',
    text: 'Planos mensais, pacotes, créditos e alertas para vencimentos próximos.',
    icon: CreditCard,
  },
  {
    title: 'Gestão',
    text: 'Financeiro, comissões, estoque, equipe, importação e relatórios para decisão.',
    icon: BarChart3,
  },
]

const results = [
  { label: 'menos esquecimentos', value: 'Alertas' },
  { label: 'mais controle de caixa', value: 'PDV' },
  { label: 'mais retorno de clientes', value: 'CRM' },
  { label: 'decisões por período', value: 'Relatórios' },
]

const testimonials = [
  {
    quote: 'Antes eu só sabia o movimento pelo caixa do fim do dia. Agora vejo agenda, comandas e planos no mesmo lugar.',
    name: 'Gestor de barbearia',
    role: 'Operação e financeiro',
  },
  {
    quote: 'O melhor é conseguir acompanhar comissão e estoque sem ficar perguntando para todo mundo.',
    name: 'Renata Costa',
    role: 'Gerente operacional',
  },
  {
    quote: 'A parte de planos ajuda a não deixar cliente recorrente sumir. O alerta de vencimento é simples e resolve.',
    name: 'Líder de atendimento',
    role: 'Agenda e relacionamento',
  },
]

const faqs = [
  {
    question: 'O que entra no Starter?',
    answer: 'O Starter traz a gestão essencial para a barbearia organizar agenda, clientes, comandas e controles do dia a dia. O Pro adiciona mais usuários, relatórios avançados e importação/exportação.',
  },
  {
    question: 'Consigo testar antes de contratar?',
    answer: 'Sim. Você pode criar sua conta, cadastrar sua barbearia e testar o fluxo com seus próprios dados.',
  },
  {
    question: 'Dá para importar clientes e produtos?',
    answer: 'No Pro e Premium a importação/exportação entra como recurso do plano. No Premium ela pode ser acompanhada na implantação.',
  },
  {
    question: 'Serve para mais de uma unidade?',
    answer: 'Sim. O Premium é pensado para multiunidade, com visão de operação por barbearia.',
  },
]

export default function Home() {
  return (
    <main className="min-h-screen bg-background">
      <section className="relative overflow-hidden bg-primary text-primary-foreground">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_88%_10%,rgba(212,169,51,0.16),transparent_45%)]" />
        <div className="pointer-events-none absolute -bottom-24 -left-24 size-[420px] rounded-full bg-primary-foreground/[0.04] blur-3xl" />

        <header className="relative z-10 mx-auto flex max-w-7xl items-center justify-between px-5 py-4 sm:py-5">
          <Link href="/" className="flex items-center gap-3">
            <span className="flex size-9 items-center justify-center rounded-lg bg-primary-foreground/12 ring-1 ring-primary-foreground/15 sm:size-10">
              <Scissors className="size-5" />
            </span>
            <div>
              <p className="font-bold">MeuBarberHub</p>
              <p className="hidden text-xs text-primary-foreground/65 sm:block">Gestão simples. Barbearia forte.</p>
            </div>
          </Link>
          <nav className="hidden items-center gap-6 text-sm text-primary-foreground/75 md:flex">
            <a href="#solucao" className="hover:text-primary-foreground">Solução</a>
            <a href="#recursos" className="hover:text-primary-foreground">Recursos</a>
            <a href="#planos" className="hover:text-primary-foreground">Planos</a>
            <a href="#contato" className="hover:text-primary-foreground">Contato</a>
          </nav>
          <Link href="/login" className={buttonVariants({ variant: 'outline', size: 'sm', className: 'bg-primary-foreground/10 text-primary-foreground hover:bg-primary-foreground/15 hover:text-primary-foreground' })}>
            Entrar
          </Link>
        </header>

        <div className="relative z-10 mx-auto grid max-w-7xl items-center gap-10 px-5 pb-16 pt-8 lg:grid-cols-[1fr_1.08fr] lg:gap-14 lg:pb-24 lg:pt-14">
          <div className="max-w-xl">
            <p className="mb-5 inline-flex items-center gap-2 rounded-full bg-primary-foreground/10 px-4 py-2 text-sm font-semibold text-primary-foreground/90 ring-1 ring-primary-foreground/15">
              <Sparkles className="size-4 text-gold" />
              30 dias grátis, sem cartão
            </p>
            <h1 className="text-[2.6rem] font-bold leading-[1.04] tracking-[-0.04em] text-balance sm:text-5xl lg:text-[3.5rem]">
              Sua barbearia organizada para <span className="text-gold">atender mais</span> e faturar melhor.
            </h1>
            <p className="mt-5 max-w-lg text-base leading-7 text-primary-foreground/78 sm:text-lg sm:leading-8">
              Agenda, comandas, clientes, estoque e financeiro em um só lugar. Menos planilhas, mais controle para sua barbearia crescer.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Link href="/cadastro" className={buttonVariants({ variant: 'gold', size: 'lg', className: 'w-full shadow-lg shadow-black/20 sm:w-auto' })}>
                Testar grátis por 30 dias
                <ArrowRight className="size-4" />
              </Link>
              <a href="#recursos" className={buttonVariants({ variant: 'outline', size: 'lg', className: 'w-full border-primary-foreground/25 bg-primary-foreground/5 text-primary-foreground hover:bg-primary-foreground/15 hover:text-primary-foreground sm:w-auto' })}>
                Conhecer o sistema
              </a>
            </div>
            <div className="mt-6 flex flex-wrap gap-x-5 gap-y-2 text-sm text-primary-foreground/72">
              {['Sem cartão', 'Cancele quando quiser', 'Suporte na implantação'].map((item) => (
                <span key={item} className="inline-flex items-center gap-1.5">
                  <CheckCircle2 className="size-4 text-gold" /> {item}
                </span>
              ))}
            </div>
          </div>

          <div className="relative">
            <div className="pointer-events-none absolute -inset-6 rounded-[2.5rem] bg-gold/10 blur-2xl" />
            <div className="relative rounded-2xl border border-black/5 bg-card p-4 text-foreground shadow-2xl shadow-black/40 ring-1 ring-black/5 lg:-rotate-1">
              <div className="mb-4 flex items-center justify-between border-b pb-3">
                <div className="flex items-center gap-3">
                  <span className="flex size-10 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                    <Scissors className="size-5" />
                  </span>
                  <div>
                    <p className="font-bold">MeuBarberHub</p>
                    <p className="text-xs text-muted-foreground">Painel da sua barbearia</p>
                  </div>
                </div>
                <div className="hidden items-center gap-1.5 text-xs sm:flex">
                  <span className="rounded-md bg-muted px-2.5 py-1 text-muted-foreground">Hoje</span>
                  <span className="rounded-md bg-muted px-2.5 py-1 text-muted-foreground">Semana</span>
                  <span className="rounded-md bg-gold px-2.5 py-1 font-semibold text-gold-foreground">Mês</span>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
                {[
                  ['Receita', 'R$ 12.840', BadgeDollarSign],
                  ['Agendamentos', '58', CalendarDays],
                  ['Clientes novos', '19', Users],
                  ['Planos ativos', '46', CreditCard],
                ].map(([label, value, Icon]) => (
                  <div key={label as string} className="rounded-xl border bg-background p-3.5">
                    <div className="mb-4 flex items-center justify-between">
                      <span className="text-xs font-medium text-muted-foreground">{label as string}</span>
                      <Icon className="size-4 text-primary" />
                    </div>
                    <p className="text-xl font-bold">{value as string}</p>
                  </div>
                ))}
              </div>
              <div className="mt-3 grid gap-3 lg:grid-cols-[1.5fr_1fr]">
                <div className="rounded-xl border bg-background p-4">
                  <div className="mb-4 flex items-center justify-between">
                    <p className="text-sm font-semibold">Receita por dia</p>
                    <p className="text-xs text-muted-foreground">Julho</p>
                  </div>
                  <div className="flex h-32 items-end gap-1.5">
                    {[42, 58, 45, 72, 64, 88, 54, 76, 91, 68, 83, 61].map((height, index) => (
                      <span key={index} className="flex-1 rounded-t bg-primary" style={{ height: `${height}%`, opacity: 0.5 + index * 0.03 }} />
                    ))}
                  </div>
                </div>
                <div className="rounded-xl border bg-background p-4">
                  <p className="mb-4 text-sm font-semibold">Fila de alertas</p>
                  <div className="space-y-3 text-sm">
                    {['3 planos vencendo', '6 produtos c/ estoque baixo', '2 comandas pendentes'].map((item) => (
                      <div key={item} className="flex items-start gap-2">
                        <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-success" />
                        <span className="leading-5">{item}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="border-b bg-card">
        <div className="mx-auto max-w-7xl px-5 py-8">
          <div className="grid grid-cols-3 gap-4 sm:gap-8">
            {proof.map((item) => (
              <div key={item.label} className="text-center sm:text-left">
                <p className="text-2xl font-bold text-primary sm:text-3xl">{item.value}</p>
                <p className="mt-1 text-xs leading-5 text-muted-foreground sm:text-sm">{item.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="solucao" className="mx-auto grid max-w-7xl gap-8 px-5 py-16 lg:grid-cols-[0.9fr_1.1fr] lg:items-center">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-primary">O problema</p>
          <h2 className="mt-3 text-3xl font-bold tracking-tight text-foreground">
            A barbearia cresce, mas a gestão fica presa em improvisos.
          </h2>
          <p className="mt-4 leading-7 text-muted-foreground">
            O MeuBarberHub organiza a operação diária para que agenda, venda, cliente, estoque e financeiro conversem entre si. Menos conferência manual, mais clareza para decidir.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Link href="/login" className={buttonVariants({ variant: 'default' })}>
              Ver painel demo
              <ArrowRight className="size-4" />
            </Link>
            <a href="#planos" className={buttonVariants({ variant: 'outline' })}>
              Comparar planos
            </a>
          </div>
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          {painPoints.map((point) => (
            <Card key={point} className="p-4 transition-shadow duration-200 hover:shadow-md">
              <div className="mb-3 flex size-9 items-center justify-center rounded-lg bg-warning/18 text-warning-foreground">
                <BellRing className="size-4" />
              </div>
              <p className="text-sm leading-6 text-foreground">{point}</p>
            </Card>
          ))}
        </div>
      </section>

      <section id="recursos" className="mx-auto max-w-7xl px-5 py-16">
        <div className="mb-8 max-w-2xl">
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-primary">Operação centralizada</p>
          <h2 className="mt-3 text-3xl font-bold tracking-tight text-foreground">
            Tudo que a barbearia precisa em um só painel.
          </h2>
        </div>
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {features.map((feature) => {
            const Icon = feature.icon
            return (
              <Card key={feature.title} className="group p-5 transition duration-200 hover:-translate-y-1 hover:border-primary/25 hover:shadow-xl hover:shadow-primary/5">
                <span className="mb-5 flex size-11 items-center justify-center rounded-lg bg-primary/10 text-primary transition-colors group-hover:bg-primary group-hover:text-primary-foreground">
                  <Icon className="size-5" />
                </span>
                <h3 className="text-lg font-semibold text-foreground">{feature.title}</h3>
                <p className="mt-2 text-sm leading-6 text-muted-foreground">{feature.description}</p>
              </Card>
            )
          })}
        </div>
      </section>

      <section className="bg-card">
        <div className="mx-auto max-w-7xl px-5 py-16">
          <div className="mb-8 flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.18em] text-primary">Módulos</p>
              <h2 className="mt-3 text-3xl font-bold tracking-tight text-foreground">
                Um sistema para acompanhar a operação inteira.
              </h2>
            </div>
            <p className="max-w-md text-sm leading-6 text-muted-foreground">
              A proposta é simples: o dono não precisa abrir cinco controles diferentes para entender como a barbearia está hoje.
            </p>
          </div>
          <div className="grid gap-4 lg:grid-cols-4">
            {modules.map((module) => {
              const Icon = module.icon
              return (
                <Card key={module.title} className="group p-5 transition duration-200 hover:-translate-y-1 hover:border-gold/40 hover:shadow-xl hover:shadow-gold/10">
                  <span className="mb-5 flex size-11 items-center justify-center rounded-lg bg-gold/15 text-gold-foreground transition-colors group-hover:bg-gold">
                    <Icon className="size-5" />
                  </span>
                  <h3 className="font-semibold text-foreground">{module.title}</h3>
                  <p className="mt-2 text-sm leading-6 text-muted-foreground">{module.text}</p>
                </Card>
              )
            })}
          </div>
        </div>
      </section>

      <section className="border-y bg-card">
        <div className="mx-auto grid max-w-7xl gap-8 px-5 py-16 lg:grid-cols-[0.85fr_1.15fr] lg:items-center">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-primary">Fluxo de venda</p>
            <h2 className="mt-3 text-3xl font-bold tracking-tight text-foreground">
              Da agenda ao pagamento, sem perder informação.
            </h2>
            <p className="mt-4 leading-7 text-muted-foreground">
              O MeuBarberHub conecta atendimento, comanda, venda de produto, assinatura e comissão. Assim o dono enxerga o que entrou, o que ficou pendente e onde agir para crescer.
            </p>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            {[
              ['1', 'Cliente agenda ou chega no balcão'],
              ['2', 'Equipe abre comanda com serviço e produto'],
              ['3', 'Pagamento fecha receita e comissão'],
              ['4', 'Dashboard mostra resultados e alertas'],
            ].map(([step, label]) => (
              <div key={step} className="rounded-lg border bg-background p-4 transition-shadow duration-200 hover:shadow-md">
                <span className="mb-4 flex size-8 items-center justify-center rounded-md bg-gold text-sm font-bold text-gold-foreground">
                  {step}
                </span>
                <p className="font-medium text-foreground">{label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-primary text-primary-foreground">
        <div className="mx-auto grid max-w-7xl gap-6 px-5 py-12 sm:grid-cols-2 md:grid-cols-4">
          {results.map((item) => (
            <div key={item.label} className="border-l-2 border-gold/50 pl-4">
              <p className="text-xl font-bold text-gold">{item.value}</p>
              <p className="mt-1 text-sm leading-6 text-primary-foreground/75">{item.label}</p>
            </div>
          ))}
        </div>
      </section>

      <section id="planos" className="mx-auto max-w-7xl px-5 py-16">
        <div className="mb-8 flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-primary">Planos</p>
            <h2 className="mt-3 text-3xl font-bold tracking-tight text-foreground">Mesmo sistema, acessos diferentes.</h2>
          </div>
          <p className="max-w-md text-sm leading-6 text-muted-foreground">
            O Starter cobre a gestão essencial. Os upgrades entram quando a barbearia precisa de mais usuários, relatórios avançados, importação, suporte e multiunidade.
          </p>
        </div>
        <Card className="mb-4 border-success/30 bg-success/10 p-4">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-lg font-bold text-foreground">{FREE_TRIAL_LABEL} para novos usuários</p>
              <p className="text-sm text-muted-foreground">{FREE_TRIAL_DESCRIPTION}</p>
            </div>
            <Link href="/cadastro" className={buttonVariants({ variant: 'gold', size: 'sm' })}>
              Começar grátis
              <ArrowRight className="size-4" />
            </Link>
          </div>
        </Card>
        <div className="grid gap-4 lg:grid-cols-3 lg:pt-6">
          {plans.map((plan) => (
            <Card
              key={plan.name}
              className={cn(
                'p-6 transition duration-200',
                plan.featured
                  ? 'border-primary bg-primary text-primary-foreground shadow-2xl shadow-primary/25 ring-2 ring-gold lg:-translate-y-1 lg:scale-[1.02]'
                  : 'hover:-translate-y-1 hover:border-primary/25 hover:shadow-xl hover:shadow-primary/5',
              )}
            >
              <div className="mb-6 flex items-start justify-between gap-3">
                <div>
                  <h3 className="text-xl font-bold">{plan.name}</h3>
                  <p className={cn('mt-1 inline-flex rounded-md px-2 py-1 text-xs font-bold', plan.featured ? 'bg-gold text-gold-foreground' : 'bg-primary/10 text-primary')}>
                    {FREE_TRIAL_LABEL}
                  </p>
                  <p className={cn('mt-2 text-sm leading-6 text-muted-foreground', plan.featured && 'text-primary-foreground/70')}>
                    {plan.description}
                  </p>
                </div>
                {plan.featured ? (
                  <span className="rounded-md bg-gold px-2 py-1 text-xs font-bold text-gold-foreground">
                    Popular
                  </span>
                ) : null}
              </div>
              <p className="text-4xl font-bold">
                {plan.price}
                <span className={cn('text-sm font-medium text-muted-foreground', plan.featured && 'text-primary-foreground/65')}>
                  /mês
                </span>
              </p>
              <p className={cn('mt-1 text-xs text-muted-foreground', plan.featured && 'text-primary-foreground/65')}>
                Nenhuma cobrança é feita durante os 30 dias grátis.
              </p>
              <div className="mt-6 space-y-3">
                {plan.items.map((item) => (
                  <div key={item} className="flex items-center gap-2 text-sm">
                    <CheckCircle2 className={cn('size-4 text-success', plan.featured && 'text-gold')} />
                    <span>{item}</span>
                  </div>
                ))}
              </div>
              <Link
                href={`/cadastro?plano=${plan.id}`}
                className={buttonVariants({
                  variant: plan.featured ? 'gold' : 'default',
                  className: 'mt-6 w-full',
                })}
              >
                Começar grátis
              </Link>
            </Card>
          ))}
        </div>

        <Card className="mt-6 overflow-hidden">
          <div className="border-b p-5">
            <h3 className="text-lg font-semibold text-foreground">Comparativo dos planos</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              O núcleo do MeuBarberHub entra em todos os planos. O que muda é o nível de operação.
            </p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[760px] text-sm">
              <thead className="bg-muted/50 text-left">
                <tr>
                  <th className="px-5 py-3 font-semibold text-foreground">Recurso</th>
                  <th className="px-5 py-3 font-semibold text-foreground">Starter</th>
                  <th className="px-5 py-3 font-semibold text-foreground">Pro</th>
                  <th className="px-5 py-3 font-semibold text-foreground">Premium</th>
                </tr>
              </thead>
              <tbody>
                {comparisonRows.map(([feature, starter, pro, premium]) => (
                  <tr key={feature} className="border-t">
                    <td className="px-5 py-3 font-medium text-foreground">{feature}</td>
                    <td className="px-5 py-3 text-muted-foreground">{starter}</td>
                    <td className="px-5 py-3 text-muted-foreground">{pro}</td>
                    <td className="px-5 py-3 text-muted-foreground">{premium}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      </section>

      <section className="border-y bg-card">
        <div className="mx-auto max-w-7xl px-5 py-16">
          <div className="mb-8 max-w-2xl">
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-primary">Confiança</p>
            <h2 className="mt-3 text-3xl font-bold tracking-tight text-foreground">
              Feito para a rotina real da barbearia.
            </h2>
          </div>
          <div className="grid gap-4 lg:grid-cols-3">
            {testimonials.map((testimonial) => (
              <Card key={testimonial.name} className="flex flex-col p-5 transition-shadow duration-200 hover:shadow-lg">
                <div className="mb-3 text-sm tracking-[0.2em] text-gold">★★★★★</div>
                <p className="flex-1 text-sm leading-7 text-foreground">“{testimonial.quote}”</p>
                <div className="mt-5 flex items-center gap-3 border-t pt-4">
                  <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-primary/10 text-sm font-bold text-primary">
                    {testimonial.name.split(' ').map((word) => word[0]).slice(0, 2).join('').toUpperCase()}
                  </span>
                  <div>
                    <p className="font-semibold text-foreground">{testimonial.name}</p>
                    <p className="text-sm text-muted-foreground">{testimonial.role}</p>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-5 py-16">
        <div className="mb-8 max-w-2xl">
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-primary">Dúvidas frequentes</p>
          <h2 className="mt-3 text-3xl font-bold tracking-tight text-foreground">
            Antes de testar, o essencial já fica claro.
          </h2>
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          {faqs.map((faq) => (
            <Card key={faq.question} className="p-5 transition-shadow duration-200 hover:shadow-md">
              <h3 className="font-semibold text-foreground">{faq.question}</h3>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">{faq.answer}</p>
            </Card>
          ))}
        </div>
      </section>

      <section id="contato" className="relative overflow-hidden bg-primary text-primary-foreground">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_18%_130%,rgba(212,169,51,0.16),transparent_48%)]" />
        <div className="relative z-10 mx-auto flex max-w-7xl flex-col gap-6 px-5 py-16 md:flex-row md:items-center md:justify-between">
          <div className="max-w-2xl">
            <div className="mb-4 flex items-center gap-2 text-sm font-semibold text-primary-foreground/75">
              <ShieldCheck className="size-4 text-gold" />
              Pronto para testar com seus dados
            </div>
            <h2 className="text-3xl font-bold tracking-tight">Veja o MeuBarberHub funcionando agora.</h2>
            <p className="mt-3 text-primary-foreground/72">
              Entre na demonstração, navegue pelo dashboard, crie clientes, comandas e planos para validar o fluxo completo.
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Link href="/login" className={buttonVariants({ variant: 'gold', size: 'lg' })}>
              Abrir demonstração
              <ArrowRight className="size-4" />
            </Link>
            <Link href="/cadastro" className={buttonVariants({ variant: 'outline', size: 'lg', className: 'bg-primary-foreground/10 text-primary-foreground hover:bg-primary-foreground/15 hover:text-primary-foreground' })}>
              <MessageCircle className="size-4" />
              Criar cadastro
            </Link>
          </div>
        </div>
      </section>

      <footer className="border-t border-primary-foreground/10 bg-[#142c25] text-primary-foreground">
        <div className="mx-auto grid max-w-7xl gap-10 px-5 py-12 sm:grid-cols-2 lg:grid-cols-[1.35fr_0.65fr_1fr]">
          <div className="max-w-md">
            <Link href="/" className="inline-flex items-center gap-3">
              <span className="flex size-10 items-center justify-center rounded-lg bg-primary-foreground/10 ring-1 ring-primary-foreground/15"><Scissors className="size-5" /></span>
              <div><p className="font-bold">MeuBarberHub</p><p className="text-xs text-primary-foreground/60">Gestão simples. Barbearia forte.</p></div>
            </Link>
            <p className="mt-5 text-sm leading-6 text-primary-foreground/65">Agenda, comandas, clientes, estoque e financeiro reunidos para simplificar a gestão da sua barbearia.</p>
          </div>
          <div>
            <h2 className="text-sm font-semibold uppercase tracking-[0.16em] text-gold">Navegação</h2>
            <nav className="mt-4 flex flex-col items-start gap-3 text-sm text-primary-foreground/70">
              <a href="#solucao" className="transition-colors hover:text-primary-foreground">Solução</a>
              <a href="#recursos" className="transition-colors hover:text-primary-foreground">Recursos</a>
              <a href="#planos" className="transition-colors hover:text-primary-foreground">Planos</a>
              <Link href="/login" className="transition-colors hover:text-primary-foreground">Entrar</Link>
            </nav>
          </div>
          <div>
            <h2 className="text-sm font-semibold uppercase tracking-[0.16em] text-gold">Atendimento</h2>
            <p className="mt-4 text-sm leading-6 text-primary-foreground/65">Precisa de ajuda? Fale diretamente com nosso suporte.</p>
            <div className="mt-4 space-y-3">
              <a href="mailto:suportemeubarberhub@gmail.com" className="flex items-start gap-3 text-sm text-primary-foreground/80 transition-colors hover:text-primary-foreground">
                <Mail className="mt-0.5 size-4 shrink-0 text-gold" /><span className="break-all">suportemeubarberhub@gmail.com</span>
              </a>
              <a href="https://wa.me/5524998369828?text=Ol%C3%A1%2C%20preciso%20de%20ajuda%20com%20o%20MeuBarberHub." target="_blank" rel="noreferrer" className="inline-flex items-center gap-3 text-sm text-primary-foreground/80 transition-colors hover:text-primary-foreground">
                <MessageCircle className="size-4 text-gold" />WhatsApp: (24) 99836-9828<ExternalLink className="size-3.5" />
              </a>
            </div>
          </div>
        </div>
        <div className="border-t border-primary-foreground/10">
          <div className="mx-auto flex max-w-7xl flex-col gap-2 px-5 py-5 text-xs text-primary-foreground/50 sm:flex-row sm:items-center sm:justify-between">
            <p>© {new Date().getFullYear()} MeuBarberHub. Todos os direitos reservados.</p><p>Feito para fortalecer a gestão da sua barbearia.</p>
          </div>
        </div>
      </footer>

      <a href="https://wa.me/5524998369828?text=Ol%C3%A1%2C%20gostaria%20de%20falar%20com%20o%20MeuBarberHub." target="_blank" rel="noreferrer" aria-label="Fale conosco pelo WhatsApp" className="fixed bottom-5 right-4 z-50 inline-flex items-center gap-2 rounded-full bg-[#25D366] px-4 py-3 text-sm font-bold text-[#10251f] shadow-xl shadow-black/20 transition-transform hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-primary sm:bottom-6 sm:right-6">
        <MessageCircle className="size-5" /><span className="hidden sm:inline">Fale conosco</span>
      </a>
    </main>
  )
}
