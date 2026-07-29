/**
 * Download the image URLs specified in ships.json, resize them, upload each to
 * the Media collection (MinIO/R2 via the s3Storage plugin) and set it as the
 * `image` on the matching ship.
 *
 * Matching is by exact ship name (same key import-ships.mjs uses).
 * Overwrites any existing image on a ship. Skips ships with no image URL.
 *
 * Usage:
 *   cd cms
 *   npx tsx --env-file=.env scripts/attach-ship-images.mjs
 *
 * Requires MinIO (or R2) reachable — media bytes are uploaded to the bucket.
 */

import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

import sharp from 'sharp'
import { getPayload } from 'payload'

import config from '../payload.config'

const REPO_ROOT  = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..')
const SHIPS_JSON = path.join(REPO_ROOT, 'ships.json')

const MAX_WIDTH = 1600           // px — longest edge cap, no enlargement
const JPEG_QUALITY = 82

const slug = (s) =>
  s.toLowerCase().normalize('NFKD').replace(/[^\w]+/g, '-').replace(/^-+|-+$/g, '') || 'ship'

async function downloadImage(url) {
  const res = await fetch(url, {
    redirect: 'follow',
    headers: {
      'User-Agent':
        'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120 Safari/537.36',
      Accept: 'image/avif,image/webp,image/*,*/*;q=0.8',
    },
  })
  if (!res.ok) throw new Error(`HTTP ${res.status}`)
  const buf = Buffer.from(await res.arrayBuffer())
  if (buf.length === 0) throw new Error('empty body')
  return buf
}

async function main() {
  const raw = JSON.parse(fs.readFileSync(SHIPS_JSON, 'utf8'))
  const source = Object.values(raw).filter((v) => v?.name && v.image)
  console.log(`${source.length} ship(s) in ships.json have an image URL\n`)

  const payload = await getPayload({ config })

  const ok = []
  const failed = []
  const noShip = []

  for (const v of source) {
    const label = v.name
    try {
      // Find the target ship first — no point downloading if it isn't there.
      const { docs } = await payload.find({
        collection: 'ships',
        where: { name: { equals: v.name } },
        limit: 1,
        pagination: false,
      })
      if (!docs.length) { noShip.push(label); console.log(`SKIP  ${label} — no matching ship`); continue }
      const ship = docs[0]

      const original = await downloadImage(v.image)
      const resized = await sharp(original)
        .rotate() // respect EXIF orientation
        .resize({ width: MAX_WIDTH, height: MAX_WIDTH, fit: 'inside', withoutEnlargement: true })
        .jpeg({ quality: JPEG_QUALITY })
        .toBuffer()

      const filename = `${slug(v.name)}.jpg`
      const media = await payload.create({
        collection: 'media',
        data: { alt: v.name },
        file: { data: resized, mimetype: 'image/jpeg', name: filename, size: resized.length },
      })

      await payload.update({
        collection: 'ships',
        id: ship.id,
        data: { image: media.id },
      })

      ok.push(label)
      console.log(`OK    ${label} — ${filename} (${(resized.length / 1024).toFixed(0)} KB)`)
    } catch (err) {
      failed.push({ name: label, url: v.image, error: String(err.message || err) })
      console.log(`FAIL  ${label} — ${err.message || err}`)
    }
  }

  console.log(`\nDone. ${ok.length} attached, ${failed.length} failed, ${noShip.length} no-ship.`)
  if (failed.length) {
    console.log('\nFailures:')
    for (const f of failed) console.log(`  - ${f.name}: ${f.error}  [${f.url}]`)
  }
  process.exit(0)
}

main().catch((err) => {
  console.error('\nattach-ship-images failed:\n', err)
  process.exit(1)
})
