// Pure position-history logic, shared by update-positions.mjs and its tests.

export const HISTORY_MAX = 7 // One entry per nightly run — a rolling week of track.

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
