// Greedy screen-space clustering.
//
// Markers merge exactly when they would visually overlap and split apart again as
// you zoom in, which is the behaviour a fixed lat/lng rounding key can never give.
//
// `points` must arrive in a stable order (we sort by ship id) — the greedy walk is
// order-dependent, so a stable order keeps cluster membership from flickering
// between frames. Naming each cluster after its lowest member id keeps React keys
// stable across passes so the CSS transitions actually run.

// Once a point has joined a cluster it stays until it is this much further out than
// the join distance. Without the gap, points sitting right on the radius flip in and
// out on consecutive passes while you zoom.
const HYSTERESIS = 1.3

export function clusterScreenPoints(points, radiusPx, prevAssignment) {
  const n = points.length
  if (n === 0) return []

  // Hash into a grid of radiusPx cells so each point only tests nearby neighbours.
  const cell = radiusPx
  const grid = new Map()
  for (let i = 0; i < n; i++) {
    const key = Math.floor(points[i].x / cell) + ':' + Math.floor(points[i].y / cell)
    const bucket = grid.get(key)
    if (bucket) bucket.push(i)
    else grid.set(key, [i])
  }

  const r2 = radiusPx * radiusPx
  const hold2 = r2 * HYSTERESIS * HYSTERESIS
  // The hysteresis reach spans more than one cell, so widen the neighbourhood scan.
  const reach = Math.ceil(HYSTERESIS)
  const taken = new Uint8Array(n)
  const clusters = []

  for (let i = 0; i < n; i++) {
    if (taken[i]) continue
    taken[i] = 1

    // Points are walked in ship-id order and lower indices are always claimed first,
    // so the seed is by construction the lowest-id member of its cluster.
    const seed = points[i]
    const id = 'c' + seed.ship.id
    const members = [seed]

    const cx = Math.floor(seed.x / cell)
    const cy = Math.floor(seed.y / cell)
    for (let dx = -reach; dx <= reach; dx++) {
      for (let dy = -reach; dy <= reach; dy++) {
        const bucket = grid.get((cx + dx) + ':' + (cy + dy))
        if (!bucket) continue
        for (const j of bucket) {
          if (taken[j]) continue
          const p = points[j]
          const ddx = p.x - seed.x
          const ddy = p.y - seed.y
          const limit = prevAssignment && prevAssignment.get(p.ship.id) === id ? hold2 : r2
          if (ddx * ddx + ddy * ddy > limit) continue
          taken[j] = 1
          members.push(p)
        }
      }
    }

    clusters.push({
      id,
      // Anchored on the seed, not on the members' centroid. A centroid shifts every
      // time a point joins or leaves, which makes the marker jitter against the map
      // while zooming; the seed does not move at all. Because every member is within
      // radiusPx of the seed by construction, the anchor is never far from the group.
      x: seed.x,
      y: seed.y,
      lat: seed.ship.lat,
      lng: seed.ship.lng,
      ships: members.map(m => m.ship),
    })
  }

  return clusters
}

// Map of ship id -> cluster id, fed back into the next pass to drive the hysteresis.
export function assignmentOf(clusters) {
  const m = new Map()
  for (const c of clusters) for (const s of c.ships) m.set(s.id, c.id)
  return m
}

// Compact description of "which markers exist, holding exactly which ships" — used to
// skip React state updates when a clustering pass produced the same result as the last
// one. Member ids are spelled out rather than just counted: two different memberships
// can share a seed and a count while the globe rotates, and a centroid computed from
// stale membership would drift.
export function clusterSignature(clusters) {
  let sig = ''
  for (const c of clusters) {
    sig += c.id + ':'
    for (const s of c.ships) sig += s.id + '.'
    sig += ','
  }
  return sig
}

// Lat/lng bounds of a cluster's members, for the zoom-to-split interaction.
export function clusterBounds(cluster) {
  let minLat = Infinity, maxLat = -Infinity, minLng = Infinity, maxLng = -Infinity
  for (const s of cluster.ships) {
    if (s.lat < minLat) minLat = s.lat
    if (s.lat > maxLat) maxLat = s.lat
    if (s.lng < minLng) minLng = s.lng
    if (s.lng > maxLng) maxLng = s.lng
  }
  return { minLat, maxLat, minLng, maxLng, spanLat: maxLat - minLat, spanLng: maxLng - minLng }
}
