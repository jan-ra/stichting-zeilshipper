// Every page renders, in both languages, on desktop and mobile, without a
// JavaScript error and without an untranslated i18n key leaking onto the page.
// Content-specific pages (blog/media detail) are discovered from the JSON the
// build just generated, so the suite follows whatever the CMS contains.
import fs from 'node:fs'
import path from 'node:path'

import { expect, test } from '@playwright/test'

const GENERATED = path.resolve('site/src/data/generated')
const readJson = f => { try { return JSON.parse(fs.readFileSync(path.join(GENERATED, f), 'utf8')) } catch { return [] } }

const ROUTES = ['/', '/vloot', '/informatieborden', '/unesco', '/team', '/media', '/blog', '/support', '/privacy', '/photo-credits']
for (const p of readJson('blog-posts.json')) if (p.slug) ROUTES.push(`/blog/${p.slug}`)
for (const m of readJson('media-items.json')) if (m.id != null) ROUTES.push(`/media/${m.id}`)

// t() returns the dot-path itself when a key is missing — e.g. "home.heroTitle".
const I18N_ROOTS = 'nav|footer|pageTitles|regions|home|fleet|infoBorden|unesco|team|media|blog|blogDetail|mediaDetail|supportLetter'
const RAW_KEY = new RegExp(`(^|\\s)(${I18N_ROOTS})\\.[a-zA-Z][\\w.]*(\\s|$)`)

// Third parties we embed; their console noise is not ours to fix.
const THIRD_PARTY = /youtube|ytimg|googlevideo|spotify|stadia|maptiler|openfreemap|doubleclick|google/i

for (const lang of ['nl', 'en']) {
  for (const route of ROUTES) {
    test(`${lang} ${route}`, async ({ page, baseURL }, testInfo) => {
      const errors = []
      page.on('pageerror', e => errors.push(`pageerror: ${e.message}`))
      page.on('console', m => {
        if (m.type() !== 'error') return
        const where = m.location()?.url || ''
        if (THIRD_PARTY.test(where) || THIRD_PARTY.test(m.text())) return
        errors.push(`console: ${m.text()} @ ${where}`)
      })
      page.on('requestfailed', r => {
        const u = r.url()
        if (u.startsWith(baseURL) && !/\.(woff2?|ttf)$/.test(u)) errors.push(`requestfailed: ${u} ${r.failure()?.errorText}`)
      })
      page.on('response', r => {
        if (r.url().startsWith(baseURL) && r.status() >= 400) errors.push(`http ${r.status()}: ${r.url()}`)
      })

      await page.addInitScript(l => { try { localStorage.setItem('sz_lang', l) } catch {} }, lang)
      const res = await page.goto(route, { waitUntil: 'networkidle' })
      expect(res?.status(), 'document status').toBeLessThan(400)

      await expect(page.locator('nav').first()).toBeVisible()
      await expect(page.locator('footer').first()).toBeVisible()
      const text = await page.locator('body').innerText()
      expect(text.trim().length, 'page has content').toBeGreaterThan(200)
      const leaked = text.split('\n').find(line => RAW_KEY.test(line))
      expect(leaked, 'untranslated i18n key on page').toBeUndefined()

      if (route === '/vloot') {
        await expect(page.locator('canvas').first(), 'globe canvas').toBeVisible({ timeout: 20_000 })
      }

      if (testInfo.project.name === 'desktop') {
        const name = `${lang}${route.replace(/\//g, '_') || '_home'}`.replace(/_$/, '')
        await page.screenshot({ path: `.verify/screenshots/${name}.png`, fullPage: false })
      }
      expect(errors, 'browser errors').toEqual([])
    })
  }
}
