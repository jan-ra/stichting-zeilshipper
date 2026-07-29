/**
 * Backfill images for the remaining ships — those with NO image URL in
 * ships.json (image: null) — reusing the same keyless fallback logic, with
 * guardrails learned from the first pass:
 *
 *   Candidate order (first valid wins):
 *     1. Wikimedia Commons search by ENI number   (highest precision)
 *     2. og:image / twitter:image / JSON-LD from each sources[] page
 *        (JPEG candidates tried before PNG — logos/buttons are usually PNG)
 *     3. Wikimedia Commons search by ship name
 *
 *   A candidate is accepted only if it is a decodable raster, min edge >=250px,
 *   aspect ratio within 2.5:1 (rejects banners), and its resized bytes are not
 *   an exact duplicate of an already-attached image or another in this run
 *   (rejects shared site-default logos).
 *
 * Only touches ships whose image is currently empty; safe to re-run.
 * Usage:  cd cms && npx tsx --env-file=.env scripts/backfill-ship-images-all.mjs
 */

import crypto from 'node:crypto'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

import sharp from 'sharp'
import { getPayload } from 'payload'

import config from '../payload.config'

const REPO_ROOT  = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..')
const SHIPS_JSON = path.join(REPO_ROOT, 'ships.json')

const MAX_WIDTH = 1600, JPEG_QUALITY = 82, MIN_EDGE = 250, MAX_ASPECT = 2.5, FETCH_TIMEOUT = 12_000
const UA = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120 Safari/537.36'
const slug = (s) => s.toLowerCase().normalize('NFKD').replace(/[^\w]+/g, '-').replace(/^-+|-+$/g, '') || 'ship'
const sig = (buf) => crypto.createHash('sha256').update(buf).digest('hex')

function tSignal(ms) { const c = new AbortController(); setTimeout(() => c.abort(), ms).unref?.(); return c.signal }
async function rawFetch(url, accept) {
  let origin = ''; try { origin = new URL(url).origin } catch {}
  return fetch(url, { redirect: 'follow', signal: tSignal(FETCH_TIMEOUT), headers: {
    'User-Agent': UA, Accept: accept ?? '*/*', ...(origin ? { Referer: origin + '/' } : {}),
    'Api-User-Agent': 'zeilshipper-image-backfill/1.0 (ramdohr.jan@gmail.com)',
  } })
}
const abs = (h, b) => { try { return new URL(h, b).href } catch { return null } }

function extractImages(html, base) {
  const out = []
  const push = (u) => { const a = abs(u, base); if (a) out.push(a) }
  for (const re of [
    /<meta[^>]+(?:property|name)=["'](?:og:image(?::url)?|twitter:image(?::src)?)["'][^>]+content=["']([^"']+)["']/gi,
    /<meta[^>]+content=["']([^"']+)["'][^>]+(?:property|name)=["'](?:og:image(?::url)?|twitter:image(?::src)?)["']/gi,
  ]) { let m; while ((m = re.exec(html))) push(m[1]) }
  for (const m of html.matchAll(/<script[^>]+type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi)) {
    try {
      const walk = (n) => { if (!n || typeof n === 'string') return
        if (Array.isArray(n)) return n.forEach(walk)
        if (n.image) { const i = n.image
          if (typeof i === 'string') push(i)
          else if (Array.isArray(i)) i.forEach((x) => push(typeof x === 'string' ? x : x?.url))
          else if (i?.url) push(i.url) }
        Object.values(n).forEach(walk) }
      walk(JSON.parse(m[1].trim()))
    } catch {}
  }
  // JPEG-ish before PNG so photos win over logos.
  return [...new Set(out)].sort((a, b) => (/\.png(\?|$)/i.test(a) ? 1 : 0) - (/\.png(\?|$)/i.test(b) ? 1 : 0))
}

async function scrapePages(urls) {
  const imgs = []
  for (const p of urls) { if (!p) continue
    try { const r = await rawFetch(p, 'text/html,*/*'); const ct = r.headers.get('content-type') || ''
      if (!/html|xml|text/i.test(ct)) continue
      imgs.push(...extractImages(await r.text(), r.url || p))
    } catch {} }
  return [...new Set(imgs)]
}

async function commons(query, mustContain) {
  const api = `https://commons.wikimedia.org/w/api.php?action=query&format=json&generator=search&gsrsearch=${encodeURIComponent(query)}&gsrnamespace=6&gsrlimit=8&prop=imageinfo&iiprop=url|mime&iiurlwidth=1600`
  try {
    const data = await (await rawFetch(api, 'application/json')).json()
    const out = []
    for (const pg of Object.values(data?.query?.pages ?? {})) {
      const info = pg?.imageinfo?.[0]; if (!info) continue
      if (info.mime && !/^image\/(jpe?g|png|tiff|webp)/.test(info.mime)) continue
      const title = String(pg.title || '')
      if (mustContain && !mustContain.some((t) => title.toUpperCase().includes(t.toUpperCase()))) continue
      if (info.thumburl) out.push(info.thumburl)
      else if (info.url) out.push(info.url)
    }
    return out
  } catch { return [] }
}

async function tryImage(url, seen, tried) {
  if (!url || tried.has(url)) return null
  tried.add(url)
  try {
    const res = await rawFetch(url, 'image/avif,image/webp,image/*,*/*;q=0.8')
    if (!res.ok) return null
    const buf = Buffer.from(await res.arrayBuffer()); if (buf.length < 256) return null
    const meta = await sharp(buf).metadata()
    const w = meta.width ?? 0, h = meta.height ?? 0
    if (Math.min(w, h) < MIN_EDGE) return null
    if (Math.max(w, h) / Math.min(w, h) > MAX_ASPECT) return null   // banner
    const resized = await sharp(buf).rotate().resize({ width: MAX_WIDTH, height: MAX_WIDTH, fit: 'inside', withoutEnlargement: true }).jpeg({ quality: JPEG_QUALITY }).toBuffer()
    const hash = sig(resized)
    if (seen.has(hash)) return null                                 // duplicate of an existing/other ship
    return { resized, hash, url, w, h }
  } catch { return null }
}

async function main() {
  const raw = JSON.parse(fs.readFileSync(SHIPS_JSON, 'utf8'))
  // Driver: ships.json entries that had NO image URL (the "rest").
  const rest = Object.values(raw).filter((v) => v?.name && !v.image)
  const byName = new Map(rest.map((v) => [v.name, v]))

  const payload = await getPayload({ config })

  // Pre-hash already-attached images so we can reject shared logos/duplicates.
  const seen = new Set()
  const attached = await payload.find({ collection: 'media', where: { id: { exists: true } }, limit: 5000, pagination: false, depth: 0 })
  for (const m of attached.docs) {
    try { const r = await fetch(m.url, { signal: tSignal(FETCH_TIMEOUT) }); if (!r.ok) continue
      const b = await sharp(Buffer.from(await r.arrayBuffer())).rotate().resize({ width: MAX_WIDTH, height: MAX_WIDTH, fit: 'inside', withoutEnlargement: true }).jpeg({ quality: JPEG_QUALITY }).toBuffer()
      seen.add(sig(b)) } catch {}
  }
  console.log(`Pre-hashed ${seen.size} existing image(s).`)

  const { docs: ships } = await payload.find({ collection: 'ships', where: { image: { exists: false } }, limit: 1000, pagination: false })
  const targets = ships.filter((s) => byName.has(s.name))
  console.log(`${targets.length} ship(s) to process\n`)

  const ok = [], failed = []
  let i = 0
  for (const ship of targets) {
    i++
    const v = byName.get(ship.name)
    const tried = new Set()
    const eni = String(v.eni_number || '').replace(/\D/g, '')
    const eniPad = eni ? eni.padStart(8, '0') : ''

    const candidateBatches = [
      // 1. Commons by ENI (require the ENI in the file title)
      async () => eni ? commons(`ENI ${eni}`, [eni, eniPad]) : [],
      // 2. og:image from source pages
      async () => scrapePages(Array.isArray(v.sources) ? v.sources : []),
      // 3. Commons by name (require the name in the file title)
      async () => commons(`${ship.name} ship`, [ship.name]),
    ]

    let hit = null
    for (const batch of candidateBatches) {
      for (const u of await batch()) {
        const r = await tryImage(u, seen, tried)
        if (r) { hit = r; break }
      }
      if (hit) break
    }

    if (!hit) { failed.push(ship.name); console.log(`[${i}/${targets.length}] FAIL  ${ship.name}`); continue }

    const media = await payload.create({ collection: 'media', data: { alt: ship.name }, file: { data: hit.resized, mimetype: 'image/jpeg', name: `${slug(ship.name)}.jpg`, size: hit.resized.length } })
    await payload.update({ collection: 'ships', id: ship.id, data: { image: media.id } })
    seen.add(hit.hash)
    ok.push(ship.name)
    console.log(`[${i}/${targets.length}] OK    ${ship.name} — ${hit.w}x${hit.h} — ${(hit.resized.length / 1024).toFixed(0)}KB — ${hit.url.slice(0, 70)}`)
  }

  console.log(`\nDone. ${ok.length} newly attached, ${failed.length} still without image.`)
  if (failed.length) console.log(`\nStill missing (${failed.length}): ${failed.join(', ')}`)
  process.exit(0)
}

main().catch((e) => { console.error('\nfailed:\n', e); process.exit(1) })
