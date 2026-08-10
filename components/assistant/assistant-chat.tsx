'use client'

import * as React from 'react'
import { Bot, Loader2, MessageCircle, Send, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { createBrowserSupabaseClient } from '@/lib/supabase/client'

type ChatMessage = {
  id: string
  role: 'user' | 'assistant'
  content: string
}

type AssistantResponse = {
  answer?: string
  error?: string
  remaining?: number
  limit?: number
}

const suggestions = [
  'Quanto faturou hoje?',
  'Quantas comandas hoje?',
  'Agenda de hoje',
  'Como criar comanda?',
]

export function AssistantChat() {
  const [open, setOpen] = React.useState(false)
  const [input, setInput] = React.useState('')
  const [messages, setMessages] = React.useState<ChatMessage[]>([
    {
      id: 'welcome',
      role: 'assistant',
      content: 'Oi! Posso ajudar com dados da barbearia e duvidas da Barber Hub.',
    },
  ])
  const [loading, setLoading] = React.useState(false)
  const [remaining, setRemaining] = React.useState<number | null>(null)
  const [limit, setLimit] = React.useState<number | null>(null)

  async function ask(question: string) {
    const cleanQuestion = question.trim()
    if (!cleanQuestion || loading) return

    setInput('')
    setLoading(true)
    const userMessage: ChatMessage = { id: crypto.randomUUID(), role: 'user', content: cleanQuestion }
    setMessages((current) => [...current, userMessage])

    try {
      const supabase = createBrowserSupabaseClient()
      const { data } = await supabase.auth.getSession()
      const token = data.session?.access_token
      if (!token) throw new Error('Sessao invalida. Entre novamente para usar o assistente.')

      const response = await fetch('/api/assistant/chat', {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ question: cleanQuestion }),
      })
      const payload = await response.json() as AssistantResponse
      if (!response.ok) throw new Error(payload.error ?? 'Nao foi possivel consultar o assistente.')

      setRemaining(typeof payload.remaining === 'number' ? payload.remaining : null)
      setLimit(typeof payload.limit === 'number' ? payload.limit : null)
      setMessages((current) => [
        ...current,
        { id: crypto.randomUUID(), role: 'assistant', content: payload.answer ?? 'Nao consegui responder agora.' },
      ])
    } catch (error) {
      setMessages((current) => [
        ...current,
        {
          id: crypto.randomUUID(),
          role: 'assistant',
          content: error instanceof Error ? error.message : 'Nao foi possivel consultar o assistente agora.',
        },
      ])
    } finally {
      setLoading(false)
    }
  }

  function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    void ask(input)
  }

  return (
    <>
      <Button
        type="button"
        className="fixed bottom-4 right-4 z-40 h-12 rounded-full px-4 shadow-lg"
        aria-label="Abrir assistente"
        onClick={() => setOpen(true)}
      >
        <MessageCircle className="size-5" />
        <span className="hidden sm:inline">Assistente inteligente</span>
      </Button>

      {open ? (
        <section className="fixed bottom-20 right-4 z-50 flex h-[560px] max-h-[calc(100vh-6rem)] w-[calc(100vw-2rem)] max-w-sm flex-col overflow-hidden rounded-lg border border-border bg-card shadow-2xl">
          <header className="flex items-center justify-between border-b border-border px-4 py-3">
            <div className="flex min-w-0 items-center gap-2">
              <span className="grid size-8 place-items-center rounded-md bg-primary/10 text-primary">
                <Bot className="size-4" />
              </span>
              <div className="min-w-0">
                <h2 className="truncate text-sm font-semibold text-foreground">Assistente</h2>
                <p className="text-xs text-muted-foreground">
                  {remaining === null || limit === null ? 'Limite mensal por plano' : `${remaining}/${limit} perguntas restantes`}
                </p>
              </div>
            </div>
            <Button type="button" variant="ghost" size="icon-sm" aria-label="Fechar assistente" onClick={() => setOpen(false)}>
              <X className="size-4" />
            </Button>
          </header>

          <div className="flex-1 space-y-3 overflow-y-auto px-4 py-3">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`max-w-[85%] rounded-lg px-3 py-2 text-sm leading-relaxed ${
                  message.role === 'user'
                    ? 'ml-auto bg-primary text-primary-foreground'
                    : 'bg-muted text-foreground'
                }`}
              >
                {message.content}
              </div>
            ))}
            {loading ? (
              <div className="inline-flex items-center gap-2 rounded-lg bg-muted px-3 py-2 text-sm text-muted-foreground">
                <Loader2 className="size-4 animate-spin" />
                Consultando...
              </div>
            ) : null}
          </div>

          <div className="border-t border-border p-3">
            <div className="mb-2 grid grid-cols-2 gap-2">
              {suggestions.map((suggestion) => (
                <button
                  key={suggestion}
                  type="button"
                  className="min-h-9 rounded-md border border-border px-2.5 py-1.5 text-xs font-medium leading-tight text-muted-foreground hover:bg-muted hover:text-foreground"
                  onClick={() => void ask(suggestion)}
                >
                  {suggestion}
                </button>
              ))}
            </div>
            <form className="flex items-end gap-2" onSubmit={submit}>
              <Textarea
                value={input}
                onChange={(event) => setInput(event.target.value)}
                placeholder="Pergunte sobre a barbearia..."
                className="max-h-28 min-h-11 resize-none"
                disabled={loading}
                onKeyDown={(event) => {
                  if (event.key === 'Enter' && !event.shiftKey) {
                    event.preventDefault()
                    void ask(input)
                  }
                }}
              />
              <Button type="submit" size="icon" disabled={loading || !input.trim()} aria-label="Enviar pergunta">
                {loading ? <Loader2 className="size-4 animate-spin" /> : <Send className="size-4" />}
              </Button>
            </form>
          </div>
        </section>
      ) : null}
    </>
  )
}
