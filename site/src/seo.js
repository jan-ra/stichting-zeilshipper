// Search and share metadata for every route. Used twice:
//   - at build time by scripts/seo-plugin.mjs, which writes a copy of index.html per
//     route with these tags in its <head> (crawlers and link previews do not run JS)
//     plus sitemap.xml;
//   - at runtime by App.jsx, which keeps title/description/canonical in step while the
//     visitor navigates.
// Plain data and functions only: this module is imported by Node as well as Vite.

export const SITE_URL = 'https://stichtingzeilschipper.nl'
export const SITE_NAME = 'Stichting Zeilschipper'

export const KEYWORDS = [
  'bruine vloot',
  'unesco erfgoed',
  'immaterieel erfgoed',
  'zeilschipper',
  'schipper bruine vloot',
  'traditionele zeilschepen',
  'chartervaart',
  'IJsselmeer',
  'Waddenzee',
].join(', ')

const DEFAULT_DESCRIPTION =
  'Stichting Zeilschipper werkt aan UNESCO-erkenning van het ambacht van de schipper Bruine Vloot als immaterieel cultureel erfgoed van de mensheid.'

// Static routes, in sitemap order. `index: false` keeps a page out of the sitemap.
export const STATIC_ROUTES = [
  { path: '/', page: 'home', priority: 1.0, description: DEFAULT_DESCRIPTION },
  { path: '/vloot', page: 'vloot', priority: 0.9,
    description: 'De schepen van de Bruine Vloot: traditionele zeilschepen, hun thuishavens en waar ze nu varen, op een wereldbol.' },
  { path: '/unesco', page: 'unesco', priority: 0.9,
    description: 'De weg naar UNESCO-erkenning: hoe het ambacht van de schipper van de Bruine Vloot immaterieel erfgoed wordt.' },
  { path: '/informatieborden', page: 'informatieborden', priority: 0.7,
    description: 'Informatieborden in Nederlandse havens over de Bruine Vloot en het immaterieel erfgoed van de zeilschipper.' },
  { path: '/media', page: 'media', priority: 0.7,
    description: "Video's, teksten en podcasts over de Bruine Vloot en het UNESCO-erfgoed van de zeilschipper." },
  { path: '/blog', page: 'blog', priority: 0.8,
    description: 'Verhalen en nieuws over de Bruine Vloot, de zeilschippers en de weg naar UNESCO-erfgoed.' },
  { path: '/team', page: 'team', priority: 0.5,
    description: 'Het team achter Stichting Zeilschipper en de UNESCO-nominatie van de Bruine Vloot.' },
  { path: '/support', page: 'support', priority: 0.6,
    description: 'Steun de UNESCO-nominatie van het ambacht van de schipper Bruine Vloot met een steunbrief.' },
  { path: '/privacy', page: 'privacy', priority: 0.1, index: false, description: DEFAULT_DESCRIPTION },
  { path: '/photo-credits', page: 'photo-credits', priority: 0.1, index: false, description: DEFAULT_DESCRIPTION },
]

// Trim long text to a search-snippet length on a word boundary.
export function snippet(text, max = 160) {
  const s = String(text || '').replace(/\s+/g, ' ').trim()
  if (s.length <= max) return s
  const cut = s.slice(0, max - 1)
  return cut.slice(0, cut.lastIndexOf(' ')).replace(/[,.;:]$/, '') + '…'
}

// An image usable as a share preview: baked copies are small and served by the site
// itself; anything else (originals on the media bucket can be many MB) is skipped.
function shareImage(src) {
  return typeof src === 'string' && src.startsWith('/baked/') ? SITE_URL + encodeURI(src) : null
}

// Every route with its metadata. `titles` are the NL page titles (strings.pageTitles).
export function allRoutes({ titles, blogPosts = [], mediaItems = [] }) {
  const routes = STATIC_ROUTES.map(r => ({
    ...r,
    title: titles[r.page] || titles.home,
    type: 'website',
  }))
  for (const p of blogPosts) {
    if (!p.slug) continue
    routes.push({
      path: `/blog/${p.slug}`, page: 'blog-detail', priority: 0.7, type: 'article',
      title: `${p.title} — ${SITE_NAME}`,
      description: snippet(p.excerpt) || DEFAULT_DESCRIPTION,
      image: shareImage(p.coverImage?.src),
      lastmod: p.date || null,
    })
  }
  for (const m of mediaItems) {
    if (m.id == null) continue
    routes.push({
      path: `/media/${m.id}`, page: 'media-detail', priority: 0.5, type: 'website',
      title: `${m.title} — ${SITE_NAME}`,
      description: snippet(m.description) || DEFAULT_DESCRIPTION,
      image: shareImage(m.coverImage?.src),
    })
  }
  return routes
}

export const canonicalUrl = path => SITE_URL + (path === '/' ? '/' : path.replace(/\/+$/, ''))
