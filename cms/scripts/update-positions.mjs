#!/usr/bin/env node
/**
 * Nightly AIS position updater.
 *
 * Fetches all ships with an MMSI from Payload, opens a WebSocket connection to
 * AISStream, listens for PositionReport messages, then PATCHes updated lat/lng
 * back to Payload for every ship that was heard. Ships that were not heard keep
 * their existing position untouched.
 *
 * Required env vars:
 *   AISSTREAM_API_KEY     – from your aisstream.io account
 *   POSITION_BOT_API_KEY  – Payload API key for the position-bot editor user
 *   PAYLOAD_API_URL       – default: http://localhost:3001
 *
 * Optional:
 *   AIS_LISTEN_MS         – how long to listen (default: 90000 ms)
 */

import WebSocket from 'ws'

const API = (process.env.PAYLOAD_API_URL || 'http://localhost:3001').replace(/\/+$/, '')
const AISSTREAM_API_KEY   = process.env.AISSTREAM_API_KEY
const POSITION_BOT_API_KEY = process.env.POSITION_BOT_API_KEY
const LISTEN_MS = Number(process.env.AIS_LISTEN_MS ?? 90_000)
const AIS_URL   = 'wss://stream.aisstream.io/v0/stream'

if (!AISSTREAM_API_KEY)    { console.error('Missing AISSTREAM_API_KEY');    process.exit(1) }
if (!POSITION_BOT_API_KEY) { console.error('Missing POSITION_BOT_API_KEY'); process.exit(1) }

// ── Fetch ships that should be tracked ─────────────────────────────────────

async function fetchTrackedShips() {
  const url = `${API}/api/ships?limit=200&depth=0`
  const res = await fetch(url)
  if (!res.ok) throw new Error(`GET /api/ships returned ${res.status}`)
  const { docs } = await res.json()

  const tracked = new Map() // mmsi string → { id, name }
  for (const d of docs) {
    const mmsi = (d.mmsi ?? '').trim()
    if (!mmsi) continue
    if (d.autoTrack === false) continue
    tracked.set(mmsi, { id: d.id, name: d.name })
  }
  return tracked
}

// ── PATCH a single ship's position ─────────────────────────────────────────

async function patchShip(id, lat, lng) {
  const url = `${API}/api/ships/${id}`
  const res = await fetch(url, {
    method: 'PATCH',
    headers: {
      'Content-Type':  'application/json',
      'Authorization': `users API-Key ${POSITION_BOT_API_KEY}`,
    },
    body: JSON.stringify({ lat, lng, positionUpdatedAt: new Date().toISOString() }),
  })
  if (!res.ok) {
    const body = await res.text().catch(() => '')
    throw new Error(`PATCH /api/ships/${id} returned ${res.status}: ${body.slice(0, 200)}`)
  }
}

// ── Main ───────────────────────────────────────────────────────────────────

async function main() {
  console.log(`Payload: ${API}`)

  const tracked = await fetchTrackedShips()
  if (tracked.size === 0) {
    console.log('No ships with MMSI + autoTrack — nothing to do.')
    return
  }

  const mmsiList = [...tracked.keys()]
  console.log(`Tracking ${mmsiList.length} ship(s): ${mmsiList.join(', ')}`)

  // For fleets >50, chunk into multiple connections (one per 50). For now we
  // almost certainly have far fewer, so one connection suffices.
  const CHUNK = 50
  const chunks = []
  for (let i = 0; i < mmsiList.length; i += CHUNK) chunks.push(mmsiList.slice(i, i + CHUNK))

  const fixes = new Map() // mmsi → { lat, lng }

  await Promise.all(chunks.map(chunk => listenChunk(chunk, fixes)))

  console.log(`Heard ${fixes.size} / ${tracked.size} ship(s).`)

  let updated = 0
  for (const [mmsi, { lat, lng }] of fixes) {
    const ship = tracked.get(mmsi)
    if (!ship) continue
    try {
      await patchShip(ship.id, lat, lng)
      console.log(`  ✓ ${ship.name} (${mmsi}): ${lat.toFixed(5)}, ${lng.toFixed(5)}`)
      updated++
    } catch (err) {
      console.error(`  ✗ ${ship.name} (${mmsi}): ${err.message}`)
    }
  }

  console.log(`Done. Updated ${updated} ship(s).`)
}

function listenChunk(mmsiChunk, fixes) {
  return new Promise((resolve, reject) => {
    const ws = new WebSocket(AIS_URL)
    let timer
    let msgCount = 0
    const deadline = Date.now() + LISTEN_MS

    ws.on('open', () => {
      console.log(`  WebSocket open — subscribed to ${mmsiChunk.length} MMSI(s), listening for ${LISTEN_MS / 1000}s`)
      ws.send(JSON.stringify({
        APIKey:             AISSTREAM_API_KEY,
        BoundingBoxes:      [[[-90, -180], [90, 180]]],
        FiltersShipMMSI:    mmsiChunk,
        FilterMessageTypes: ['PositionReport'],
      }))

      // Heartbeat: print a dot every 10s so we can see the connection is alive.
      const heartbeat = setInterval(() => {
        const remaining = Math.round((deadline - Date.now()) / 1000)
        process.stdout.write(`  ... ${msgCount} msg(s) received, ${remaining}s remaining\n`)
      }, 10_000)

      timer = setTimeout(() => {
        clearInterval(heartbeat)
        console.log(`  Timeout reached — closing (${msgCount} total messages)`)
        ws.close()
      }, LISTEN_MS)

      // Store heartbeat ref so we can clear it on early close too.
      ws._heartbeat = heartbeat
    })

    ws.on('message', (raw) => {
      let msg
      try { msg = JSON.parse(raw) } catch { return }

      msgCount++

      if (msg.MessageType !== 'PositionReport') {
        console.log(`  [msg] ${msg.MessageType ?? 'unknown'} (not a PositionReport, skipping)`)
        return
      }

      const mmsi = String(msg.MetaData?.MMSI ?? msg.Message?.PositionReport?.UserID ?? '')
      const lat  = msg.Message?.PositionReport?.Latitude
      const lng  = msg.Message?.PositionReport?.Longitude

      console.log(`  [PositionReport] MMSI=${mmsi} lat=${lat} lng=${lng} — ${mmsiChunk.includes(mmsi) ? 'MATCH' : 'not our ship'}`)

      if (!mmsi || lat == null || lng == null) return
      if (!mmsiChunk.includes(mmsi)) return

      fixes.set(mmsi, { lat, lng })

      // Close early if all ships in this chunk are heard.
      if (mmsiChunk.every(m => fixes.has(m))) {
        clearTimeout(timer)
        clearInterval(ws._heartbeat)
        console.log('  All ships heard — closing early')
        ws.close()
      }
    })

    ws.on('close', () => resolve())
    ws.on('error', (err) => {
      clearTimeout(timer)
      clearInterval(ws._heartbeat)
      reject(err)
    })
  })
}

main().catch(err => {
  console.error('\nupdate-positions failed:\n', err.message || err)
  process.exit(1)
})
