# Admin Billing Dashboard Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Entregar uma central administrativa profissional com indicadores de receita, gestão segura de assinaturas e concessão de cortesias sincronizadas ao Asaas.

**Architecture:** Regras financeiras puras ficam em `lib/admin-billing.ts`, compartilhadas pelas APIs e protegidas por Vitest. O banco armazena os metadados da cortesia; as rotas administrativas validam e sincronizam datas com o Asaas; as telas consomem respostas agregadas sem calcular valores financeiros no navegador.

**Tech Stack:** Next.js 16, React 19, TypeScript, Supabase/Postgres, Asaas API, Vitest, Tailwind CSS.

## Global Constraints

- O administrador não edita dados operacionais das barbearias.
- MRR contratado e receita prevista são indicadores separados.
- Vencimento futuro nunca aparece como atraso.
- O bloqueio operacional começa somente no 8º dia de atraso.
- Cortesias exigem motivo e são registradas na auditoria administrativa.
- Datas de assinaturas existentes são sincronizadas com o Asaas antes da confirmação local.

---

### Task 1: Regras financeiras e de cortesia

**Files:**
- Create: `lib/admin-billing.ts`
- Create: `lib/admin-billing.test.ts`

**Interfaces:**
- Produces: `addComplimentaryPeriod(baseDate, input)`, `calculateAdminBillingMetrics(rows, now)` e tipos associados.

- [ ] Escrever testes com valores literais para MRR, receita prevista, ticket médio, empresas em cortesia e avanço de dias/meses.
- [ ] Executar `pnpm.cmd test lib/admin-billing.test.ts` e confirmar falha pela ausência das funções.
- [ ] Implementar as funções puras com planos de R$ 89, R$ 149 e R$ 249.
- [ ] Executar o teste focado e confirmar aprovação.

### Task 2: Persistência de cortesias

**Files:**
- Create: `supabase/migrations/20260804160000_add_billing_complimentary_period.sql`

**Interfaces:**
- Produces: `complimentary_until`, `complimentary_reason`, `complimentary_value` e `complimentary_granted_at` em `barbershops`.

- [ ] Criar colunas opcionais, validação de valor não negativo e índice para cortesias ativas.
- [ ] Restringir atualização das novas colunas a `service_role`.

### Task 3: Métricas administrativas

**Files:**
- Modify: `app/api/admin/overview/route.ts`
- Modify: `app/plataforma/types.ts`
- Modify: `app/plataforma/admin-client.tsx`

**Interfaces:**
- Consumes: `calculateAdminBillingMetrics` e registros de `barbershops`.
- Produces: `revenue` com `mrr`, `forecast30Days`, `averageTicket`, `complimentaryValue`, `complimentaryCount`, `conversionRate` e `receivedThisMonth`.

- [ ] Ampliar a consulta da API e retornar métricas calculadas no servidor.
- [ ] Buscar pagamentos recebidos no mês no Asaas com fallback não bloqueante.
- [ ] Exibir cartões executivos e resumo por situação no painel.
- [ ] Ajustar tabela para mostrar cortesia e trocar ações perigosas por “Gerenciar”.

### Task 4: Gestão detalhada da assinatura

**Files:**
- Modify: `app/api/admin/tenants/[id]/route.ts`
- Modify: `app/api/admin/tenants/route.ts`
- Modify: `app/plataforma/contas/[id]/conta-client.tsx`

**Interfaces:**
- Consumes: `{ plan, billing_status, nextBillingDate, complimentaryDays, complimentaryMonths, complimentaryUntil, reason }`.
- Produces: assinatura atualizada, sincronização de `nextDueDate` no Asaas e auditoria `tenant.billing_update`.

- [ ] Validar plano, status, datas, duração máxima de 24 meses e motivo obrigatório.
- [ ] Calcular a nova data a partir do vencimento futuro ou de hoje.
- [ ] Atualizar o Asaas antes do banco para assinaturas existentes.
- [ ] Adicionar formulário com ações rápidas de 7, 15, 30 dias e 1, 2, 3 meses, além de data personalizada.
- [ ] Mostrar plano, status real, vencimentos, último pagamento, IDs do Asaas e resultado da operação.

### Task 5: Verificação

**Files:**
- Verify: all modified files.

**Interfaces:**
- Produces: evidência de testes, lint e checagem de tipos.

- [ ] Executar testes focados de cobrança e administração.
- [ ] Executar `pnpm.cmd lint`.
- [ ] Executar `pnpm.cmd typecheck` e separar falhas preexistentes.
- [ ] Executar `git diff --check` e revisar o diff final contra a especificação.
