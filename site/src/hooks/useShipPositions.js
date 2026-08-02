import { useEffect, useState } from 'react'

// Live ship positions, written nightly to the media bucket by
// .github/workflows/update-positions.yml. Fetched at runtime rather than baked
// into the bundle, so a position refresh never needs a site rebuild.
const POSITIONS_URL =
  import.meta.env.VITE_POSITIONS_URL || 'http://localhost:9000/zeilshipper-media/data/positions.json'

/**
 * Returns `{ positions, loaded }` where `positions` is a map of ship id →
 * { lat, lng, positionUpdatedAt, history }, or null while loading and on
 * failure. Callers fall back to the coordinates baked into ships.json at build
 * time, so a failed fetch degrades to slightly stale positions rather than an
 * empty globe.
 */
export function useShipPositions() {
  const [positions, setPositions] = useState(null)
  const [loaded, setLoaded] = useState(false)

  useEffect(() => {
    const controller = new AbortController()

    fetch(POSITIONS_URL, { signal: controller.signal })
      .then(res => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`)
        return res.json()
      })
      .then(json => {
        setPositions(json?.ships ?? null)
        setLoaded(true)
      })
      .catch(err => {
        if (err.name === 'AbortError') return
        console.warn(`[positions] falling back to baked positions: ${err.message}`)
        setLoaded(true)
      })

    return () => controller.abort()
  }, [])

  return { positions, loaded }
}
