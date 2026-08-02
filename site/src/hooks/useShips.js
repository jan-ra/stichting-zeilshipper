import { useMemo } from 'react'

import { SHIPS } from '../data/content.js'
import { useShipPositions } from './useShipPositions.js'

/**
 * The fleet: editorial fields baked from the CMS at build time, merged with the
 * live positions fetched from the media bucket.
 *
 * Use this instead of importing SHIPS directly on any page that shows the globe
 * or a position timestamp. A ship keeps its baked coordinates until the fetch
 * resolves, and forever if the fetch fails.
 */
export function useShips() {
  const { positions } = useShipPositions()

  return useMemo(() => {
    if (!positions) return SHIPS
    return SHIPS.map(ship => {
      const pos = positions[String(ship.id)]
      if (!pos || pos.lat == null || pos.lng == null) return ship
      return {
        ...ship,
        lat: pos.lat,
        lng: pos.lng,
        positionUpdatedAt: pos.positionUpdatedAt ?? ship.positionUpdatedAt,
        history: Array.isArray(pos.history) ? pos.history : ship.history,
      }
    })
  }, [positions])
}
