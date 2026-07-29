#!/usr/bin/env node
/**
 * One-shot position updater via the MyShipTracking REST API.
 *
 * Fetches all ships with an MMSI + autoTrack from Payload, asks MyShipTracking
 * for their current positions in as few requests as possible, and PATCHes each
 * ship that came back. Ships MyShipTracking has no recent position for keep
 * their old coordinates.
 *
 * Credit usage is the floor for "position every ship once": the bulk endpoint
 * with response=simple costs 1 credit per vessel, and we batch up to 100 MMSIs
 * per HTTP call — so ~180 ships is 2 requests and ~180 credits, no polling.
 *
 * Required env vars:
 *   MYSHIPTRACKING_API_KEY – from your myshiptracking.com account
 *   POSITION_BOT_API_KEY   – Payload API key for the position-bot editor user
 *   PAYLOAD_API_URL        – default: http://localhost:3001
 */

const API = (process.env.PAYLOAD_API_URL || 'http://localhost:3001').replace(/\/+$/, '')
const MST_API_KEY          = process.env.MYSHIPTRACKING_API_KEY
const POSITION_BOT_API_KEY = process.env.POSITION_BOT_API_KEY
const MST_BULK_URL         = 'https://api.myshiptracking.com/api/v2/vessel/bulk'

const CHUNK_SIZE = 100 // MyShipTracking bulk limit is 100 identifiers per request.

if (!MST_API_KEY)          { console.error('Missing MYSHIPTRACKING_API_KEY'); process.exit(1) }
if (!POSITION_BOT_API_KEY) { console.error('Missing POSITION_BOT_API_KEY');   process.exit(1) }

// ── Fetch ships that should be tracked ─────────────────────────────────────

async function fetchTrackedShips() {
  const url = `${API}/api/ships?limit=1000&depth=0`
  const res = await fetch(url)
  if (!res.ok) throw new Error(`GET /api/ships returned ${res.status}`)
  const { docs } = await res.json()

  const tracked = new Map() // mmsi string → { id, name }
  for (const d of docs) {
    const mmsi = (d.mmsi ?? '').toString().trim()
    if (!mmsi) continue
    if (d.autoTrack === false) continue
    tracked.set(mmsi, { id: d.id, name: d.name })
  }
  return tracked
}

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

// ── PATCH a single ship's position ─────────────────────────────────────────

async function patchShip(id, lat, lng, receivedAt) {
  const res = await fetch(`${API}/api/ships/${id}`, {
    method: 'PATCH',
    headers: {
      'Content-Type':  'application/json',
      'Authorization': `users API-Key ${POSITION_BOT_API_KEY}`,
    },
    body: JSON.stringify({
      lat,
      lng,
      positionUpdatedAt: receivedAt || new Date().toISOString(),
    }),
  })
  if (!res.ok) {
    const body = await res.text().catch(() => '')
    throw new Error(`PATCH /api/ships/${id} returned ${res.status}: ${body.slice(0, 200)}`)
  }
}

// ── Main ───────────────────────────────────────────────────────────────────

function chunk(arr, size) {
  const out = []
  for (let i = 0; i < arr.length; i += size) out.push(arr.slice(i, i + size))
  return out
}

async function main() {
  console.log(`Payload: ${API}`)

  const tracked = await fetchTrackedShips()
  if (tracked.size === 0) {
    console.log('No ships with MMSI + autoTrack — nothing to do.')
    return
  }

  const all     = [...tracked.keys()]
  const batches = chunk(all, CHUNK_SIZE)
  console.log(`Tracking ${all.length} ship(s) → ${batches.length} bulk request(s) of ≤${CHUNK_SIZE}.`)

  let heard      = 0
  let updated    = 0
  let creditsSum = 0

  for (const [i, mmsis] of batches.entries()) {
    let rows, charged
    try {
      ({ rows, charged } = await fetchPositions(mmsis))
    } catch (err) {
      console.error(`  ✗ batch ${i + 1}/${batches.length} failed: ${err.message}`)
      continue
    }
    if (charged != null) creditsSum += Number(charged) || 0
    console.log(`  Batch ${i + 1}/${batches.length}: ${rows.length} position(s)${charged != null ? `, ${charged} credit(s)` : ''}.`)

    for (const row of rows) {
      const mmsi = String(row.mmsi ?? '').trim()
      const lat  = row.lat
      const lng  = row.lng
      const ship = tracked.get(mmsi)
      if (!ship || lat == null || lng == null) continue

      heard++
      try {
        await patchShip(ship.id, lat, lng, row.received)
        updated++
        console.log(`  ✓ ${ship.name} (${mmsi}): ${Number(lat).toFixed(5)}, ${Number(lng).toFixed(5)}`)
      } catch (err) {
        console.error(`  ✗ ${ship.name} (${mmsi}): ${err.message}`)
      }
    }
  }

  const missing = all.length - heard
  console.log(
    `\nDone. Positioned ${heard}/${all.length} ship(s), updated ${updated}` +
    `${missing ? `, ${missing} had no recent position` : ''}` +
    `${creditsSum ? `. Credits charged: ${creditsSum}` : ''}.`,
  )
}

main().catch(err => {
  console.error('\nupdate-positions failed:\n', err.message || err)
  process.exit(1)
})
