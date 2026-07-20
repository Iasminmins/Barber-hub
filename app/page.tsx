import Link from 'next/link'
import {
  ArrowRight,
  BadgeDollarSign,
  BarChart3,
  BellRing,
  CalendarDays,
  CheckCircle2,
  CreditCard,
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
    question: 'O Starter tem o sistema completo?',
    answer: 'Sim. O Starter tem o núcleo completo do BarberHub. A diferença está em limites de usuários, relatórios, importação e suporte.',
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
      <section className="relative min-h-[92vh] overflow-hidden bg-primary text-primary-foreground">
        <div className="absolute inset-0 opacity-95">
          <div className="absolute left-1/2 top-20 w-[860px] -translate-x-1/2 rounded-2xl border border-primary-foreground/15 bg-primary-foreground/10 p-4 shadow-2xl lg:top-24">
            <div className="mb-4 flex items-center justify-between border-b border-primary-foreground/10 pb-3">
              <div className="flex items-center gap-3">
                <span className="flex size-10 items-center justify-center rounded-lg bg-gold text-gold-foreground">
                  <Scissors className="size-5" />
                </span>
                <div>
                  <p className="font-bold">BarberHub</p>
                  <p className="text-xs text-primary-foreground/60">Painel da sua barbearia</p>
                </div>
              </div>
              <div className="hidden items-center gap-2 text-xs text-primary-foreground/65 sm:flex">
                <span className="rounded-md bg-primary-foreground/10 px-3 py-1">Hoje</span>
                <span className="rounded-md bg-primary-foreground/10 px-3 py-1">Semana</span>
                <span className="rounded-md bg-gold px-3 py-1 font-semibold text-gold-foreground">Mês</span>
              </div>
            </div>
            <div className="grid gap-3 md:grid-cols-4">
              {[
                ['Receita', 'R$ 12.840', BadgeDollarSign],
                ['Agendamentos', '58', CalendarDays],
                ['Clientes novos', '19', Users],
                ['Planos ativos', '46', CreditCard],
              ].map(([label, value, Icon]) => (
                <div key={label as string} className="rounded-lg bg-background/95 p-4 text-foreground shadow-sm">
                  <div className="mb-5 flex justify-between">
                    <span className="text-xs font-medium text-muted-foreground">{label as string}</span>
                    <Icon className="size-4 text-primary" />
                  </div>
                  <p className="text-2xl font-bold">{value as string}</p>
                </div>
              ))}
            </div>
            <div className="mt-3 grid gap-3 lg:grid-cols-[1.4fr_0.6fr]">
              <div className="rounded-lg bg-background/95 p-4 text-foreground shadow-sm">
                <div className="mb-4 flex items-center justify-between">
                  <p className="font-semibold">Receita por dia</p>
                  <p className="text-xs text-muted-foreground">Julho</p>
                </div>
                <div className="flex h-40 items-end gap-2">
                  {[42, 58, 45, 72, 64, 88, 54, 76, 91, 68, 83, 61].map((height, index) => (
                    <span
                      key={index}
                      className="flex-1 rounded-t-md bg-primary"
                      style={{ height: `${height}%`, opacity: 0.45 + index * 0.035 }}
                    />
                  ))}
                </div>
              </div>
              <div className="rounded-lg bg-background/95 p-4 text-foreground shadow-sm">
                <p className="mb-4 font-semibold">Fila de alertas</p>
                <div className="space-y-3 text-sm">
                  {['3 planos vencendo', '6 produtos com estoque baixo', '2 comandas pendentes'].map((item) => (
                    <div key={item} className="flex items-center gap-2">
                      <CheckCircle2 className="size-4 text-success" />
                      <span>{item}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(30,58,50,0.18),rgba(30,58,50,0.7)_48%,rgba(30,58,50,0.98))]" />

        <header className="relative z-10 mx-auto flex max-w-7xl items-center justify-between px-5 py-5">
          <Link href="/" className="flex items-center gap-3">
            <span className="flex size-10 items-center justify-center rounded-lg bg-primary-foreground/12 ring-1 ring-primary-foreground/15">
              <Scissors className="size-5" />
            </span>
            <div>
              <p className="font-bold">BarberHub</p>
              <p className="text-xs text-primary-foreground/65">Sua barbearia conectada</p>
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

        <div className="relative z-10 mx-auto flex min-h-[calc(92vh-84px)] max-w-5xl flex-col justify-end px-5 pb-10 pt-20">
          <div className="max-w-3xl">
            <p className="mb-4 inline-flex items-center gap-2 rounded-md bg-primary-foreground/12 px-3 py-1 text-sm font-semibold text-primary-foreground/85 ring-1 ring-primary-foreground/12">
              <Sparkles className="size-4 text-gold" />
              SaaS para barbearias que querem vender mais e operar melhor
            </p>
            <h1 className="text-4xl font-bold tracking-tight text-balance sm:text-6xl">
              Gestão completa para transformar atendimento em receita recorrente.
            </h1>
            <p className="mt-5 max-w-2xl text-lg leading-8 text-primary-foreground/78">
              Agenda, comandas, clientes, planos, financeiro, comissões e alertas em uma plataforma simples para o dono acompanhar a operação sem planilhas soltas.
            </p>
            <div className="mt-7 flex flex-wrap gap-3">
              <Link href="/cadastro" className={buttonVariants({ variant: 'gold', size: 'lg' })}>
                Começar agora
                <ArrowRight className="size-4" />
              </Link>
              <Link href="/login" className={buttonVariants({ variant: 'outline', size: 'lg', className: 'bg-primary-foreground/10 text-primary-foreground hover:bg-primary-foreground/15 hover:text-primary-foreground' })}>
                Ver demonstração
              </Link>
            </div>
          </div>
          <div className="mt-10 grid gap-3 sm:grid-cols-3">
            {proof.map((item) => (
              <div key={item.label} className="rounded-lg bg-primary-foreground/10 p-4 ring-1 ring-primary-foreground/10">
                <p className="text-2xl font-bold">{item.value}</p>
                <p className="mt-1 text-sm text-primary-foreground/68">{item.label}</p>
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
            O BarberHub organiza a operação diária para que agenda, venda, cliente, estoque e financeiro conversem entre si. Menos conferência manual, mais clareza para decidir.
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
            <Card key={point} className="p-4">
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
              <Card key={feature.title} className="p-5">
                <span className="mb-5 flex size-11 items-center justify-center rounded-lg bg-primary/10 text-primary">
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
                <Card key={module.title} className="p-5">
                  <span className="mb-5 flex size-11 items-center justify-center rounded-lg bg-gold/15 text-gold-foreground">
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
              O BarberHub conecta atendimento, comanda, venda de produto, assinatura e comissão. Assim o dono enxerga o que entrou, o que ficou pendente e onde agir para crescer.
            </p>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            {[
              ['1', 'Cliente agenda ou chega no balcão'],
              ['2', 'Equipe abre comanda com serviço e produto'],
              ['3', 'Pagamento fecha receita e comissão'],
              ['4', 'Dashboard mostra resultados e alertas'],
            ].map(([step, label]) => (
              <div key={step} className="rounded-lg border bg-background p-4">
                <span className="mb-4 flex size-8 items-center justify-center rounded-md bg-gold text-sm font-bold text-gold-foreground">
                  {step}
                </span>
                <p className="font-medium text-foreground">{label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-5 py-16">
        <div className="grid gap-4 md:grid-cols-4">
          {results.map((item) => (
            <Card key={item.label} className="p-5 text-center">
              <p className="text-2xl font-bold text-foreground">{item.value}</p>
              <p className="mt-2 text-sm text-muted-foreground">{item.label}</p>
            </Card>
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
            Minha sugestão é manter o Starter completo e vender os upgrades por quantidade de usuários, relatórios, importação, suporte e multiunidade.
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
        <div className="grid gap-4 lg:grid-cols-3">
          {plans.map((plan) => (
            <Card
              key={plan.name}
              className={cn(
                'p-6',
                plan.featured ? 'border-primary bg-primary text-primary-foreground shadow-lg' : '',
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
                Ativação do plano confirmada antes do fim do teste.
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
              O núcleo do BarberHub entra em todos os planos. O que muda é o nível de operação.
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
              <Card key={testimonial.name} className="p-5">
                <p className="text-sm leading-7 text-foreground">“{testimonial.quote}”</p>
                <div className="mt-5 border-t pt-4">
                  <p className="font-semibold text-foreground">{testimonial.name}</p>
                  <p className="text-sm text-muted-foreground">{testimonial.role}</p>
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
            <Card key={faq.question} className="p-5">
              <h3 className="font-semibold text-foreground">{faq.question}</h3>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">{faq.answer}</p>
            </Card>
          ))}
        </div>
      </section>

      <section id="contato" className="bg-primary text-primary-foreground">
        <div className="mx-auto flex max-w-7xl flex-col gap-6 px-5 py-14 md:flex-row md:items-center md:justify-between">
          <div className="max-w-2xl">
            <div className="mb-4 flex items-center gap-2 text-sm font-semibold text-primary-foreground/75">
              <ShieldCheck className="size-4 text-gold" />
              Pronto para testar com seus dados
            </div>
            <h2 className="text-3xl font-bold tracking-tight">Veja o BarberHub funcionando agora.</h2>
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
    </main>
  )
}
