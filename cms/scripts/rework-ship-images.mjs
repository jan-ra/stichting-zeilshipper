/**
 * Re-pick images for a named list of ships whose current image is wrong.
 * Chooses a DIFFERENT picture: every candidate's final (resized) bytes are
 * hashed and rejected if they match any already-attached image — which
 * includes the ship's own current image — so the result is guaranteed to
 * differ from what's there now.
 *
 * Candidate sources (first valid, non-duplicate wins):
 *   - ships.json `image` (mechanical variants)
 *   - og:image / twitter / JSON-LD  AND  filtered <img> tags from every source
 *   - Wikimedia Commons by ENI, then by name
 * JPEGs are tried before PNGs. Banners / sub-250px / duplicates are rejected.
 *
 * Usage:  cd cms && npx tsx --env-file=.env scripts/rework-ship-images.mjs
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

const TARGETS = [
  'ANNA', 'ANNA TRIJNTJE', 'LOTUS', 'SPES MEA', 'LIBERTÉ', 'KOREVAER', 'AMBIANCE',
  'PELIKAAN', 'TSJERK HIDDES', 'VRIENDSCHAP', 'SYBARIS', 'ELBRICH', 'SOEVEREIN',
  'ZEEWOLF', 'TWEE GEBROEDERS', "'T WAPEN FAN FRYSLÂN", 'KLAAS KOMPAAN', 'WINDBRUID',
  'ORION', 'DE VLIETER', 'DE AMAZONE', 'SUDWESTER', 'BRACKSAND', 'RIVAL',
  'CHATEAUROUX', 'SUMMERTIME', 'BALDER', 'ACTIA', 'VRIJBUITER', 'LIS',
  'NIL DESPERANDUM', 'MINERVA', 'ZORG MET VLIJT', 'GRIETJE', 'MARE FAN FRYSLÂN',
  'DE HOOP', 'SUDERMAR', 'MERIDIAAN', 'AVONDROOD',
]

const MAX_WIDTH = 1600, JPEG_QUALITY = 82, MIN_EDGE = 250, MAX_ASPECT = 2.5, FETCH_TIMEOUT = 12_000
const UA = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120 Safari/537.36'
const slug = (s) => s.toLowerCase().normalize('NFKD').replace(/[^\w]+/g, '-').replace(/^-+|-+$/g, '') || 'ship'
const sig = (b) => crypto.createHash('sha256').update(b).digest('hex')
const tSignal = (ms) => { const c = new AbortController(); setTimeout(() => c.abort(), ms).unref?.(); return c.signal }
const abs = (h, b) => { try { return new URL(h, b).href } catch { return null } }

async function rawFetch(url, accept) {
  let origin = ''; try { origin = new URL(url).origin } catch {}
  return fetch(url, { redirect: 'follow', signal: tSignal(FETCH_TIMEOUT), headers: {
    'User-Agent': UA, Accept: accept ?? '*/*', ...(origin ? { Referer: origin + '/' } : {}),
    'Api-User-Agent': 'zeilshipper-image-backfill/1.0 (ramdohr.jan@gmail.com)' } })
}

const IMG_JUNK = /logo|icon|sprite|avatar|placeholder|blank|pixel|badge|flag|emoji|favicon|wp-content\/plugins\/|thumbnails?\//i

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

function extractImages(html, base) {
  const meta = [], imgs = []
  const push = (arr, u) => { const a = abs(u, base); if (a) arr.push(a) }
  for (const re of [
    /<meta[^>]+(?:property|name)=["'](?:og:image(?::url)?|twitter:image(?::src)?)["'][^>]+content=["']([^"']+)["']/gi,
    /<meta[^>]+content=["']([^"']+)["'][^>]+(?:property|name)=["'](?:og:image(?::url)?|twitter:image(?::src)?)["']/gi,
  ]) { let m; while ((m = re.exec(html))) push(meta, m[1]) }
  for (const m of html.matchAll(/<script[^>]+type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi)) {
    try { const walk = (n) => { if (!n || typeof n === 'string') return
      if (Array.isArray(n)) return n.forEach(walk)
      if (n.image) { const i = n.image
        if (typeof i === 'string') push(meta, i)
        else if (Array.isArray(i)) i.forEach((x) => push(meta, typeof x === 'string' ? x : x?.url))
        else if (i?.url) push(meta, i.url) }
      Object.values(n).forEach(walk) }
      walk(JSON.parse(m[1].trim())) } catch {}
  }
  for (const m of html.matchAll(/<img[^>]+src=["']([^"']+\.(?:jpe?g|png|webp))(?:\?[^"']*)?["']/gi)) {
    if (IMG_JUNK.test(m[1])) continue
    push(imgs, m[1])
  }
  const jpgFirst = (a, b) => (/\.png(\?|$)/i.test(a) ? 1 : 0) - (/\.png(\?|$)/i.test(b) ? 1 : 0)
  return [...new Set([...meta.sort(jpgFirst), ...imgs.sort(jpgFirst)])]
}

async function scrapePages(urls) {
  const imgs = []
  for (const p of urls) { if (!p) continue
    try { const r = await rawFetch(p, 'text/html,*/*'); const ct = r.headers.get('content-type') || ''
      if (!/html|xml|text/i.test(ct)) continue
      imgs.push(...extractImages(await r.text(), r.url || p)) } catch {} }
  return [...new Set(imgs)]
}

async function commons(query, mustContain) {
  const api = `https://commons.wikimedia.org/w/api.php?action=query&format=json&generator=search&gsrsearch=${encodeURIComponent(query)}&gsrnamespace=6&gsrlimit=8&prop=imageinfo&iiprop=url|mime&iiurlwidth=1600`
  try { const data = await (await rawFetch(api, 'application/json')).json(); const out = []
    for (const pg of Object.values(data?.query?.pages ?? {})) { const info = pg?.imageinfo?.[0]; if (!info) continue
      if (info.mime && !/^image\/(jpe?g|png|tiff|webp)/.test(info.mime)) continue
      const title = String(pg.title || '')
      if (mustContain && !mustContain.some((t) => title.toUpperCase().includes(t.toUpperCase()))) continue
      out.push(info.thumburl || info.url) }
    return out.filter(Boolean) } catch { return [] }
}

async function tryImage(url, seen, tried) {
  if (!url || tried.has(url)) return null
  tried.add(url)
  try {
    const res = await rawFetch(url, 'image/avif,image/webp,image/*,*/*;q=0.8')
    if (!res.ok) return null
    const buf = Buffer.from(await res.arrayBuffer()); if (buf.length < 256) return null
    const meta = await sharp(buf).metadata(); const w = meta.width ?? 0, h = meta.height ?? 0
    if (Math.min(w, h) < MIN_EDGE) return null
    if (Math.max(w, h) / Math.min(w, h) > MAX_ASPECT) return null
    const resized = await sharp(buf).rotate().resize({ width: MAX_WIDTH, height: MAX_WIDTH, fit: 'inside', withoutEnlargement: true }).jpeg({ quality: JPEG_QUALITY }).toBuffer()
    const hash = sig(resized)
    if (seen.has(hash)) return null            // same as an existing image (incl. this ship's current)
    return { resized, hash, url, w, h }
  } catch { return null }
}

async function main() {
  const raw = JSON.parse(fs.readFileSync(SHIPS_JSON, 'utf8'))
  const byName = new Map()
  for (const v of Object.values(raw)) { if (!v?.name) continue
    if (!byName.has(v.name)) byName.set(v.name, [])
    byName.get(v.name).push(v) }

  const payload = await getPayload({ config })

  // Seed the "seen" set with the RAW bytes of every attached image (our pipeline
  // output), so a candidate resolving to the same source is rejected as a dup.
  const seen = new Set()
  const allMedia = await payload.find({ collection: 'media', limit: 5000, pagination: false, depth: 0 })
  for (const m of allMedia.docs) {
    try { const r = await fetch(m.url, { signal: tSignal(FETCH_TIMEOUT) }); if (!r.ok) continue
      seen.add(sig(Buffer.from(await r.arrayBuffer()))) } catch {}
  }
  console.log(`Seeded ${seen.size} existing image hash(es).\n`)

  const ok = [], none = []
  for (const name of TARGETS) {
    const { docs: rows } = await payload.find({ collection: 'ships', where: { name: { equals: name } }, limit: 10, pagination: false })
    if (!rows.length) { console.log(`?? no ship named ${name}`); continue }
    const entries = byName.get(name) ?? []
    const sources = [...new Set(entries.flatMap((e) => Array.isArray(e.sources) ? e.sources : []))]
    const images  = entries.map((e) => e.image).filter(Boolean)
    const enis    = [...new Set(entries.map((e) => String(e.eni_number || '').replace(/\D/g, '')).filter(Boolean))]

    for (const ship of rows) {
      const tried = new Set()
      const oldId = typeof ship.image === 'object' ? ship.image?.id : ship.image

      const batches = [
        async () => images.flatMap(mechanicalVariants),
        async () => scrapePages(sources),
        async () => (await Promise.all(enis.map((e) => commons(`ENI ${e}`, [e, e.padStart(8, '0')])))).flat(),
        async () => commons(`${name} ship`, [name]),
      ]
      let hit = null
      for (const batch of batches) { for (const u of await batch()) { const r = await tryImage(u, seen, tried); if (r) { hit = r; break } } if (hit) break }

      if (!hit) { none.push(name); console.log(`NONE  ${name} — no different valid image found (left as-is)`); continue }

      const media = await payload.create({ collection: 'media', data: { alt: name }, file: { data: hit.resized, mimetype: 'image/jpeg', name: `${slug(name)}.jpg`, size: hit.resized.length } })
      await payload.update({ collection: 'ships', id: ship.id, data: { image: media.id } })
      if (oldId) { try { await payload.delete({ collection: 'media', id: oldId }) } catch {} }
      seen.add(hit.hash)
      ok.push(name)
      console.log(`OK    ${name} — ${hit.w}x${hit.h} — ${(hit.resized.length / 1024).toFixed(0)}KB — ${hit.url.slice(0, 78)}`)
    }
  }

  console.log(`\nDone. ${ok.length} reworked, ${none.length} had no different image.`)
  if (none.length) console.log(`No alternative found: ${[...new Set(none)].join(', ')}`)
  process.exit(0)
}

main().catch((e) => { console.error('\nrework failed:\n', e); process.exit(1) })
