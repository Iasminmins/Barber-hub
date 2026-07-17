'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import {
  ArrowLeft,
  ArrowRight,
  Building2,
  CheckCircle2,
  Mail,
  Scissors,
  Store,
  User,
} from 'lucide-react'
import { Button, buttonVariants } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select } from '@/components/ui/select'
import {
  FREE_TRIAL_DESCRIPTION,
  FREE_TRIAL_LABEL,
  getSaasPlan,
  saasPlans,
  type SaasPlanId,
} from '@/lib/saas-plans'
import { createBrowserSupabaseClient, isSupabaseConfigured } from '@/lib/supabase/client'
import { cn } from '@/lib/utils'

export function CadastroClient({ selectedPlanId }: { selectedPlanId: SaasPlanId }) {
  const router = useRouter()
  const selectedPlan = getSaasPlan(selectedPlanId)
  const [owner, setOwner] = useState('')
  const [email, setEmail] = useState('')
  const [shop, setShop] = useState('')
  const [city, setCity] = useState('')
  const [plan, setPlan] = useState<SaasPlanId>(selectedPlanId)
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [status, setStatus] = useState('')
  const [loading, setLoading] = useState(false)

  async function createAccount() {
    setStatus('')

    if (!isSupabaseConfigured()) {
      setStatus('Configure as variáveis NEXT_PUBLIC_SUPABASE_URL e NEXT_PUBLIC_SUPABASE_ANON_KEY.')
      return
    }

    if (!owner.trim() || !email.trim() || !shop.trim() || !password) {
      setStatus('Preencha nome, e-mail, barbearia e senha.')
      return
    }

    if (password !== confirm) {
      setStatus('As senhas não conferem.')
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
          plan,
        },
      },
    })

    if (error) {
      setLoading(false)
      setStatus(error.message)
      return
    }

    if (data.session) {
      const { error: onboardingError } = await supabase.rpc('create_barbershop_for_current_user', {
        barbershop_name: shop.trim(),
        barbershop_city: city.trim() || null,
        owner_name: owner.trim(),
      })

      if (onboardingError) {
        setLoading(false)
        setStatus(onboardingError.message)
        return
      }

      router.push('/dashboard')
      return
    }

    setLoading(false)
    setStatus('Cadastro criado. Confirme seu e-mail e depois entre pelo login.')
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-background p-4">
      <Card className="w-full max-w-4xl p-6">
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <span className="flex size-10 items-center justify-center rounded-lg bg-primary text-primary-foreground">
              <Scissors className="size-5" />
            </span>
            <div>
              <h1 className="text-xl font-bold text-foreground">Criar cadastro</h1>
              <p className="text-sm text-muted-foreground">Configure sua primeira barbearia no BarberHub.</p>
            </div>
          </div>
          <Link href="/login" className={buttonVariants({ variant: 'outline', size: 'sm' })}>
            <ArrowLeft className="size-4" />
            Login
          </Link>
        </div>

        <div className="grid gap-5 lg:grid-cols-[1fr_320px]">
          <form className="grid gap-4 sm:grid-cols-2" onSubmit={(event) => event.preventDefault()}>
            <div className="space-y-2">
              <Label htmlFor="owner">Seu nome</Label>
              <div className="relative">
                <User className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                <Input id="owner" value={owner} onChange={(event) => setOwner(event.target.value)} placeholder="Seu nome" className="pl-9" />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">E-mail</Label>
              <div className="relative">
                <Mail className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                <Input id="email" type="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="voce@barbearia.com" className="pl-9" />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="shop">Nome da barbearia</Label>
              <div className="relative">
                <Store className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                <Input id="shop" value={shop} onChange={(event) => setShop(event.target.value)} placeholder="Nome da sua barbearia" className="pl-9" />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="city">Cidade</Label>
              <div className="relative">
                <Building2 className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                <Input id="city" value={city} onChange={(event) => setCity(event.target.value)} placeholder="Cidade, UF" className="pl-9" />
              </div>
            </div>
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="plan">Plano da conta</Label>
              <Select id="plan" value={plan} onChange={(event) => setPlan(event.target.value as SaasPlanId)}>
                {saasPlans.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.name} - {item.price}/mês
                  </option>
                ))}
              </Select>
              <div className="rounded-md border border-success/30 bg-success/10 p-3 text-sm">
                <p className="font-semibold text-foreground">{FREE_TRIAL_LABEL} incluído</p>
                <p className="mt-1 text-muted-foreground">{FREE_TRIAL_DESCRIPTION}</p>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Senha</Label>
              <Input id="password" type="password" value={password} onChange={(event) => setPassword(event.target.value)} placeholder="Crie uma senha" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirm">Confirmar senha</Label>
              <Input id="confirm" type="password" value={confirm} onChange={(event) => setConfirm(event.target.value)} placeholder="Repita a senha" />
            </div>
            {status ? <p className="text-sm font-medium text-muted-foreground sm:col-span-2">{status}</p> : null}
            <div className="sm:col-span-2">
              <Button type="button" variant="gold" className="w-full" onClick={createAccount} disabled={loading}>
                {loading ? 'Criando conta...' : `Criar conta com ${FREE_TRIAL_LABEL}`}
                <ArrowRight className="size-4" />
              </Button>
            </div>
          </form>

          <div className="rounded-lg border bg-muted/25 p-4">
            <p className="text-sm font-semibold text-muted-foreground">Plano selecionado</p>
            <div className="mt-2 flex items-end justify-between gap-3">
              <div>
                <h2 className="text-2xl font-bold text-foreground">{selectedPlan.name}</h2>
                <p className="text-sm text-muted-foreground">{selectedPlan.shortDescription}</p>
              </div>
              <p className="shrink-0 text-xl font-bold text-foreground">{selectedPlan.price}</p>
            </div>
            <div className="mt-4 rounded-lg bg-success/10 p-3">
              <p className="text-sm font-semibold text-foreground">{FREE_TRIAL_LABEL}</p>
              <p className="text-xs text-muted-foreground">Primeira cobrança somente após 30 dias.</p>
            </div>
            <div className="mt-5 space-y-3">
              {selectedPlan.items.map((item) => (
                <div key={item} className="flex items-center gap-2 text-sm">
                  <CheckCircle2 className="size-4 text-success" />
                  <span className="text-foreground">{item}</span>
                </div>
              ))}
            </div>
            <div className="mt-5 grid grid-cols-2 gap-2 text-xs">
              {saasPlans.map((item) => (
                <Link
                  key={item.id}
                  href={`/cadastro?plano=${item.id}`}
                  className={cn(
                    'rounded-md border px-3 py-2 text-center font-medium',
                    selectedPlanId === item.id
                      ? 'border-primary bg-primary text-primary-foreground'
                      : 'bg-card text-foreground hover:bg-muted',
                    item.id === 'premium' && 'col-span-2',
                  )}
                >
                  {item.name}
                </Link>
              ))}
            </div>
          </div>
        </div>
      </Card>
    </main>
  )
}
