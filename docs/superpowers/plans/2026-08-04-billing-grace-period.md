# Billing Grace Period Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Evitar bloqueios com vencimento futuro e aplicar sete dias completos de tolerância após o vencimento.

**Architecture:** Centralizar a decisão no `getBillingState`, usando a data como fonte da situação temporal e o status apenas para identificar o contexto da assinatura. Manter a confirmação de pagamento no webhook existente e condicionar a mensagem promocional ao teste gratuito.

**Tech Stack:** TypeScript, React, Next.js, Vitest.

## Global Constraints

- Cobrança futura nunca bloqueia.
- Dias 1 a 7 de atraso exibem aviso sem bloqueio.
- O bloqueio começa no 8º dia.
- Pagamento confirmado ou recebido limpa o estado de atraso por meio do webhook do Asaas.

---

### Task 1: Regra de tolerância

**Files:**
- Create: `components/billing/billing-notice.test.ts`
- Modify: `components/billing/billing-notice.tsx`

**Interfaces:**
- Consumes: `Barbershop` e `daysUntil` existentes.
- Produces: `getBillingState(barbershop: Barbershop): BillingState` com limite de sete dias.

- [ ] **Step 1: Escrever testes falhando** para vencimento futuro em `past_due`, atrasos de 1 e 7 dias, bloqueio no 8º dia e status ativo.
- [ ] **Step 2: Executar `pnpm test components/billing/billing-notice.test.ts`** e confirmar falhas nos casos futuro, 7º e 8º dia.
- [ ] **Step 3: Alterar `getBillingState`** para ignorar `past_due` com data futura, avisar de 1 a 7 dias e bloquear quando `overdue > 7`.
- [ ] **Step 4: Executar o teste focado** e confirmar todos os casos passando.

### Task 2: Texto contextual do card

**Files:**
- Modify: `components/billing/billing-card.tsx`

**Interfaces:**
- Consumes: `billing.status` já retornado por `/api/billing/status`.
- Produces: rodapé promocional renderizado somente para `trialing`.

- [ ] **Step 1: Condicionar o rodapé dos 30 dias** a `billing?.status === 'trialing'`.
- [ ] **Step 2: Executar `pnpm typecheck`** e confirmar compilação sem erros.

### Task 3: Verificação integral

**Files:**
- Verify: `app/api/webhooks/asaas/route.ts`

**Interfaces:**
- Consumes: eventos `PAYMENT_CONFIRMED` e `PAYMENT_RECEIVED`.
- Produces: `billing_status: 'active'`, `last_payment_at` e `next_billing_date` atualizados.

- [ ] **Step 1: Confirmar que o webhook mantém a atualização de pagamento existente.**
- [ ] **Step 2: Executar `pnpm lint`, `pnpm typecheck` e `pnpm test`.**
- [ ] **Step 3: Revisar o diff** para garantir que somente cobrança e testes foram alterados.
