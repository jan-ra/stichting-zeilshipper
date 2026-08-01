import { useState, useEffect, useRef } from 'react'

export const GLOBE_RADIUS = 100
export const TILE_URL = (x, y, l) => `https://a.basemaps.cartocdn.com/dark_nolabels/${l}/${x}/${y}.png`

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
          .globeTileEngineUrl(TILE_URL)
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
