'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { ArrowLeft, Loader2, MapPin, Save, Search, UserPlus } from 'lucide-react'
import { useAppData } from '@/components/data/app-data-provider'
import { PageHeader } from '@/components/page-header'
import { Button, buttonVariants } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import type { ClientTag } from '@/lib/types'

const weekDays = ['Segunda-feira', 'Terça-feira', 'Quarta-feira', 'Quinta-feira', 'Sexta-feira', 'Sábado', 'Domingo']

function formatCep(value: string) {
  const digits = value.replace(/\D/g, '').slice(0, 8)
  return digits.length > 5 ? `${digits.slice(0, 5)}-${digits.slice(5)}` : digits
}

function formatPhone(value: string) {
  const digits = value.replace(/\D/g, '').slice(0, 11)
  if (digits.length <= 2) return digits
  if (digits.length <= 7) return `(${digits.slice(0, 2)}) ${digits.slice(2)}`
  const split = digits.length === 11 ? 7 : 6
  return `(${digits.slice(0, 2)}) ${digits.slice(2, split)}-${digits.slice(split)}`
}

export default function NovoClientePage() {
  const router = useRouter()
  const { barbershop, employees, insertRecord } = useAppData()
  const [form, setForm] = useState({
    name: '', phone: '', email: '', birthDate: '', postalCode: '', address: '',
    addressNumber: '', addressComplement: '', neighborhood: '', city: '', state: '',
    preferredDay: '', preferredBarber: '', notes: '',
  })
  const [tags, setTags] = useState<ClientTag[]>([])
  const [status, setStatus] = useState('')
  const [cepStatus, setCepStatus] = useState('')
  const [searchingCep, setSearchingCep] = useState(false)
  const set = (key: keyof typeof form, value: string) => setForm((current) => ({ ...current, [key]: value }))

  async function searchCep() {
    const cep = form.postalCode.replace(/\D/g, '')
    if (cep.length !== 8) {
      setCepStatus('Informe um CEP com 8 dígitos.')
      return
    }
    setSearchingCep(true)
    setCepStatus('Buscando endereço...')
    try {
      const response = await fetch(`/api/cep/${cep}`)
      const data = await response.json() as {
        error?: string
        cep?: string
        street?: string
        complement?: string
        neighborhood?: string
        city?: string
        state?: string
      }
      if (!response.ok) {
        setCepStatus(data.error ?? 'CEP não encontrado.')
        return
      }
      setForm((current) => ({
        ...current,
        postalCode: formatCep(data.cep ?? current.postalCode),
        address: data.street ?? '',
        addressComplement: current.addressComplement || data.complement || '',
        neighborhood: data.neighborhood ?? '',
        city: data.city ?? '',
        state: data.state ?? '',
      }))
      setCepStatus('Endereço encontrado. Complete o número e o complemento.')
      window.setTimeout(() => document.getElementById('addressNumber')?.focus(), 0)
    } catch {
      setCepStatus('Não foi possível consultar o CEP. Preencha o endereço manualmente.')
    } finally {
      setSearchingCep(false)
    }
  }

  async function save() {
    if (!form.name.trim()) { setStatus('Informe o nome do cliente.'); return }
    if (form.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) { setStatus('Informe um e-mail válido.'); return }
    setStatus('Salvando...')
    const result = await insertRecord('clients', {
      barbershop_id: barbershop.id,
      name: form.name.trim(),
      phone: form.phone.trim() || null,
      email: form.email.trim() || null,
      birth_date: form.birthDate || null,
      postal_code: form.postalCode.replace(/\D/g, '') || null,
      address: form.address.trim() || null,
      address_number: form.addressNumber.trim() || null,
      address_complement: form.addressComplement.trim() || null,
      neighborhood: form.neighborhood.trim() || null,
      city: form.city.trim() || null,
      state: form.state.trim().toUpperCase() || null,
      preferred_day: form.preferredDay || null,
      preferred_barber: form.preferredBarber || null,
      notes: form.notes.trim() || null,
      tags,
    })
    if (result.error) { setStatus(result.error); return }
    router.push('/clientes')
  }

  return (
    <div>
      <PageHeader title="Novo cliente" description="Cadastre contato, endereço, preferências e observações.">
        <Link href="/clientes" className={buttonVariants({ variant: 'outline', size: 'sm' })}>
          <ArrowLeft className="size-4" />Voltar
        </Link>
      </PageHeader>

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_320px]">
        <div className="space-y-4">
          <Card className="p-5">
            <h2 className="mb-4 flex items-center gap-2 font-semibold"><UserPlus className="size-4" />Dados pessoais</h2>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Nome completo"><Input autoFocus value={form.name} onChange={(e) => set('name', e.target.value)} /></Field>
              <Field label="Telefone / WhatsApp"><Input inputMode="tel" placeholder="(99) 99999-9999" value={form.phone} onChange={(e) => set('phone', formatPhone(e.target.value))} /></Field>
              <Field label="E-mail (opcional)"><Input type="email" value={form.email} onChange={(e) => set('email', e.target.value)} /></Field>
              <Field label="Data de nascimento"><Input type="date" value={form.birthDate} onChange={(e) => set('birthDate', e.target.value)} /></Field>
            </div>
          </Card>

          <Card className="p-5">
            <h2 className="mb-4 flex items-center gap-2 font-semibold"><MapPin className="size-4" />Endereço</h2>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2 sm:max-w-xs">
                <Label htmlFor="postalCode">CEP</Label>
                <div className="flex gap-2">
                  <Input
                    id="postalCode"
                    inputMode="numeric"
                    placeholder="00000-000"
                    value={form.postalCode}
                    onChange={(e) => { set('postalCode', formatCep(e.target.value)); setCepStatus('') }}
                    onBlur={() => { if (form.postalCode.replace(/\D/g, '').length === 8 && !form.address) void searchCep() }}
                    onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); void searchCep() } }}
                  />
                  <Button type="button" variant="outline" size="icon" onClick={searchCep} disabled={searchingCep} aria-label="Buscar CEP">
                    {searchingCep ? <Loader2 className="size-4 animate-spin" /> : <Search className="size-4" />}
                  </Button>
                </div>
                {cepStatus ? <p className="text-xs text-muted-foreground">{cepStatus}</p> : null}
              </div>
              <div />
              <div className="sm:col-span-2"><Field label="Rua / Logradouro"><Input value={form.address} onChange={(e) => set('address', e.target.value)} /></Field></div>
              <Field label="Número"><Input id="addressNumber" value={form.addressNumber} onChange={(e) => set('addressNumber', e.target.value)} /></Field>
              <Field label="Complemento"><Input placeholder="Apartamento, bloco, referência..." value={form.addressComplement} onChange={(e) => set('addressComplement', e.target.value)} /></Field>
              <Field label="Bairro"><Input value={form.neighborhood} onChange={(e) => set('neighborhood', e.target.value)} /></Field>
              <Field label="Cidade"><Input value={form.city} onChange={(e) => set('city', e.target.value)} /></Field>
              <Field label="Estado (UF)"><Input maxLength={2} placeholder="RJ" value={form.state} onChange={(e) => set('state', e.target.value.toUpperCase().replace(/[^A-Z]/g, ''))} /></Field>
            </div>
          </Card>

          <Card className="p-5">
            <h2 className="mb-4 font-semibold">Preferências e observações</h2>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Barbeiro preferido"><Select value={form.preferredBarber} onChange={(e) => set('preferredBarber', e.target.value)}><option value="">Selecionar</option>{employees.filter((e) => e.active).map((e) => <option key={e.id} value={e.name}>{e.name}</option>)}</Select></Field>
              <Field label="Dia preferido"><Select value={form.preferredDay} onChange={(e) => set('preferredDay', e.target.value)}><option value="">Selecionar</option>{weekDays.map((day) => <option key={day} value={day}>{day}</option>)}</Select></Field>
              <div className="space-y-2 sm:col-span-2"><Label>Observações</Label><Textarea className="min-h-28" value={form.notes} onChange={(e) => set('notes', e.target.value)} /></div>
            </div>
          </Card>
        </div>

        <aside className="space-y-4 xl:sticky xl:top-4 xl:self-start">
          <Card className="p-5">
            <h3 className="mb-3 font-semibold">Classificação</h3>
            {([['vip', 'VIP'], ['recorrente', 'Recorrente'], ['aniversariante', 'Aniversariante'], ['inadimplente', 'Inadimplente']] as const).map(([tag, label]) => (
              <label key={tag} className="flex justify-between py-1.5 text-sm">
                <span>{label}</span>
                <input type="checkbox" checked={tags.includes(tag)} onChange={(e) => setTags((current) => e.target.checked ? [...current, tag] : current.filter((item) => item !== tag))} className="size-4 accent-[var(--primary)]" />
              </label>
            ))}
          </Card>
          {status ? <p className="text-sm text-muted-foreground">{status}</p> : null}
          <Button variant="gold" className="w-full" onClick={save}><Save className="size-4" />Salvar cliente</Button>
        </aside>
      </div>
    </div>
  )
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <div className="space-y-2"><Label>{label}</Label>{children}</div>
}
