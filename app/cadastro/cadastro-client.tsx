'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { type FormEvent, useState } from 'react'
import {
  AlertCircle,
  ArrowRight,
  Building2,
  Check,
  CheckCircle2,
  CreditCard,
  Eye,
  EyeOff,
  IdCard,
  Lock,
  Mail,
  Scissors,
  ShieldCheck,
  Store,
  User,
} from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  FREE_TRIAL_DAYS,
  FREE_TRIAL_DESCRIPTION,
  FREE_TRIAL_LABEL,
  getSaasPlan,
  saasPlans,
  type SaasPlanId,
} from '@/lib/saas-plans'
import posthog from 'posthog-js'
import { createBrowserSupabaseClient, isSupabaseConfigured } from '@/lib/supabase/client'
import { cn } from '@/lib/utils'
import { formatBillingDocument, isValidBillingDocument, onlyDigits } from '@/lib/billing-document'

type FieldKey = 'owner' | 'email' | 'shop' | 'city' | 'billingDocument' | 'password' | 'confirm'

/** Classes aplicadas a um campo em erro, sobre o estado padrão do `Input`. */
const fieldErrorClass =
  'border-destructive focus-visible:border-destructive focus-visible:ring-destructive/30'

/** Ícone à esquerda do campo, com destaque quando o campo está em erro. */
function fieldIconClass(hasError: boolean) {
  return cn(
    'pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 transition-colors',
    hasError ? 'text-destructive' : 'text-muted-foreground',
  )
}

export function CadastroClient({ selectedPlanId }: { selectedPlanId: SaasPlanId }) {
  const router = useRouter()
  const [owner, setOwner] = useState('')
  const [email, setEmail] = useState('')
  const [shop, setShop] = useState('')
  const [city, setCity] = useState('')
  const [billingDocument, setBillingDocument] = useState('')
  const [plan, setPlan] = useState<SaasPlanId>(selectedPlanId)
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [status, setStatus] = useState('')
  const [statusTone, setStatusTone] = useState<'error' | 'success'>('error')
  const [invalidFields, setInvalidFields] = useState<FieldKey[]>([])
  const [loading, setLoading] = useState(false)

  // O resumo lateral acompanha o plano escolhido no formulário — uma única fonte.
  const selectedPlan = getSaasPlan(plan)

  const passwordRules = [
    { id: 'length', label: 'Pelo menos 8 caracteres', done: password.length >= 8 },
    { id: 'match', label: 'Senha e confirmação iguais', done: password.length > 0 && password === confirm },
  ]

  function hasError(field: FieldKey) {
    return invalidFields.includes(field)
  }

  function clearError(field: FieldKey) {
    setInvalidFields((current) => (current.includes(field) ? current.filter((item) => item !== field) : current))
  }

  function showError(message: string, fields: FieldKey[] = []) {
    setStatusTone('error')
    setStatus(message)
    setInvalidFields(fields)
  }

  async function createAccount() {
    setStatus('')
    setInvalidFields([])

    if (!isSupabaseConfigured()) {
      showError('Configure as variáveis NEXT_PUBLIC_SUPABASE_URL e NEXT_PUBLIC_SUPABASE_ANON_KEY.')
      return
    }

    if (!owner.trim() || !email.trim() || !shop.trim() || !billingDocument.trim() || !password) {
      showError(
        'Preencha nome, e-mail, barbearia, CPF/CNPJ e senha.',
        (
          [
            ['owner', owner.trim()],
            ['email', email.trim()],
            ['shop', shop.trim()],
            ['billingDocument', billingDocument.trim()],
            ['password', password],
          ] as const
        )
          .filter(([, value]) => !value)
          .map(([field]) => field),
      )
      return
    }

    if (!isValidBillingDocument(billingDocument)) {
      showError('Informe um CPF ou CNPJ válido, com 11 ou 14 dígitos.', ['billingDocument'])
      return
    }

    if (password !== confirm) {
      showError('As senhas não conferem.', ['password', 'confirm'])
      return
    }
    if (password.length < 8) {
      showError('A senha deve ter pelo menos 8 caracteres.', ['password'])
      return
    }

    setLoading(true)
    const supabase = createBrowserSupabaseClient()
    const { data, error } = await supabase.auth.signUp({
      email: email.trim(),
      password,
      options: {
        data: {
          owner_name: owner.trim(),
          barbershop_name: shop.trim(),
          barbershop_city: city.trim(),
          barbershop_document: onlyDigits(billingDocument),
          plan,
        },
      },
    })

    if (error) {
      setLoading(false)
      showError(error.message)
      return
    }

    if (data.session && data.user) {
      posthog.identify(data.user.id, {
        email: data.user.email,
        name: owner.trim(),
      })

      const { error: onboardingError } = await supabase.rpc('create_barbershop_for_current_user', {
        barbershop_name: shop.trim(),
        barbershop_city: city.trim() || null,
        owner_name: owner.trim(),
        selected_plan: plan,
        billing_document: onlyDigits(billingDocument),
      })

      if (onboardingError) {
        setLoading(false)
        showError(onboardingError.message)
        return
      }

      try {
        const welcomeResponse = await fetch('/api/auth/welcome', {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${data.session.access_token}`,
          },
        })

        if (!welcomeResponse.ok) {
          console.error('Welcome email could not be sent.')
        }
      } catch {
        console.error('Welcome email could not be sent.')
      }

      router.push('/dashboard')
      return
    }

    setLoading(false)
    setStatusTone('success')
    setStatus('Cadastro criado. Confirme seu e-mail e depois entre pelo login.')
  }

  function submitAccount(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!loading) {
      void createAccount()
    }
  }

  return (
    <main className="min-h-screen bg-background">
      <div className="mx-auto flex min-h-screen w-full max-w-5xl flex-col justify-center gap-5 px-4 py-8 sm:px-6 lg:gap-6 lg:py-12">
        <header className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2">
          <Link
            href="/"
            className="flex items-center gap-2.5 rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-4 focus-visible:ring-offset-background"
          >
            <span className="flex size-9 items-center justify-center rounded-lg bg-primary text-primary-foreground shadow-sm">
              <Scissors className="size-5" />
            </span>
            <span className="text-lg font-bold tracking-tight text-foreground">BarberHub</span>
          </Link>
          <p className="text-[0.8125rem] text-muted-foreground sm:text-sm">
            Já possui uma conta?{' '}
            <Link
              href="/login"
              className="rounded-sm font-semibold text-primary underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
            >
              Entrar
            </Link>
          </p>
        </header>

        <Card className="overflow-hidden shadow-md">
          <div className="grid lg:grid-cols-[minmax(0,1fr)_20.5rem]">
            {/* Coluna do formulário — primeira no DOM, portanto primeira no celular. */}
            <form className="p-5 sm:p-7 lg:p-8" onSubmit={submitAccount} noValidate>
              <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-[1.75rem]">
                Criar sua conta
              </h1>
              <p className="mt-2 max-w-md text-sm leading-6 text-muted-foreground">
                Configure sua primeira barbearia no BarberHub e comece com {FREE_TRIAL_LABEL}.
              </p>

              <section className="mt-7" aria-labelledby="grupo-dados">
                <h2 id="grupo-dados" className="text-sm font-semibold text-foreground">
                  Seus dados
                </h2>
                <div className="mt-3 grid gap-4 sm:grid-cols-2">
                  <div className="space-y-1.5">
                    <Label htmlFor="owner">Seu nome</Label>
                    <div className="relative">
                      <User className={fieldIconClass(hasError('owner'))} />
                      <Input
                        id="owner"
                        name="owner"
                        autoComplete="name"
                        value={owner}
                        onChange={(event) => {
                          setOwner(event.target.value)
                          clearError('owner')
                        }}
                        placeholder="Seu nome"
                        aria-invalid={hasError('owner')}
                        aria-describedby={status ? 'cadastro-status' : undefined}
                        className={cn('h-11 pl-9', hasError('owner') && fieldErrorClass)}
                      />
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="email">E-mail</Label>
                    <div className="relative">
                      <Mail className={fieldIconClass(hasError('email'))} />
                      <Input
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
                        aria-describedby={status ? 'cadastro-status' : undefined}
                        className={cn('h-11 pl-9', hasError('email') && fieldErrorClass)}
                      />
                    </div>
                  </div>
                </div>
              </section>

              <section className="mt-6 border-t border-border pt-6" aria-labelledby="grupo-barbearia">
                <h2 id="grupo-barbearia" className="text-sm font-semibold text-foreground">
                  Sua barbearia
                </h2>
                <div className="mt-3 grid gap-4 sm:grid-cols-2">
                  <div className="space-y-1.5">
                    <Label htmlFor="shop">Nome da barbearia</Label>
                    <div className="relative">
                      <Store className={fieldIconClass(hasError('shop'))} />
                      <Input
                        id="shop"
                        name="shop"
                        autoComplete="organization"
                        value={shop}
                        onChange={(event) => {
                          setShop(event.target.value)
                          clearError('shop')
                        }}
                        placeholder="Nome da sua barbearia"
                        aria-invalid={hasError('shop')}
                        aria-describedby={status ? 'cadastro-status' : undefined}
                        className={cn('h-11 pl-9', hasError('shop') && fieldErrorClass)}
                      />
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="city">
                      Cidade <span className="font-normal text-muted-foreground">(opcional)</span>
                    </Label>
                    <div className="relative">
                      <Building2 className={fieldIconClass(false)} />
                      <Input
                        id="city"
                        name="city"
                        autoComplete="address-level2"
                        value={city}
                        onChange={(event) => setCity(event.target.value)}
                        placeholder="Cidade, UF"
                        className="h-11 pl-9"
                      />
                    </div>
                  </div>
                  <div className="space-y-1.5 sm:col-span-2">
                    <Label htmlFor="billingDocument">CPF ou CNPJ</Label>
                    <div className="relative">
                      <IdCard className={fieldIconClass(hasError('billingDocument'))} />
                      <Input
                        id="billingDocument"
                        name="billingDocument"
                        inputMode="numeric"
                        value={billingDocument}
                        onChange={(event) => {
                          setBillingDocument(formatBillingDocument(event.target.value))
                          clearError('billingDocument')
                        }}
                        placeholder="CPF ou CNPJ do responsável"
                        aria-invalid={hasError('billingDocument')}
                        aria-describedby={
                          status ? 'cadastro-status documento-ajuda' : 'documento-ajuda'
                        }
                        className={cn('h-11 pl-9', hasError('billingDocument') && fieldErrorClass)}
                      />
                    </div>
                    <p id="documento-ajuda" className="text-xs text-muted-foreground">
                      Usado apenas na emissão da cobrança, depois do período de teste.
                    </p>
                  </div>
                </div>
              </section>

              <fieldset aria-labelledby="grupo-plano" className="mt-6 border-t border-border pt-6">
                <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
                  <h2 id="grupo-plano" className="text-sm font-semibold text-foreground">
                    Plano da conta
                  </h2>
                  <p className="text-xs text-muted-foreground">Você pode ajustar depois no painel.</p>
                </div>
                <div className="mt-3 space-y-2.5">
                  {saasPlans.map((item) => {
                    const isSelected = plan === item.id
                    return (
                      <label
                        key={item.id}
                        htmlFor={`plano-${item.id}`}
                        className={cn(
                          'flex cursor-pointer items-center gap-3 rounded-lg border p-3 transition-colors sm:gap-4 sm:p-3.5',
                          'has-focus-visible:ring-2 has-focus-visible:ring-ring has-focus-visible:ring-offset-2 has-focus-visible:ring-offset-card',
                          isSelected
                            ? 'border-primary bg-primary/8 ring-1 ring-primary/30'
                            : 'border-border bg-card hover:border-primary/40 hover:bg-muted/50',
                        )}
                      >
                        <input
                          id={`plano-${item.id}`}
                          type="radio"
                          name="plan"
                          value={item.id}
                          checked={isSelected}
                          onChange={() => setPlan(item.id)}
                          className="sr-only"
                        />
                        <span
                          aria-hidden="true"
                          className={cn(
                            'flex size-5 shrink-0 items-center justify-center rounded-full border-2 transition-colors',
                            isSelected ? 'border-primary bg-primary' : 'border-input bg-card',
                          )}
                        >
                          {isSelected ? <Check className="size-3 text-primary-foreground" /> : null}
                        </span>
                        <span className="min-w-0 flex-1">
                          <span className="flex flex-wrap items-center gap-x-2 gap-y-1">
                            <span className="font-semibold text-foreground">{item.name}</span>
                            {item.featured ? (
                              <Badge variant="gold" className="px-2 py-0 text-[11px]">
                                Mais escolhido
                              </Badge>
                            ) : null}
                          </span>
                          <span className="mt-0.5 block text-xs text-muted-foreground">
                            {item.units} · {item.users}
                          </span>
                        </span>
                        <span className="shrink-0 text-right">
                          <span className="block font-semibold text-foreground">{item.price}</span>
                          <span className="block text-xs text-muted-foreground">/mês</span>
                        </span>
                      </label>
                    )
                  })}
                </div>
              </fieldset>

              <section className="mt-6 border-t border-border pt-6" aria-labelledby="grupo-acesso">
                <h2 id="grupo-acesso" className="text-sm font-semibold text-foreground">
                  Senha de acesso
                </h2>
                <div className="mt-3 grid gap-4 sm:grid-cols-2">
                  <div className="space-y-1.5">
                    <Label htmlFor="password">Senha</Label>
                    <div className="relative">
                      <Lock className={fieldIconClass(hasError('password'))} />
                      <Input
                        id="password"
                        name="password"
                        type={showPassword ? 'text' : 'password'}
                        autoComplete="new-password"
                        value={password}
                        onChange={(event) => {
                          setPassword(event.target.value)
                          clearError('password')
                          clearError('confirm')
                        }}
                        placeholder="Crie uma senha"
                        aria-invalid={hasError('password')}
                        aria-describedby={
                          status ? 'cadastro-status requisitos-senha' : 'requisitos-senha'
                        }
                        className={cn('h-11 pl-9 pr-11', hasError('password') && fieldErrorClass)}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword((current) => !current)}
                        aria-label={showPassword ? 'Ocultar senha' : 'Mostrar senha'}
                        aria-pressed={showPassword}
                        className="absolute right-1 top-1/2 flex size-9 -translate-y-1/2 cursor-pointer items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                      >
                        {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                      </button>
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="confirm">Confirmar senha</Label>
                    <div className="relative">
                      <Lock className={fieldIconClass(hasError('confirm'))} />
                      <Input
                        id="confirm"
                        name="confirm"
                        type={showConfirm ? 'text' : 'password'}
                        autoComplete="new-password"
                        value={confirm}
                        onChange={(event) => {
                          setConfirm(event.target.value)
                          clearError('confirm')
                        }}
                        placeholder="Repita a senha"
                        aria-invalid={hasError('confirm')}
                        aria-describedby={
                          status ? 'cadastro-status requisitos-senha' : 'requisitos-senha'
                        }
                        className={cn('h-11 pl-9 pr-11', hasError('confirm') && fieldErrorClass)}
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirm((current) => !current)}
                        aria-label={showConfirm ? 'Ocultar confirmação de senha' : 'Mostrar confirmação de senha'}
                        aria-pressed={showConfirm}
                        className="absolute right-1 top-1/2 flex size-9 -translate-y-1/2 cursor-pointer items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                      >
                        {showConfirm ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                      </button>
                    </div>
                  </div>
                </div>
                <ul id="requisitos-senha" className="mt-3 grid gap-1.5 sm:grid-cols-2">
                  {passwordRules.map((rule) => (
                    <li
                      key={rule.id}
                      className={cn(
                        'flex items-center gap-2 text-xs transition-colors',
                        rule.done ? 'text-success' : 'text-muted-foreground',
                      )}
                    >
                      <span
                        aria-hidden="true"
                        className={cn(
                          'flex size-4 shrink-0 items-center justify-center rounded-full border transition-colors',
                          rule.done ? 'border-success bg-success/15' : 'border-border',
                        )}
                      >
                        {rule.done ? <Check className="size-2.5" /> : null}
                      </span>
                      {rule.label}
                    </li>
                  ))}
                </ul>
              </section>

              {status ? (
                <p
                  id="cadastro-status"
                  role="alert"
                  className={cn(
                    'mt-6 flex items-start gap-2 rounded-lg border p-3 text-sm font-medium',
                    statusTone === 'success'
                      ? 'border-success/30 bg-success/10 text-foreground'
                      : 'border-destructive/30 bg-destructive/8 text-destructive',
                  )}
                >
                  {statusTone === 'success' ? (
                    <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-success" />
                  ) : (
                    <AlertCircle className="mt-0.5 size-4 shrink-0" />
                  )}
                  <span>{status}</span>
                </p>
              ) : null}

              <Button
                type="submit"
                variant="gold"
                size="lg"
                className="mt-6 h-12 w-full text-[0.9375rem] font-semibold"
                disabled={loading}
              >
                {loading ? 'Criando conta...' : `Criar conta com ${FREE_TRIAL_LABEL}`}
                {loading ? null : <ArrowRight className="size-4" />}
              </Button>
              <p className="mt-3 flex items-center justify-center gap-1.5 text-xs text-muted-foreground">
                <CreditCard className="size-3.5 shrink-0" />
                Nenhum cartão de crédito é necessário para começar.
              </p>
            </form>

            {/* Resumo do plano — segunda no DOM, portanto abaixo do formulário no celular. */}
            <aside
              aria-label="Resumo do plano selecionado"
              className="border-t border-border bg-muted/30 p-5 sm:p-7 lg:border-l lg:border-t-0 lg:p-8"
            >
              {/* Acompanha a rolagem só quando a janela é alta o bastante para exibir o resumo inteiro. */}
              <div className="lg:[@media(min-height:56rem)]:sticky lg:[@media(min-height:56rem)]:top-8">
                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Resumo do plano
                </p>

                <h2 className="mt-3 text-2xl font-bold tracking-tight text-foreground">
                  {selectedPlan.name}
                </h2>
                <p className="mt-1.5 text-sm leading-6 text-muted-foreground">
                  {selectedPlan.shortDescription}
                </p>

                <p className="mt-4 flex items-baseline gap-1.5">
                  <span className="text-[2rem] font-bold leading-none tracking-tight text-foreground">
                    {selectedPlan.price}
                  </span>
                  <span className="text-sm font-medium text-muted-foreground">/mês</span>
                </p>
                <p className="mt-2 text-xs leading-5 text-muted-foreground">
                  Cobrado somente depois dos {FREE_TRIAL_DAYS} dias de teste.
                </p>

                <div className="mt-5 rounded-lg border border-success/30 bg-success/10 p-3.5">
                  <p className="flex items-center gap-2 text-sm font-semibold text-foreground">
                    <ShieldCheck className="size-4 shrink-0 text-success" />
                    {FREE_TRIAL_LABEL}
                  </p>
                  <p className="mt-1.5 text-xs leading-5 text-muted-foreground">
                    {FREE_TRIAL_DESCRIPTION}
                  </p>
                </div>

                <div className="mt-6 border-t border-border pt-5">
                  <p className="text-sm font-semibold text-foreground">O que está incluído</p>
                  <ul className="mt-3 space-y-2.5">
                    {selectedPlan.items.map((item) => (
                      <li key={item} className="flex items-start gap-2 text-sm">
                        <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-success" />
                        <span className="text-foreground">{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <dl className="mt-5 space-y-2 border-t border-border pt-5 text-sm">
                  {[
                    ['Unidades', selectedPlan.units],
                    ['Usuários', selectedPlan.users],
                    ['Relatórios', selectedPlan.reports],
                    ['Suporte', selectedPlan.support],
                  ].map(([label, value]) => (
                    <div key={label} className="flex items-start justify-between gap-3">
                      <dt className="text-muted-foreground">{label}</dt>
                      <dd className="text-right font-medium text-foreground">{value}</dd>
                    </div>
                  ))}
                </dl>
              </div>
            </aside>
          </div>
        </Card>

        <p className="text-center text-xs leading-5 text-muted-foreground">
          Ao criar sua conta você concorda com os{' '}
          <Link href="/termos" className="font-medium text-foreground underline underline-offset-2 hover:text-primary">
            Termos de uso
          </Link>{' '}
          e a{' '}
          <Link href="/privacidade" className="font-medium text-foreground underline underline-offset-2 hover:text-primary">
            Política de privacidade
          </Link>
          .
        </p>
      </div>
    </main>
  )
}
