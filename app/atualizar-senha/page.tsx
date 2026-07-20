'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createBrowserSupabaseClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

export default function AtualizarSenhaPage(){const router=useRouter();const[password,setPassword]=useState('');const[confirm,setConfirm]=useState('');const[status,setStatus]=useState('');async function save(){if(password.length<8){setStatus('Use pelo menos 8 caracteres.');return}if(password!==confirm){setStatus('As senhas não conferem.');return}const{error}=await createBrowserSupabaseClient().auth.updateUser({password});if(error){setStatus(error.message);return}router.push('/dashboard')}return <main className="grid min-h-screen place-items-center p-4"><Card className="w-full max-w-md p-6"><h1 className="text-xl font-bold">Criar nova senha</h1><div className="mt-5 space-y-4"><div><Label>Nova senha</Label><Input type="password" value={password} onChange={e=>setPassword(e.target.value)}/></div><div><Label>Confirmar senha</Label><Input type="password" value={confirm} onChange={e=>setConfirm(e.target.value)}/></div>{status?<p className="text-sm">{status}</p>:null}<Button variant="gold" className="w-full" onClick={save}>Salvar nova senha</Button></div></Card></main>}
