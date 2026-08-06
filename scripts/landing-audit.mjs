/**
 * Auditoria visual da landing page.
 *
 * Captura screenshots em todas as resoluções alvo e reporta overflow
 * horizontal, erros de console e erros de rede.
 *
 *   node scripts/landing-audit.mjs [rotulo]
 */
import { chromium } from '@playwright/test'
import { mkdirSync } from 'node:fs'

const BASE = process.env.LANDING_URL ?? 'http://localhost:3000'
const label = process.argv[2] ?? 'atual'
const outDir = `outputs/landing-${label}`

const VIEWPORTS = [
  { name: '1920x1080', width: 1920, height: 1080 },
  { name: '1440x900', width: 1440, height: 900 },
  { name: '1280x800', width: 1280, height: 800 },
  { name: '768x1024', width: 768, height: 1024 },
  { name: '390x844', width: 390, height: 844 },
  { name: '360x800', width: 360, height: 800 },
]

mkdirSync(outDir, { recursive: true })

const browser = await chromium.launch()
let problemas = 0

for (const vp of VIEWPORTS) {
  const context = await browser.newContext({
    viewport: { width: vp.width, height: vp.height },
    deviceScaleFactor: 1,
  })
  const page = await context.newPage()

  const consoleErros = []
  const redeErros = []
  page.on('console', (msg) => {
    if (msg.type() === 'error') consoleErros.push(msg.text().slice(0, 160))
  })
  page.on('requestfailed', (req) => {
    redeErros.push(`${req.method()} ${req.url().slice(0, 110)}`)
  })

  await page.goto(BASE, { waitUntil: 'networkidle' })
  await page.waitForTimeout(2200)

  const metricas = await page.evaluate(() => ({
    scrollW: document.documentElement.scrollWidth,
    clientW: document.documentElement.clientWidth,
    bodyOverflowX: getComputedStyle(document.body).overflowX,
  }))

  const overflow = metricas.scrollW - metricas.clientW

  await page.screenshot({ path: `${outDir}/${vp.name}-dobra.png` })
  await page.screenshot({ path: `${outDir}/${vp.name}-completa.png`, fullPage: true })

  const linhas = [`\n[${vp.name}]`]
  if (overflow > 1) {
    linhas.push(`  OVERFLOW HORIZONTAL: +${overflow}px (body overflow-x: ${metricas.bodyOverflowX})`)
    problemas++
  } else {
    linhas.push('  overflow horizontal: ok')
  }
  if (consoleErros.length) {
    linhas.push(`  ERROS DE CONSOLE (${consoleErros.length}):`)
    consoleErros.slice(0, 5).forEach((e) => linhas.push(`    - ${e}`))
    problemas++
  } else {
    linhas.push('  console: limpo')
  }
  if (redeErros.length) {
    linhas.push(`  ERROS DE REDE (${redeErros.length}):`)
    redeErros.slice(0, 5).forEach((e) => linhas.push(`    - ${e}`))
    problemas++
  } else {
    linhas.push('  rede: ok')
  }
  console.log(linhas.join('\n'))

  await context.close()
}

await browser.close()
console.log(`\nScreenshots em ${outDir}`)
console.log(problemas === 0 ? 'RESULTADO: nenhum problema detectado' : `RESULTADO: ${problemas} ponto(s) a corrigir`)
