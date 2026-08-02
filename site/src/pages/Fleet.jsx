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

// globe.gl uses a globe radius of 100, so altitude 1 is one Earth radius (6371 km) up
// and camera distance = (1 + altitude) * 100.
//
// The old floor of 0.12 sat 764 km up at ~890 m/px, which is why every harbour stayed
// a single lump no matter how far you zoomed. 0.0004 is ~2.5 km up at ~3 m/px, where
// ships more than about 90 m apart resolve into separate markers; anything closer than
// that shares a berth and bottoms out into the picker list instead.
const MIN_ALTITUDE = 0.0004
const MAX_ALTITUDE = 2.8
// Selecting a ship frames its harbour rather than slamming to the zoom floor — at
// ~25 km up you can still see where in the country you are.
const SELECT_ALTITUDE = 0.004

// Visible angular height is roughly 53 * altitude degrees — the same relationship the
// globe framing above is built on.
const VISIBLE_DEG_PER_ALTITUDE = 53
const CARD_MARGIN_PX = 20   // breathing room around the card when reserving space
const CARD_MAX_RESERVE = 0.45

// Aiming south to clear a bottom sheet must not send the camera over a pole.
const clampLat = v => (v < -85 ? -85 : v > 85 ? 85 : v)
const DEFAULT_POV = { lat: 52.5, lng: 5.0, altitude: 1.8, ms: 1500 }

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

// Camera framing that fits a set of ships. Visible angular height is roughly
// 53 * altitude degrees, so span / 30 leaves a comfortable margin around the group.
// A smaller divisor pulls the camera back further; fitRoute uses one to keep a track
// clear of the detail card, which covers the top-right of the globe pane.
function fitPov(list, divisor = 30) {
  const pts = list.filter(s => s.lat != null && s.lng != null)
  if (pts.length === 0) return DEFAULT_POV

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
  const altitude = Math.min(MAX_ALTITUDE, Math.max(MIN_ALTITUDE, span / divisor))
  return { lat, lng, altitude, ms: 1800 }
}

// Camera framing for a selected ship: the whole stored track on screen, not just where
// the ship happens to be now. Unlike a plain marker click this flight may zoom *out* —
// a week of sailing can easily be wider than the current view, and half a track off
// screen is worse than a wider shot.
//
// SELECT_ALTITUDE acts as the floor so a ship that barely moved gets a harbour-level
// view with context, rather than the camera slamming to the zoom limit on a 200 m track.
function fitRoute(ship, pane) {
  const pts = (ship.history ?? []).filter(p => p.lat != null && p.lng != null)

  if (pts.length < 2) {
    if (ship.lat == null || ship.lng == null) return DEFAULT_POV
    return { lat: ship.lat, lng: ship.lng, altitude: SELECT_ALTITUDE, zoomInOnly: true, ms: 1800 }
  }

  // Unwrap longitudes relative to the first point, so a track crossing the antimeridian
  // frames around the crossing instead of around the far side of the planet.
  const base = pts[0].lng
  const unwrapped = pts.map(p => ({ lat: p.lat, lng: p.lng - 360 * Math.round((p.lng - base) / 360) }))
  // Wider margin than a plain group fit — a track wants breathing room around it.
  const pov = fitPov(unwrapped, 18)

  let { lat, lng } = pov
  let altitude = Math.max(pov.altitude, SELECT_ALTITUDE)

  // The ship card covers part of the pane whenever something is selected, so zooming to
  // fit is not enough on its own — half the track can end up behind it. Pull back to
  // make room, then aim off-centre so the track slides into the clear part: east of it
  // when the card is the floating panel on the right, south when it is a bottom sheet.
  const reserved = Math.max(pane?.reservedX ?? 0, pane?.reservedY ?? 0)
  if (reserved > 0) {
    altitude = Math.min(MAX_ALTITUDE, altitude / (1 - reserved))
    const visibleLatDeg = VISIBLE_DEG_PER_ALTITUDE * altitude
    if (pane.reservedX > 0) {
      const visibleLngDeg = visibleLatDeg * pane.aspect
      lng += (pane.reservedX / 2) * visibleLngDeg / Math.cos((lat * Math.PI) / 180)
    } else {
      lat = clampLat(lat - (pane.reservedY / 2) * visibleLatDeg)
    }
  }

  return { lat, lng: ((lng + 540) % 360) - 180, altitude, ms: 1800 }
}

// How much of the globe pane the ship card takes out of play, plus the pane's aspect —
// both needed to frame a track around it.
//
// The card is measured rather than assumed, because it has two quite different shapes:
// a 320px panel floating over the top-right on wide screens, and a full-width bottom
// sheet below 1000px (see ShipCard.css). One reserves width, the other height, and the
// switch point is a CSS concern that JS should not be repeating.
function paneMetrics(paneEl) {
  if (!paneEl) return null
  const p = paneEl.getBoundingClientRect()
  if (p.width <= 0 || p.height <= 0) return null

  const metrics = { aspect: p.width / p.height, reservedX: 0, reservedY: 0 }

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

  const cap = v => Math.min(CARD_MAX_RESERVE, v)
  if (sheet) metrics.reservedY = cap((overlapH + CARD_MARGIN_PX) / p.height)
  else metrics.reservedX = cap((overlapW + CARD_MARGIN_PX) / p.width)

  return metrics
}

export default function FleetPage() {
  const [selectedId, setSelectedId] = useState(null)
  const [filter, setFilter] = useState({ type: 'all', region: 'all', search: '' })
  const [userInteracted, setUserInteracted] = useState(false)
  const [pov, setPov] = useState(DEFAULT_POV)
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
  const povSeq = useRef(0)
  const flyTo = useCallback(next => setPov({ ...next, seq: ++povSeq.current }), [])

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
    flyTo(fitPov(allItems.filter(s => filter.region === 'all' || s.region === filter.region)))
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
            pov={pov}
            autoRotate={!userInteracted}
            autoRotateSpeed={0.18}
            enableZoom
            minAltitude={MIN_ALTITUDE}
            maxAltitude={MAX_ALTITUDE}
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
