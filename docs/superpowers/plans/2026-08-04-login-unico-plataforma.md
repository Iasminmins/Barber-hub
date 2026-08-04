# Login único da plataforma Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Fazer `/login` reconhecer administradores ativos e enviá-los diretamente a `/plataforma`, removendo o login e as páginas antigas em `/admin`.

**Architecture:** O Supabase Auth continua sendo o único validador de senha. Após autenticar no navegador, um endpoint recebe o access token, valida o usuário no servidor, consulta `platform_admins` com service role e cria o cookie administrativo HTTP-only quando aplicável. As páginas administrativas são movidas para `/plataforma` e nunca exibem credenciais próprias.

**Tech Stack:** Next.js 16 App Router, React 19, Supabase Auth/Postgres, Vitest 4, cookie HMAC existente.

## Global Constraints

- `/login` é a única tela de credenciais.
- Administrador ativo tem precedência e cai em `/plataforma`.
- Usuário operacional cai em `/dashboard`.
- O cliente nunca decide sozinho se alguém é administrador.
- Preservar cookie `HttpOnly`, `SameSite=Strict`, `Secure` em produção, auditoria e revogação imediata.
- Remover páginas e formulário antigos em `/admin`; manter `/api/admin` privado.

---

### Task 1: Classificação autenticada e limitação por IP

**Files:**
- Create: `lib/platform-route.ts`
- Create: `lib/platform-route.test.ts`
- Create: `app/api/auth/platform-route/route.ts`
- Create via CLI: migration path printed by `supabase migration new add_platform_route_rate_limit`

**Interfaces:**
- Consumes: bearer token, `createAdminSupabaseClient`, `createAdminSessionToken`, `adminCookieHeader`.
- Produces: `classifyAuthenticatedUser(deps, token): Promise<{ destination: '/plataforma' | '/dashboard'; admin?: { name: string; email: string } }>`.

- [ ] **Step 1: Criar a migration pelo CLI**

Run: `supabase migration new add_platform_route_rate_limit`  
Implementar função atômica que permita 60 classificações por IP por minuto, revogada de `public`, `anon` e `authenticated`, executável apenas por `service_role`.

- [ ] **Step 2: Escrever testes de administrador, usuário comum, token inválido e conta inativa**

```ts
await expect(classifyAuthenticatedUser(deps, 'valid-admin-token')).resolves.toMatchObject({ destination: '/plataforma' })
await expect(classifyAuthenticatedUser(deps, 'valid-member-token')).resolves.toEqual({ destination: '/dashboard' })
await expect(classifyAuthenticatedUser(deps, 'invalid')).rejects.toMatchObject({ status: 401 })
```

- [ ] **Step 3: Executar teste e confirmar RED**

Run: `pnpm.cmd test lib/platform-route.test.ts`  
Expected: FAIL porque a classificação ainda não existe.

- [ ] **Step 4: Implementar classificação no servidor**

Validar token com `supabase.auth.getUser(token)`, consultar `platform_admins` por `user_id` e `active=true`, nunca aceitar e-mail/role do corpo.

- [ ] **Step 5: Implementar route handler**

Responder 401 para token inválido, 429 com `Retry-After` para limite excedido, `{ destination: '/dashboard' }` para usuário comum e definir cookie administrativo somente para admin.

- [ ] **Step 6: Aplicar migration, executar advisors e testes**

Usar Supabase MCP/CLI conforme ambiente; confirmar função, grants, RLS e advisors de segurança/performance.  
Run: `pnpm.cmd test lib/platform-route.test.ts && pnpm.cmd typecheck`  
Expected: PASS.

- [ ] **Step 7: Commit**

```bash
git add lib/platform-route.ts lib/platform-route.test.ts app/api/auth/platform-route/route.ts supabase/migrations/*_add_platform_route_rate_limit.sql
git commit -m "feat: classifica acesso da plataforma no login"
```

### Task 2: Login único

**Files:**
- Modify: `app/login/login-client.tsx`
- Test: `lib/platform-route.test.ts`

**Interfaces:**
- Consumes: sessão retornada por `supabase.auth.signInWithPassword` e `/api/auth/platform-route`.
- Produces: redirecionamento para a destination validada pelo servidor.

- [ ] **Step 1: Adicionar testes para precedência administrativa e fallback seguro**

Testar que apenas `'/plataforma'` e `'/dashboard'` são destinos aceitos; resposta desconhecida deve encerrar com erro genérico, nunca navegar para URL arbitrária.

- [ ] **Step 2: Confirmar RED**

Run: `pnpm.cmd test lib/platform-route.test.ts`  
Expected: FAIL na validação de destino ainda ausente.

- [ ] **Step 3: Chamar classificação após login Supabase**

```ts
const response = await fetch('/api/auth/platform-route', {
  method: 'POST',
  headers: { Authorization: `Bearer ${data.session.access_token}` },
})
if (payload.destination !== '/plataforma' && payload.destination !== '/dashboard') {
  throw new Error('Destino de acesso inválido.')
}
const destination = payload.destination
router.replace(destination)
```

Para admin, encerrar a sessão operacional do navegador somente depois que o cookie administrativo for confirmado. Para usuário comum, preservar a sessão.

- [ ] **Step 4: Executar testes e typecheck**

Run: `pnpm.cmd test lib/platform-route.test.ts && pnpm.cmd typecheck`  
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add app/login/login-client.tsx lib/platform-route.test.ts
git commit -m "feat: unifica entrada operacional e administrativa"
```

### Task 3: Mover painel para `/plataforma` e remover login antigo

**Files:**
- Create from existing: `app/plataforma/page.tsx`, `app/plataforma/admin-client.tsx`, `app/plataforma/use-platform-session.ts`, `app/plataforma/tenant-actions.tsx`, `app/plataforma/types.ts`, `app/plataforma/contas/[id]/page.tsx`, `app/plataforma/contas/[id]/conta-client.tsx`
- Delete: `app/admin/**`
- Delete: `app/api/admin/login/route.ts`
- Delete: `lib/admin-rate-limit.ts`, `lib/admin-rate-limit.test.ts`
- Create via CLI: migration path printed by `supabase migration new remove_admin_login_rate_limit`
- Modify: `app/api/admin/session/route.ts`

**Interfaces:**
- Consumes: `/api/admin/session`, `/api/admin/logout` e APIs administrativas atuais.
- Produces: páginas `/plataforma` e `/plataforma/contas/[id]`; `usePlatformSession` sem método `signIn`.

- [ ] **Step 1: Criar teste de contrato de rotas**

Adicionar teste que verifica links `/plataforma/contas/<id>`, ausência de `AccessGate` e ausência de chamada a `/api/admin/login` nos fontes finais.

- [ ] **Step 2: Confirmar RED**

Run: `pnpm.cmd test`  
Expected: FAIL enquanto os caminhos antigos existirem.

- [ ] **Step 3: Copiar componentes para o novo segmento e atualizar links**

Trocar `/admin` por `/plataforma`; manter `/api/admin/*`. Quando `gate === 'anon'`, executar `router.replace('/login')` e mostrar apenas estado de verificação, nunca formulário.

- [ ] **Step 4: Remover árvore antiga e endpoint de senha**

Excluir `AccessGate`, `/api/admin/login`, helpers/testes exclusivos e criar migration via `supabase migration new remove_admin_login_rate_limit` para remover RPC/tabela legadas com segurança.

- [ ] **Step 5: Executar testes, lint, tipos e build**

Run: `pnpm.cmd lint && pnpm.cmd typecheck && pnpm.cmd test && pnpm.cmd build`  
Expected: PASS; rotas do build incluem `/plataforma` e não incluem `/admin`.

- [ ] **Step 6: Verificação no navegador**

Confirmar: admin `/login` → `/plataforma`; usuário comum → `/dashboard`; acesso anônimo a `/plataforma` → `/login`; detalhes usam `/plataforma/contas/[id]`; logout volta a `/login`; `/admin` não exibe formulário antigo.

- [ ] **Step 7: Commit**

```bash
git add app/plataforma app/login app/api/admin lib supabase/migrations
git commit -m "feat: move administracao para plataforma"
```

### Task 4: Verificação de segurança e produção

**Files:**
- Modify only if verification finds a defect in files from Tasks 1-3.

**Interfaces:**
- Consumes: fluxo completo implementado.
- Produces: evidência de autorização, build e deploy.

- [ ] **Step 1: Executar suíte completa novamente**

Run: `pnpm.cmd lint && pnpm.cmd typecheck && pnpm.cmd test && pnpm.cmd build`  
Expected: zero falhas.

- [ ] **Step 2: Executar advisors e consultas de grants**

Confirmar que `platform_admins` continua sem acesso `anon/authenticated`, funções novas não são públicas e service role possui somente privilégios necessários.

- [ ] **Step 3: Publicar e aguardar Vercel READY**

Enviar commits para `main`, acompanhar logs e interromper se o deployment não ficar `READY`.

- [ ] **Step 4: Smoke test no domínio real**

Repetir os cinco fluxos de navegador da Task 3 e verificar ausência de novos erros de console/runtime.
