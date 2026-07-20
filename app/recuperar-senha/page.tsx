'use client'
import Link from 'next/link'
import { useState } from 'react'
import { createBrowserSupabaseClient, isSupabaseConfigured } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

export default function RecuperarSenhaPage(){const[email,setEmail]=useState('');const[status,setStatus]=useState('');async function send(){if(!isSupabaseConfigured()){setStatus('Supabase não configurado.');return}if(!email.trim()){setStatus('Informe seu e-mail.');return}const{error}=await createBrowserSupabaseClient().auth.resetPasswordForEmail(email.trim(),{redirectTo:`${window.location.origin}/atualizar-senha`});setStatus(error?error.message:'Enviamos o link de recuperação para seu e-mail.')}return <main className="grid min-h-screen place-items-center p-4"><Card className="w-full max-w-md p-6"><h1 className="text-xl font-bold">Recuperar senha</h1><p className="mb-5 mt-1 text-sm text-muted-foreground">Informe o e-mail da sua conta.</p><div className="space-y-2"><Label>E-mail</Label><Input type="email" value={email} onChange={e=>setEmail(e.target.value)}/></div>{status?<p className="my-3 text-sm">{status}</p>:null}<Button className="mt-4 w-full" variant="gold" onClick={send}>Enviar link</Button><Link href="/login" className="mt-4 block text-center text-sm text-primary">Voltar ao login</Link></Card></main>}
