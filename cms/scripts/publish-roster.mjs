#!/usr/bin/env node
/**
 * Publish the ship tracking roster to the media bucket, over the REST API.
 *
 * Normally the Ships afterChange hook (src/hooks/publishShipRoster.ts) keeps
 * data/ships-roster.json current. This script does the same thing from the
 * outside, for two cases:
 *
 *   - the initial backfill, before the hook has ever fired
 *   - repair, if a hook write failed while R2 was unreachable
 *
 * Unlike the nightly position job, this DOES talk to Payload — so against
 * production it will wake the Fly machine. That is fine for a manual command.
 *
 * Required env:
 *   S3_* (see .env.example)   – target bucket
 *   PAYLOAD_API_URL           – default: http://localhost:3001
 *
 * Usage:
 *   npm run publish-roster
 *   npm run publish-roster -- --dry-run
 */

import { ROSTER_KEY, putJson, requireS3Env } from './lib/r2.mjs'

const API = (process.env.PAYLOAD_API_URL || 'http://localhost:3001').replace(/\/+$/, '')
const DRY_RUN = process.argv.includes('--dry-run')

if (!DRY_RUN) requireS3Env()

async function main() {
  console.log(`Payload: ${API}`)

  const res = await fetch(`${API}/api/ships?limit=1000&depth=0`)
  if (!res.ok) throw new Error(`GET /api/ships returned ${res.status}`)
  const { docs } = await res.json()

  const roster = {
    generatedAt: new Date().toISOString(),
    ships: docs
      .map(d => ({
        id: d.id,
        name: String(d.name ?? ''),
        mmsi: String(d.mmsi ?? '').trim(),
        autoTrack: d.autoTrack !== false,
      }))
      .filter(s => s.mmsi && s.autoTrack)
      .sort((a, b) => String(a.id).localeCompare(String(b.id), undefined, { numeric: true })),
  }

  console.log(`${docs.length} ship(s) in the CMS, ${roster.ships.length} tracked (MMSI + autoTrack).`)

  if (DRY_RUN) {
    console.log(JSON.stringify(roster, null, 2))
    console.log('\n--dry-run: nothing written.')
    return
  }

  await putJson(ROSTER_KEY, roster)
  console.log(`Wrote ${ROSTER_KEY}.`)
}

main().catch(err => {
  console.error('\npublish-roster failed:\n', err.message || err)
  process.exit(1)
})
