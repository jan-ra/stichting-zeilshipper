#!/usr/bin/env node
// Compare base-map styles for the globe on the real pages. Run from the repo root:
//
//   npm run globe-styles            screenshots of / and /vloot in every style, collected
//                                   in .verify/globe-styles/index.html (the comparison card)
//   npm run globe-styles -- --serve also keep the site running afterwards, so each style
//                                   can be opened and played with at the printed URLs
//
// Uses the content the last `npm run dev` / `npm run verify` generated
// (site/src/data/generated), served by Vite's dev server. Styles live in
// site/src/components/globe/mapStyles.js; production always uses the default one.
import { spawn } from 'node:child_process'
import { existsSync, mkdirSync, rmSync, writeFileSync } from 'node:fs'
import { resolve, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import { chromium } from '@playwright/test'

import { MAP_STYLES, DEFAULT_MAP_STYLE } from '../site/src/components/globe/mapStyles.js'

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const SITE = resolve(ROOT, 'site')
const OUT = resolve(ROOT, '.verify/globe-styles')
const PORT = 5299
const BASE = `http://localhost:${PORT}`
const SERVE = process.argv.includes('--serve')
const PAGES = [{ path: '/', name: 'home', label: 'Home' }, { path: '/vloot', name: 'fleet', label: 'Fleet' }]

if (!existsSync(resolve(SITE, 'src/data/generated/ships.json'))) {
  console.error('No generated site content. Run `npm run dev` or `npm run verify` once first.')
  process.exit(1)
}

const vite = spawn('npx', ['vite', '--port', String(PORT), '--strictPort'], { cwd: SITE, stdio: ['ignore', 'pipe', 'inherit'] })
const stop = () => { try { vite.kill() } catch {} }
process.on('SIGINT', () => { stop(); process.exit(130) })

async function waitForServer() {
  for (let i = 0; i < 60; i++) {
    try { if ((await fetch(BASE)).ok) return } catch {}
    await new Promise(r => setTimeout(r, 500))
  }
  throw new Error(`Vite did not start on ${BASE}`)
}

try {
  await waitForServer()
  rmSync(OUT, { recursive: true, force: true })
  mkdirSync(OUT, { recursive: true })

  const browser = await chromium.launch()
  for (const name of Object.keys(MAP_STYLES)) {
    for (const page of PAGES) {
      // A fresh context per shot: the style choice is kept in sessionStorage.
      const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } })
      const tab = await ctx.newPage()
      await tab.goto(`${BASE}${page.path}?mapStyle=${name}`, { waitUntil: 'networkidle' })
      await tab.waitForTimeout(3000) // tiles settle after networkidle on the globe
      await tab.screenshot({ path: resolve(OUT, `${name}-${page.name}.png`) })
      await ctx.close()
    }
    console.log(`  ${name}`)
  }
  await browser.close()

  const cards = Object.entries(MAP_STYLES).map(([name, s]) => `
    <section>
      <h2>${name}${name === DEFAULT_MAP_STYLE ? ' <span>current</span>' : ''}</h2>
      <p>${s.provider} &middot; <code>?mapStyle=${name}</code></p>
      <div class="shots">${PAGES.map(p => `
        <a href="${name}-${p.name}.png"><img src="${name}-${p.name}.png" alt="${name}, ${p.label}" loading="lazy"><small>${p.label}</small></a>`).join('')}
      </div>
    </section>`).join('')

  writeFileSync(resolve(OUT, 'index.html'), `<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<title>Globe map styles</title>
<style>
  :root { color-scheme: light; --ink: #0f2238; --gold: #a07d33; --bg: #f4ede1; }
  body { margin: 0; padding: 32px 16px; background: var(--bg); color: var(--ink); font: 15px/1.5 system-ui, sans-serif; }
  main { max-width: 1400px; margin: 0 auto; }
  h1 { font-weight: 500; margin: 0 0 4px; }
  header p { margin: 0 0 32px; color: #3a4f65; }
  section { background: #fff; border: 1px solid rgba(15,34,56,.1); padding: 16px 20px 20px; margin-bottom: 20px; }
  h2 { margin: 0; font-size: 18px; font-weight: 600; }
  h2 span { font-size: 11px; text-transform: uppercase; letter-spacing: .1em; color: #fff; background: var(--gold); padding: 2px 6px; vertical-align: middle; }
  section > p { margin: 2px 0 12px; color: #3a4f65; font-size: 13px; }
  .shots { display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 12px; }
  .shots a { color: inherit; text-decoration: none; }
  .shots img { width: 100%; display: block; border: 1px solid rgba(15,34,56,.15); }
  small { color: #3a4f65; }
</style></head><body><main>
<header><h1>Globe map styles</h1>
<p>The current globe on the home and fleet pages in each free base-map style, 1440&times;900.
To try one live: <code>npm run globe-styles -- --serve</code>, or open any local page with <code>?mapStyle=&lt;name&gt;</code>.
The atmosphere and marker colours are tuned for <code>dark</code>; picking another style may mean retuning those.</p></header>
${cards}
</main></body></html>
`)

  console.log(`\nComparison card: ${resolve(OUT, 'index.html')}`)
  if (SERVE) {
    console.log('\nLive, per style (Ctrl-C to stop):')
    for (const name of Object.keys(MAP_STYLES)) console.log(`  ${name.padEnd(14)} ${BASE}/?mapStyle=${name}`)
  } else {
    stop()
  }
} catch (err) {
  console.error(err)
  stop()
  process.exit(1)
}
