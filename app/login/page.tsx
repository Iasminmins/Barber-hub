import Link from 'next/link'
import {
  ArrowRight,
  BarChart3,
  Building2,
  CalendarDays,
  CheckCircle2,
  Lock,
  Mail,
  Scissors,
  ShieldCheck,
} from 'lucide-react'
import { buttonVariants } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

export default function LoginPage() {
  return (
    <main className="grid min-h-screen bg-background lg:grid-cols-[1.05fr_0.95fr]">
      <section className="relative hidden overflow-hidden bg-primary text-primary-foreground lg:block">
        <div className="absolute inset-0 bg-[linear-gradient(140deg,rgba(255,255,255,0.08),transparent_35%,rgba(201,162,39,0.15))]" />
        <div className="relative flex min-h-screen flex-col justify-between p-10">
          <div className="flex items-center gap-3">
            <span className="flex size-11 items-center justify-center rounded-lg bg-primary-foreground/12 ring-1 ring-primary-foreground/12">
              <Scissors className="size-6" />
            </span>
            <div>
              <p className="font-bold">BarberHub</p>
              <p className="text-sm text-primary-foreground/70">Sua barbearia conectada</p>
            </div>
          </div>

          <div className="max-w-xl">
            <p className="mb-3 inline-flex rounded-md bg-primary-foreground/10 px-3 py-1 text-sm font-semibold text-primary-foreground/85">
              Ambiente de demonstração
            </p>
            <h1 className="text-4xl font-bold tracking-tight">
              Gestão completa para barbearias que querem crescer.
            </h1>
            <p className="mt-4 text-lg leading-8 text-primary-foreground/75">
              Agenda, comandas, clientes, planos, financeiro e alertas em uma operação simples de acompanhar.
            </p>
          </div>

          <div className="grid gap-4">
            <div className="grid grid-cols-3 gap-3">
              {[
                { label: 'Agenda hoje', value: '18 horários', icon: CalendarDays },
                { label: 'Receita semanal', value: 'R$ 24.780', icon: BarChart3 },
                { label: 'Planos ativos', value: '10 clientes', icon: ShieldCheck },
              ].map((item) => {
                const Icon = item.icon
                return (
                  <div key={item.label} className="rounded-lg bg-primary-foreground/10 p-4 ring-1 ring-primary-foreground/10">
                    <Icon className="mb-3 size-5 text-gold" />
                    <p className="text-xs text-primary-foreground/65">{item.label}</p>
                    <p className="mt-1 font-bold">{item.value}</p>
                  </div>
                )
              })}
            </div>
            <div className="rounded-lg bg-primary-foreground/10 p-4 ring-1 ring-primary-foreground/10">
              <div className="mb-3 flex items-center gap-2 text-sm font-semibold">
                <CheckCircle2 className="size-4 text-gold" />
                O que testar primeiro
              </div>
              <div className="grid grid-cols-3 gap-2 text-sm text-primary-foreground/75">
                <span>Dashboard por período</span>
                <span>Nova comanda</span>
                <span>Editor de planos</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="flex items-center justify-center p-4 lg:p-10">
        <Card className="w-full max-w-md p-6">
          <div className="mb-6 flex items-center gap-3">
            <span className="flex size-10 items-center justify-center rounded-lg bg-primary text-primary-foreground">
              <Building2 className="size-5" />
            </span>
            <div>
              <h1 className="text-xl font-bold text-foreground">Entrar no BarberHub</h1>
              <p className="text-sm text-muted-foreground">Acesse sua unidade e continue a operação.</p>
            </div>
          </div>

          <div className="mb-5 rounded-lg border border-border bg-muted/50 p-3 text-sm">
            <p className="mb-2 font-semibold text-foreground">Acesso de teste</p>
            <div className="space-y-1 text-muted-foreground">
              <p>
                E-mail: <span className="font-medium text-foreground">rafael@barberhub.com</span>
              </p>
              <p>
                Senha: <span className="font-medium text-foreground">123456</span>
              </p>
            </div>
          </div>

          <form className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">E-mail</Label>
              <div className="relative">
                <Mail className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                <Input id="email" type="email" defaultValue="rafael@barberhub.com" className="pl-9" />
              </div>
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="password">Senha</Label>
                <Link href="/login" className="text-xs font-semibold text-primary hover:underline">
                  Esqueci a senha
                </Link>
              </div>
              <div className="relative">
                <Lock className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                <Input id="password" type="password" defaultValue="123456" className="pl-9" />
              </div>
            </div>
            <Link href="/dashboard" className={buttonVariants({ variant: 'gold', className: 'w-full' })}>
              Entrar no painel
              <ArrowRight className="size-4" />
            </Link>
          </form>

          <p className="mt-6 text-center text-sm text-muted-foreground">
            Ainda não tem conta?{' '}
            <Link href="/cadastro" className="font-semibold text-primary hover:underline">
              Criar cadastro
            </Link>
          </p>
        </Card>
      </section>
    </main>
  )
}
