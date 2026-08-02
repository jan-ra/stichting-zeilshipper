import { useState, useEffect, useRef } from 'react'
// MapLibre loads its tile-parsing worker as a sibling file of its own bundle. Neither
// Vite's dep pre-bundling (dev) nor its rollup build (production) follows that, so the
// worker 404s and no tile is ever fetched — the map renders as a bare background with
// no coastlines. Handing MapLibre a worker Vite has built itself is the fix; `?worker&url`
// bundles it with its shared chunk and returns a URL that works in both modes.
import maplibreWorkerUrl from 'maplibre-gl/dist/maplibre-gl-worker.mjs?worker&url'

// OpenFreeMap: OpenStreetMap data on the OpenMapTiles schema, no key, no domain
// allowlist, commercial use explicitly allowed. Attribution is required, and the style
// carries its own — hence the plain AttributionControl below rather than a custom
// string, which would render it twice.
export const STYLE_URL = 'https://tiles.openfreemap.org/styles/dark'

// MapLibre's default vertical field of view, and the constant that turns a viewport
// height into the camera's distance from the map centre in pixels:
//   cameraToCenterDistance = 0.5 / tan(fov / 2) * height
const FOV_RAD = 0.6435011087932844
const CAMERA_K = 0.5 / Math.tan(FOV_RAD / 2)

// MapLibre works in 512px tiles, so the whole world is 512 * 2^zoom pixels wide.
const TILE_SIZE = 512

const rad = deg => (deg * Math.PI) / 180

// Unit vector from the planet centre towards a location. Only ever used in dot
// products against another vector from this same function, so the choice of basis
// does not matter as long as it is consistent.
const unitVec = (lat, lng) => {
  const cl = Math.cos(rad(lat))
  return { x: cl * Math.cos(rad(lng)), y: cl * Math.sin(rad(lng)), z: Math.sin(rad(lat)) }
}

// Imports MapLibre on first use and points it at the worker above. Every map on the
// site goes through here, so the worker is wired up exactly once.
let workerWired = false
export async function loadMapLibre() {
  const maplibregl = await import('maplibre-gl')
  if (!workerWired) {
    maplibregl.setWorkerUrl(maplibreWorkerUrl)
    workerWired = true
  }
  return maplibregl
}

// The screen-space view of the map, and the only thing ShipMarkers is allowed to know
// about the rendering engine. Swapping engines again means rewriting this and nothing
// else.
//
// `visible` is the horizon test: a location on the far side of the globe still projects
// to a screen point, so it has to be culled explicitly. MapLibre computes this for its
// own markers on `map._camera.transform`, which is private, so it is reproduced here
// from public state. The camera sits `d` radii above the surface, which puts the horizon
// at an angular distance of acos(1 / (1 + d)) from the map centre — the same tangent
// plane MapLibre clips against, simplified for pitch 0 (the globe never pitches here).
export function createView(map) {
  let mLat = NaN, mLng = NaN, mZoom = NaN, mH = NaN
  let cosLimit = -1
  let centre = { x: 0, y: 0, z: 0 }

  const refresh = () => {
    const c = map.getCenter()
    const z = map.getZoom()
    const h = map.getCanvas().clientHeight
    if (z === mZoom && c.lat === mLat && c.lng === mLng && h === mH) return
    mZoom = z; mLat = c.lat; mLng = c.lng; mH = h

    const globeRadiusPx = (TILE_SIZE * 2 ** z) / (2 * Math.PI) / Math.cos(rad(c.lat))
    const d = (CAMERA_K * h) / globeRadiusPx
    cosLimit = 1 / (1 + d)
    centre = unitVec(c.lat, c.lng)
  }

  return {
    project: (lat, lng) => map.project([lng, lat]),
    visible: (lat, lng) => {
      refresh()
      const p = unitVec(lat, lng)
      return p.x * centre.x + p.y * centre.y + p.z * centre.z >= cosLimit
    },
    width: () => map.getCanvas().clientWidth,
    height: () => map.getCanvas().clientHeight,
    zoom: () => map.getZoom(),
    // Frame a lat/lng box, but only ever moving closer — pulling the camera back out
    // from under someone who has already zoomed in is disorienting. Returns false when
    // there is no room left to move in, which is the caller's cue to offer a list
    // instead. `step` guarantees a visible move even when the box is a single point.
    zoomIntoBounds: (b, { padding = 60, maxZoom = Infinity, step = 0.25, duration = 700 } = {}) => {
      const cam = map.cameraForBounds([[b.minLng, b.minLat], [b.maxLng, b.maxLat]], { padding })
      if (!cam) return false
      const current = map.getZoom()
      const target = Math.min(maxZoom, Math.max(cam.zoom, current + step))
      if (target <= current + 1e-4) return false
      map.flyTo({ center: cam.center, zoom: target, duration })
      return true
    },
    // Screen positions depend on the canvas box as well as the camera, so a resize has
    // to invalidate the cache even when the camera has not moved.
    key: () => {
      const c = map.getCenter()
      return `${c.lng.toFixed(6)},${c.lat.toFixed(6)},${map.getZoom().toFixed(4)},` +
        `${map.getBearing().toFixed(2)},${map.getCanvas().clientWidth},${map.getCanvas().clientHeight}`
    },
  }
}

// Everything below the ship markers: the vector basemap on a sphere. MapLibre is
// imported lazily so only the pages that show a map pay for the chunk.
export function useMapEngine(containerRef, { minZoom, maxZoom, initialView, labels = false }) {
  const mapRef = useRef(null)
  const viewRef = useRef(null)
  const [ready, setReady] = useState(false)
  const [failed, setFailed] = useState(false)

  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    let cancelled = false
    let map = null
    let ro = null

    const mount = async () => {
      let maplibregl
      try {
        maplibregl = await loadMapLibre()
      } catch (err) {
        if (!cancelled) setFailed(true)
        return
      }
      if (cancelled) return

      const init = () => {
        if (map) return
        map = new maplibregl.Map({
          container,
          style: STYLE_URL,
          center: [initialView.lng, initialView.lat],
          zoom: initialView.zoom,
          minZoom,
          maxZoom,
          attributionControl: false,
          // The globe is turned by dragging and never tilted; pitch would break the
          // horizon test in createView, which assumes the camera looks straight down.
          dragRotate: false,
          pitchWithRotate: false,
          touchPitch: false,
        })
        mapRef.current = map
        viewRef.current = createView(map)

        map.addControl(new maplibregl.AttributionControl({ compact: true }))

        map.on('style.load', () => {
          map.setProjection({ type: 'globe' })

          // The dark style carries place and road labels; on the globe the ship markers
          // are the only text that should be there. Informatieborden keeps them.
          if (!labels) {
            for (const layer of map.getStyle().layers) {
              if (layer.type === 'symbol') map.removeLayer(layer.id)
            }
          }

          // Note the `background` layer is left alone: on the globe it paints the planet
          // itself, not the space around it. The canvas is already transparent outside
          // the sphere, so the page's own gradient shows through there regardless.

          // Stands in for globe.gl's atmosphere (#3a7abd at 0.22 altitude). The globe
          // sits on the site's sand background, so this has to stay a narrow navy rim:
          // MapLibre's default blend throws a broad halo that reads as a white wash
          // against the page. Site palette — navy #0f2238, atmosphere blue #3a7abd.
          map.setSky({
            'sky-color': '#0f2238',
            'horizon-color': '#3a7abd',
            'fog-color': '#0f2238',
            'sky-horizon-blend': 0.35,
            'horizon-fog-blend': 0.5,
            'fog-ground-blend': 0.1,
            'atmosphere-blend': ['interpolate', ['linear'], ['zoom'], 0, 0.35, 5, 0.15, 9, 0],
          })

          if (!cancelled) setReady(true)
        })

        // A failed style fetch leaves an empty canvas, which is worse than saying so.
        map.on('error', e => {
          if (!cancelled && !map.isStyleLoaded()) setFailed(true)
        })
      }

      init()

      // MapLibre tracks its own container size, but only once the box is non-zero —
      // the map pane starts collapsed on the first layout pass of some routes.
      ro = new ResizeObserver(entries => {
        const { width, height } = entries[0].contentRect
        if (width > 0 && height > 0) map?.resize()
      })
      ro.observe(container)
    }

    mount()

    return () => {
      cancelled = true
      ro?.disconnect()
      mapRef.current = null
      viewRef.current = null
      try { map?.remove() } catch (err) { /* teardown is best-effort */ }
    }
    // Mount-once: the options above are camera limits that never change per page.
  }, [])

  return { mapRef, viewRef, ready, failed }
}
