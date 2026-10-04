import { useState, useEffect, useMemo, useCallback, useRef } from 'react'
import { SHIPS, FLEET_PAGE } from '../data/content.js'
import { useLanguage } from '../context/LanguageContext.jsx'
import { asset } from '../utils/asset.js'
import ShipGlobe from '../components/globe/ShipGlobe.jsx'
import ShipCard from '../components/ShipCard.jsx'
import { useShips } from '../hooks/useShips.js'

// Fold the many raw type variants (koftjalk, driemastklipper, lemsteraak, …) into
// a handful of ship families. First match wins, so order matters (aak before
// klipper so "klipperaak" lands under Aak; schoener before brik for "schoenerbrik").
const TYPE_GROUPS = [
  { label: 'Tjalk',   match: t => t.includes('tjalk') },
  { label: 'Aak',     match: t => t.includes('aak') },
  { label: 'Klipper', match: t => t.includes('klipper') },
  { label: 'Schoener', match: t => t.includes('schoener') },
  { label: 'Bark',    match: t => t.includes('bark') },
  { label: 'Brik',    match: t => t.includes('brik') || t.includes('brigantijn') },
  { label: 'Logger',  match: t => t.includes('logger') },
  { label: 'Kotter',  match: t => t.includes('kotter') },
  { label: 'Skûtsje', match: t => t.includes('skûtsje') || t.includes('skutsje') },
]

const OTHER = 'Overig'

// MapLibre zoom levels. The ceiling of 14 is ~3 m/px, where ships more than about 90 m
// apart resolve into separate markers; anything closer than that shares a berth and
// bottoms out into the picker list instead. Note the globe flattens into Mercator
// around zoom 12, so the deepest part of a dive lands on a flat map — which is the
// right reading of a harbour anyway.
const MIN_ZOOM = 1.1        // the whole planet in the pane
const MAX_ZOOM = 14
// Selecting a ship frames its harbour rather than slamming to the zoom floor — at
// ~25 km up you can still see where in the country you are.
const SELECT_ZOOM = 10.7

const CARD_MARGIN_PX = 20   // breathing room around the card when reserving space
const CARD_MAX_RESERVE = 0.45

// Zoom 1.8 puts the planet at roughly 93% of the pane's height, which is the tighter of
// the two axes on this page. Note the globe grows as a *fraction* of a shrinking pane —
// the camera distance is derived from the viewport height — so this is deliberately kept
// short of filling it, leaving room on stubbier windows.
const DEFAULT_VIEW = { lat: 52.5, lng: 5.0, zoom: 1.8, ms: 1500 }

// The zoom at which `spanDeg` degrees of latitude fill `fill` of a pane `heightPx` tall.
// MapLibre lays the world out in 512px tiles, so at zoom z one pixel is
// 360 * cos(lat) / (512 * 2^z) degrees.
function zoomForSpanDeg(spanDeg, lat, heightPx, fill) {
  const visibleDeg = Math.max(spanDeg, 1e-6) / fill
  return Math.log2((heightPx * 360 * Math.cos((lat * Math.PI) / 180)) / (512 * visibleDeg))
}

const categoryOf = (type) => {
  const t = (type || '').toLowerCase()
  return TYPE_GROUPS.find(g => g.match(t))?.label ?? OTHER
}

const presentCats = new Set(SHIPS.map(s => categoryOf(s.type)))
const TYPES = [
  'all',
  ...TYPE_GROUPS.map(g => g.label).filter(l => presentCats.has(l)),
  ...(presentCats.has(OTHER) ? [OTHER] : []),
]
const REGIONS = ['all', 'thuiswateren', 'europa', 'wereld']

const matchesSearch = (s, q) => {
  if (!q) return true
  const needle = q.trim().toLowerCase()
  return [s.name, s.type, s.port].some(v => v && v.toLowerCase().includes(needle))
}

// Camera framing that fits a set of ships, leaving a comfortable margin around the
// group. A smaller `fill` pulls the camera back further; fitRoute uses one to give a
// track room to breathe.
function fitView(list, pane, fill = 0.56) {
  const pts = list.filter(s => s.lat != null && s.lng != null)
  if (pts.length === 0) return DEFAULT_VIEW

  let minLat = Infinity, maxLat = -Infinity, minLng = Infinity, maxLng = -Infinity
  for (const s of pts) {
    if (s.lat < minLat) minLat = s.lat
    if (s.lat > maxLat) maxLat = s.lat
    if (s.lng < minLng) minLng = s.lng
    if (s.lng > maxLng) maxLng = s.lng
  }
  const lat = (minLat + maxLat) / 2
  const lng = (minLng + maxLng) / 2
  const span = Math.max(maxLat - minLat, (maxLng - minLng) * Math.cos((lat * Math.PI) / 180))
  const zoom = clampZoom(zoomForSpanDeg(span, lat, pane?.height ?? 800, fill))
  return { lat, lng, zoom, ms: 1800 }
}

const clampZoom = z => Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, z))

// Camera framing for a selected ship: the whole stored track on screen, not just where
// the ship happens to be now. Unlike a plain marker click this flight may zoom *out* —
// a week of sailing can easily be wider than the current view, and half a track off
// screen is worse than a wider shot.
//
// SELECT_ZOOM acts as the ceiling so a ship that barely moved gets a harbour-level view
// with context, rather than the camera slamming to the zoom limit on a 200 m track.
//
// The ship card covers part of the pane whenever something is selected, so zooming to
// fit is not enough on its own — half the track can end up behind it. That is what
// `padding` is for: MapLibre frames the target inside what is left of the pane, which
// replaces the hand-rolled zoom-out-and-aim-off-centre this used to do.
function fitRoute(ship, pane) {
  const padding = pane?.padding ?? null
  const pts = (ship.history ?? []).filter(p => p.lat != null && p.lng != null)

  if (pts.length < 2) {
    if (ship.lat == null || ship.lng == null) return DEFAULT_VIEW
    return { lat: ship.lat, lng: ship.lng, zoom: SELECT_ZOOM, zoomInOnly: true, padding, ms: 1800 }
  }

  // Unwrap longitudes relative to the first point, so a track crossing the antimeridian
  // frames around the crossing instead of around the far side of the planet.
  const base = pts[0].lng
  const unwrapped = pts.map(p => ({ lat: p.lat, lng: p.lng - 360 * Math.round((p.lng - base) / 360) }))
  // Wider margin than a plain group fit — a track wants breathing room around it.
  const view = fitView(unwrapped, pane, 0.34)

  return {
    lat: view.lat,
    lng: ((view.lng + 540) % 360) - 180,
    zoom: Math.min(view.zoom, SELECT_ZOOM),
    padding,
    ms: 1800,
  }
}

// The pane's height (for turning a span into a zoom) and the padding that keeps the
// ship card clear of whatever the camera is framing.
//
// The card is measured rather than assumed, because it has two quite different shapes:
// a 320px panel floating over the top-right on wide screens, and a full-width bottom
// sheet below 1000px (see ShipCard.css). One eats width, the other height, and the
// switch point is a CSS concern that JS should not be repeating.
function paneMetrics(paneEl) {
  if (!paneEl) return null
  const p = paneEl.getBoundingClientRect()
  if (p.width <= 0 || p.height <= 0) return null

  const metrics = { height: p.height, padding: { top: 0, right: 0, bottom: 0, left: 0 } }

  const card = document.querySelector('.sz-shipcard')
  if (!card) return metrics

  // Both card variants animate in — the sheet from translateY(100%) — and this runs
  // while that is happening, so a live getBoundingClientRect can catch it still off
  // screen. offsetWidth/offsetHeight are layout boxes and ignore transforms.
  const sheet = getComputedStyle(card).position === 'fixed'
  const c = sheet
    ? { left: 0, right: window.innerWidth, top: window.innerHeight - card.offsetHeight, bottom: window.innerHeight }
    : card.getBoundingClientRect()

  const overlapW = Math.max(0, Math.min(p.right, c.right) - Math.max(p.left, c.left))
  const overlapH = Math.max(0, Math.min(p.bottom, c.bottom) - Math.max(p.top, c.top))
  if (overlapW <= 0 || overlapH <= 0) return metrics   // card is clear of the globe

  // MapLibre refuses padding that leaves no room, so cap it well short of the pane.
  if (sheet) metrics.padding.bottom = Math.min(p.height * CARD_MAX_RESERVE, overlapH + CARD_MARGIN_PX)
  else metrics.padding.right = Math.min(p.width * CARD_MAX_RESERVE, overlapW + CARD_MARGIN_PX)

  return metrics
}

export default function FleetPage() {
  const [selectedId, setSelectedId] = useState(null)
  const [filter, setFilter] = useState({ type: 'all', region: 'all', search: '' })
  const [userInteracted, setUserInteracted] = useState(false)
  const [view, setView] = useState(DEFAULT_VIEW)
  const { t, tc } = useLanguage()

  // Baked CMS fields merged with the positions fetched from the media bucket.
  const allItems = useShips()

  // Held by id rather than by object: the positions fetch replaces every ship object
  // shortly after mount, and a captured object would leave the card and the track
  // showing the baked coordinates instead of the live ones.
  const selected = useMemo(
    () => (selectedId == null ? null : allItems.find(s => s.id === selectedId) ?? null),
    [allItems, selectedId]
  )

  // Read by the fly-to effect, which must not re-run when the ship list changes.
  const allItemsRef = useRef(allItems)
  allItemsRef.current = allItems

  // Measured when framing a track, to know how much of the pane the card will cover.
  const mapRef = useRef(null)

  const regionLabels = t('fleet.regionLabels')

  const filtered = useMemo(() => allItems.filter(s => {
    if (filter.type !== 'all' && categoryOf(s.type) !== filter.type) return false
    if (filter.region !== 'all' && s.region !== filter.region) return false
    if (!matchesSearch(s, filter.search)) return false
    return true
  }), [allItems, filter])

  // Non-matching markers stay on the globe for context but are dimmed and inert.
  // `null` means "no filter active", which lets ShipMarkers skip the check entirely.
  const matchedIds = useMemo(() => {
    const noFilter = filter.type === 'all' && filter.region === 'all' && !filter.search
    return noFilter ? null : new Set(filtered.map(s => s.id))
  }, [filtered, filter])

  const shipCount = filtered.length

  const handleSelect = useCallback((item) => {
    setUserInteracted(true)
    setSelectedId(prev => (prev === item.id ? null : item.id))
  }, [])

  const handleDeselect = useCallback(() => setSelectedId(null), [])

  const handleUserInteract = useCallback(() => setUserInteracted(true), [])

  // Every camera command gets a sequence number so re-issuing the same one still flies.
  const viewSeq = useRef(0)
  const flyTo = useCallback(next => setView({ ...next, seq: ++viewSeq.current }), [])

  // Selecting a ship frames its whole track (see fitRoute). Deselecting leaves the
  // camera exactly where it is — closing the card must not move the globe.
  //
  // Keyed on selectedId, not `selected`: the positions fetch swaps the ship object out
  // from under us on load, and re-flying the camera because the data refreshed would
  // yank the view away from wherever the visitor had dragged it.
  useEffect(() => {
    if (selectedId == null) return
    const ship = allItemsRef.current.find(s => s.id === selectedId)
    if (ship) flyTo(fitRoute(ship, paneMetrics(mapRef.current)))
  }, [selectedId, flyTo])

  // Switching region re-frames the globe around whatever that region contains. This is
  // a filter action rather than a ship click, so it may zoom out.
  const firstRegionRun = useRef(true)
  useEffect(() => {
    if (firstRegionRun.current) { firstRegionRun.current = false; return }
    if (selected) return
    flyTo(fitView(
      allItems.filter(s => filter.region === 'all' || s.region === filter.region),
      paneMetrics(mapRef.current)
    ))
  }, [filter.region])

  return (
    <div className="fleet-shell">

      {/* ── Crew notice banner ── */}
      <div className="fleet-banner">
        <div style={{ width: 1, height: 44, background: 'linear-gradient(to bottom, transparent, #c19a52, transparent)', flexShrink: 0 }} />
        <div>
          <div style={{ fontFamily: "'Playfair Display', serif", fontSize: 17, color: '#0f2238', fontWeight: 400, letterSpacing: '0.01em', marginBottom: 5 }}>
            {tc(FLEET_PAGE, 'bannerQuote')}
          </div>
          <div style={{ fontSize: 12, color: 'rgba(15,34,56,0.5)', letterSpacing: '0.04em', textTransform: 'uppercase' }}>
            {tc(FLEET_PAGE, 'bannerSub')}
          </div>
        </div>
      </div>

      <div className="fleet-grid">

        {/* ── Ship list ── */}
        <div className="fleet-list">

          {/* Sticky header + filters */}
          <div style={{ position: 'sticky', top: 0, zIndex: 10, background: '#efe7d8', padding: '28px 24px 16px', borderBottom: '1px solid rgba(193,154,82,0.25)' }}>
            <div style={{ fontSize: 10, color: '#a07d33', letterSpacing: '0.2em', textTransform: 'uppercase', marginBottom: 6 }}>{t('fleet.badge')}</div>
            <div style={{ fontFamily: "'Playfair Display', serif", fontSize: 22, color: '#0f2238', fontWeight: 400, marginBottom: 16 }}>
              {shipCount} <span style={{ fontSize: 14, color: 'rgba(15,34,56,0.45)', fontFamily: 'inherit', fontWeight: 400 }}>{t('fleet.of')} {SHIPS.length} {t('fleet.ships')}</span>
            </div>
            <div style={{ position: 'relative', marginBottom: 12 }}>
              <input
                type="text"
                value={filter.search}
                onChange={e => setFilter(f => ({ ...f, search: e.target.value }))}
                placeholder={t('fleet.searchPlaceholder')}
                style={{
                  width: '100%', boxSizing: 'border-box',
                  padding: '9px 30px 9px 12px',
                  background: '#faf6ee', border: '1px solid rgba(193,154,82,0.35)',
                  borderRadius: 2, fontSize: 13, color: '#0f2238',
                  fontFamily: 'inherit', outline: 'none',
                }}
              />
              {filter.search && (
                <button
                  onClick={() => setFilter(f => ({ ...f, search: '' }))}
                  aria-label="clear search"
                  style={{
                    position: 'absolute', top: '50%', right: 8, transform: 'translateY(-50%)',
                    background: 'none', border: 'none', cursor: 'pointer',
                    color: 'rgba(15,34,56,0.4)', fontSize: 15, lineHeight: 1, padding: 0,
                  }}
                >✕</button>
              )}
            </div>
            <div className="fleet-chips" style={{ marginBottom: 6 }}>
              {TYPES.map(o => (
                <button key={o} onClick={() => setFilter(f => ({ ...f, type: o }))} style={{
                  background: filter.type === o ? '#c19a52' : 'rgba(15,34,56,0.06)',
                  border: 'none', cursor: 'pointer',
                  fontSize: 10, fontWeight: 500, letterSpacing: '0.08em', textTransform: 'uppercase',
                  color: filter.type === o ? '#0f2238' : 'rgba(15,34,56,0.55)',
                  padding: '5px 10px', borderRadius: 2, transition: 'all 0.2s', whiteSpace: 'nowrap',
                }}>
                  {o === 'all' ? t('fleet.allTypes') : o === OTHER ? t('fleet.otherType') : o}
                </button>
              ))}
            </div>
            <div className="fleet-chips">
              {REGIONS.map(o => (
                <button key={o} onClick={() => setFilter(f => ({ ...f, region: o }))} style={{
                  background: filter.region === o ? '#c19a52' : 'rgba(15,34,56,0.06)',
                  border: 'none', cursor: 'pointer',
                  fontSize: 10, fontWeight: 500, letterSpacing: '0.08em', textTransform: 'uppercase',
                  color: filter.region === o ? '#0f2238' : 'rgba(15,34,56,0.55)',
                  padding: '5px 10px', borderRadius: 2, transition: 'all 0.2s', whiteSpace: 'nowrap',
                }}>
                  {regionLabels[o]}
                </button>
              ))}
            </div>
          </div>

          {/* List */}
          <div style={{ padding: '12px 16px 24px', display: 'flex', flexDirection: 'column', gap: 2, flex: 1 }}>
            {filtered.map(item => (
              <div
                key={item.id}
                onClick={() => handleSelect(item)}
                style={{
                  background: selected?.id === item.id ? 'rgba(193,154,82,0.16)' : '#faf6ee',
                  border: `1px solid ${selected?.id === item.id ? 'rgba(193,154,82,0.45)' : 'rgba(15,34,56,0.08)'}`,
                  padding: '14px 18px', cursor: 'pointer', transition: 'all 0.2s',
                }}
                onMouseEnter={e => { if (selected?.id !== item.id) e.currentTarget.style.background = 'rgba(193,154,82,0.1)' }}
                onMouseLeave={e => { if (selected?.id !== item.id) e.currentTarget.style.background = '#faf6ee' }}
              >
                <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                  {item.image && (
                    <img src={asset(item.image)} alt={item.name} style={{ width: 52, height: 52, objectFit: 'cover', borderRadius: 2, flexShrink: 0 }} />
                  )}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div>
                        <div style={{ fontSize: 10, color: '#a07d33', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 3 }}>{item.type} · {item.year}</div>
                        <div style={{ fontFamily: "'Playfair Display', serif", fontSize: 15, color: '#0f2238' }}>{item.name}</div>
                      </div>
                      {item.lat != null ? (
                        <div title={t('fleet.positionUpdated')} style={{ width: 7, height: 7, borderRadius: '50%', background: '#c19a52', boxShadow: '0 0 5px rgba(193,154,82,0.6)', flexShrink: 0, animation: 'pulse 2.5s ease-in-out infinite' }} />
                      ) : (
                        <div title={t('fleet.noPosition')} style={{ width: 7, height: 7, borderRadius: '50%', border: '1px solid rgba(15,34,56,0.25)', flexShrink: 0 }} />
                      )}
                    </div>
                    <div style={{ marginTop: 6, fontSize: 11, color: 'rgba(15,34,56,0.5)', display: 'flex', gap: 14 }}>
                      <span>{item.port}</span>
                      <span>{item.passengers} pax</span>
                    </div>
                    <div style={{ marginTop: 4, fontSize: 10, color: 'rgba(15,34,56,0.55)' }}>
                      {item.lat == null
                        ? t('fleet.noPosition')
                        : item.positionUpdatedAt
                          ? `${t('fleet.positionUpdated')}: ${new Date(item.positionUpdatedAt).toLocaleString()}`
                          : null}
                    </div>
                  </div>
                </div>
              </div>
            ))}
            {filtered.length === 0 && (
              <div style={{ textAlign: 'center', padding: '40px 0', color: 'rgba(15,34,56,0.45)', fontSize: 14 }}>
                {t('fleet.noShips')}
              </div>
            )}
          </div>
        </div>

        {/* ── Globe ── */}
        <div className="fleet-map" ref={mapRef}>
          <ShipGlobe
            ships={allItems}
            matchedIds={matchedIds}
            selectedShip={selected}
            onSelectShip={handleSelect}
            onDeselect={handleDeselect}
            view={view}
            autoRotate={!userInteracted}
            autoRotateSpeed={1.6}
            enableZoom
            minZoom={MIN_ZOOM}
            maxZoom={MAX_ZOOM}
            /* The track only makes sense here: this is the globe you can zoom, and the
               only one that frames the camera around a selected ship's route. */
            showRoute
            onUserInteract={handleUserInteract}
          />

          {/* Selected detail — shared with the home hero */}
          <ShipCard ship={selected} onClose={handleDeselect} />

          {!selected && (
            <div className="fleet-hint">{t('fleet.clickHint')}</div>
          )}
        </div>
      </div>

      <style>{`
        /* Flex column rather than a calc() on the viewport height: the banner is free
           to wrap to any height without pushing the grid past the bottom edge. */
        .fleet-shell {
          padding-top: 68px;
          height: 100vh;
          height: 100dvh;
          display: flex;
          flex-direction: column;
          overflow: hidden;
          background: #f4ede1;
        }
        .fleet-banner {
          flex: none;
          display: flex;
          align-items: center;
          gap: 24px;
          padding: 18px 40px;
          background: linear-gradient(90deg, rgba(193,154,82,0.22) 0%, rgba(193,154,82,0.08) 60%, transparent 100%);
          border-bottom: 1px solid rgba(193,154,82,0.3);
        }
        .fleet-grid {
          flex: 1;
          min-height: 0;
          display: grid;
          grid-template-columns: 420px 1fr;
        }
        .fleet-list {
          overflow-y: auto;
          background: #efe7d8;
          display: flex;
          flex-direction: column;
          min-width: 0;
          min-height: 0;
        }
        .fleet-map {
          position: relative;
          min-width: 0;
          min-height: 0;
          background: #f4ede1;
        }
        .fleet-chips { display: flex; gap: 2px; flex-wrap: wrap; }
        .fleet-hint {
          position: absolute;
          bottom: 20px;
          left: 50%;
          transform: translateX(-50%);
          font-size: 10px;
          color: rgba(193,154,82,0.7);
          letter-spacing: 0.15em;
          text-transform: uppercase;
          pointer-events: none;
          white-space: nowrap;
        }

        @media (max-width: 768px) {
          /* Reclaim the banner's vertical budget — on a phone it costs a fifth of the
             screen and the same text is on the page above the fold anyway. */
          .fleet-banner { display: none; }
          .fleet-grid {
            grid-template-columns: 1fr;
            grid-template-rows: 42dvh 1fr;
          }
          .fleet-map  { grid-row: 1; }
          .fleet-list { grid-row: 2; }
          /* 15 chips wrapping would eat most of the screen; scroll them instead. */
          .fleet-chips {
            flex-wrap: nowrap;
            overflow-x: auto;
            scrollbar-width: none;
            padding-bottom: 2px;
          }
          .fleet-chips::-webkit-scrollbar { display: none; }
          .fleet-hint { bottom: 10px; }
        }
      `}</style>
    </div>
  )
}
