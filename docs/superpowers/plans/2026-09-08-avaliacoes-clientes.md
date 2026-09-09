# Avaliações de clientes Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Coletar a avaliação após um agendamento público, armazenar as respostas com segurança e permitir que a barbearia consulte os resultados.

**Architecture:** A tabela `customer_reviews` relaciona cada resposta a uma barbearia e agendamento. A confirmação pública recebe um token assinado pelo banco para permitir o envio anônimo e a área autenticada consulta as avaliações da unidade via `AppDataProvider`.

**Tech Stack:** Next.js App Router, React, Supabase/Postgres, RLS, Vitest, Docker via Supabase CLI.

**Spec:** Approved in chat on 2026-09-08.

## Global Constraints

- O cliente não precisa criar conta para avaliar.
- Cada agendamento pode receber no máximo uma avaliação.
- Avaliações públicas só podem inserir respostas vinculadas a um token válido.
- A área administrativa só exibe avaliações da barbearia ativa para usuários autenticados.

### Task 1: Persistência e acesso seguro

**Files:**
- Create: `supabase/migrations/<timestamp>_add_customer_reviews.sql`
- Modify: `lib/types.ts`, `components/data/app-data-provider.tsx`
- Test: `lib/customer-reviews.test.ts`

- [x] Criar teste para normalização e resumo de avaliações.
- [x] Criar tabela, índice, unique por agendamento, RLS e RPC pública de inserção.
- [x] Adicionar tipo e carregamento autenticado no provider.
- [x] Rodar teste unitário e typecheck.

### Task 2: Fluxo público pós-agendamento

**Files:**
- Modify: `app/agendar/[slug]/public-booking-client.tsx`
- Modify: migration da Task 1

- [x] Exibir formulário de nota, perguntas e comentário após a confirmação.
- [x] Enviar a resposta pela RPC validando o telefone do agendamento.
- [x] Mostrar estado enviado e impedir duplicidade no banco.
- [x] Testar validação de nota e submissão.

### Task 3: Área administrativa

**Files:**
- Create: `app/(app)/avaliacoes/page.tsx`
- Modify: `lib/nav.ts`

- [x] Criar resumo com média, total e recomendação.
- [x] Adicionar filtros por período, profissional e nota.
- [x] Renderizar lista das respostas com comentário e respostas objetivas.
- [x] Restringir a owners/managers pela navegação existente.

### Task 4: Docker e verificação

**Files:**
- Modify: `design-qa.md`

- [x] Iniciar o Supabase local com Docker usando a CLI instalada.
- [x] Aplicar migrations e executar uma consulta de verificação.
- [x] Rodar testes completos, lint, typecheck e build.
- [x] Registrar qualquer bloqueio visual ou de ambiente.
