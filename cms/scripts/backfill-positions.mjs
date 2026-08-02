#!/usr/bin/env node
/**
 * Seed data/positions.json from the coordinates currently stored in Payload.
 *
 * Run this ONCE per environment, before the first nightly job. Without it,
 * positions.json starts empty and a ship stays unpositioned on the map until
 * MyShipTracking happens to hear it — which for a boat that has not moved in
 * months may be never.
 *
 * By default this only fills in ships that have no entry yet, so it is safe to
 * re-run: fresher AIS data already on R2 is never overwritten. Pass --force to
 * overwrite everything from the database instead (useful locally to undo a
 * --fixture=synthetic run).
 *
 * Required env:
 *   S3_*             – target bucket, see .env.example
 *   PAYLOAD_API_URL  – default: http://localhost:3001
 *
 * Usage:
 *   node --env-file=.env scripts/backfill-positions.mjs
 *   node --env-file=.env scripts/backfill-positions.mjs --force
 *   node --env-file=.env scripts/backfill-positions.mjs --dry-run
 */

import { POSITIONS_KEY, getJson, putJson, requireS3Env } from './lib/r2.mjs'

const API     = (process.env.PAYLOAD_API_URL || 'http://localhost:3001').replace(/\/+$/, '')
const DRY_RUN = process.argv.includes('--dry-run')
const FORCE   = process.argv.includes('--force')

requireS3Env()

async function main() {
  console.log(`Payload: ${API}`)

  const res = await fetch(`${API}/api/ships?limit=1000&depth=0`)
  if (!res.ok) throw new Error(`GET /api/ships returned ${res.status}`)
  const { docs } = await res.json()

  const previous  = (await getJson(POSITIONS_KEY)) ?? { ships: {} }
  const nextShips = { ...(previous.ships ?? {}) }

  let seeded = 0, kept = 0, skipped = 0

  for (const d of docs) {
    const key = String(d.id)
    if (d.lat == null || d.lng == null) { skipped++; continue }

    if (nextShips[key] && !FORCE) { kept++; continue }

    // The stored timestamp is the AIS fix time, so it carries straight over as
    // the single history entry. Ships that never had one get the epoch-free
    // fallback of "unknown", represented by the current time.
    const at = d.positionUpdatedAt || new Date().toISOString()
    nextShips[key] = {
      mmsi: String(d.mmsi ?? '').trim(),
      lat: Number(d.lat),
      lng: Number(d.lng),
      positionUpdatedAt: at,
      history: [{ lat: Number(d.lat), lng: Number(d.lng), at }],
    }
    seeded++
  }

  const out = { generatedAt: new Date().toISOString(), ships: nextShips }

  console.log(
    `${docs.length} ship(s) in the CMS: ${seeded} seeded from the database, ` +
    `${kept} already on R2 (kept), ${skipped} had no coordinates.`,
  )
  if (kept && !FORCE) console.log('Pass --force to overwrite the kept entries from the database.')

  if (DRY_RUN) {
    console.log('\n--dry-run: nothing written.')
    return
  }

  await putJson(POSITIONS_KEY, out)
  console.log(`Wrote ${POSITIONS_KEY} (${Object.keys(nextShips).length} ship(s)).`)
}

main().catch(err => {
  console.error('\nbackfill-positions failed:\n', err.message || err)
  process.exit(1)
})
