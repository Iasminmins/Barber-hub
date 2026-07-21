'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { type FormEvent, useState } from 'react'
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
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { createBrowserSupabaseClient, isSupabaseConfigured } from '@/lib/supabase/client'

const loginTimeoutMs = 15000

function withTimeout<T>(promise: PromiseLike<T>, message: string) {
  return Promise.race([
    Promise.resolve(promise),
    new Promise<never>((_, reject) => {
      window.setTimeout(() => reject(new Error(message)), loginTimeoutMs)
    }),
  ])
}

export function LoginClient() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [status, setStatus] = useState('')
  const [loading, setLoading] = useState(false)

  async function signIn() {
    setStatus('')

    if (!isSupabaseConfigured()) {
      setStatus('Configure as variáveis NEXT_PUBLIC_SUPABASE_URL e NEXT_PUBLIC_SUPABASE_ANON_KEY.')
      return
    }

    if (!email.trim() || !password) {
      setStatus('Informe e-mail e senha.')
      return
    }

    setLoading(true)
    try {
      const supabase = createBrowserSupabaseClient()
      const { error } = await withTimeout(
        supabase.auth.signInWithPassword({
          email: email.trim(),
          password,
        }),
        'O login demorou demais para responder. Atualize a página e tente novamente.',
      )

      if (error) {
        setStatus(error.message)
        return
      }

      router.push('/dashboard')
      router.refresh()
    } catch (error) {
      setStatus(error instanceof Error ? error.message : 'Não foi possível entrar agora. Tente novamente.')
    } finally {
      setLoading(false)
    }
  }

  function submitLogin(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!loading) {
      void signIn()
    }
  }

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
              Plataforma operacional
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
                { label: 'Agenda', value: 'Horários organizados', icon: CalendarDays },
                { label: 'Financeiro', value: 'Receitas e caixa', icon: BarChart3 },
                { label: 'Planos', value: 'Assinaturas e pacotes', icon: ShieldCheck },
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
                Feito para operação diária
              </div>
              <div className="grid grid-cols-3 gap-2 text-sm text-primary-foreground/75">
                <span>Dashboard por período</span>
                <span>Comandas no balcão</span>
                <span>Clientes e recorrência</span>
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

          <form className="space-y-4" onSubmit={submitLogin}>
            <div className="space-y-2">
              <Label htmlFor="email">E-mail</Label>
              <div className="relative">
                <Mail className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                <Input id="email" type="email" value={email} onChange={(event) => setEmail(event.target.value)} className="pl-9" />
              </div>
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="password">Senha</Label>
                <Link href="/recuperar-senha" className="text-xs font-semibold text-primary hover:underline">
                  Esqueci a senha
                </Link>
              </div>
              <div className="relative">
                <Lock className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                <Input id="password" type="password" value={password} onChange={(event) => setPassword(event.target.value)} className="pl-9" />
              </div>
            </div>
            {status ? <p className="text-sm font-medium text-destructive">{status}</p> : null}
            <Button type="submit" variant="gold" className="w-full" disabled={loading}>
              {loading ? 'Entrando...' : 'Entrar no painel'}
              <ArrowRight className="size-4" />
            </Button>
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
