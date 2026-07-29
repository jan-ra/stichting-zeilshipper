/**
 * Backfill images for ships that still have none, using a no-API-key fallback
 * chain (no LLM / search credits involved):
 *
 *   1. Mechanical fix of the ships.json `image` URL
 *        - Jimdo/CF `format=auto` -> `format=jpeg`  (fixes AVIF-only decode)
 *        - strip WordPress `-1024x683` size suffix -> original file
 *        - Wikimedia `/thumb/.../1200px-Name` -> original upload path
 *   2. Scrape og:image / twitter:image / JSON-LD / <img> from the pages we
 *      already have (the `image` URL when it's an HTML page, plus every
 *      `sources[]` URL), with Referer set to the page origin (beats hotlink 403s)
 *   3. Wikimedia Commons API search by ship name (free, keyless)
 *
 * Every candidate is downloaded with a real browser UA + Referer, validated
 * (decodable raster, min edge >= 250px, not a 1x1 pixel), resized (fit 1600,
 * JPEG q82) and attached to the matching ship. Only touches ships whose
 * image is currently empty, so it is safe to re-run.
 *
 * Usage:  cd cms && npx tsx --env-file=.env scripts/backfill-ship-images.mjs
 */

import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

import sharp from 'sharp'
import { getPayload } from 'payload'

import config from '../payload.config'

const REPO_ROOT  = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..')
const SHIPS_JSON = path.join(REPO_ROOT, 'ships.json')

const MAX_WIDTH    = 1600
const JPEG_QUALITY = 82
const MIN_EDGE     = 250          // reject icons / tracking pixels / logos
const FETCH_TIMEOUT = 12_000
const UA = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120 Safari/537.36'

const slug = (s) =>
  s.toLowerCase().normalize('NFKD').replace(/[^\w]+/g, '-').replace(/^-+|-+$/g, '') || 'ship'

function timeoutSignal(ms) {
  const c = new AbortController()
  setTimeout(() => c.abort(), ms).unref?.()
  return c.signal
}

async function rawFetch(url, { accept } = {}) {
  let origin = ''
  try { origin = new URL(url).origin } catch { /* ignore */ }
  return fetch(url, {
    redirect: 'follow',
    signal: timeoutSignal(FETCH_TIMEOUT),
    headers: {
      'User-Agent': UA,
      Accept: accept ?? '*/*',
      ...(origin ? { Referer: origin + '/' } : {}),
      'Api-User-Agent': 'zeilshipper-image-backfill/1.0 (ramdohr.jan@gmail.com)',
    },
  })
}

// ── Candidate generators ────────────────────────────────────────────────────

function mechanicalVariants(url) {
  if (!url) return []
  const out = []
  if (url.includes('format=auto')) out.push(url.replace('format=auto', 'format=jpeg'))
  out.push(url)
  const wp = url.match(/^(.*?)-\d+x\d+(\.[a-z]{3,4})(\?.*)?$/i)
  if (wp) out.push(wp[1] + wp[2] + (wp[3] ?? ''))
  const wm = url.match(/\/wikipedia\/commons\/thumb\/([0-9a-f])\/([0-9a-f]{2})\/([^/]+)\/[^/]+$/i)
  if (wm) out.push(`https://upload.wikimedia.org/wikipedia/commons/${wm[1]}/${wm[2]}/${wm[3]}`)
  return [...new Set(out)]
}

function absolute(href, base) {
  try { return new URL(href, base).href } catch { return null }
}

function extractImages(html, baseUrl) {
  const found = []
  const push = (u) => { const a = absolute(u, baseUrl); if (a) found.push(a) }

  for (const re of [
    /<meta[^>]+(?:property|name)=["'](?:og:image(?::url)?|twitter:image(?::src)?)["'][^>]+content=["']([^"']+)["']/gi,
    /<meta[^>]+content=["']([^"']+)["'][^>]+(?:property|name)=["'](?:og:image(?::url)?|twitter:image(?::src)?)["']/gi,
  ]) {
    let m; while ((m = re.exec(html))) push(m[1])
  }

  for (const m of html.matchAll(/<script[^>]+type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi)) {
    try {
      const walk = (node) => {
        if (!node) return
        if (typeof node === 'string') return
        if (Array.isArray(node)) return node.forEach(walk)
        if (node.image) {
          const img = node.image
          if (typeof img === 'string') push(img)
          else if (Array.isArray(img)) img.forEach((x) => push(typeof x === 'string' ? x : x?.url))
          else if (img?.url) push(img.url)
        }
        Object.values(node).forEach(walk)
      }
      walk(JSON.parse(m[1].trim()))
    } catch { /* ignore malformed ld+json */ }
  }

  // Last resort: raster <img> that isn't obviously an icon/sprite/svg.
  for (const m of html.matchAll(/<img[^>]+src=["']([^"']+\.(?:jpe?g|png|webp))(?:\?[^"']*)?["']/gi)) {
    if (/sprite|logo|icon|avatar|placeholder|blank|pixel/i.test(m[1])) continue
    push(m[1])
  }
  return [...new Set(found)]
}

async function scrapePages(urls) {
  const imgs = []
  for (const p of urls) {
    if (!p) continue
    try {
      const res = await rawFetch(p, { accept: 'text/html,*/*' })
      const ct = res.headers.get('content-type') || ''
      if (!/html|xml|text/i.test(ct)) continue
      const html = await res.text()
      imgs.push(...extractImages(html, res.url || p))
    } catch { /* page unreachable — skip */ }
  }
  return [...new Set(imgs)]
}

async function wikimediaCandidates(name) {
  const q = encodeURIComponent(`${name} schip`)
  const api = `https://commons.wikimedia.org/w/api.php?action=query&format=json&generator=search&gsrsearch=${q}&gsrnamespace=6&gsrlimit=6&prop=imageinfo&iiprop=url|mime&iiurlwidth=1600`
  try {
    const res = await rawFetch(api, { accept: 'application/json' })
    const data = await res.json()
    const pages = Object.values(data?.query?.pages ?? {})
    const out = []
    for (const pg of pages) {
      const info = pg?.imageinfo?.[0]
      if (!info) continue
      if (info.mime && !/^image\//.test(info.mime)) continue
      if (info.thumburl) out.push(info.thumburl)
      if (info.url) out.push(info.url)
    }
    return [...new Set(out)]
  } catch { return [] }
}

// ── Download + validate ─────────────────────────────────────────────────────

async function tryImage(url, tried) {
  if (!url || tried.has(url)) return null
  tried.add(url)
  try {
    const res = await rawFetch(url, { accept: 'image/avif,image/webp,image/*,*/*;q=0.8' })
    if (!res.ok) return null
    const buf = Buffer.from(await res.arrayBuffer())
    if (buf.length < 128) return null
    const meta = await sharp(buf).metadata()
    const w = meta.width ?? 0, h = meta.height ?? 0
    if (Math.min(w, h) < MIN_EDGE) return null
    return { buf, url, w, h }
  } catch { return null }
}

async function resolveImage(v, tried) {
  // 1. mechanical variants of the declared image URL
  for (const u of mechanicalVariants(v.image)) {
    const r = await tryImage(u, tried)
    if (r) return { ...r, via: 'mechanical' }
  }
  // 2. scrape the image page + every source page for a declared image
  const scraped = await scrapePages([v.image, ...(Array.isArray(v.sources) ? v.sources : [])])
  for (const img of scraped) {
    for (const u of mechanicalVariants(img)) {
      const r = await tryImage(u, tried)
      if (r) return { ...r, via: 'scrape' }
    }
  }
  // 3. Wikimedia Commons
  for (const u of await wikimediaCandidates(v.name)) {
    const r = await tryImage(u, tried)
    if (r) return { ...r, via: 'wikimedia' }
  }
  return null
}

// ── Main ────────────────────────────────────────────────────────────────────

async function main() {
  const raw = JSON.parse(fs.readFileSync(SHIPS_JSON, 'utf8'))
  const byName = new Map(Object.values(raw).filter((v) => v?.name).map((v) => [v.name, v]))

  const payload = await getPayload({ config })

  // Ships that have a ships.json image URL but no attached image yet.
  const { docs: ships } = await payload.find({
    collection: 'ships',
    where: { image: { exists: false } },
    limit: 1000,
    pagination: false,
  })
  const targets = ships.filter((s) => byName.get(s.name)?.image)
  console.log(`${targets.length} ship(s) missing an image with a ships.json URL to try\n`)

  const ok = [], failed = []
  for (const ship of targets) {
    const v = byName.get(ship.name)
    const tried = new Set()
    const r = await resolveImage(v, tried)
    if (!r) { failed.push(ship.name); console.log(`FAIL  ${ship.name}`); continue }

    const resized = await sharp(r.buf)
      .rotate()
      .resize({ width: MAX_WIDTH, height: MAX_WIDTH, fit: 'inside', withoutEnlargement: true })
      .jpeg({ quality: JPEG_QUALITY })
      .toBuffer()

    const filename = `${slug(ship.name)}.jpg`
    const media = await payload.create({
      collection: 'media',
      data: { alt: ship.name },
      file: { data: resized, mimetype: 'image/jpeg', name: filename, size: resized.length },
    })
    await payload.update({ collection: 'ships', id: ship.id, data: { image: media.id } })

    ok.push(ship.name)
    console.log(`OK    ${ship.name} — via ${r.via} — ${r.w}x${r.h} src -> ${(resized.length / 1024).toFixed(0)}KB`)
  }

  console.log(`\nDone. ${ok.length} newly attached, ${failed.length} still missing.`)
  if (failed.length) console.log(`Still missing: ${failed.join(', ')}`)
  process.exit(0)
}

main().catch((err) => { console.error('\nbackfill-ship-images failed:\n', err); process.exit(1) })
