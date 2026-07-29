#!/usr/bin/env node
/**
 * Nightly AIS position updater (adaptive).
 *
 * Fetches all ships with an MMSI + autoTrack from Payload, opens ONE WebSocket
 * to AISStream, and listens for PositionReport messages. Each ship is PATCHed
 * back to Payload the first time it is heard (incremental — a crash/timeout
 * keeps everything caught so far). Ships never heard keep their old position.
 *
 * The listen ends on whichever comes first:
 *   • coverage target reached   (heard >= AIS_TARGET_COVERAGE of trackable)
 *   • diminishing returns       (no NEW ship heard in AIS_STALE_MS)
 *   • hard cap                  (AIS_MAX_TOTAL_MS total wall-clock)
 *
 * AISStream's free tier allows only ONE concurrent connection, so we keep a
 * single socket open and, if it drops, reconnect after a backoff — subscribing
 * to just the ships we still need. We never open connections in parallel.
 *
 * Required env vars:
 *   AISSTREAM_API_KEY     – from your aisstream.io account
 *   POSITION_BOT_API_KEY  – Payload API key for the position-bot editor user
 *   PAYLOAD_API_URL       – default: http://localhost:3001
 *
 * Optional tuning:
 *   AIS_MAX_TOTAL_MS       – hard cap on the whole run   (default: 600000 = 10 min)
 *   AIS_TARGET_COVERAGE    – stop when this fraction heard (default: 0.85)
 *   AIS_STALE_MS           – stop after this long with no new ship (default: 240000 = 4 min)
 *   AIS_RECONNECT_BACKOFF_MS – wait before reconnecting on a drop (default: 8000)
 */

import WebSocket from 'ws'

const API = (process.env.PAYLOAD_API_URL || 'http://localhost:3001').replace(/\/+$/, '')
const AISSTREAM_API_KEY    = process.env.AISSTREAM_API_KEY
const POSITION_BOT_API_KEY = process.env.POSITION_BOT_API_KEY
const AIS_URL              = 'wss://stream.aisstream.io/v0/stream'

const MAX_TOTAL_MS   = Number(process.env.AIS_MAX_TOTAL_MS ?? 600_000)
const TARGET_COVERAGE = Number(process.env.AIS_TARGET_COVERAGE ?? 0.85)
const STALE_MS       = Number(process.env.AIS_STALE_MS ?? 240_000)
const BACKOFF_MS     = Number(process.env.AIS_RECONNECT_BACKOFF_MS ?? 8_000)

if (!AISSTREAM_API_KEY)    { console.error('Missing AISSTREAM_API_KEY');    process.exit(1) }
if (!POSITION_BOT_API_KEY) { console.error('Missing POSITION_BOT_API_KEY'); process.exit(1) }

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

// ── PATCH a single ship's position ─────────────────────────────────────────

async function patchShip(id, lat, lng) {
  const res = await fetch(`${API}/api/ships/${id}`, {
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

  const all    = [...tracked.keys()]
  const target = Math.ceil(all.length * TARGET_COVERAGE)
  console.log(
    `Tracking ${all.length} ship(s). Target ${target} (${Math.round(TARGET_COVERAGE * 100)}%), ` +
    `cap ${Math.round(MAX_TOTAL_MS / 1000)}s, stale-stop ${Math.round(STALE_MS / 1000)}s.`,
  )

  const heard    = new Set()
  const deadline = Date.now() + MAX_TOTAL_MS
  let lastNewAt  = Date.now()
  let updated    = 0
  let stopping   = false
  let ws         = null

  const remaining = () => all.filter(m => !heard.has(m))

  await new Promise((resolve) => {
    const timers = []
    const finish = (reason) => {
      if (stopping) return
      stopping = true
      for (const t of timers) clearInterval(t)
      try { ws?.removeAllListeners('close'); ws?.close() } catch { /* noop */ }
      console.log(`\nStopping — ${reason}.`)
      resolve()
    }

    // Stop-condition poller: hard cap + diminishing returns.
    timers.push(setInterval(() => {
      if (Date.now() >= deadline)              return finish(`hard cap ${Math.round(MAX_TOTAL_MS / 1000)}s reached`)
      if (Date.now() - lastNewAt >= STALE_MS)  return finish(`no new ship in ${Math.round(STALE_MS / 1000)}s`)
    }, 5_000))

    // Progress heartbeat.
    timers.push(setInterval(() => {
      const remS = Math.max(0, Math.round((deadline - Date.now()) / 1000))
      console.log(`  … heard ${heard.size}/${all.length}, ${remS}s until cap`)
    }, 15_000))

    const connect = () => {
      if (stopping) return
      const rem = remaining()
      if (rem.length === 0) return finish('all ships heard')

      ws = new WebSocket(AIS_URL)

      ws.on('open', () => {
        console.log(`  Connected — subscribed to ${rem.length} remaining MMSI(s).`)
        ws.send(JSON.stringify({
          APIKey:             AISSTREAM_API_KEY,
          BoundingBoxes:      [[[-90, -180], [90, 180]]],
          FiltersShipMMSI:    rem,
          FilterMessageTypes: ['PositionReport'],
        }))
      })

      ws.on('message', (raw) => {
        let msg
        try { msg = JSON.parse(raw) } catch { return }
        if (msg.MessageType !== 'PositionReport') return

        const mmsi = String(msg.MetaData?.MMSI ?? msg.Message?.PositionReport?.UserID ?? '')
        const lat  = msg.Message?.PositionReport?.Latitude
        const lng  = msg.Message?.PositionReport?.Longitude
        if (!mmsi || lat == null || lng == null) return
        if (!tracked.has(mmsi) || heard.has(mmsi)) return

        heard.add(mmsi)
        lastNewAt = Date.now()
        const ship = tracked.get(mmsi)

        // Incremental PATCH — persist progress immediately.
        patchShip(ship.id, lat, lng)
          .then(() => {
            updated++
            console.log(`  ✓ ${ship.name} (${mmsi}): ${lat.toFixed(5)}, ${lng.toFixed(5)}  [${heard.size}/${all.length}]`)
          })
          .catch(err => console.error(`  ✗ ${ship.name} (${mmsi}): ${err.message}`))

        if (heard.size >= target) finish(`coverage target ${Math.round(TARGET_COVERAGE * 100)}% reached`)
      })

      // On an unexpected drop, reconnect with just the remaining ships (after a
      // backoff, so we don't trip AISStream's reconnect rate limit → 429).
      ws.on('close', () => {
        if (stopping) return
        console.log(`  Socket closed — reconnecting in ${Math.round(BACKOFF_MS / 1000)}s with ${remaining().length} remaining…`)
        timers.push(setTimeout(connect, BACKOFF_MS))
      })

      ws.on('error', (err) => {
        console.error(`  WebSocket error: ${err.message}`)
        try { ws.close() } catch { /* 'close' handles reconnect */ }
      })
    }

    connect()
  })

  console.log(`Done. Heard ${heard.size}/${all.length}, updated ${updated} ship(s).`)
}

main().catch(err => {
  console.error('\nupdate-positions failed:\n', err.message || err)
  process.exit(1)
})
