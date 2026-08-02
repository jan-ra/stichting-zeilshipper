import { useState, useEffect, useRef } from 'react'
import { tileUrl } from '../../utils/basemap.js'

export const GLOBE_RADIUS = 100

// How many zoom levels earlier than stock the tile engine should step up. See
// boostTileDetail below for what "earlier" means and what it costs.
const TILE_LEVEL_BOOST = 1

// three-globe delegates the tiled sphere to three-slippy-map-globe, which picks its zoom
// level from a `thresholds` array: thresholds[L] is the lowest camera altitude, in globe
// radii, at which level L is still used, and it defaults to 8 / 2**L. Because the engine
// takes the first entry that is <= the current altitude, scaling every entry UP makes it
// reach for a deeper level sooner — at the home page's altitude of 1.8 the stock array
// lands on level 3 (an 8x8 grid for the whole earth), which is what reads as pixelated on
// a globe several hundred pixels wide.
//
// Each boosted level quadruples the tiles fetched for a given view, and the basemap plan
// is metered per tile, so this is deliberately one level rather than the two it would
// take to match the screen outright. The other level comes free from the @2x tiles in
// utils/basemap.js, which cost no extra requests.
//
// Neither globe.gl nor three-globe re-exposes the engine, so we find it in the scene by
// its shape. Best-effort by design: if a future version of the dependency renames these,
// the globe keeps working at stock sharpness instead of breaking.
function boostTileDetail(globe) {
  if (TILE_LEVEL_BOOST <= 0) return
  let engine = null
  globe.scene().traverse(obj => {
    if (!engine && Array.isArray(obj.thresholds) && typeof obj.updatePov === 'function') engine = obj
  })
  if (!engine) return
  const scale = 2 ** TILE_LEVEL_BOOST
  engine.thresholds = engine.thresholds.map(t => t * scale)
  // The level is only re-derived on point-of-view changes, so nudge it now — otherwise
  // the globe keeps the level it picked at mount until the first drag.
  engine.updatePov(globe.camera())
}

// three-globe's own polar2Cartesian, reimplemented because globe.gl re-exposes
// getScreenCoords but not getCoords, and the marker layer needs the scene-space
// position to work out whether a point is on the near side of the globe.
export function polar2Cartesian(lat, lng, relAltitude = 0) {
  const phi = ((90 - lat) * Math.PI) / 180
  const theta = ((90 - lng) * Math.PI) / 180
  const r = GLOBE_RADIUS * (1 + relAltitude)
  const phiSin = Math.sin(phi)
  return {
    x: r * phiSin * Math.cos(theta),
    y: r * Math.cos(phi),
    z: r * phiSin * Math.sin(theta),
  }
}

// Creates the globe.gl instance inside `containerRef`, keeps it sized to its box, and
// tears it down on unmount. globe.gl (which bundles three.js) is imported lazily so
// only the two pages that actually show a globe pay for the chunk.
//
// The instance renders nothing but the tiled sphere and its atmosphere — every ship
// marker is DOM, drawn by ShipMarkers on top of the canvas. See globe.css.
export function useGlobeEngine(containerRef, { minDistance, maxDistance, initialPov }) {
  const globeRef = useRef(null)
  const [ready, setReady] = useState(false)
  const [failed, setFailed] = useState(false)

  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    let cancelled = false
    let globe = null
    let ro = null

    const mount = async () => {
      let Globe
      try {
        ({ default: Globe } = await import('globe.gl'))
      } catch (err) {
        if (!cancelled) setFailed(true)
        return
      }
      if (cancelled) return

      const init = (w, h) => {
        if (globe) return
        globe = Globe()(container)
        globeRef.current = globe

        globe
          .width(w)
          .height(h)
          .globeTileEngineUrl(tileUrl)
          .backgroundColor('rgba(0,0,0,0)')
          // No interactive WebGL layers left — skip globe.gl's per-pointer-move
          // raycast entirely; ShipMarkers handles hit-testing in the DOM.
          .enablePointerInteraction(false)
          .showAtmosphere(true)
          .atmosphereColor('#3a7abd')
          .atmosphereAltitude(0.22)

        // three's PerspectiveCamera defaults to near = 0.1, which on a radius-100
        // globe is 6.4 km — the surface gets clipped before you can zoom in far
        // enough to tell two moored ships apart. 0.01 puts the floor at ~640 m.
        const camera = globe.camera()
        camera.near = 0.01
        camera.updateProjectionMatrix()

        const controls = globe.controls()
        controls.enablePan = false
        controls.minDistance = minDistance
        controls.maxDistance = maxDistance

        globe.pointOfView(initialPov, 0)
        boostTileDetail(globe)
        setReady(true)
      }

      ro = new ResizeObserver(entries => {
        const { width, height } = entries[0].contentRect
        if (width <= 0 || height <= 0) return
        if (globe) globe.width(width).height(height)
        else init(width, height)
      })
      ro.observe(container)
    }

    mount()

    return () => {
      cancelled = true
      ro?.disconnect()
      globeRef.current = null
      try { globe?._destructor?.() } catch (err) { /* globe.gl teardown is best-effort */ }
    }
    // Mount-once: the options above are camera limits that never change per page.
  }, [])

  return { globeRef, ready, failed }
}
