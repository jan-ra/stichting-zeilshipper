#!/usr/bin/env node
/**
 * Build-time image baker.
 *
 * After load-from-payload has written src/data/generated/*.json, this script:
 *   1. Scans the JSON for any string URL that starts with MEDIA_BASE_URL.
 *   2. Probes each URL (HEAD) for content-type and size.
 *   3. Downloads image/* responses up to BAKE_MAX_BYTES into public/baked/.
 *   4. Rewrites the JSON in-place so baked URLs point to /baked/<filename>.
 *
 * Larger files and non-image types (video, audio, pdf, zip) are left alone
 * and load directly from R2 at runtime.
 *
 * Env:
 *   MEDIA_BASE_URL   - required, e.g. https://media.zeilshipper.nl
 *   BAKE_MAX_BYTES   - default 2_097_152 (2 MiB)
 */
import { readdir, readFile, writeFile, mkdir } from 'node:fs/promises'
import { resolve, dirname, extname, basename } from 'node:path'
import { fileURLToPath } from 'node:url'
import { createHash } from 'node:crypto'

const SITE      = resolve(fileURLToPath(import.meta.url), '..', '..')
const GEN_DIR   = resolve(SITE, 'src/data/generated')
const BAKED_DIR = resolve(SITE, 'public/baked')
const PUBLIC    = '/baked'
const MEDIA     = (process.env.MEDIA_BASE_URL || '').replace(/\/+$/, '')
const MAX_BYTES = Number(process.env.BAKE_MAX_BYTES || 2_097_152)

if (!MEDIA) {
  console.warn('bake-media: MEDIA_BASE_URL not set — skipping.')
  process.exit(0)
}

// ── URL collection ──────────────────────────────────────────────────────────

function collectUrls(node, out) {
  if (typeof node === 'string') {
    if (node.startsWith(MEDIA + '/')) out.add(node)
    return
  }
  if (Array.isArray(node)) {
    for (const v of node) collectUrls(v, out)
    return
  }
  if (node && typeof node === 'object') {
    for (const k of Object.keys(node)) collectUrls(node[k], out)
  }
}

function rewrite(node, map) {
  if (typeof node === 'string') return map.get(node) ?? node
  if (Array.isArray(node)) return node.map(v => rewrite(v, map))
  if (node && typeof node === 'object') {
    const out = {}
    for (const k of Object.keys(node)) out[k] = rewrite(node[k], map)
    return out
  }
  return node
}

// ── Naming ──────────────────────────────────────────────────────────────────

function bakedFilename(url) {
  const hash = createHash('sha1').update(url).digest('hex').slice(0, 10)
  const raw  = basename(new URL(url).pathname) || 'file'
  const safe = raw.replace(/[^a-zA-Z0-9._-]/g, '_')
  return `${hash}-${safe}`
}

// ── Probe + download ────────────────────────────────────────────────────────

async function probe(url) {
  let res
  try {
    res = await fetch(url, { method: 'HEAD' })
  } catch (err) {
    return { ok: false, reason: `HEAD failed: ${err.message}` }
  }
  if (!res.ok) return { ok: false, reason: `HEAD ${res.status}` }
  const type = (res.headers.get('content-type') || '').toLowerCase()
  const len  = Number(res.headers.get('content-length') || '0')
  return { ok: true, type, len }
}

async function download(url, destPath) {
  const res = await fetch(url)
  if (!res.ok) throw new Error(`GET ${res.status} ${url}`)
  const buf = Buffer.from(await res.arrayBuffer())
  await writeFile(destPath, buf)
}

// ── Driver ──────────────────────────────────────────────────────────────────

async function main() {
  console.log(`bake-media: scanning ${GEN_DIR} for URLs under ${MEDIA}`)
  await mkdir(BAKED_DIR, { recursive: true })

  const jsonFiles = (await readdir(GEN_DIR))
    .filter(f => f.endsWith('.json'))
    .map(f => resolve(GEN_DIR, f))

  // 1. collect distinct URLs across all JSON
  const docs = []
  const urls = new Set()
  for (const path of jsonFiles) {
    const text = await readFile(path, 'utf8')
    const doc  = JSON.parse(text)
    docs.push({ path, doc })
    collectUrls(doc, urls)
  }
  console.log(`  found ${urls.size} R2 URLs across ${docs.length} JSON files`)

  // 2. classify + download eligible ones
  const map = new Map() // original URL -> /baked/<filename>
  let baked = 0, skipped = 0, errors = 0

  for (const url of urls) {
    const p = await probe(url)
    if (!p.ok) {
      console.warn(`  ! ${url} — ${p.reason}`)
      errors++
      continue
    }
    const isImage = p.type.startsWith('image/')
    if (!isImage) { skipped++; continue }
    if (p.len > MAX_BYTES) { skipped++; continue }

    const name = bakedFilename(url)
    const dest = resolve(BAKED_DIR, name)
    try {
      await download(url, dest)
      map.set(url, `${PUBLIC}/${name}`)
      baked++
    } catch (err) {
      console.warn(`  ! ${url} — download failed: ${err.message}`)
      errors++
    }
  }

  // 3. rewrite JSON
  if (map.size > 0) {
    for (const { path, doc } of docs) {
      const next = rewrite(doc, map)
      await writeFile(path, JSON.stringify(next, null, 2) + '\n', 'utf8')
    }
  }

  console.log(`bake-media: baked=${baked} skipped=${skipped} errors=${errors}`)
  if (errors > 0) process.exit(1)
}

main().catch(err => {
  console.error('bake-media failed:', err)
  process.exit(1)
})
