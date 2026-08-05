# Agenda por Horário de Funcionamento Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Fazer a visão diária respeitar o horário configurado para o dia selecionado sem ocultar agendamentos excepcionais.

**Architecture:** Extrair o cálculo da faixa visível para um módulo puro e testável. A tela usa o resultado para gerar linhas, altura e posições relativas ao início calculado.

**Tech Stack:** TypeScript, React 19, Next.js 16, Vitest, Tailwind CSS.

## Global Constraints

- Não alterar as visões semanal e mensal.
- Manter 64 pixels por hora.
- Nunca ocultar agendamentos existentes fora do horário configurado.

---

### Task 1: Calcular a faixa da grade

**Files:**
- Create: `lib/agenda-grid.ts`
- Create: `lib/agenda-grid.test.ts`

**Interfaces:**
- Produces: `getAgendaGridRange(businessHours, appointments, blocks)` e `minutesToGridTop(time, startMinutes)`.

- [ ] **Step 1: Escrever testes que cobrem abertura e fechamento fracionados, expansão por agendamento e dia fechado.**
- [ ] **Step 2: Executar os testes e confirmar falha por funções ausentes.**
- [ ] **Step 3: Implementar o menor cálculo que satisfaça os casos.**
- [ ] **Step 4: Executar os testes e confirmar aprovação.**

### Task 2: Renderizar a faixa dinâmica

**Files:**
- Modify: `app/(app)/agenda/agenda-client.tsx`
- Test: `lib/agenda-grid.test.ts`

**Interfaces:**
- Consumes: `getAgendaGridRange` e `minutesToGridTop`.

- [ ] **Step 1: Substituir `HOURS` e `timeToTop` pelo resultado calculado para o dia selecionado.**
- [ ] **Step 2: Exibir aviso de barbearia fechada preservando eventos excepcionais.**
- [ ] **Step 3: Executar `pnpm.cmd check`.**
- [ ] **Step 4: Revisar o diff, registrar e publicar a correção.**
