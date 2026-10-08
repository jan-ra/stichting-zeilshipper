// Base-map styles the globe can be drawn with. All are free, need no key and allow
// commercial use; each style carries its own attribution, which the map shows.
//
// Production always uses DEFAULT_MAP_STYLE. On localhost, `?mapStyle=<name>` swaps it,
// so styles can be compared on the real pages (see `npm run globe-styles`). The choice
// is kept for the tab, so it survives navigating between pages.
export const MAP_STYLES = {
  dark:            { url: 'https://tiles.openfreemap.org/styles/dark',     provider: 'OpenFreeMap' },
  positron:        { url: 'https://tiles.openfreemap.org/styles/positron', provider: 'OpenFreeMap' },
  bright:          { url: 'https://tiles.openfreemap.org/styles/bright',   provider: 'OpenFreeMap' },
  liberty:         { url: 'https://tiles.openfreemap.org/styles/liberty',  provider: 'OpenFreeMap' },
  fiord:           { url: 'https://tiles.openfreemap.org/styles/fiord',    provider: 'OpenFreeMap' },
  colorful:        { url: 'https://tiles.versatiles.org/assets/styles/colorful/style.json',      provider: 'VersaTiles' },
  'colorful-dark': { url: 'https://tiles.versatiles.org/assets/styles/colorful-dark/style.json', provider: 'VersaTiles' },
  gray:            { url: 'https://tiles.versatiles.org/assets/styles/gray/style.json',          provider: 'VersaTiles' },
  muted:           { url: 'https://tiles.versatiles.org/assets/styles/muted/style.json',         provider: 'VersaTiles' },
}

export const DEFAULT_MAP_STYLE = 'dark'

const STORAGE_KEY = 'sz_map_style'
const isLocal = () =>
  typeof window !== 'undefined' && ['localhost', '127.0.0.1'].includes(window.location.hostname)

// The style name in effect for this page load.
export function currentMapStyle() {
  if (!isLocal()) return DEFAULT_MAP_STYLE
  try {
    const asked = new URLSearchParams(window.location.search).get('mapStyle')
    if (asked && MAP_STYLES[asked]) sessionStorage.setItem(STORAGE_KEY, asked)
    const kept = sessionStorage.getItem(STORAGE_KEY)
    if (kept && MAP_STYLES[kept]) return kept
  } catch { /* storage blocked: fall back to the default */ }
  return DEFAULT_MAP_STYLE
}

export const mapStyleUrl = () => MAP_STYLES[currentMapStyle()].url
