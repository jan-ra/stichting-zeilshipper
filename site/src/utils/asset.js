const BASE = import.meta.env.BASE_URL

// Returns a renderable URL for an asset reference. Absolute URLs (typically
// produced by the WordPress / R2 media pipeline) pass through unchanged;
// repo-relative paths get the Vite base path applied.
export function asset(path) {
  if (!path) return ''
  if (/^https?:\/\//i.test(path)) return path
  return BASE + String(path).replace(/^\//, '')
}

// Same for every candidate of a srcset ("url 640w, url 1280w").
export function assetSrcSet(srcSet) {
  if (!srcSet) return undefined
  return srcSet.split(',').map(c => {
    const [url, descriptor] = c.trim().split(/\s+/)
    return descriptor ? `${asset(url)} ${descriptor}` : asset(url)
  }).join(', ')
}
