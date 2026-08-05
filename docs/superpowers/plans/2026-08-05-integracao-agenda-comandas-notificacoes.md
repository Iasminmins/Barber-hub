# Integração Agenda, Comandas e Notificações — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Permitir criar opcionalmente uma comanda aberta a partir de um agendamento, concluir o agendamento apenas no pagamento e tornar Agenda e Notificações coerentes e acionáveis.

**Architecture:** `orders.appointment_id` será a fonte de vínculo entre os domínios. Regras puras de indicadores e validade de notificações ficarão em módulos de `lib` testáveis; telas existentes apenas consumirão essas regras. A gravação continuará usando o provedor Supabase atual e preservará comandas avulsas.

**Tech Stack:** Next.js 16, React 19, TypeScript 5.7, Supabase/Postgres, Vitest, Tailwind CSS.

## Global Constraints

- Criar comanda pela Agenda é opcional e nunca acontece apenas ao criar o agendamento.
- A comanda vinculada nasce aberta e pode ser modificada antes do pagamento.
- Apenas uma comanda pode estar vinculada a cada agendamento.
- O pagamento conclui o agendamento; salvar como aberta ou pendente não conclui.
- Concluídos permanecem verdes na Agenda e o filtro apenas os oculta visualmente.
- Receita realizada usa o total da comanda paga, não o preço previsto do agendamento.
- Comandas avulsas continuam aceitando `appointment_id` nulo.

---

### Task 1: Vínculo persistente e tipos de domínio

**Files:**
- Create: `supabase/migrations/20260805120000_link_orders_to_appointments.sql`
- Modify: `lib/types.ts`
- Modify: `components/data/app-data-provider.tsx`

**Interfaces:**
- Produces: `Order.appointmentId?: string` e coluna `orders.appointment_id uuid null`.

- [ ] **Step 1: Criar a migração** com chave estrangeira `on delete set null`, índice de busca e índice único parcial `where appointment_id is not null`.
- [ ] **Step 2: Atualizar `Order`** para expor `appointmentId?: string`.
- [ ] **Step 3: Mapear `appointment_id`** ao carregar as comandas no provedor central.
- [ ] **Step 4: Executar verificação estática** com `pnpm typecheck`; esperado: PASS.
- [ ] **Step 5: Commit** com `git commit -m "feat: vincula comandas a agendamentos"`.

### Task 2: Regras puras de Agenda e notificações

**Files:**
- Create: `lib/agenda-operations.ts`
- Create: `lib/agenda-operations.test.ts`
- Modify: `components/shell/topbar.tsx`

**Interfaces:**
- Consumes: `Appointment[]`, `Order[]`, data inicial/final e barbeiro.
- Produces: `getAgendaStats(...)`, `isFreshAppointmentNotification(createdAt, now, maxAgeHours)` e `findLinkedOrder(appointmentId, orders)`.

- [ ] **Step 1: Escrever testes falhando** para receita de comanda paga vinculada, exclusão de comanda avulsa da receita, filtros de período/barbeiro e expiração de novidade após 24 horas.
- [ ] **Step 2: Rodar** `pnpm test -- lib/agenda-operations.test.ts`; esperado: FAIL porque o módulo ainda não existe.
- [ ] **Step 3: Implementar as funções puras** com receita baseada apenas em `status === 'paga'` e `appointmentId` pertencente ao conjunto filtrado.
- [ ] **Step 4: Rodar novamente o teste**; esperado: PASS.
- [ ] **Step 5: Trocar a janela de sete dias da Topbar** por `isFreshAppointmentNotification(..., 24)` e remover a associação heurística por cliente/data/barbeiro.
- [ ] **Step 6: Executar** `pnpm typecheck`; esperado: PASS.
- [ ] **Step 7: Commit** com `git commit -m "feat: centraliza regras operacionais da agenda"`.

### Task 3: Criar comanda opcional pelo agendamento

**Files:**
- Modify: `app/(app)/agenda/page.tsx`
- Modify: `app/(app)/agenda/agenda-client.tsx`
- Modify: `app/(app)/comandas/nova/page.tsx`
- Modify: `app/(app)/comandas/nova/nova-comanda-client.tsx`

**Interfaces:**
- Consumes: query `agendamento=<uuid>` e `findLinkedOrder`.
- Produces: inserção de `orders.appointment_id` e navegação para `/comandas?order=<id>` quando já existir vínculo.

- [ ] **Step 1: Passar comandas para `AgendaClient`** e localizar comanda pelo identificador do agendamento.
- [ ] **Step 2: Adicionar no diálogo** `Criar comanda` apenas para agendamentos sem vínculo e não cancelados/faltosos; adicionar `Ver comanda #N` quando houver vínculo.
- [ ] **Step 3: Fazer `Criar comanda` navegar** para `/comandas/nova?agendamento=<id>` sem criar registro antecipadamente.
- [ ] **Step 4: Ler a query na página Nova Comanda** e passar o agendamento correspondente como prop opcional.
- [ ] **Step 5: Inicializar estado do formulário** com cliente, barbeiro, serviço, preço e quantidade 1 do agendamento; manter pagamento vazio.
- [ ] **Step 6: Ao salvar uma comanda originada da Agenda**, forçar status inicial `aberta`, gravar `appointment_id` e não gerar lançamento financeiro.
- [ ] **Step 7: Tratar conflito único** exibindo mensagem e link para abrir a comanda existente.
- [ ] **Step 8: Executar** `pnpm typecheck` e `pnpm lint`; esperado: PASS.
- [ ] **Step 9: Commit** com `git commit -m "feat: cria comanda opcional pela agenda"`.

### Task 4: Pagamento conclui o agendamento vinculado

**Files:**
- Modify: `app/(app)/comandas/page.tsx`
- Modify: `app/(app)/comandas/nova/nova-comanda-client.tsx`
- Create: `lib/order-appointment-sync.ts`
- Create: `lib/order-appointment-sync.test.ts`

**Interfaces:**
- Produces: `shouldCompleteLinkedAppointment(previousStatus, nextStatus, appointmentId): boolean`.

- [ ] **Step 1: Escrever testes falhando** provando que apenas transição para `paga` com vínculo solicita conclusão.
- [ ] **Step 2: Rodar** `pnpm test -- lib/order-appointment-sync.test.ts`; esperado: FAIL porque o módulo ainda não existe.
- [ ] **Step 3: Implementar a função pura** e rodar novamente; esperado: PASS.
- [ ] **Step 4: Após salvar uma edição como paga**, atualizar `appointments.status` para `concluido` quando `shouldCompleteLinkedAppointment` retornar verdadeiro.
- [ ] **Step 5: Não alterar agendamento** para comandas abertas, pendentes, canceladas ou avulsas.
- [ ] **Step 6: Mostrar erro explícito** se o pagamento persistir e a sincronização falhar, sem criar outro lançamento financeiro na nova tentativa.
- [ ] **Step 7: Executar testes e typecheck**; esperado: PASS.
- [ ] **Step 8: Commit** com `git commit -m "feat: conclui agendamento ao pagar comanda"`.

### Task 5: Agenda verde, filtro e indicadores realizados

**Files:**
- Modify: `app/(app)/agenda/page.tsx`
- Modify: `app/(app)/agenda/agenda-client.tsx`
- Modify: `lib/agenda-operations.test.ts`

**Interfaces:**
- Consumes: `getAgendaStats` e `Order[]`.
- Produces: controle local `showCompleted` e cards coerentes com período/barbeiro.

- [ ] **Step 1: Acrescentar caso de teste** para agendamento concluído sem comanda: conta em concluídos, receita zero.
- [ ] **Step 2: Substituir cálculo local dos cards** por `getAgendaStats`.
- [ ] **Step 3: Adicionar botão alternável** `Ocultar concluídos` / `Mostrar concluídos`, com `aria-pressed`.
- [ ] **Step 4: Aplicar o filtro somente à grade/lista**, mantendo os indicadores calculados sobre todos os registros do período.
- [ ] **Step 5: Renderizar concluídos** com verde, ícone `Check` e texto `Concluído`, sem depender apenas de cor.
- [ ] **Step 6: Executar** `pnpm test -- lib/agenda-operations.test.ts`, `pnpm typecheck` e `pnpm lint`; esperado: PASS.
- [ ] **Step 7: Commit** com `git commit -m "feat: atualiza estados e indicadores da agenda"`.

### Task 6: Notificações acionáveis

**Files:**
- Modify: `components/shell/topbar.tsx`
- Modify: `app/(app)/catalogo/catalogo-client.tsx`
- Modify: `app/(app)/comandas/page.tsx`

**Interfaces:**
- Produces: rotas `/catalogo?produto=<id>` e `/comandas?order=<id>` já interpretadas pelas páginas de destino.

- [ ] **Step 1: Adicionar `catalogItemId` e `orderId`** aos itens de notificação.
- [ ] **Step 2: Transformar cards de estoque e comandas em botões acessíveis** que navegam para o registro correto.
- [ ] **Step 3: Adicionar ação visível `Repor estoque`** que abre o editor do produto indicado.
- [ ] **Step 4: Fazer Catálogo interpretar `produto`** e abrir o diálogo de edição do item.
- [ ] **Step 5: Fazer Comandas interpretar `order`** e abrir o editor da comanda.
- [ ] **Step 6: Alterar badge do sino e texto do cabeçalho** para contar apenas agendamentos novos; manter contagens de pendências nas abas.
- [ ] **Step 7: Garantir foco visível, Enter e Espaço** para todos os cards acionáveis.
- [ ] **Step 8: Executar lint e typecheck**; esperado: PASS.
- [ ] **Step 9: Commit** com `git commit -m "feat: torna notificacoes acionaveis"`.

### Task 7: Verificação integrada

**Files:**
- Modify somente os arquivos que falharem na verificação.

**Interfaces:**
- Consumes: todas as entregas anteriores.
- Produces: fluxo pronto para uso sem regressão conhecida.

- [ ] **Step 1: Executar** `pnpm test`; esperado: todos os testes PASS.
- [ ] **Step 2: Executar** `pnpm lint`; esperado: zero erros.
- [ ] **Step 3: Executar** `pnpm typecheck`; esperado: zero erros.
- [ ] **Step 4: Executar** `pnpm build`; esperado: build de produção concluído.
- [ ] **Step 5: Revisar o diff** para confirmar que nenhum arquivo não relacionado foi alterado ou incluído.
- [ ] **Step 6: Commit de correções de verificação**, se necessário, com `git commit -m "fix: valida integracao operacional"`.
