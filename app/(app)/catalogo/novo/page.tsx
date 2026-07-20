'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { ArrowLeft, Save } from 'lucide-react'
import { useAppData } from '@/components/data/app-data-provider'
import { PageHeader } from '@/components/page-header'
import { Button, buttonVariants } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select } from '@/components/ui/select'

export default function NovoCatalogoPage() {
  const router=useRouter(); const {barbershop,insertRecord}=useAppData()
  const [form,setForm]=useState({type:'produto',category:'',name:'',price:'',cost:'',commission:'',duration:'',stock:'',minStock:''}); const [status,setStatus]=useState('')
  const set=(key:keyof typeof form,value:string)=>setForm(c=>({...c,[key]:value})); const number=(v:string)=>Number(v.replace(',','.'))||0
  async function save(){if(!form.name.trim()){setStatus('Informe o nome do item.');return} const r=await insertRecord('catalog_items',{barbershop_id:barbershop.id,type:form.type,category:form.category.trim()||null,name:form.name.trim(),price:number(form.price),cost:number(form.cost),commission:number(form.commission),duration_min:form.type==='servico'?number(form.duration):null,stock:form.type==='produto'?number(form.stock):null,min_stock:form.type==='produto'?number(form.minStock):null,active:true});if(r.error){setStatus(r.error);return}router.push('/catalogo')}
  return <div><PageHeader title="Novo item do catálogo" description="Cadastre produto ou serviço."><Link href="/catalogo" className={buttonVariants({variant:'outline',size:'sm'})}><ArrowLeft className="size-4"/>Voltar</Link></PageHeader><Card className="mx-auto max-w-3xl p-5"><div className="grid gap-4 sm:grid-cols-2">
    <Field label="Tipo"><Select value={form.type} onChange={e=>set('type',e.target.value)}><option value="produto">Produto</option><option value="servico">Serviço</option></Select></Field><Field label="Categoria"><Input value={form.category} onChange={e=>set('category',e.target.value)}/></Field><Field label="Nome"><Input value={form.name} onChange={e=>set('name',e.target.value)}/></Field><Field label="Preço"><Input inputMode="decimal" value={form.price} onChange={e=>set('price',e.target.value)}/></Field><Field label="Custo"><Input inputMode="decimal" value={form.cost} onChange={e=>set('cost',e.target.value)}/></Field><Field label="Comissão (%)"><Input type="number" value={form.commission} onChange={e=>set('commission',e.target.value)}/></Field>{form.type==='servico'?<Field label="Duração (minutos)"><Input type="number" value={form.duration} onChange={e=>set('duration',e.target.value)}/></Field>:<><Field label="Estoque"><Input type="number" value={form.stock} onChange={e=>set('stock',e.target.value)}/></Field><Field label="Estoque mínimo"><Input type="number" value={form.minStock} onChange={e=>set('minStock',e.target.value)}/></Field></>}
  </div>{status?<p className="mt-4 text-sm">{status}</p>:null}<Button variant="gold" className="mt-5 w-full" onClick={save}><Save className="size-4"/>Salvar item</Button></Card></div>
}
function Field({label,children}:{label:string;children:React.ReactNode}){return <div className="space-y-2"><Label>{label}</Label>{children}</div>}
