'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { type FormEvent, useState } from 'react'
import {
  AlertCircle,
  ArrowRight,
  BarChart3,
  Building2,
  CalendarDays,
  CheckCircle2,
  Eye,
  EyeOff,
  Layers,
  Loader2,
  Lock,
  Mail,
  Scissors,
  Sparkles,
} from 'lucide-react'
import { Label } from '@/components/ui/label'
import posthog from 'posthog-js'
import { createBrowserSupabaseClient, isSupabaseConfigured } from '@/lib/supabase/client'
import { readPlatformDestination } from '@/lib/platform-route'
import { cn } from '@/lib/utils'

const loginTimeoutMs = 15000

type FieldKey = 'email' | 'password'

const FEATURES = [
  { label: 'Agenda', value: 'Horários organizados', icon: CalendarDays },
  { label: 'Financeiro', value: 'Receitas e caixa', icon: BarChart3 },
  { label: 'Planos', value: 'Assinaturas e pacotes', icon: Layers },
]

const DAILY_OPS = ['Dashboard por período', 'Comandas no balcão', 'Clientes e recorrência']

const inputBaseClass =
  'h-11 w-full rounded-lg border border-lp-ink-900/12 bg-white text-sm text-lp-graphite shadow-sm outline-none transition-all duration-200 placeholder:text-lp-slate/50 focus:border-lp-gold-500 focus:ring-4 focus:ring-lp-gold-400/20'

const inputErrorClass = 'border-destructive focus:border-destructive focus:ring-destructive/20'

function withTimeout<T>(promise: PromiseLike<T>, message: string) {
  return Promise.race([
    Promise.resolve(promise),
    new Promise<never>((_, reject) => {
      window.setTimeout(() => reject(new Error(message)), loginTimeoutMs)
    }),
  ])
}

/** Ícone à esquerda do campo, com destaque quando o campo está em erro. */
function fieldIconClass(hasError: boolean) {
  return cn(
    'pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 transition-colors duration-150',
    hasError ? 'text-destructive' : 'text-lp-slate',
  )
}

export function LoginClient() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [status, setStatus] = useState('')
  const [invalidFields, setInvalidFields] = useState<FieldKey[]>([])
  const [loading, setLoading] = useState(false)

  function hasError(field: FieldKey) {
    return invalidFields.includes(field)
  }

  function clearError(field: FieldKey) {
    setInvalidFields((current) => (current.includes(field) ? current.filter((item) => item !== field) : current))
  }

  async function signIn() {
    setStatus('')
    setInvalidFields([])

    if (!isSupabaseConfigured()) {
      setStatus('Configure as variáveis NEXT_PUBLIC_SUPABASE_URL e NEXT_PUBLIC_SUPABASE_ANON_KEY.')
      return
    }

    if (!email.trim() || !password) {
      setStatus('Informe e-mail e senha para continuar.')
      setInvalidFields(
        ([['email', email.trim()], ['password', password]] as const)
          .filter(([, value]) => !value)
          .map(([field]) => field),
      )
      return
    }

    setLoading(true)
    try {
      const supabase = createBrowserSupabaseClient()
      const { data, error } = await withTimeout(
        supabase.auth.signInWithPassword({
          email: email.trim(),
          password,
        }),
        'O login demorou demais para responder. Atualize a página e tente novamente.',
      )

      if (error) {
        setStatus(error.message)
        setInvalidFields(['email', 'password'])
        return
      }

      if (!data.user || !data.session?.access_token) {
        setStatus('Não foi possível identificar a conta autenticada. Tente novamente.')
        return
      }

      posthog.identify(data.user.id, {
        email: data.user.email,
        name: data.user.user_metadata.owner_name,
      })

      const routeResponse = await withTimeout(fetch('/api/auth/platform-route', {
        method: 'POST',
        headers: { Authorization: `Bearer ${data.session.access_token}` },
      }), 'A validacao do acesso demorou demais. Tente novamente.')
      const routePayload = await routeResponse.json().catch(() => ({}))
      if (!routeResponse.ok) throw new Error(routePayload.error ?? 'Nao foi possivel validar o acesso.')
      const destination = readPlatformDestination(routePayload)
      if (destination === '/plataforma') await supabase.auth.signOut()
      router.replace(destination)
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
    <main className="lp-noise relative flex min-h-screen flex-col overflow-hidden bg-lp-cream-2 lg:grid lg:grid-cols-[1.05fr_0.95fr]">
      {/* --- Coluna esquerda: branding --- */}
      <section className="relative isolate overflow-hidden bg-lp-ink-900 text-lp-cream">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 -z-10"
          style={{ background: 'var(--lp-grad-ink)' }}
        />
        <div
          aria-hidden="true"
          className="lp-anim lp-fade pointer-events-none absolute inset-0 -z-10"
          style={{
            background:
              'radial-gradient(60% 50% at 78% 8%, oklch(0.46 0.05 168 / 0.5) 0%, transparent 70%)',
          }}
        />
        <div
          aria-hidden="true"
          className="lp-anim lp-fade pointer-events-none absolute inset-0 -z-10"
          style={{
            animationDelay: '120ms',
            background:
              'radial-gradient(42% 38% at 12% 92%, oklch(0.742 0.128 86 / 0.14) 0%, transparent 68%)',
          }}
        />
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 -z-10"
          style={{
            background:
              'radial-gradient(120% 100% at 50% 0%, transparent 42%, oklch(0.13 0.02 166 / 0.55) 100%)',
          }}
        />

        <div className="relative flex flex-col gap-9 px-4 py-6 sm:px-10 sm:py-10 lg:min-h-screen lg:justify-between lg:gap-10 lg:px-12 lg:py-12">
          <div className="flex items-center justify-between gap-4">
            <Link
              href="/"
              className="lp-anim lp-fade inline-flex items-center gap-2.5 rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-lp-gold-400 focus-visible:ring-offset-2 focus-visible:ring-offset-lp-ink-900"
            >
              <span className="flex size-10 items-center justify-center rounded-xl bg-lp-cream/12 ring-1 ring-lp-cream/15">
                <Scissors className="size-5" />
              </span>
              <span>
                <p className="text-[15px] font-bold leading-none tracking-tight">MeuBarberHub</p>
                <p className="mt-1.5 text-xs text-lp-cream/65">Sua barbearia conectada</p>
              </span>
            </Link>

            <span
              className="lp-anim lp-fade inline-flex items-center gap-1.5 rounded-full bg-lp-cream/10 px-3 py-1.5 text-[11px] font-semibold text-lp-cream/85 ring-1 ring-lp-cream/15 lg:hidden"
              style={{ animationDelay: '80ms' }}
            >
              <Sparkles className="size-3 text-lp-gold-400" />
              Operacional
            </span>
          </div>

          <div className="hidden lg:block lg:max-w-md">
            <p
              className="lp-anim lp-rise mb-5 inline-flex items-center gap-2 rounded-full bg-lp-cream/10 px-3.5 py-1.5 text-[13px] font-semibold text-lp-cream/90 ring-1 ring-lp-cream/15"
              style={{ animationDelay: '80ms' }}
            >
              <Sparkles className="size-3.5 text-lp-gold-400" />
              Plataforma operacional
            </p>
            <h1
              className="lp-anim lp-rise text-balance text-[clamp(1.85rem,2.6vw,2.35rem)] font-bold leading-[1.12] tracking-[-0.025em]"
              style={{ animationDelay: '160ms' }}
            >
              Gestão completa para barbearias que querem crescer.
            </h1>
            <p
              className="lp-anim lp-rise mt-4 text-[15px] leading-[1.65] text-lp-cream/75"
              style={{ animationDelay: '240ms' }}
            >
              Agenda, comandas, clientes, planos, financeiro e alertas em uma operação simples de acompanhar.
            </p>
          </div>

          <div className="hidden lg:grid lg:gap-4">
            <div className="grid grid-cols-3 gap-3">
              {FEATURES.map((item, index) => {
                const Icon = item.icon
                return (
                  <div
                    key={item.label}
                    className="lp-anim lp-rise rounded-xl bg-lp-cream/8 p-4 ring-1 ring-lp-cream/12"
                    style={{ animationDelay: `${320 + index * 60}ms` }}
                  >
                    <Icon className="mb-3 size-5 text-lp-gold-400" />
                    <p className="text-[11px] text-lp-cream/60">{item.label}</p>
                    <p className="mt-1 text-sm font-bold leading-tight">{item.value}</p>
                  </div>
                )
              })}
            </div>
            <div
              className="lp-anim lp-rise rounded-xl bg-lp-cream/8 p-4 ring-1 ring-lp-cream/12"
              style={{ animationDelay: '520ms' }}
            >
              <div className="mb-3 flex items-center gap-2 text-sm font-semibold">
                <CheckCircle2 className="size-4 text-lp-gold-400" />
                Feito para operação diária
              </div>
              <div className="grid grid-cols-3 gap-2 text-[13px] text-lp-cream/75">
                {DAILY_OPS.map((item) => (
                  <span key={item}>{item}</span>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* --- Coluna direita: login --- */}
      <section className="relative flex flex-1 items-center justify-center px-4 py-8 sm:px-8 sm:py-14 lg:px-12">
        <div className="lp-anim lp-card-in w-full max-w-md">
          <div className="rounded-2xl border border-lp-ink-900/8 bg-lp-cream p-5 shadow-[var(--lp-shadow-lg)] sm:p-7 lg:p-8">
            <div className="mb-6 flex flex-col items-start gap-3 sm:mb-7 sm:flex-row sm:items-center">
              <span className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-lp-ink-900 text-lp-cream ring-1 ring-lp-gold-400/30">
                <Building2 className="size-5" />
              </span>
              <div className="min-w-0">
                <h1 className="text-balance text-[1.375rem] font-bold leading-tight tracking-tight text-lp-graphite">
                  Entrar no MeuBarberHub
                </h1>
                <p className="mt-1 text-sm text-lp-slate">Acesse sua unidade e continue a operação.</p>
              </div>
            </div>

            <form className="space-y-5" onSubmit={submitLogin} noValidate>
              <div className="space-y-1.5">
                <Label htmlFor="email" className="text-[13px] font-semibold text-lp-graphite">
                  E-mail
                </Label>
                <div className="relative">
                  <Mail className={fieldIconClass(hasError('email'))} />
                  <input
                    id="email"
                    name="email"
                    type="email"
                    autoComplete="email"
                    value={email}
                    onChange={(event) => {
                      setEmail(event.target.value)
                      clearError('email')
                    }}
                    placeholder="voce@barbearia.com"
                    aria-invalid={hasError('email')}
                    aria-describedby={status ? 'login-status' : undefined}
                    className={cn(inputBaseClass, 'pl-10 pr-3.5', hasError('email') && inputErrorClass)}
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <Label htmlFor="password" className="text-[13px] font-semibold text-lp-graphite">
                    Senha
                  </Label>
                  <Link
                    href="/recuperar-senha"
                    className="rounded-sm text-xs font-semibold text-lp-ink-700 transition-colors duration-150 hover:text-lp-gold-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-lp-gold-400"
                  >
                    Esqueci a senha
                  </Link>
                </div>
                <div className="relative">
                  <Lock className={fieldIconClass(hasError('password'))} />
                  <input
                    id="password"
                    name="password"
                    type={showPassword ? 'text' : 'password'}
                    autoComplete="current-password"
                    value={password}
                    onChange={(event) => {
                      setPassword(event.target.value)
                      clearError('password')
                    }}
                    placeholder="Sua senha"
                    aria-invalid={hasError('password')}
                    aria-describedby={status ? 'login-status' : undefined}
                    className={cn(inputBaseClass, 'pl-10 pr-11', hasError('password') && inputErrorClass)}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((current) => !current)}
                    aria-label={showPassword ? 'Ocultar senha' : 'Mostrar senha'}
                    aria-pressed={showPassword}
                    className="absolute right-1 top-1/2 flex size-9 -translate-y-1/2 cursor-pointer items-center justify-center rounded-md text-lp-slate transition-colors duration-150 hover:bg-lp-ink-900/5 hover:text-lp-graphite focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-lp-gold-400"
                  >
                    {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                  </button>
                </div>
              </div>

              {status ? (
                <p
                  id="login-status"
                  role="alert"
                  className="flex items-start gap-2 rounded-lg border border-destructive/30 bg-destructive/8 p-3 text-sm font-medium text-destructive"
                >
                  <AlertCircle className="mt-0.5 size-4 shrink-0" />
                  <span>{status}</span>
                </p>
              ) : null}

              <button
                type="submit"
                disabled={loading}
                className="group inline-flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-lp-gold-500 text-[15px] font-bold text-lp-gold-ink shadow-[var(--lp-shadow-gold)] transition-all duration-200 hover:-translate-y-0.5 hover:bg-lp-gold-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-lp-gold-300 focus-visible:ring-offset-2 focus-visible:ring-offset-lp-cream active:translate-y-0 disabled:pointer-events-none disabled:opacity-70 disabled:hover:translate-y-0"
              >
                {loading ? (
                  <>
                    <Loader2 className="size-4 animate-spin" />
                    Entrando...
                  </>
                ) : (
                  <>
                    Entrar no painel
                    <ArrowRight className="size-4 transition-transform duration-200 group-hover:translate-x-1" />
                  </>
                )}
              </button>
            </form>

            <p className="mt-6 text-center text-sm text-lp-slate sm:mt-7">
              Ainda não tem conta?{' '}
              <Link
                href="/cadastro"
                className="rounded-sm font-semibold text-lp-ink-700 underline-offset-4 transition-colors duration-150 hover:text-lp-gold-600 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-lp-gold-400"
              >
                Criar cadastro
              </Link>
            </p>
          </div>
        </div>
      </section>
    </main>
  )
}
