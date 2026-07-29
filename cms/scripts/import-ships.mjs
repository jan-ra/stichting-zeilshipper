/**
 * Import ships from the repo-root ships.json into the Ships collection.
 *
 * Replaces the existing ships (wipe + insert) with the curated dataset in
 * ../../ships.json. Writes directly via the Payload Local API — no running
 * server, MinIO, or API key required.
 *
 * Field mapping (ships.json → ships collection):
 *   name               → name
 *   type_of_ship       → type
 *   home_port          → port
 *   passenger_capacity → passengers
 *   year_of_build      → year
 *   mmsi               → mmsi   (coerced to string)
 *
 * Not mapped (no target field / needs media upload):
 *   image (external URL), eni_number, sources, field_confidence
 *
 * Usage:
 *   cd cms
 *   node --env-file=.env scripts/import-ships.mjs
 *
 * Safe to re-run: clears the ships collection first.
 */

import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

import { getPayload } from 'payload'

import config from '../payload.config'

const REPO_ROOT  = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..')
const SHIPS_JSON = path.join(REPO_ROOT, 'ships.json')

const clean = (v) => (v === null || v === undefined || v === '' ? undefined : v)

function mapShip(v) {
  const out = { name: v.name }
  const type       = clean(v.type_of_ship)
  const port       = clean(v.home_port)
  const passengers = clean(v.passenger_capacity)
  const year       = clean(v.year_of_build)
  const mmsi       = clean(v.mmsi)

  if (type != null)       out.type       = String(type)
  if (port != null)       out.port       = String(port)
  if (passengers != null) out.passengers = Number(passengers)
  if (year != null)       out.year       = Number(year)
  if (mmsi != null)       out.mmsi       = String(mmsi)
  return out
}

async function main() {
  const raw = JSON.parse(fs.readFileSync(SHIPS_JSON, 'utf8'))
  const source = Object.values(raw)
  console.log(`Read ${source.length} ships from ${SHIPS_JSON}`)

  const payload = await getPayload({ config })

  // Wipe existing ships.
  const { docs: existing } = await payload.find({ collection: 'ships', limit: 1000, pagination: false })
  for (const doc of existing) await payload.delete({ collection: 'ships', id: doc.id })
  console.log(`Cleared ${existing.length} existing ship(s)`)

  // Insert mapped ships.
  let created = 0
  let withMmsi = 0
  const skipped = []
  for (const v of source) {
    if (!v?.name) { skipped.push(v?.eni_number ?? '(no eni)'); continue }
    const data = mapShip(v)
    if (data.mmsi) withMmsi++
    await payload.create({ collection: 'ships', data })
    created++
  }

  console.log(`\nDone. Created ${created} ship(s) — ${withMmsi} with MMSI (AIS-trackable).`)
  if (skipped.length) console.log(`Skipped ${skipped.length} entr(y/ies) with no name: ${skipped.join(', ')}`)

  process.exit(0)
}

main().catch((err) => {
  console.error('\nimport-ships failed:\n', err)
  process.exit(1)
})
