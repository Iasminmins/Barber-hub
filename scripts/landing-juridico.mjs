/** Verifica se as páginas jurídicas respondem e se o footer aponta para elas. */
import { chromium } from '@playwright/test'

const BASE = process.env.LANDING_URL ?? 'http://localhost:3000'
const browser = await chromium.launch()
let falhas = 0
const ok = (m) => console.log(`  ok   ${m}`)
const bad = (m) => {
  falhas++
  console.log(`  FALHA ${m}`)
}

const page = await browser.newPage({ viewport: { width: 1280, height: 900 } })

console.log('\n[páginas jurídicas]')
for (const rota of ['/termos', '/privacidade', '/cookies']) {
  const erros = []
  page.on('console', (m) => m.type() === 'error' && erros.push(m.text().slice(0, 120)))
  const resp = await page.goto(BASE + rota, { waitUntil: 'networkidle' })
  const status = resp.status()
  const h1 = await page.locator('h1').first().textContent()
  const overflow = await page.evaluate(
    () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
  )
  status === 200 ? ok(`${rota} responde 200 — "${h1.trim()}"`) : bad(`${rota} retornou ${status}`)
  overflow > 1 ? bad(`${rota} com overflow de ${overflow}px`) : null
  erros.length ? bad(`${rota}: ${erros.length} erro(s) de console`) : null

  // marcadores pendentes visíveis ao usuário
  const texto = await page.locator('main').innerText()
  const pendentes = (texto.match(/\[[A-ZÁÉÍÓÚÇ][^\]]*\]/g) ?? []).length
  console.log(`       ${pendentes} marcador(es) [PENDENTE] a preencher`)
}

console.log('\n[links do footer]')
await page.goto(BASE, { waitUntil: 'networkidle' })
for (const [rota, rotulo] of [
  ['/termos', 'Termos de uso'],
  ['/privacidade', 'Política de privacidade'],
  ['/cookies', 'Política de cookies'],
]) {
  const n = await page.locator(`footer a[href="${rota}"]`).count()
  n === 1 ? ok(`footer aponta para ${rota}`) : bad(`${rotulo}: ${n} links para ${rota}`)
}

console.log('\n[depoimentos]')
const estrelas = await page.locator('svg.lucide-star').count()
estrelas === 0 ? ok('nenhuma estrela sem origem verificável') : bad(`${estrelas} estrelas exibidas`)
const reservados = await page.getByText('Espaço reservado').count()
reservados === 0 ? ok('nenhum placeholder visível') : bad(`${reservados} placeholders visíveis`)

await browser.close()
console.log(falhas === 0 ? '\nRESULTADO: tudo certo' : `\nRESULTADO: ${falhas} falha(s)`)
