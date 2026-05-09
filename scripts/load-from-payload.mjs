#!/usr/bin/env node
/**
 * Build-time content loader (Payload variant).
 *
 * Pulls every editorial collection from a running Payload instance via REST,
 * normalises each response into the same shape `scripts/load-content.mjs`
 * produces from WordPress, and writes pretty-printed JSON to
 * src/data/generated/. The Vite build then statically inlines that JSON — no
 * runtime CMS calls.
 *
 * Usage:  npm run load-from-payload
 *         PAYLOAD_API_URL=https://cms.example.com npm run load-from-payload
 */

import { writeFile, mkdir } from 'node:fs/promises'
import { resolve, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const API     = (process.env.PAYLOAD_API_URL || 'http://localhost:3001').replace(/\/+$/, '')
const PUBLIC  = (process.env.PAYLOAD_PUBLIC_URL || API).replace(/\/+$/, '')
const ROOT    = resolve(fileURLToPath(import.meta.url), '..', '..')
const OUT_DIR = resolve(ROOT, 'src/data/generated')

// ── Transport ───────────────────────────────────────────────────────────────

async function fetchCollection(slug, params = '') {
  const url = `${API}/api/${slug}?limit=200&depth=2${params}`
  let res
  try {
    res = await fetch(url)
  } catch (err) {
    if (err.cause?.code === 'ECONNREFUSED' || /ECONNREFUSED/.test(String(err))) {
      throw new Error(
        `Cannot reach ${API} (connection refused).\n` +
        `Is Payload running? Try:  cd payload && npm run dev`
      )
    }
    throw new Error(`Failed to reach ${url}: ${err.message}`)
  }

  if (!res.ok) {
    const body = await res.text().catch(() => '<no body>')
    throw new Error(`HTTP ${res.status} from ${url}\n${body.slice(0, 800)}`)
  }

  const json = await res.json()
  if (!Array.isArray(json.docs)) {
    throw new Error(`Unexpected response from ${url}: missing "docs" array.`)
  }
  return json.docs
}

// ── Helpers ─────────────────────────────────────────────────────────────────

const text = (v) => (v == null ? '' : String(v))
const num  = (v) => (v == null || v === '' ? null : Number(v))

// With locale=all, localized text fields come back as { nl: '...', en: '...' }.
// Non-localized fields are plain values. Both shapes are handled here.
const locStr = (f, locale) => {
  if (f == null) return ''
  if (typeof f === 'object' && !Array.isArray(f)) return String(f[locale] ?? f.nl ?? '')
  return String(f)
}

// Localized array fields (e.g. body) come back as { nl: [...], en: [...] }.
const locArr = (f, locale) => {
  if (!f) return []
  if (Array.isArray(f)) return f
  const arr = f[locale] ?? f.nl
  return Array.isArray(arr) ? arr : []
}

// Payload returns upload relations as { url: '/api/media/file/foo.jpg', alt, ... }
// when depth >= 1. Absolutise so the JSON contains URLs the static frontend can
// load directly without knowing about the CMS host.
function absolutise(url) {
  if (!url) return ''
  if (/^https?:\/\//i.test(url)) return url
  return `${PUBLIC}${url.startsWith('/') ? '' : '/'}${url}`
}

function image(rel) {
  if (!rel) return null
  // Could be a populated doc or just an id (depth=0). We always pass depth=2
  // so the populated case is the norm.
  if (typeof rel !== 'object') return null
  const url = absolutise(rel.url)
  if (!url) return null
  return { src: url, alt: rel.alt || '' }
}

// ── Per-collection transforms ───────────────────────────────────────────────

async function loadShips() {
  const docs = await fetchCollection('ships')
  return docs.map(d => ({
    id: d.id,
    name: text(d.name),
    type: text(d.type),
    lat: num(d.lat),
    lng: num(d.lng),
    port: text(d.port),
    speed: num(d.speed),
    year: num(d.year),
    region: text(d.region) || 'thuiswateren',
    passengers: num(d.passengers),
  }))
}

async function loadBlogPosts() {
  const docs = await fetchCollection('blog-posts', '&locale=all&sort=-date')
  return docs.map(d => {
    const cover  = image(d.coverImage)
    const author = image(d.authorPhoto)
    const nlTitle = locStr(d.title, 'nl')
    return {
      id: d.id,
      slug: text(d.slug) || String(d.id),
      title: nlTitle,
      title_en: locStr(d.title, 'en') || nlTitle,
      date: d.date ? new Date(d.date).toISOString().slice(0, 10) : '',
      category: locStr(d.category, 'nl'),
      category_en: locStr(d.category, 'en') || locStr(d.category, 'nl'),
      author: text(d.author),
      authorPhoto: author?.src || '',
      readTime: text(d.readTime),
      coverImage: cover ? { src: cover.src, alt: cover.alt } : null,
      images: (d.images || [])
        .map(row => {
          const img = image(row?.image)
          if (!img) return null
          return { src: img.src, alt: locStr(row.alt, 'nl') || img.alt || '', after: num(row.after) }
        })
        .filter(Boolean),
      excerpt: locStr(d.excerpt, 'nl'),
      excerpt_en: locStr(d.excerpt, 'en') || locStr(d.excerpt, 'nl'),
      body: locArr(d.body, 'nl').map(row => text(row?.text)).filter(Boolean),
      body_en: locArr(d.body, 'en').map(row => text(row?.text)).filter(Boolean),
    }
  })
}

async function loadTeam() {
  const docs = await fetchCollection('team-members', '&locale=all')
  return docs.map(d => {
    const photo = image(d.photo)
    return {
      id: d.id,
      name: text(d.name),
      role: locStr(d.role, 'nl'),
      role_en: locStr(d.role, 'en') || locStr(d.role, 'nl'),
      location: text(d.location),
      since: text(d.since),
      photo: photo?.src || '',
      bio: locStr(d.bio, 'nl'),
      bio_en: locStr(d.bio, 'en') || locStr(d.bio, 'nl'),
      expertise: locStr(d.expertise, 'nl'),
      expertise_en: locStr(d.expertise, 'en') || locStr(d.expertise, 'nl'),
    }
  })
}

async function loadHarbours() {
  const docs = await fetchCollection('info-boards', '&locale=all')
  return docs.map(d => ({
    id: d.id,
    name: text(d.name),
    lat: num(d.lat),
    lng: num(d.lng),
    status: text(d.status) || 'kandidaat',
    ships: num(d.ships) ?? 0,
    notes: locStr(d.notes, 'nl'),
    notes_en: locStr(d.notes, 'en') || locStr(d.notes, 'nl'),
    date: text(d.date),
  }))
}

async function loadMediaItems() {
  const docs = await fetchCollection('media-items', '&locale=all')
  return docs.map(d => {
    const file = image(d.file)
    return {
      id: d.id,
      type: text(d.type),
      title: locStr(d.title, 'nl'),
      title_en: locStr(d.title, 'en') || locStr(d.title, 'nl'),
      description: locStr(d.description, 'nl'),
      description_en: locStr(d.description, 'en') || locStr(d.description, 'nl'),
      category: text(d.category),
      tag: locStr(d.tag, 'nl'),
      tag_en: locStr(d.tag, 'en') || locStr(d.tag, 'nl'),
      format: text(d.format),
      url: text(d.externalUrl) || file?.src || '',
    }
  })
}

async function loadUnescoSteps() {
  const docs = await fetchCollection('unesco-steps', '&locale=all&sort=order')
  return docs.map(d => ({
    id: d.id,
    year: text(d.year),
    label: locStr(d.label, 'nl'),
    label_en: locStr(d.label, 'en') || locStr(d.label, 'nl'),
    done: Boolean(d.done),
    active: Boolean(d.active),
    order: num(d.order),
  }))
}

async function loadPartners() {
  const docs = await fetchCollection('partners', '&sort=order')
  return docs.map(d => ({
    id: d.id,
    name: text(d.name),
    order: num(d.order),
  }))
}

// ── Driver ──────────────────────────────────────────────────────────────────

const TYPES = [
  { name: 'ships',         file: 'ships.json',         load: loadShips },
  { name: 'blog-posts',    file: 'blog-posts.json',    load: loadBlogPosts },
  { name: 'team',          file: 'team.json',          load: loadTeam },
  { name: 'harbours',      file: 'harbours.json',      load: loadHarbours },
  { name: 'media-items',   file: 'media-items.json',   load: loadMediaItems },
  { name: 'unesco-steps',  file: 'unesco-steps.json',  load: loadUnescoSteps },
  { name: 'partners',      file: 'partners.json',      load: loadPartners },
]

async function main() {
  console.log(`Loading content from ${API}`)
  await mkdir(OUT_DIR, { recursive: true })

  for (const t of TYPES) {
    const items = await t.load()
    const out = resolve(OUT_DIR, t.file)
    await writeFile(out, JSON.stringify(items, null, 2) + '\n', 'utf8')
    console.log(`  ✓ ${t.name}: ${items.length}`)
  }

  console.log('Done. Run `npm run build:static` next.')
}

main().catch(err => {
  console.error('\nload-from-payload failed:\n')
  console.error(err.message || err)
  process.exit(1)
})
