#!/usr/bin/env node
/**
 * Nightly position updater via the MyShipTracking REST API.
 *
 * Reads the tracking roster from the media bucket, asks MyShipTracking for the
 * current positions in as few requests as possible, merges them into the
 * existing positions file (keeping a rolling 7-day history per ship) and writes
 * the result back as a single object.
 *
 * This script deliberately does NOT talk to Payload. Both its input and its
 * output live on R2, so the nightly run costs nothing on the CMS side — the Fly
 * machine stays asleep and the site is never rebuilt. The roster is kept current
 * by the Ships afterChange hook (src/hooks/publishShipRoster.ts).
 *
 * Credit usage is the floor for "position every ship once": the bulk endpoint
 * with response=simple costs 1 credit per vessel, and we batch up to 100 MMSIs
 * per HTTP call — so ~180 ships is 2 requests and ~180 credits, no polling.
 *
 * Required env vars:
 *   MYSHIPTRACKING_API_KEY – from your myshiptracking.com account
 *   S3_*                   – media bucket credentials, see .env.example
 *
 * Usage:
 *   npm run update-positions
 *   node --env-file=.env scripts/update-positions.mjs --dry-run
 *   node --env-file=.env scripts/update-positions.mjs --fixture=synthetic
 *   node --env-file=.env scripts/update-positions.mjs --fixture=synthetic --at=2026-08-01T02:00:00Z
 *   node --env-file=.env scripts/update-positions.mjs --fixture=scripts/fixtures/myshiptracking-sample.json
 *
 * Flags:
 *   --dry-run              print the merged result, write nothing
 *   --fixture=<path>       read canned API rows from a JSON file
 *   --fixture=synthetic    generate a plausible fix for every roster ship
 *   --at=<iso>             override the fix timestamp (fixture modes only)
 */

import { readFile } from 'node:fs/promises'

import { POSITIONS_KEY, ROSTER_KEY, getJson, putJson, requireS3Env } from './lib/r2.mjs'

const MST_API_KEY  = process.env.MYSHIPTRACKING_API_KEY
const MST_BULK_URL = 'https://api.myshiptracking.com/api/v2/vessel/bulk'

const CHUNK_SIZE   = 100 // MyShipTracking bulk limit is 100 identifiers per request.
const HISTORY_MAX  = 7   // One entry per nightly run — a rolling week of track.

const DRY_RUN   = process.argv.includes('--dry-run')
const FIXTURE   = process.argv.find(a => a.startsWith('--fixture='))?.slice('--fixture='.length)
const SYNTHETIC = FIXTURE === 'synthetic'
const AT        = process.argv.find(a => a.startsWith('--at='))?.slice('--at='.length)

if (!FIXTURE && !MST_API_KEY) { console.error('Missing MYSHIPTRACKING_API_KEY'); process.exit(1) }
requireS3Env()

// ── Ask MyShipTracking for a batch of positions ────────────────────────────

async function fetchPositions(mmsis) {
  const url = `${MST_BULK_URL}?mmsi=${mmsis.join(',')}&response=simple`
  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${MST_API_KEY}` },
  })
  const charged = res.headers.get('x-credit-charged')
  if (!res.ok) {
    const body = await res.text().catch(() => '')
    throw new Error(`GET /vessel/bulk returned ${res.status}: ${body.slice(0, 300)}`)
  }
  const json = await res.json()
  if (json.status && json.status !== 'success') {
    throw new Error(`MyShipTracking status "${json.status}": ${JSON.stringify(json).slice(0, 300)}`)
  }
  return { rows: Array.isArray(json.data) ? json.data : [], charged }
}

/**
 * Fixture mode: canned rows instead of a live API call, so local testing burns
 * zero credits. Rows outside the current batch are filtered out, so batching
 * behaves as it does against the real endpoint.
 */
function fetchPositionsFromFixture(mmsis, rows) {
  const wanted = new Set(mmsis.map(String))
  return { rows: rows.filter(r => wanted.has(String(r.mmsi ?? '').trim())), charged: null }
}

/**
 * Synthetic rows for every ship in the roster (`--fixture=synthetic`), each a
 * small deterministic step away from its previous stored position. Run it
 * repeatedly and every ship grows a believable track, so the history logic can
 * be exercised locally without spending credits.
 *
 * These positions are FABRICATED. Seed real coordinates first with
 * `npm run backfill-positions`, and restore them afterwards with
 * `npm run backfill-positions -- --force` — otherwise the map shows fiction.
 *
 * `--at=<iso>` overrides the fix timestamp so you can exercise the dedupe rule
 * (same timestamp twice must not append) without waiting a day.
 */
function syntheticRows(tracked, prevShips, at) {
  return [...tracked.entries()].map(([mmsi, ships], i) => {
    const prev = prevShips[String(ships[0].id)]
    const base = { lat: prev?.lat ?? 53.1 + (i % 20) * 0.05, lng: prev?.lng ?? 5.2 + (i % 20) * 0.07 }
    // Deterministic per-ship drift — no Math.random, so runs are reproducible.
    return {
      mmsi,
      lat: Number((base.lat + ((i % 7) - 3) * 0.01).toFixed(5)),
      lng: Number((base.lng + ((i % 5) - 2) * 0.012).toFixed(5)),
      received: at,
    }
  })
}

// ── Merge a fix into a ship's stored history ───────────────────────────────

/**
 * Appends `fix` to `prev.history` when it is genuinely new, trims to the last
 * HISTORY_MAX entries and returns the ship's new record.
 *
 * The dedupe is on the AIS fix time, not the run time: a ship that sat still
 * and re-reported the same fix must not push six days of real track out of the
 * buffer. Same reason the record keeps its previous history when we merge.
 */
export function mergeShipPosition(prev, fix) {
  const history = Array.isArray(prev?.history) ? [...prev.history] : []
  const newest = history[history.length - 1]

  if (!newest || newest.at !== fix.at) {
    history.push({ lat: fix.lat, lng: fix.lng, at: fix.at })
  } else {
    // Same timestamp, refreshed coordinates — correct in place rather than append.
    history[history.length - 1] = { lat: fix.lat, lng: fix.lng, at: fix.at }
  }

  const trimmed = history.slice(-HISTORY_MAX)
  const latest = trimmed[trimmed.length - 1]

  return {
    mmsi: fix.mmsi,
    lat: latest.lat,
    lng: latest.lng,
    positionUpdatedAt: latest.at,
    history: trimmed,
  }
}

// ── Main ───────────────────────────────────────────────────────────────────

function chunk(arr, size) {
  const out = []
  for (let i = 0; i < arr.length; i += size) out.push(arr.slice(i, i + size))
  return out
}

async function main() {
  const roster = await getJson(ROSTER_KEY)
  if (!roster?.ships?.length) {
    console.error(
      `No tracked ships in ${ROSTER_KEY}. Run \`npm run publish-roster\` first ` +
      `(or save any ship in the admin to fire the hook).`,
    )
    process.exit(1)
  }

  // mmsi → [{ id, name }]. Duplicate MMSIs happen (the same vessel entered
  // twice, or a copy-paste error), so every ship sharing an MMSI gets the fix
  // rather than the last one silently winning. Flagged so it can be cleaned up.
  const tracked = new Map()
  for (const s of roster.ships) {
    const mmsi = String(s.mmsi ?? '').trim()
    if (!mmsi) continue
    const ships = tracked.get(mmsi) ?? []
    ships.push({ id: s.id, name: s.name })
    tracked.set(mmsi, ships)
  }
  for (const [mmsi, ships] of tracked) {
    if (ships.length > 1) {
      console.warn(`  ! MMSI ${mmsi} is shared by ${ships.map(s => `${s.id}:${s.name}`).join(', ')} — all will get the same position.`)
    }
  }

  const previous = (await getJson(POSITIONS_KEY)) ?? { ships: {} }
  const prevShips = previous.ships ?? {}
  // Start from the previous state: ships MyShipTracking has nothing for keep
  // the position and history they already had.
  const nextShips = { ...prevShips }

  let fixtureRows = null
  if (SYNTHETIC) {
    fixtureRows = syntheticRows(tracked, prevShips, AT || new Date().toISOString())
    console.log(`Fixture mode: synthetic (${fixtureRows.length} row(s)) at ${AT || 'now'}, no API calls.`)
  } else if (FIXTURE) {
    fixtureRows = JSON.parse(await readFile(FIXTURE, 'utf8')).data ?? []
    console.log(`Fixture mode: ${FIXTURE} (${fixtureRows.length} row(s)), no API calls.`)
  }

  const all        = [...tracked.keys()]
  const totalShips = roster.ships.length
  const batches    = chunk(all, CHUNK_SIZE)
  console.log(`Tracking ${totalShips} ship(s) over ${all.length} MMSI(s) → ${batches.length} bulk request(s) of ≤${CHUNK_SIZE}.`)

  let heard      = 0
  let appended   = 0
  let creditsSum = 0

  for (const [i, mmsis] of batches.entries()) {
    let rows, charged
    try {
      ({ rows, charged } = FIXTURE
        ? fetchPositionsFromFixture(mmsis, fixtureRows)
        : await fetchPositions(mmsis))
    } catch (err) {
      console.error(`  ✗ batch ${i + 1}/${batches.length} failed: ${err.message}`)
      continue
    }
    if (charged != null) creditsSum += Number(charged) || 0
    console.log(`  Batch ${i + 1}/${batches.length}: ${rows.length} position(s)${charged != null ? `, ${charged} credit(s)` : ''}.`)

    for (const row of rows) {
      const mmsi  = String(row.mmsi ?? '').trim()
      const lat   = row.lat
      const lng   = row.lng
      const ships = tracked.get(mmsi)
      if (!ships || lat == null || lng == null) continue

      const fix = {
        mmsi,
        lat: Number(lat),
        lng: Number(lng),
        at: row.received || new Date().toISOString(),
      }

      for (const ship of ships) {
        heard++
        const key  = String(ship.id)
        const prev = prevShips[key]
        if (prev?.positionUpdatedAt !== fix.at) appended++
        nextShips[key] = mergeShipPosition(prev, fix)
        console.log(`  ✓ ${ship.name} (${mmsi}): ${fix.lat.toFixed(5)}, ${fix.lng.toFixed(5)} — ${nextShips[key].history.length} point(s)`)
      }
    }
  }

  // Ships removed from the roster (untracked or deleted in the CMS) drop out.
  const trackedIds = new Set([...tracked.values()].flat().map(s => String(s.id)))
  for (const key of Object.keys(nextShips)) {
    if (!trackedIds.has(key)) delete nextShips[key]
  }

  const out = { generatedAt: new Date().toISOString(), ships: nextShips }

  const missing = totalShips - heard
  console.log(
    `\nPositioned ${heard}/${totalShips} ship(s), ${appended} new fix/fixes` +
    `${missing ? `, ${missing} had no recent position` : ''}` +
    `${creditsSum ? `. Credits charged: ${creditsSum}` : ''}.`,
  )

  if (DRY_RUN) {
    console.log(JSON.stringify(out, null, 2))
    console.log('\n--dry-run: nothing written.')
    return
  }

  await putJson(POSITIONS_KEY, out)
  console.log(`Wrote ${POSITIONS_KEY} (${Object.keys(nextShips).length} ship(s)).`)
}

main().catch(err => {
  console.error('\nupdate-positions failed:\n', err.message || err)
  process.exit(1)
})
