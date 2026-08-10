# Assistente Operacional Barbearia Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build an in-app assistant that answers approved Barber Hub operational questions with role-aware data access and a plan-based monthly limit per user.

**Architecture:** Add pure assistant domain functions in `lib`, a Supabase usage table, a server route at `/api/assistant/chat`, and a compact chat widget mounted in the authenticated app shell. The route classifies questions into a fixed intent list, applies permissions, fetches controlled data, then returns a short response without letting AI query the database directly.

**Tech Stack:** Next.js App Router, React 19, Supabase, TypeScript, Vitest, lucide-react, existing UI components.

## Global Constraints

- Use plan-based monthly limits per authenticated user: Starter 20, Pro 50, Premium 150.
- Financial general intents are allowed only for `owner` and `manager`.
- The assistant must answer only about Barber Hub and the barbershop's own data.
- The MVP must not create, edit, or delete records through chat.
- The model must not execute SQL or access the database directly.
- Conversation history is local UI state only.

---

### Task 1: Assistant Domain Logic

**Files:**
- Create: `lib/assistant.ts`
- Test: `lib/assistant.test.ts`

**Interfaces:**
- Produces: `classifyAssistantIntent(question: string): AssistantIntent`
- Produces: `canUseAssistantIntent(intent: AssistantIntent, role: Role): boolean`
- Produces: `buildAssistantAnswer(input: AssistantAnswerInput): string`
- Produces: `getAssistantPeriod(now: Date): string`
- Produces: `getNextAssistantResetDate(now: Date): string`

- [ ] Write tests for classifying supported questions and out-of-scope questions.
- [ ] Write tests for blocking financial intents for `barber` and allowing them for `owner` and `manager`.
- [ ] Implement the fixed intent classifier with normalized Portuguese text.
- [ ] Implement answer formatting for revenue, orders, payment methods, appointments, clients, top service, top employee, help, empty data, denied, and out-of-scope states.
- [ ] Run `pnpm vitest run lib/assistant.test.ts`.

### Task 2: Supabase Usage Tracking

**Files:**
- Create: `supabase/migrations/20260810190000_add_assistant_usage.sql`

**Interfaces:**
- Produces table: `public.assistant_usage`
- Produces unique key: `(user_id, period)`

- [ ] Add `assistant_usage` with `id`, `barbershop_id`, `user_id`, `period`, `used_count`, `created_at`, `updated_at`.
- [ ] Add indexes for `barbershop_id`, `user_id`, and `period`.
- [ ] Enable RLS and allow authenticated users to select their own rows.
- [ ] Grant service role full access and authenticated select only.

### Task 3: Assistant API Route

**Files:**
- Create: `app/api/assistant/chat/route.ts`
- Modify: `.env.example`
- Test: `lib/assistant-route.test.ts`

**Interfaces:**
- Consumes: functions from `lib/assistant.ts`
- Produces route response: `{ answer: string; intent: AssistantIntent; remaining: number; limit: number }`

- [ ] Write tests for limit calculation and safe response helpers that can run without live Supabase.
- [ ] Implement session lookup from `Authorization: Bearer <token>`.
- [ ] Load active member for the user and use the first active barbershop membership for the MVP.
- [ ] Check current period usage with service role Supabase client.
- [ ] Classify the question before any optional model call.
- [ ] Return out-of-scope without calling a model.
- [ ] Deny protected intents for non-admin roles.
- [ ] Query only known tables for the selected intent.
- [ ] Increment usage only after a question is processed.
- [ ] Add `OPENAI_API_KEY` and `OPENAI_ASSISTANT_MODEL` to `.env.example`; make model optional and use deterministic local answers if no key exists.
- [ ] Run `pnpm vitest run lib/assistant-route.test.ts`.

### Task 4: Chat Widget UI

**Files:**
- Create: `components/assistant/assistant-chat.tsx`
- Modify: `components/shell/app-shell.tsx`

**Interfaces:**
- Consumes route: `POST /api/assistant/chat` with `{ question: string }`
- Produces mounted widget inside authenticated app shell.

- [ ] Build floating assistant button with `MessageCircle`.
- [ ] Build compact panel with local message state, suggested prompts, remaining monthly limit, loading state, and error state.
- [ ] Send requests with the Supabase access token from the browser client.
- [ ] Keep messages in local state only.
- [ ] Mount the widget in `AppShell` after the main layout content.

### Task 5: Verification

**Files:**
- Modify as needed only for failing type/lint issues.

- [ ] Run `pnpm lint`.
- [ ] Run `pnpm typecheck`.
- [ ] Run `pnpm test`.
- [ ] Run `pnpm build`.
- [ ] Inspect `git diff` and ensure no unrelated changes are present.
