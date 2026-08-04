# Admin Persistent Rate Limit Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Substituir o contador em memoria do login administrativo por limites persistentes e atomicos no Supabase.

**Architecture:** O servidor deriva duas chaves HMAC (IP+e-mail e IP) e chama uma RPC atomica acessivel somente ao `service_role`. A tabela e a funcao sao aditivas e isoladas, sem atualizar linhas das tabelas existentes.

**Tech Stack:** Next.js 16, TypeScript, Vitest, Supabase/PostgreSQL 17.

## Global Constraints

- 5 falhas por IP+e-mail em uma janela de 15 minutos.
- 20 falhas globais por IP em uma janela de 15 minutos.
- Nunca persistir IP, e-mail ou senha em texto legivel.
- Falhar fechado com HTTP 503 se o limitador persistente estiver indisponivel.
- Nao bloquear a conta administrativa real durante testes de producao.

---

### Task 1: Chaves e orquestracao do limitador

**Files:**
- Create: `lib/admin-rate-limit.ts`
- Test: `lib/admin-rate-limit.test.ts`

**Interfaces:**
- Produces: `buildAdminRateLimitLayers(ip, email): RateLimitLayer[]`
- Produces: `maxRetryAfter(results): number`

- [ ] Escrever testes que esperam duas chaves HMAC deterministicas, sem IP/e-mail visiveis, e o maior `retryAfter`.
- [ ] Rodar `pnpm test lib/admin-rate-limit.test.ts` e confirmar falha por modulo ausente.
- [ ] Implementar as funcoes puras usando HMAC-SHA256 e os limites 5/20.
- [ ] Rodar o teste e confirmar sucesso.

### Task 2: Schema persistente atomico

**Files:**
- Create: `supabase/migrations/<timestamp>_add_admin_login_rate_limit.sql`

**Interfaces:**
- Produces: tabela `public.platform_login_rate_limits`.
- Produces: RPC `public.apply_platform_login_rate_limit(text,text,integer,integer)` retornando `locked` e `retry_after`.

- [ ] Criar a migration pelo comando oficial `supabase migration new add_admin_login_rate_limit`.
- [ ] Adicionar tabela com RLS, chave primaria textual, contador e timestamps.
- [ ] Implementar RPC atomica para `check`, `failure` e `success`, com limpeza de registros expirados.
- [ ] Revogar tabela e funcao de `PUBLIC`, `anon` e `authenticated`; conceder apenas `EXECUTE` da funcao ao `service_role`.
- [ ] Aplicar em producao como migration aditiva e verificar os privilegios via SQL.

### Task 3: Integracao no login

**Files:**
- Modify: `app/api/admin/login/route.ts`
- Modify: `lib/admin-rate-limit.ts`
- Test: `lib/admin-rate-limit.test.ts`

**Interfaces:**
- Consumes: `buildAdminRateLimitLayers`, `checkAdminRateLimit`, `recordAdminLoginFailure`, `clearAdminRateLimit`.

- [ ] Escrever teste da decisao de bloqueio quando qualquer camada retorna bloqueada.
- [ ] Confirmar o teste falhando antes da integracao.
- [ ] Remover o `Map` em memoria e consultar as duas camadas antes do Supabase Auth.
- [ ] Registrar ambas as falhas para senha invalida ou usuario sem permissao.
- [ ] Limpar ambas as camadas no login valido.
- [ ] Retornar `429` com `Retry-After` ou `503` em indisponibilidade do limitador.
- [ ] Rodar testes, typecheck e build.

### Task 4: Validacao segura em producao

**Files:**
- No source changes.

- [ ] Usar chaves de teste diretamente na RPC para confirmar a quinta falha e a vigesima falha sem usar o e-mail administrativo real.
- [ ] Limpar as chaves de teste pela operacao `success`.
- [ ] Rodar Security Advisor e confirmar que a nova RPC nao e executavel por `anon` ou `authenticated`.
- [ ] Depois do deploy do codigo, confirmar login valido `200` e dashboard `200`.
- [ ] Verificar a disponibilidade da configuracao de protecao contra senhas vazadas; documentar o passo manual se o conector nao puder ativa-la.
