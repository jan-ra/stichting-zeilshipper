// How big MapLibre draws the globe, and the zoom that makes it a given size.
//
// The planet's radius is fixed by zoom and latitude alone, but the camera sits a
// distance proportional to the *pane height* in front of it, so how large the globe
// looks on screen depends on the pane too. Pages that want the globe to fill a pane
// work the zoom out from here rather than hard-coding one that only suits one window.

// MapLibre's default vertical field of view, and the constant that turns a pane height
// into the camera's distance from the map centre in pixels:
//   cameraToCenterDistance = 0.5 / tan(fov / 2) * height
const FOV_RAD = 0.6435011087932844
export const CAMERA_K = 0.5 / Math.tan(FOV_RAD / 2)

// MapLibre works in 512px tiles, so the whole world is 512 * 2^zoom pixels wide.
const TILE_SIZE = 512

const rad = deg => (deg * Math.PI) / 180

// The planet's radius in pixels. Note the 1/cos(latitude): MapLibre's globe grows as
// the centre moves away from the equator, so equal zooms are not equal sizes.
export function globeRadiusPx(zoom, lat) {
  return (TILE_SIZE * 2 ** zoom) / (2 * Math.PI) / Math.cos(rad(lat))
}

// The globe's outline on screen, edge to edge, in a pane `paneHeight` pixels tall.
// The camera is `d` in front of the near surface, so the limb is the tangent from a
// point d + R from the centre, seen through a focal length of d.
export function globeScreenDiameter(zoom, lat, paneHeight) {
  const R = globeRadiusPx(zoom, lat)
  const d = CAMERA_K * paneHeight
  return (2 * d * R) / Math.sqrt(d * d + 2 * d * R)
}

// The inverse: the zoom at which the globe's outline is `diameter` pixels across.
export function zoomForGlobeDiameter(diameter, lat, paneHeight) {
  const r = diameter / 2
  const d = CAMERA_K * paneHeight
  const R = (r * r + r * Math.sqrt(r * r + d * d)) / d
  return Math.log2((R * 2 * Math.PI * Math.cos(rad(lat))) / TILE_SIZE)
}

// Both pages open with the globe a little smaller than the size they would otherwise
// pick, so it sits in its pane with some air around it rather than filling it.
export const OPENING_GLOBE_SCALE = 0.9

// The zoom that draws the globe `scale` times as wide as `zoom` does, in the same pane.
export function scaleGlobeZoom(zoom, lat, paneHeight, scale) {
  return zoomForGlobeDiameter(globeScreenDiameter(zoom, lat, paneHeight) * scale, lat, paneHeight)
}
