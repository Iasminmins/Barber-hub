# PDF mensal por funcionário Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Adicionar em cada card do ranking mensal um download de PDF individual com totais e memória de cálculo idênticos aos exibidos na tela.

**Architecture:** Extrair o cálculo mensal hoje embutido em `funcionarios/page.tsx` para um modelo puro e testável. Um gerador client-side isolado transforma esse modelo em PDF usando jsPDF e AutoTable; a página apenas controla estado, erro e download.

**Tech Stack:** Next.js 16, React 19, TypeScript 5.7, Vitest 4, jsPDF 4.2.1, jspdf-autotable 5.0.8, Poppler/pypdf para QA.

## Global Constraints

- Gerar um arquivo individual referente ao mês exibido no ranking.
- Nome: `fechamento-<funcionario>-<AAAA-MM>.pdf`.
- Manter totais zerados e explicar comandas com valor final zero.
- Fixar versões das dependências e atualizar `pnpm-lock.yaml`.
- Uma falha de PDF não pode derrubar a página.
- Verificar PDF curto e multipágina por extração de texto e renderização PNG.

---

### Task 1: Modelo mensal puro

**Files:**
- Create: `lib/employee-monthly-statement.ts`
- Create: `lib/employee-monthly-statement.test.ts`
- Modify: `app/(app)/funcionarios/page.tsx`

**Interfaces:**
- Consumes: `Employee`, `Order`, `Commission` de `lib/types.ts`.
- Produces: `buildEmployeeMonthlyStatement(input): EmployeeMonthlyStatement`, com `employee`, `barbershop`, `competence`, `services`, `revenue`, `subscriptionRevenue`, `orderCommission`, `subscriptionCommission`, `totalCommission` e `orders`.

- [ ] **Step 1: Escrever testes que fixem totais, assinatura e comanda zerada**

```ts
it('keeps zero-value orders in the statement without commission', () => {
  const result = buildEmployeeMonthlyStatement(fixtureWithZeroValueOrder)
  expect(result.orders[0].received).toBe(0)
  expect(result.orders[0].commission).toBe(0)
  expect(result.totalCommission).toBe(result.subscriptionCommission)
})
```

- [ ] **Step 2: Executar o teste e confirmar RED**

Run: `pnpm.cmd test lib/employee-monthly-statement.test.ts`  
Expected: FAIL porque o construtor ainda não existe.

- [ ] **Step 3: Implementar tipos e cálculo mínimo**

```ts
export function buildEmployeeMonthlyStatement(input: EmployeeMonthlyStatementInput): EmployeeMonthlyStatement {
  const orders = input.orders.filter((order) => order.status === 'paga' && order.createdAt.slice(0, 7) === input.competence)
  // Resolver funcionário, itens, bases e comissões com as mesmas regras atuais.
  return { ...totals, orders: details }
}
```

- [ ] **Step 4: Substituir o cálculo duplicado da página pelo modelo puro**

Manter ranking, memória expansível e totais consumindo `EmployeeMonthlyStatement`, sem alterar valores visíveis.

- [ ] **Step 5: Executar teste, tipos e página**

Run: `pnpm.cmd test lib/employee-monthly-statement.test.ts && pnpm.cmd typecheck`  
Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add lib/employee-monthly-statement.ts lib/employee-monthly-statement.test.ts "app/(app)/funcionarios/page.tsx"
git commit -m "refactor: extrai fechamento mensal de funcionarios"
```

### Task 2: Gerador de PDF

**Files:**
- Modify: `package.json`
- Modify: `pnpm-lock.yaml`
- Create: `lib/employee-monthly-pdf.ts`
- Create: `lib/employee-monthly-pdf.test.ts`

**Interfaces:**
- Consumes: `EmployeeMonthlyStatement` da Task 1.
- Produces: `buildEmployeeMonthlyPdf(statement): jsPDF` e `employeeMonthlyPdfFilename(statement): string`.

- [ ] **Step 1: Instalar versões fixas**

Run: `pnpm.cmd add --save-exact jspdf@4.2.1 jspdf-autotable@5.0.8`

- [ ] **Step 2: Escrever testes de nome, cabeçalhos e totais**

```ts
expect(employeeMonthlyPdfFilename(statement)).toBe('fechamento-evandro-2026-08.pdf')
const bytes = buildEmployeeMonthlyPdf(statement).output('arraybuffer')
expect(bytes.byteLength).toBeGreaterThan(1000)
```

- [ ] **Step 3: Executar teste e confirmar RED**

Run: `pnpm.cmd test lib/employee-monthly-pdf.test.ts`  
Expected: FAIL porque o gerador não existe.

- [ ] **Step 4: Implementar A4, cabeçalho, resumo e tabelas paginadas**

Usar `new jsPDF({ unit: 'pt', format: 'a4' })`, `autoTable(doc, ...)`, repetir cabeçalho nas páginas e rodapé `Página X de Y`. Escapar textos como dados; não usar HTML.

- [ ] **Step 5: Executar testes e typecheck**

Run: `pnpm.cmd test lib/employee-monthly-pdf.test.ts && pnpm.cmd typecheck`  
Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add package.json pnpm-lock.yaml lib/employee-monthly-pdf.ts lib/employee-monthly-pdf.test.ts
git commit -m "feat: gera pdf mensal por funcionario"
```

### Task 3: Ação em cada card e QA visual

**Files:**
- Modify: `app/(app)/funcionarios/page.tsx`
- Create: `output/pdf/fechamento-funcionario-exemplo.pdf` (QA local, não versionar)
- Create: `tmp/pdfs/fechamento-funcionario-*.png` (QA local, remover ao finalizar)

**Interfaces:**
- Consumes: `buildEmployeeMonthlyPdf` e `employeeMonthlyPdfFilename`.
- Produces: botão `Gerar PDF`, estado por funcionário e mensagem de erro local.

- [ ] **Step 1: Adicionar teste do estado de geração à lógica extraída**

Testar que uma exceção do gerador retorna mensagem `Não foi possível gerar o PDF. Tente novamente.` sem propagá-la.

- [ ] **Step 2: Implementar handler com import dinâmico**

```ts
const { buildEmployeeMonthlyPdf, employeeMonthlyPdfFilename } = await import('@/lib/employee-monthly-pdf')
buildEmployeeMonthlyPdf(statement).save(employeeMonthlyPdfFilename(statement))
```

Adicionar `FileDown` no card, desabilitar somente o funcionário em geração e exibir erro no mesmo card.

- [ ] **Step 3: Executar suíte completa**

Run: `pnpm.cmd lint && pnpm.cmd typecheck && pnpm.cmd test && pnpm.cmd build`  
Expected: tudo PASS.

- [ ] **Step 4: Gerar amostras curta e multipágina**

Salvar fixtures em `output/pdf/`, extrair texto com `pypdf`, executar `pdfinfo` e renderizar com `pdftoppm -png`. Confirmar competência, totais, paginação, rodapés, ausência de cortes e caracteres quebrados.

- [ ] **Step 5: Verificar no navegador**

Confirmar um botão por card, download correto e nenhuma alteração nos totais do ranking.

- [ ] **Step 6: Commit**

```bash
git add "app/(app)/funcionarios/page.tsx"
git commit -m "feat: adiciona pdf ao ranking mensal"
```
