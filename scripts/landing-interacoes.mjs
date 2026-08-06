/** Testes de interação da landing: tabs, menu mobile, âncoras e CTAs. */
import { chromium } from '@playwright/test'

const BASE = process.env.LANDING_URL ?? 'http://localhost:3000'
const browser = await chromium.launch()
let falhas = 0
const ok = (m) => console.log(`  ok   ${m}`)
const bad = (m) => {
  falhas++
  console.log(`  FALHA ${m}`)
}

// --- Tabs do tour (desktop) ---
{
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } })
  await page.goto(BASE, { waitUntil: 'networkidle' })
  console.log('\n[tour do produto — 1440x900]')

  const tabs = page.getByRole('tab')
  const total = await tabs.count()
  total === 5 ? ok(`${total} abas encontradas`) : bad(`esperava 5 abas, achei ${total}`)

  const alturas = []
  for (let i = 0; i < total; i++) {
    await tabs.nth(i).click()
    await page.waitForTimeout(450)
    const painel = page.getByRole('tabpanel')
    const visiveis = await painel.count()
    visiveis === 1 ? null : bad(`aba ${i}: ${visiveis} painéis visíveis`)
    const box = await painel.first().boundingBox()
    alturas.push(Math.round(box.height))
    const selecionada = await tabs.nth(i).getAttribute('aria-selected')
    selecionada === 'true' ? null : bad(`aba ${i} sem aria-selected=true`)
  }
  ok(`troca de aba funcional — alturas dos painéis: ${alturas.join(', ')}px`)

  // Navegação por teclado
  await tabs.first().focus()
  await page.keyboard.press('ArrowRight')
  await page.waitForTimeout(200)
  const segundaAtiva = await tabs.nth(1).getAttribute('aria-selected')
  segundaAtiva === 'true' ? ok('seta direita navega entre abas') : bad('seta direita não navegou')

  await page.close()
}

// --- Menu mobile + âncoras + CTAs ---
{
  const page = await browser.newPage({ viewport: { width: 390, height: 844 } })
  await page.goto(BASE, { waitUntil: 'networkidle' })
  console.log('\n[menu mobile — 390x844]')

  const botao = page.getByRole('button', { name: /abrir menu/i })
  await botao.click()
  await page.waitForTimeout(300)
  const menu = page.locator('#menu-mobile')
  ;(await menu.isVisible()) ? ok('menu abre') : bad('menu não abriu')
  // Após abrir, o rótulo do botão muda para "Fechar menu".
  const botaoFechar = page.getByRole('button', { name: /fechar menu/i })
  ;(await botaoFechar.getAttribute('aria-expanded')) === 'true'
    ? ok('aria-expanded correto')
    : bad('aria-expanded não atualizou')

  const links = menu.getByRole('link')
  const qtd = await links.count()
  qtd >= 7 ? ok(`${qtd} links no menu (5 âncoras + 2 CTAs)`) : bad(`só ${qtd} links no menu`)

  // Clicar numa âncora fecha o menu e rola
  await menu.getByRole('link', { name: 'Planos' }).click()
  await page.waitForTimeout(900)
  ;(await menu.isVisible()) ? bad('menu não fechou após clicar na âncora') : ok('menu fecha ao navegar')
  const y = await page.evaluate(() => window.scrollY)
  y > 200 ? ok(`âncora rolou a página (scrollY=${Math.round(y)})`) : bad(`âncora não rolou (scrollY=${y})`)

  await page.close()
}

// --- Destinos dos CTAs ---
{
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } })
  await page.goto(BASE, { waitUntil: 'networkidle' })
  console.log('\n[CTAs e links externos]')

  const cadastro = await page.locator('a[href^="/cadastro"]').count()
  const login = await page.locator('a[href="/login"]').count()
  const whats = await page.locator('a[href*="wa.me"]').count()
  cadastro >= 5 ? ok(`${cadastro} CTAs apontando para /cadastro`) : bad(`só ${cadastro} CTAs de cadastro`)
  login >= 1 ? ok(`${login} links para /login`) : bad('nenhum link de login')
  whats >= 1 ? ok(`${whats} links de WhatsApp`) : bad('nenhum link de WhatsApp')

  // Âncoras precisam ter destino existente
  const ancoras = await page.locator('a[href^="#"]').evaluateAll((els) =>
    els.map((e) => e.getAttribute('href')).filter((h) => h && h !== '#'),
  )
  const quebradas = []
  for (const href of [...new Set(ancoras)]) {
    if ((await page.locator(href).count()) === 0) quebradas.push(href)
  }
  quebradas.length === 0
    ? ok(`${new Set(ancoras).size} âncoras com destino válido`)
    : bad(`âncoras sem destino: ${quebradas.join(', ')}`)

  await page.close()
}

// --- Accordion do FAQ ---
{
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } })
  await page.goto(BASE, { waitUntil: 'networkidle' })
  console.log('\n[FAQ]')

  const perguntas = page.locator('#duvidas button[aria-expanded]')
  const total = await perguntas.count()
  total >= 8 ? ok(`${total} perguntas no accordion`) : bad(`só ${total} perguntas`)

  const abertasInicial = await page.locator('#duvidas button[aria-expanded="true"]').count()
  abertasInicial === 1 ? ok('abre com 1 resposta visível') : bad(`${abertasInicial} abertas no início`)

  // Abrir a terceira e conferir que a primeira fecha
  await perguntas.nth(2).click()
  await page.waitForTimeout(450)
  const abertas = await page.locator('#duvidas button[aria-expanded="true"]').count()
  abertas === 1 ? ok('só uma resposta aberta por vez') : bad(`${abertas} abertas ao mesmo tempo`)
  ;(await perguntas.nth(2).getAttribute('aria-expanded')) === 'true'
    ? ok('aria-expanded acompanha o clique')
    : bad('aria-expanded não atualizou')

  // Fechar clicando de novo
  await perguntas.nth(2).click()
  await page.waitForTimeout(450)
  ;(await page.locator('#duvidas button[aria-expanded="true"]').count()) === 0
    ? ok('clique repetido fecha a resposta')
    : bad('resposta não fechou')

  await page.close()
}

await browser.close()
console.log(falhas === 0 ? '\nRESULTADO: todas as interações passaram' : `\nRESULTADO: ${falhas} falha(s)`)
