import assert from 'node:assert/strict'
import { test } from 'node:test'

import { allRoutes, canonicalUrl, snippet, KEYWORDS } from '../src/seo.js'
import { headTags, sitemapXml } from '../scripts/seo-plugin.mjs'
import { strings } from '../src/i18n/strings.js'

const routes = allRoutes({
  titles: strings.nl.pageTitles,
  blogPosts: [
    { slug: 'bruine-vloot', title: 'Bruine Vloot', excerpt: 'Een dag op de "Bruine Vloot" <aan boord>.', date: '2026-01-15', coverImage: { src: '/baked/abc-het_vloot.jpg' } },
    { slug: 'groot', title: 'Groot', excerpt: 'x', coverImage: { src: 'https://media.example/9mb.jpg' } },
  ],
  mediaItems: [{ id: 9, title: 'Tekst', description: 'Intro' }],
})

test('every static page, blog post and media item gets a route', () => {
  const paths = routes.map(r => r.path)
  for (const p of ['/', '/vloot', '/unesco', '/blog', '/media', '/blog/bruine-vloot', '/media/9']) assert.ok(paths.includes(p), p)
})

test('the keywords the foundation asked for are in every page head', () => {
  assert.match(KEYWORDS, /bruine vloot/)
  assert.match(KEYWORDS, /unesco erfgoed/)
  for (const r of routes) assert.match(headTags(r, null), /name="keywords" content="[^"]*bruine vloot[^"]*unesco erfgoed/)
})

test('head tags are escaped and carry a canonical URL', () => {
  const blog = routes.find(r => r.path === '/blog/bruine-vloot')
  const head = headTags(blog, null)
  assert.ok(head.includes('&quot;Bruine Vloot&quot; &lt;aan boord&gt;'))
  assert.ok(head.includes('<link rel="canonical" href="https://stichtingzeilschipper.nl/blog/bruine-vloot" />'))
  assert.ok(head.includes('<meta property="og:type" content="article" />'))
})

test('only small baked images are used as share images; others fall back to the default', () => {
  assert.equal(routes.find(r => r.path === '/blog/bruine-vloot').image, 'https://stichtingzeilschipper.nl/baked/abc-het_vloot.jpg')
  const big = routes.find(r => r.path === '/blog/groot')
  assert.equal(big.image, null)
  assert.ok(headTags(big, 'https://stichtingzeilschipper.nl/og-image.jpg').includes('og:image" content="https://stichtingzeilschipper.nl/og-image.jpg"'))
  assert.ok(!headTags(big, null).includes('og:image'))
})

test('sitemap lists indexable routes only, with lastmod where known', () => {
  const xml = sitemapXml(routes)
  assert.ok(xml.includes('<loc>https://stichtingzeilschipper.nl/</loc>'))
  assert.ok(xml.includes('<loc>https://stichtingzeilschipper.nl/media/9</loc>'))
  assert.ok(xml.includes('<lastmod>2026-01-15</lastmod>'))
  assert.ok(!xml.includes('/privacy'))
})

test('snippet trims on a word boundary', () => {
  const s = snippet('woord '.repeat(60), 40)
  assert.ok(s.length <= 40)
  assert.ok(s.endsWith('…'))
  assert.equal(snippet('kort'), 'kort')
  assert.equal(canonicalUrl('/vloot/'), 'https://stichtingzeilschipper.nl/vloot')
})
