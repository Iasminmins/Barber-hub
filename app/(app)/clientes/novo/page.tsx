'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { ArrowLeft, Save, UserPlus } from 'lucide-react'
import { useAppData } from '@/components/data/app-data-provider'
import { PageHeader } from '@/components/page-header'
import { Button, buttonVariants } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import type { ClientTag } from '@/lib/types'

export default function NovoClientePage() {
  const router = useRouter()
  const { barbershop, employees, insertRecord } = useAppData()
  const [form, setForm] = useState({ name:'', phone:'', email:'', birthDate:'', preferredBarber:'', address:'', notes:'' })
  const [tags, setTags] = useState<ClientTag[]>([])
  const [status, setStatus] = useState('')
  const set = (key: keyof typeof form, value: string) => setForm((current) => ({ ...current, [key]: value }))
  async function save() {
    if (!form.name.trim()) { setStatus('Informe o nome do cliente.'); return }
    setStatus('Salvando...')
    const result = await insertRecord('clients', { barbershop_id: barbershop.id, name: form.name.trim(), phone: form.phone.trim() || null, email: form.email.trim() || null, birth_date: form.birthDate || null, preferred_barber: form.preferredBarber || null, address: form.address.trim() || null, notes: form.notes.trim() || null, tags })
    if (result.error) { setStatus(result.error); return }
    router.push('/clientes')
  }
  return <div>
    <PageHeader title="Novo cliente" description="Cadastre dados de contato, preferências e observações."><Link href="/clientes" className={buttonVariants({ variant:'outline', size:'sm' })}><ArrowLeft className="size-4" />Voltar</Link></PageHeader>
    <div className="grid gap-4 lg:grid-cols-[1fr_320px]">
      <Card className="p-5"><h2 className="mb-4 flex items-center gap-2 font-semibold"><UserPlus className="size-4" />Dados do cliente</h2><div className="grid gap-4 sm:grid-cols-2">
        <Field label="Nome completo"><Input value={form.name} onChange={(e)=>set('name',e.target.value)} /></Field>
        <Field label="Telefone / WhatsApp"><Input value={form.phone} onChange={(e)=>set('phone',e.target.value)} /></Field>
        <Field label="E-mail"><Input type="email" value={form.email} onChange={(e)=>set('email',e.target.value)} /></Field>
        <Field label="Data de nascimento"><Input type="date" value={form.birthDate} onChange={(e)=>set('birthDate',e.target.value)} /></Field>
        <Field label="Barbeiro preferido"><Select value={form.preferredBarber} onChange={(e)=>set('preferredBarber',e.target.value)}><option value="">Selecionar</option>{employees.filter(e=>e.active).map(e=><option key={e.id} value={e.name}>{e.name}</option>)}</Select></Field>
        <Field label="Endereço"><Input value={form.address} onChange={(e)=>set('address',e.target.value)} /></Field>
        <div className="space-y-2 sm:col-span-2"><Label>Observações</Label><Textarea value={form.notes} onChange={(e)=>set('notes',e.target.value)} /></div>
      </div></Card>
      <aside className="space-y-4"><Card className="p-5"><h3 className="mb-3 font-semibold">Classificação</h3>{([['vip','VIP'],['recorrente','Recorrente'],['aniversariante','Aniversariante'],['inadimplente','Inadimplente']] as const).map(([tag,label])=><label key={tag} className="flex justify-between py-1 text-sm"><span>{label}</span><input type="checkbox" checked={tags.includes(tag)} onChange={(e)=>setTags(c=>e.target.checked?[...c,tag]:c.filter(x=>x!==tag))} /></label>)}</Card>{status?<p className="text-sm text-muted-foreground">{status}</p>:null}<Button variant="gold" className="w-full" onClick={save}><Save className="size-4" />Salvar cliente</Button></aside>
    </div>
  </div>
}

function Field({ label, children }: { label:string; children:React.ReactNode }) { return <div className="space-y-2"><Label>{label}</Label>{children}</div> }
