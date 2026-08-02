// The single source of truth for the raster basemap used by the globe (globe.gl) and
// the harbour map (Leaflet). Both consume PNG XYZ tiles, so switching provider is a
// change to this file and nothing else.
//
// Provider: Stadia Maps, `stamen_toner_dark`. Chosen over Stadia's own
// `alidade_smooth_dark` because it is effectively labels-free, which is what the CARTO
// `dark_nolabels` style it replaces gave us — the globe is a canvas for ship markers and
// place names compete with them. Stadia has no labels-free variant of its house dark
// style (`alidade_smooth_dark_nolabels` and `_background` both 404).
//
// Stadia authenticates by domain rather than by key: a static Vite bundle cannot keep a
// key secret, and localhost needs no credentials at all, so `npm run dev` works
// untouched. Production domains must be allowlisted in the Stadia account before
// deploying, otherwise every tile comes back as a 401 placeholder image.
//
// Attribution is required and must stay visible on every map — including the Stamen
// Design credit, which Stadia requires on top of the usual three for its Stamen styles.
// Leaflet draws it through its own attribution control, the globe through ShipGlobe's
// credit overlay.
export const RASTER_TILE_URL = 'https://tiles.stadiamaps.com/tiles/stamen_toner_dark/{z}/{x}/{y}{r}.png'

export const BASEMAP_ATTRIBUTION_HTML =
  '<a href="https://www.stadiamaps.com/" target="_blank" rel="noreferrer">Stadia Maps</a> · ' +
  '<a href="https://stamen.com/" target="_blank" rel="noreferrer">Stamen Design</a> · ' +
  '<a href="https://openmaptiles.org/" target="_blank" rel="noreferrer">OpenMapTiles</a> · ' +
  '<a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noreferrer">OpenStreetMap</a>'

// Plain-text form for the globe, whose overlay is React rather than injected HTML.
export const BASEMAP_ATTRIBUTION = 'Stadia Maps · Stamen Design · OpenMapTiles · OpenStreetMap'

// globe.gl asks for a tile by (x, y, level) and wants a finished URL back. `{r}` is
// Leaflet's retina placeholder, and the globe always asks for the @2x tile: 512px of
// texture stretched over the same patch of sphere is one extra level of sharpness for
// exactly the same number of requests, which on a credit-metered plan is the cheapest
// resolution there is. Verified against the provider — @2x returns 512x512, @3x/@4x 404.
export function tileUrl(x, y, level) {
  return RASTER_TILE_URL
    .replace('{z}', level)
    .replace('{x}', x)
    .replace('{y}', y)
    .replace('{r}', '@2x')
}
