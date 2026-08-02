import { useState, useRef, useEffect, useLayoutEffect, useMemo } from 'react'
import { asset } from '../../utils/asset.js'
import { clusterScreenPoints, clusterSignature, clusterBounds, assignmentOf } from './clusterScreenPoints.js'
import { polar2Cartesian } from './useGlobeEngine.js'

// Ship markers are plain DOM on top of the canvas, not a globe.gl points layer.
// three-globe draws points as cylinders with a hard `Math.max(alt * R, 0.1)` floor on
// their height, so they can never be flat — zoomed in they turn into spikes. Drawing
// them ourselves also means real z-index (a selected marker can be forced on top),
// hit areas we control, and pointer events that work on touch.

const RECLUSTER_MS = 110      // membership does not need 60Hz; positions do
const REF_ALT = 1.8           // the default framing altitude on both pages
const DOT_SCALE_MIN = 0.85
const DOT_SCALE_MAX = 1.3
const TIP_MAX_NAMES = 6

// ── Spotlight timings (home hero only) ───────────────────────────────────────
const SPOT_FIRST_MS = 1600    // let the opening camera flight settle first
const SPOT_HOLD_MS = 5000     // how long one card stays up
const SPOT_OUT_MS = 600       // must match the CSS transition in globe.css
const SPOT_GAP_MS = 1000      // dark pause between two cards
const SPOT_COOLDOWN_MS = 30000 // silence after the user last pointed at a marker
const SPOT_EDGE_PX = 90       // keep the anchor clear of the canvas edges

// Route date tags: offset clear of the dot, and the box a neighbouring tag has to stay
// out of for both to be drawn.
const TAG_OFFSET_X = 9
const TAG_OFFSET_Y = -8
const TAG_MIN_GAP_X = 54
const TAG_MIN_GAP_Y = 15
const TAG_EST_W = 52       // rough drawn width of "27 jul" — enough to test for overlap
const TAG_BOX_ABOVE = 10
const TAG_BOX_BELOW = 4

// The detail card floats over the globe while a ship is selected, and how much of the
// pane it covers swings from ~30% on a wide monitor to ~50% on a small laptop — too
// much for a fixed threshold. Measured directly instead, so tags flip or drop based on
// where the card actually is.
const CARD_SELECTOR = '.sz-shipcard'

// Visible angular height is roughly 53 * altitude degrees; aiming for the cluster to
// fill ~60% of that gives span / 32. Round it off to 30.
const SPLIT_DIVISOR = 30

const clamp = (v, lo, hi) => (v < lo ? lo : v > hi ? hi : v)
const discSize = n => Math.round(20 + Math.min(n, 24) * 0.75)
const countLabel = n => (n > 99 ? '99+' : String(n))

// A point on the sphere faces the camera when its surface normal (which, for a globe
// centred on the origin, is just its own position) points camera-ward.
const isFrontFacing = (lat, lng, cam) => {
  const p = polar2Cartesian(lat, lng)
  return p.x * (cam.x - p.x) + p.y * (cam.y - p.y) + p.z * (cam.z - p.z) > 0
}

function placeMarkers(globe, clusters, nodes) {
  const cam = globe.camera().position
  // The overlay cannot clip with `overflow: hidden` — that would cut off tooltips and
  // pickers, which are allowed to hang over the edge. So markers projecting outside the
  // canvas box are hidden instead of drawn on top of the rest of the page.
  const w = globe.width()
  const h = globe.height()
  for (const c of clusters) {
    const node = nodes.get(c.id)
    if (!node) continue
    if (!isFrontFacing(c.lat, c.lng, cam)) {
      node.style.visibility = 'hidden'
      continue
    }
    const { x, y } = globe.getScreenCoords(c.lat, c.lng, 0)
    if (x < 0 || y < 0 || x > w || y > h) {
      node.style.visibility = 'hidden'
      continue
    }
    node.style.visibility = 'visible'
    node.style.transform = `translate3d(${x}px, ${y}px, 0)`
  }
}

// The selected ship's track: one dot per stored position, joined by a line, projected
// in screen space every frame like the markers are. Attributes are written directly
// rather than through React — this runs at 60Hz and must not re-render.
//
// The line breaks at the horizon rather than at the viewport edge: a segment whose ends
// straddle the far side of the globe would otherwise be drawn as a chord straight
// through it. Running off the edge is fine, the SVG viewport clips that itself.
// The ship card's box in overlay-local coordinates, or null when nothing is covering
// the globe. One layout read per placement pass, and only while a track is on screen.
function cardBox(svg) {
  const el = document.querySelector(CARD_SELECTOR)
  if (!el || !svg) return null
  const c = el.getBoundingClientRect()
  if (c.width === 0 || c.height === 0) return null
  const s = svg.getBoundingClientRect()
  return { left: c.left - s.left, right: c.right - s.left, top: c.top - s.top, bottom: c.bottom - s.top }
}

function placeRoute(globe, route, refs) {
  const { path, dots, tags, svg } = refs
  if (!path || route.length < 2) return

  const cam = globe.camera().position
  const w = globe.width()
  const h = globe.height()
  let d = ''
  let penDown = false
  const onScreen = []

  for (let i = 0; i < route.length; i++) {
    const p = route[i]
    const dot = dots[i]

    if (isFrontFacing(p.lat, p.lng, cam)) {
      const { x, y } = globe.getScreenCoords(p.lat, p.lng, 0)
      d += `${penDown ? 'L' : 'M'}${x.toFixed(1)},${y.toFixed(1)}`
      penDown = true
      const inBox = x >= 0 && y >= 0 && x <= w && y <= h
      onScreen[i] = inBox ? { x, y } : null
      if (dot) {
        dot.setAttribute('cx', x.toFixed(1))
        dot.setAttribute('cy', y.toFixed(1))
        dot.style.visibility = inBox ? 'visible' : 'hidden'
      }
    } else {
      penDown = false
      onScreen[i] = null
      if (dot) dot.style.visibility = 'hidden'
    }
  }

  path.setAttribute('d', d)

  // Date tags are dropped rather than allowed to overlap: on a ship that barely moved,
  // seven of them land on top of each other and the whole track becomes unreadable.
  // Walked newest first, so when two points are too close it is the older tag that goes.
  const card = cardBox(svg)
  const placed = []

  for (let i = route.length - 1; i >= 0; i--) {
    const tag = tags[i]
    if (!tag) continue
    const pt = onScreen[i]

    const clear = pt && placed.every(q => Math.abs(q.x - pt.x) > TAG_MIN_GAP_X || Math.abs(q.y - pt.y) > TAG_MIN_GAP_Y)
    if (!clear) {
      tag.style.visibility = 'hidden'
      continue
    }

    // fitRoute keeps the route's *points* clear of the card, but a tag reaches ~50px
    // past the dot it belongs to. Read it leftwards if that would put it under the
    // card, and drop it if neither side is clear.
    const ty = pt.y + TAG_OFFSET_Y
    const hitsCard = (x0, x1) =>
      card && x1 > card.left && x0 < card.right &&
      ty + TAG_BOX_BELOW > card.top && ty - TAG_BOX_ABOVE < card.bottom

    const rightX = pt.x + TAG_OFFSET_X
    const leftX = pt.x - TAG_OFFSET_X
    const flip = hitsCard(rightX, rightX + TAG_EST_W)
    if (flip && hitsCard(leftX - TAG_EST_W, leftX)) {
      tag.style.visibility = 'hidden'
      continue
    }

    placed.push(pt)
    tag.setAttribute('x', (flip ? leftX : rightX).toFixed(1))
    tag.setAttribute('y', ty.toFixed(1))
    tag.setAttribute('text-anchor', flip ? 'end' : 'start')
    tag.style.visibility = 'visible'
  }
}

// The spotlight card rides the marker its ship currently belongs to — which is the
// group marker while that ship is clustered with others, and its own dot once the
// cluster splits. Looked up per frame rather than pinned at pick time, so the card
// keeps pointing at the right thing while the globe turns.
function placeSpot(globe, shipId, node, clusters) {
  if (!node || shipId == null) return
  const cluster = clusters.find(c => c.ships.some(s => s.id === shipId))
  if (!cluster || !isFrontFacing(cluster.lat, cluster.lng, globe.camera().position)) {
    node.style.visibility = 'hidden'
    return
  }
  const { x, y } = globe.getScreenCoords(cluster.lat, cluster.lng, 0)
  if (x < 0 || y < 0 || x > globe.width() || y > globe.height()) {
    node.style.visibility = 'hidden'
    return
  }
  node.style.visibility = 'visible'
  node.style.transform = `translate3d(${x}px, ${y}px, 0)`
}

export default function ShipMarkers({
  globeRef,
  ready,
  ships,
  matchedIds,        // Set of ship ids matching the current filter, or null for "all"
  selectedId,
  selectedRoute,     // the selected ship's stored positions, oldest first
  routeLocale = 'nl-NL',
  clusterRadiusPx,
  isTouch,
  canZoom,
  minAltitude,
  labels,
  spotlight = false,  // cycle a floating card through random ships (home hero only)
  onSelectShip,
  onDeselect,
}) {
  const overlayRef = useRef(null)
  const nodesRef = useRef(new Map())
  const clustersRef = useRef([])
  const sigRef = useRef('')
  const assignRef = useRef(null)
  const spotNodeRef = useRef(null)
  const spotShipRef = useRef(null)
  const routeRef = useRef({ svg: null, path: null, dots: [], tags: [] })

  // A single stored position is not a track, so it draws nothing — the ship's own
  // marker already says where it is.
  const route = useMemo(() => {
    const pts = (selectedRoute ?? []).filter(p => p && p.lat != null && p.lng != null)
    if (pts.length < 2) return []
    // Day and month only: these are nightly fixes, so the year is the same across a
    // track and the time of day says nothing a visitor would act on.
    const fmt = new Intl.DateTimeFormat(routeLocale, { day: 'numeric', month: 'short' })
    return pts.map(p => {
      const d = p.at ? new Date(p.at) : null
      return { ...p, label: d && !Number.isNaN(d.getTime()) ? fmt.format(d) : '' }
    })
  }, [selectedRoute, routeLocale])

  const [clusters, setClusters] = useState([])
  const [hover, setHover] = useState(null)    // { id, flip }
  const [picker, setPicker] = useState(null)  // { id, flip }
  const [spot, setSpot] = useState(null)      // { ship, flip, phase: 'in' | 'out' }
  const [spotPaused, setSpotPaused] = useState(false)

  // ── Projection + clustering loop ───────────────────────────────────────────
  useEffect(() => {
    if (!ready) return
    const nodes = nodesRef.current
    let raf = 0
    let lastKey = ''
    let lastClusterAt = 0
    sigRef.current = ''
    assignRef.current = null

    const recluster = globe => {
      const cam = globe.camera().position
      const points = []
      for (const s of ships) {
        if (!isFrontFacing(s.lat, s.lng, cam)) continue
        const { x, y } = globe.getScreenCoords(s.lat, s.lng, 0)
        points.push({ x, y, ship: s })
      }
      const next = clusterScreenPoints(points, clusterRadiusPx, assignRef.current)
      assignRef.current = assignmentOf(next)
      const sig = clusterSignature(next)
      clustersRef.current = next
      if (sig !== sigRef.current) {
        sigRef.current = sig
        setClusters(next)
      }
    }

    const tick = now => {
      raf = requestAnimationFrame(tick)
      const globe = globeRef.current
      if (!globe) return

      // Screen coordinates depend on the canvas box as well as the camera, so a
      // window resize has to invalidate the cache even when the camera is still.
      const cam = globe.camera().position
      const key = `${cam.x.toFixed(3)},${cam.y.toFixed(3)},${cam.z.toFixed(3)},${globe.width()},${globe.height()}`
      if (key === lastKey) return
      lastKey = key

      // Dots track the zoom continuously. This is a CSS custom property on the
      // overlay, so it costs one style write per frame regardless of marker count —
      // and never a tween, which is what made the old points layer lag a full second
      // behind the gesture.
      const altitude = Math.hypot(cam.x, cam.y, cam.z) / 100 - 1
      const scale = clamp(DOT_SCALE_MAX - 0.45 * (altitude / REF_ALT), DOT_SCALE_MIN, DOT_SCALE_MAX)
      overlayRef.current?.style.setProperty('--sz-dot-scale', scale.toFixed(3))

      if (now - lastClusterAt > RECLUSTER_MS) {
        lastClusterAt = now
        recluster(globe)
      }
      placeMarkers(globe, clustersRef.current, nodes)
      placeSpot(globe, spotShipRef.current, spotNodeRef.current, clustersRef.current)
      placeRoute(globe, routeRef.current.route ?? [], routeRef.current)
    }

    // Seed synchronously so markers appear on the first paint rather than one frame in.
    const globe = globeRef.current
    if (globe) recluster(globe)

    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [ready, ships, clusterRadiusPx, globeRef])

  // Place freshly mounted marker nodes before the browser paints them. Markers start
  // hidden, and the rAF loop only repaints when the camera moves — so without this a
  // cluster created on the last frame of a fly-to would stay invisible until the next
  // camera change.
  useLayoutEffect(() => {
    const globe = globeRef.current
    if (globe) placeMarkers(globe, clusters, nodesRef.current)
  }, [clusters, globeRef])

  // Same reason for the track: selecting a ship on a page that does not fly the camera
  // (the home hero) leaves the rAF loop with nothing to react to.
  useLayoutEffect(() => {
    routeRef.current.route = route
    routeRef.current.dots.length = route.length
    routeRef.current.tags.length = route.length
    const globe = globeRef.current
    if (globe) placeRoute(globe, route, routeRef.current)
  }, [route, globeRef])

  // ── Spotlight ──────────────────────────────────────────────────────────────
  // Anything the user is actually looking at outranks the showcase: a hovered
  // marker, an open picker, a selected ship.
  const spotBlocked = hover != null || picker != null || selectedId != null

  // Pointing at a marker stops the cycle at once; it only resumes once the pointer
  // has stayed off the markers for the full cooldown.
  useEffect(() => {
    if (!spotlight) return
    if (spotBlocked) { setSpotPaused(true); return }
    if (!spotPaused) return
    const timer = setTimeout(() => setSpotPaused(false), SPOT_COOLDOWN_MS)
    return () => clearTimeout(timer)
  }, [spotlight, spotBlocked, spotPaused])

  useEffect(() => {
    if (!spotlight || spotPaused) {
      // Animate out rather than vanish, then drop the node once the transition ends.
      setSpot(s => (s && s.phase !== 'out' ? { ...s, phase: 'out' } : s))
      const timer = setTimeout(() => setSpot(null), SPOT_OUT_MS)
      return () => clearTimeout(timer)
    }

    let timer = 0
    let lastId = null

    const pick = () => {
      const overlay = overlayRef.current
      const w = overlay?.clientWidth ?? 0
      const h = overlay?.clientHeight ?? 0
      // Only clusters currently drawn are candidates — they are front-facing by
      // construction — and only those with room around them for a card.
      const inView = clustersRef.current.filter(
        c => c.x > SPOT_EDGE_PX && c.x < w - SPOT_EDGE_PX && c.y > SPOT_EDGE_PX && c.y < h - SPOT_EDGE_PX
      )
      const candidates = inView.flatMap(c => c.ships.map(s => ({ ship: s, x: c.x })))
      if (candidates.length === 0) {
        timer = setTimeout(pick, SPOT_GAP_MS)
        return
      }
      const fresh = candidates.length > 1 ? candidates.filter(c => c.ship.id !== lastId) : candidates
      const chosen = fresh[Math.floor(Math.random() * fresh.length)]
      lastId = chosen.ship.id
      setSpot({ ship: chosen.ship, flip: chosen.x > w * 0.55, phase: 'in' })
      timer = setTimeout(hide, SPOT_HOLD_MS)
    }

    const hide = () => {
      setSpot(s => (s ? { ...s, phase: 'out' } : s))
      timer = setTimeout(() => {
        setSpot(null)
        timer = setTimeout(pick, SPOT_GAP_MS)
      }, SPOT_OUT_MS)
    }

    timer = setTimeout(pick, SPOT_FIRST_MS)
    return () => clearTimeout(timer)
  }, [spotlight, spotPaused, ships])

  spotShipRef.current = spot?.ship.id ?? null

  // Same reason as the markers above: place the card before its first paint, since
  // the rAF loop only writes when the camera moves.
  useLayoutEffect(() => {
    const globe = globeRef.current
    if (globe) placeSpot(globe, spotShipRef.current, spotNodeRef.current, clustersRef.current)
  }, [spot, globeRef])

  // Close any open popover when the selection changes from elsewhere (a list click).
  useEffect(() => { setPicker(null) }, [selectedId])

  useEffect(() => {
    if (!picker) return
    const close = () => setPicker(null)
    document.addEventListener('click', close)
    return () => document.removeEventListener('click', close)
  }, [picker])

  const setNode = (id, el) => {
    if (el) nodesRef.current.set(id, el)
    else nodesRef.current.delete(id)
  }

  // Does this marker's popover have room to open to the right?
  const flipFor = node => {
    const overlay = overlayRef.current
    if (!overlay || !node) return false
    const o = overlay.getBoundingClientRect()
    const r = node.getBoundingClientRect()
    return r.left - o.left > o.width * 0.55
  }

  const openPicker = (cluster, node) => {
    setHover(null)
    setPicker(p => (p && p.id === cluster.id ? null : { id: cluster.id, flip: flipFor(node) }))
  }

  const handleActivate = (e, cluster) => {
    e.stopPropagation()
    if (cluster.ships.length === 1) {
      setPicker(null)
      onSelectShip(cluster.ships[0])
      return
    }

    // Going after a group means the visitor has moved on from whatever single ship was
    // open — leaving its card and track up while the camera dives into a different
    // cluster would be showing two answers to the same question.
    if (selectedId != null) onDeselect?.()

    const globe = globeRef.current
    if (globe && canZoom) {
      const b = clusterBounds(cluster)
      // Longitude degrees shrink toward the poles; weight them so the span is in
      // comparable units before turning it into an altitude.
      const lngWeight = Math.cos((cluster.lat * Math.PI) / 180)
      const span = Math.max(b.spanLat, b.spanLng * lngWeight)
      const altitude = globe.pointOfView().altitude
      const target = Math.max(minAltitude, Math.min(span / SPLIT_DIVISOR, altitude * 0.85))
      if (target < altitude - 1e-4) {
        setPicker(null)
        setHover(null)
        globe.pointOfView({ lat: cluster.lat, lng: cluster.lng, altitude: target }, 700)
        return
      }
    }

    // Already at the zoom floor with ships still sharing a berth, or zooming is
    // disabled (the home hero) — fall back to picking from a list.
    openPicker(cluster, e.currentTarget)
  }

  const renderShipRows = (list, onPick) => list.map(s => {
    const dim = matchedIds && !matchedIds.has(s.id)
    return (
      <button
        key={s.id}
        type="button"
        className={'sz-picker__row' + (dim ? ' is-dim' : '')}
        onClick={e => { e.stopPropagation(); onPick(s) }}
      >
        <span className="sz-picker__name">{s.name}</span>
        <span className="sz-picker__meta">{s.type}</span>
      </button>
    )
  })

  const pickerCluster = picker && clusters.find(c => c.id === picker.id)

  return (
    <>
      <div
        className={'sz-globe__overlay' + (selectedId != null ? ' has-selection' : '')}
        ref={overlayRef}
      >
        {/* The track sits under the markers, so the ship's own dot stays on top of the
            newest point it shares a position with. Keyed by ship so switching selection
            gets fresh nodes rather than reusing another ship's. */}
        {route.length > 1 && (
          <svg className="sz-route" key={selectedId} ref={el => { routeRef.current.svg = el }}>
            <path className="sz-route__line" ref={el => { routeRef.current.path = el }} />
            {route.map((p, i) => {
              const newest = i === route.length - 1
              const ratio = i / (route.length - 1)
              return (
                <g key={p.at ?? i}>
                  <circle
                    className={'sz-route__dot' + (newest ? ' is-newest' : '')}
                    // Oldest reads faintest and smallest, so the direction of travel is
                    // legible even where the date tags had to be dropped.
                    r={3 + ratio * 2.5}
                    style={{ opacity: 0.45 + ratio * 0.55 }}
                    ref={el => { routeRef.current.dots[i] = el }}
                  />
                  {p.label && (
                    <text
                      className={'sz-route__tag' + (newest ? ' is-newest' : '')}
                      style={{ opacity: 0.55 + ratio * 0.45 }}
                      ref={el => { routeRef.current.tags[i] = el }}
                    >
                      {p.label}
                    </text>
                  )}
                </g>
              )
            })}
          </svg>
        )}

        {clusters.map(c => {
          const count = c.ships.length
          const isSelected = selectedId != null && c.ships.some(s => s.id === selectedId)
          const isMatch = !matchedIds || c.ships.some(s => matchedIds.has(s.id))
          const isCluster = count > 1
          const size = isCluster ? discSize(count) : 0

          const cls = [
            'sz-marker',
            isCluster ? 'is-cluster' : 'is-single',
            isSelected ? 'is-selected' : '',
            isMatch ? '' : 'is-dimmed',
          ].filter(Boolean).join(' ')

          const showTip = !isTouch && hover?.id === c.id
          const showPicker = !isTouch && picker?.id === c.id

          return (
            <div
              key={c.id}
              ref={el => setNode(c.id, el)}
              className={cls}
              style={{ zIndex: isSelected ? 10 : showPicker ? 9 : showTip ? 8 : isCluster ? 2 : 1 }}
              onPointerEnter={e => {
                if (isTouch || e.pointerType === 'touch' || !isMatch) return
                setHover({ id: c.id, flip: flipFor(e.currentTarget) })
              }}
              onPointerLeave={() => setHover(h => (h?.id === c.id ? null : h))}
              onClick={e => { if (isMatch) handleActivate(e, c) }}
            >
              <span
                className="sz-marker__hit"
                style={isCluster ? { width: size + 8, height: size + 8 } : undefined}
              />
              {isCluster ? (
                <span className="sz-marker__disc" style={{ width: size, height: size }}>
                  <span className="sz-marker__count">{countLabel(count)}</span>
                </span>
              ) : (
                <span className="sz-marker__dot" />
              )}

              {showTip && (
                <div className={'sz-tip' + (hover.flip ? ' is-flipped' : '')}>
                  {isCluster ? (
                    <>
                      <div className="sz-tip__title">{count} {labels.shipsHere}</div>
                      <div className="sz-tip__list">
                        {c.ships.slice(0, TIP_MAX_NAMES).map(s => (
                          <div key={s.id} className="sz-tip__row">
                            {s.name} <span className="sz-tip__meta">{s.type}</span>
                          </div>
                        ))}
                        {count > TIP_MAX_NAMES && (
                          <div className="sz-tip__row sz-tip__meta">+{count - TIP_MAX_NAMES}</div>
                        )}
                      </div>
                      {canZoom && <div className="sz-tip__hint">{labels.zoomToSplit}</div>}
                    </>
                  ) : (
                    <ShipTip ship={c.ships[0]} labels={labels} />
                  )}
                </div>
              )}

              {showPicker && (
                <div className={'sz-picker' + (picker.flip ? ' is-flipped' : '')} onClick={e => e.stopPropagation()}>
                  <div className="sz-picker__header">{labels.pickShip}</div>
                  {renderShipRows(c.ships, s => { setPicker(null); onSelectShip(s) })}
                </div>
              )}
            </div>
          )
        })}

        {spot && (
          <div
            ref={spotNodeRef}
            className={'sz-spot' + (spot.flip ? ' is-flipped' : '') + (spot.phase === 'out' ? ' is-out' : '')}
          >
            <span className="sz-spot__line" />
            <div className="sz-spot__card">
              {spot.ship.image && <img className="sz-spot__img" src={asset(spot.ship.image)} alt="" />}
              <div className="sz-spot__body">
                <div className="sz-spot__kicker">
                  {[spot.ship.type, spot.ship.year].filter(Boolean).join(' · ')}
                </div>
                <div className="sz-spot__name">{spot.ship.name}</div>
                {spot.ship.port && <div className="sz-spot__meta">{spot.ship.port}</div>}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* On touch the popover becomes a bottom sheet — it needs to escape the
          overlay's stacking context, so it lives outside it. */}
      {isTouch && pickerCluster && (
        <div className="sz-sheet" onClick={e => e.stopPropagation()}>
          <div className="sz-sheet__header">
            <span>{pickerCluster.ships.length} {labels.shipsHere}</span>
            <button type="button" className="sz-sheet__close" onClick={() => setPicker(null)} aria-label={labels.close}>
              &times;
            </button>
          </div>
          <div className="sz-sheet__body">
            {renderShipRows(pickerCluster.ships, s => { setPicker(null); onSelectShip(s) })}
          </div>
        </div>
      )}
    </>
  )
}

function ShipTip({ ship, labels }) {
  return (
    <>
      {ship.image && <img className="sz-tip__img" src={asset(ship.image)} alt="" />}
      <div className="sz-tip__title">{ship.name}</div>
      <div className="sz-tip__type">{ship.type}</div>
      <div className="sz-tip__meta">{ship.port}</div>
      {ship.positionUpdatedAt && (
        <div className="sz-tip__meta">
          {labels.positionUpdated}: {new Date(ship.positionUpdatedAt).toLocaleString()}
        </div>
      )}
    </>
  )
}
