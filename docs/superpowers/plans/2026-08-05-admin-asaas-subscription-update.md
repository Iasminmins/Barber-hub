# Admin Asaas Subscription Update Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Atualizar corretamente uma cobrança Asaas já gerada e evitar o reenvio de dados de assinatura que não mudaram.

**Architecture:** Um módulo puro produzirá um plano de operações a partir do estado local, formulário e cobranças retornadas pelo Asaas. A rota executará esse plano, mantendo Asaas antes do Supabase e persistindo somente campos alterados.

**Tech Stack:** TypeScript, Next.js App Router, Vitest, API Asaas, Supabase.

## Global Constraints

- Não alterar cobranças recebidas, confirmadas, canceladas ou reembolsadas.
- Não persistir mudanças locais quando uma operação no Asaas falhar.
- Não criar, remover ou reativar assinaturas.

---

### Task 1: Planejador de operações Asaas

**Files:**
- Create: `lib/admin-asaas-update.ts`
- Test: `lib/admin-asaas-update.test.ts`

**Interfaces:**
- Consumes: plano/data atuais, plano/data solicitados e lista de cobranças Asaas.
- Produces: `buildAsaasBillingUpdate(input): { subscriptionUpdate: Record<string, unknown>; paymentUpdate?: { id: string; dueDate: string } }`.

- [ ] **Step 1: Write the failing tests**

Cobrir plano inalterado, cobrança pendente correspondente, fallback para `nextDueDate` e exclusão de cobranças liquidadas.

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm test lib/admin-asaas-update.test.ts`
Expected: FAIL porque o módulo ainda não existe.

- [ ] **Step 3: Write minimal implementation**

Comparar valores, selecionar cobranças com status `PENDING` ou `OVERDUE`, preferir a data atual e produzir somente operações necessárias.

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm test lib/admin-asaas-update.test.ts`
Expected: PASS.

### Task 2: Integrar o planejador à rota administrativa

**Files:**
- Modify: `app/api/admin/tenants/[id]/route.ts`

**Interfaces:**
- Consumes: `buildAsaasBillingUpdate` da Task 1 e `asaasRequest` existente.
- Produces: chamadas `PUT /payments/{id}` ou `PUT /subscriptions/{id}` conforme o estado real.

- [ ] **Step 1: Replace unconditional subscription payload**

Consultar `/subscriptions/{id}/payments` quando a data mudar, executar a atualização de pagamento escolhida e enviar à assinatura apenas campos alterados.

- [ ] **Step 2: Preserve local consistency**

Construir o patch local somente com valores diferentes, executar todas as chamadas Asaas antes do update no Supabase e manter auditoria existente.

- [ ] **Step 3: Run focused and full verification**

Run: `pnpm test lib/admin-asaas-update.test.ts`, `pnpm typecheck`, `pnpm test` e `pnpm lint`.
Expected: todos com exit code 0.
