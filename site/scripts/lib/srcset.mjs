// Shared by bake-media.mjs and its tests: which downscaled copies an image gets, what
// they are called, and how they are offered to the browser.

// 320/640 cover a 260px strip tile at 1x/2x, 1280/1920 the wider photos elsewhere.
export const VARIANT_WIDTHS = [320, 640, 1280, 1920]

// Only widths that are actually a reduction; the original is always the top candidate.
export const variantWidthsFor = originalWidth =>
  VARIANT_WIDTHS.filter(w => w < originalWidth)

// /baked/abc-photo.jpg -> /baked/abc-photo-640w.webp
export const variantPath = (path, width) =>
  path.replace(/\.[^./]+$/, '') + `-${width}w.webp`

// `variants` is [{ path, width }] including the original. Smallest first, as the
// browser does not care but people reading the HTML do.
export const srcSetOf = variants =>
  [...variants].sort((a, b) => a.width - b.width).map(v => `${v.path} ${v.width}w`).join(', ')

// Adds `srcSet` to every `{ src, ... }` image object whose src has variants. Pages that
// know their rendered size pair it with `sizes`; the rest keep using `src` as before.
export function addSrcSets(node, srcSets) {
  if (Array.isArray(node)) return node.map(v => addSrcSets(v, srcSets))
  if (!node || typeof node !== 'object') return node
  const out = {}
  for (const k of Object.keys(node)) out[k] = addSrcSets(node[k], srcSets)
  if (typeof out.src === 'string' && srcSets.has(out.src)) out.srcSet = srcSets.get(out.src)
  return out
}
