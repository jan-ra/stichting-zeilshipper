// Build-time SEO: after Vite has written dist/, give every route its own HTML file
// with that page's title, description, canonical URL and share tags, and write
// sitemap.xml. The app itself is unchanged — each file is index.html with a different
// <head>, so React boots the same way on all of them.
//
// Cloudflare's static assets serve /vloot from vloot.html (html_handling
// auto-trailing-slash), so the per-route file is what crawlers and link previews see;
// unknown paths still fall back to index.html (not_found_handling = SPA).
import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs'
import { resolve, dirname } from 'node:path'

import { allRoutes, canonicalUrl, SITE_NAME, KEYWORDS } from '../src/seo.js'
import { strings } from '../src/i18n/strings.js'

const START = '<!-- seo:start -->'
const END = '<!-- seo:end -->'

const esc = s => String(s ?? '').replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;')

export function headTags(route, defaultImage) {
  const url = canonicalUrl(route.path)
  const image = route.image || defaultImage
  return [
    `<title>${esc(route.title)}</title>`,
    `<meta name="description" content="${esc(route.description)}" />`,
    `<meta name="keywords" content="${esc(KEYWORDS)}" />`,
    route.index === false ? '<meta name="robots" content="noindex, follow" />' : '',
    `<link rel="canonical" href="${esc(url)}" />`,
    `<meta property="og:site_name" content="${esc(SITE_NAME)}" />`,
    `<meta property="og:type" content="${route.type}" />`,
    `<meta property="og:title" content="${esc(route.title)}" />`,
    `<meta property="og:description" content="${esc(route.description)}" />`,
    `<meta property="og:url" content="${esc(url)}" />`,
    '<meta property="og:locale" content="nl_NL" />',
    '<meta property="og:locale:alternate" content="en_GB" />',
    image ? `<meta property="og:image" content="${esc(image)}" />` : '',
    `<meta name="twitter:card" content="${image ? 'summary_large_image' : 'summary'}" />`,
    `<meta name="twitter:title" content="${esc(route.title)}" />`,
    `<meta name="twitter:description" content="${esc(route.description)}" />`,
    image ? `<meta name="twitter:image" content="${esc(image)}" />` : '',
  ].filter(Boolean).join('\n    ')
}

export function sitemapXml(routes) {
  const urls = routes.filter(r => r.index !== false).map(r => [
    '  <url>',
    `    <loc>${esc(canonicalUrl(r.path))}</loc>`,
    r.lastmod ? `    <lastmod>${r.lastmod}</lastmod>` : '',
    `    <priority>${r.priority.toFixed(1)}</priority>`,
    '  </url>',
  ].filter(Boolean).join('\n'))
  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls.join('\n')}\n</urlset>\n`
}

const readJson = (dir, file) => {
  const p = resolve(dir, file)
  return existsSync(p) ? JSON.parse(readFileSync(p, 'utf8')) : []
}

// `defaultImage`: absolute URL of the share image for pages without their own.
export default function seo({ generatedDir, defaultImage = null }) {
  let outDir
  return {
    name: 'seo',
    apply: 'build',
    configResolved(config) { outDir = resolve(config.root, config.build.outDir) },
    closeBundle() {
      const template = readFileSync(resolve(outDir, 'index.html'), 'utf8')
      if (!template.includes(START) || !template.includes(END)) {
        throw new Error(`seo: index.html has no ${START} … ${END} block`)
      }
      const routes = allRoutes({
        titles: strings.nl.pageTitles,
        blogPosts: readJson(generatedDir, 'blog-posts.json'),
        mediaItems: readJson(generatedDir, 'media-items.json'),
      })
      const render = route => template.replace(
        new RegExp(`${START}[\\s\\S]*?${END}`),
        `${START}\n    ${headTags(route, defaultImage)}\n    ${END}`,
      )
      for (const route of routes) {
        // "/" stays index.html; "/blog/x" becomes blog/x.html.
        const file = route.path === '/' ? 'index.html' : `${route.path.slice(1)}.html`
        const target = resolve(outDir, file)
        mkdirSync(dirname(target), { recursive: true })
        writeFileSync(target, render(route))
      }
      writeFileSync(resolve(outDir, 'sitemap.xml'), sitemapXml(routes))
      console.log(`  seo: ${routes.length} route(s), sitemap.xml`)
    },
  }
}
