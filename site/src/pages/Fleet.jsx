import { useState, useEffect, useRef } from 'react'
import { SHIPS, FLEET_PAGE } from '../data/content.js'
import { useLanguage } from '../context/LanguageContext.jsx'
import { asset } from '../utils/asset.js'

const ALL_ITEMS = SHIPS

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

// globe.gl uses a globe radius of 100; camera distance = (1 + altitude) * 100.
// MIN_ALTITUDE is the closest the controls allow, so a selected ship zooms all the way in.
const MIN_ALTITUDE = 0.2
const MIN_DISTANCE = (1 + MIN_ALTITUDE) * 100

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

function FleetGlobe({ onShipClick, filter, selectedShip, userInteracted, positionLabel }) {
  const containerRef = useRef(null)
  const globeRef = useRef(null)
  const filterRef = useRef(filter)
  const updatePointsRef = useRef(null)

  const getFiltered = (f) => ALL_ITEMS.filter(s => {
    if (f.type !== 'all' && categoryOf(s.type) !== f.type) return false
    if (f.region !== 'all' && s.region !== f.region) return false
    if (!matchesSearch(s, f.search)) return false
    return true
  })

  useEffect(() => {
    if (!containerRef.current || !window.Globe) return
    let globe = null

    const initGlobe = (w, h) => {
      if (globe) return
      globe = window.Globe()(containerRef.current)
      globeRef.current = globe
      globe.width(w).height(h)

      globe
        .globeTileEngineUrl((x, y, l) => `https://a.basemaps.cartocdn.com/dark_nolabels/${l}/${x}/${y}.png`)
        .backgroundColor('rgba(0,0,0,0)')
        .showAtmosphere(true)
        .atmosphereColor('#3a7abd')
        .atmosphereAltitude(0.22)
        .pointsData(ALL_ITEMS)
        .pointLat('lat').pointLng('lng')
        .pointColor(() => '#c19a52')
        .pointRadius(0.35)
        .pointAltitude(0.001)
        .pointResolution(8)
        .htmlElementsData(ALL_ITEMS)
        .htmlLat('lat').htmlLng('lng')
        .htmlAltitude(0.001)
        .htmlElement(d => {
          const tip = document.createElement('div')
          tip.className = '_ship-tip'
          tip.style.cssText = 'position:fixed;pointer-events:none;display:none;z-index:9999;background:rgba(15,34,56,0.95);border:1px solid rgba(193,154,82,0.5);padding:10px 14px;border-radius:3px;font-family:sans-serif;min-width:150px;'
          {
            let html = d.image ? `<img src="${asset(d.image)}" style="width:160px;height:100px;object-fit:cover;display:block;margin-bottom:8px;border-radius:2px;" />` : ''
            html += `<strong style="color:#f4ede1;font-size:14px">${d.name}</strong>`
            html += `<br><span style="color:#c19a52;font-size:11px">${d.type}</span>`
            html += `<br><span style="color:rgba(244,237,225,0.6);font-size:12px">${d.port}</span>`
            if (d.positionUpdatedAt) html += `<br><span style="color:rgba(244,237,225,0.55);font-size:11px">${positionLabel}: ${new Date(d.positionUpdatedAt).toLocaleString()}</span>`
            tip.innerHTML = html
          }
          document.body.appendChild(tip)

          const el = document.createElement('div')
          el.style.cssText = 'width:52px;height:52px;border-radius:50%;cursor:pointer;transform:translate(-50%,-50%);background:rgba(0,0,0,0.001);pointer-events:auto;'
          el.addEventListener('mouseenter', () => { tip.style.display = 'block' })
          el.addEventListener('mousemove', e => {
            tip.style.left = (e.clientX + 16) + 'px'
            tip.style.top = (e.clientY - 10) + 'px'
          })
          el.addEventListener('mouseleave', () => { tip.style.display = 'none' })
          el.addEventListener('click', () => onShipClick(d))
          el._tip = tip
          return el
        })

      const REF_ALT = 1.8
      const updatePoints = () => {
        const alt = globe.pointOfView().altitude
        const scale = alt / REF_ALT
        const filteredIds = new Set(getFiltered(filterRef.current).map(s => s.id))
        globe
          .pointColor(d => filteredIds.has(d.id) ? '#c19a52' : 'rgba(193,154,82,0.15)')
          .pointRadius(d => (filteredIds.has(d.id) ? 0.35 : 0.18) * scale)
      }
      updatePointsRef.current = updatePoints

      let lastAlt = REF_ALT
      globe.controls().addEventListener('change', () => {
        const alt = globe.pointOfView().altitude
        if (Math.abs(alt - lastAlt) > 0.0005) { lastAlt = alt; updatePoints() }
      })

      globe.controls().autoRotate = true
      globe.controls().autoRotateSpeed = 0.18
      globe.controls().enableZoom = true
      globe.controls().enablePan = false
      globe.controls().minDistance = MIN_DISTANCE
      globe.controls().maxDistance = 380
      globe.controls().addEventListener('start', () => { globe.controls().autoRotate = false }, { once: true })
      globe.pointOfView({ lat: 52.5, lng: 5.0, altitude: 1.8 }, 0)
    }

    const ro = new ResizeObserver(entries => {
      const { width, height } = entries[0].contentRect
      if (!globe && width > 0 && height > 0) initGlobe(width, height)
      else if (globe) { globe.width(width).height(height); updatePointsRef.current?.() }
    })
    ro.observe(containerRef.current)

    return () => {
      ro.disconnect()
      document.querySelectorAll('._ship-tip').forEach(el => el.remove())
      try { globe?._destructor?.() } catch(e) {}
    }
  }, [])

  useEffect(() => {
    filterRef.current = filter
    updatePointsRef.current?.()
  }, [filter])

  useEffect(() => {
    if (!globeRef.current) return
    if (filter.region === 'thuiswateren') {
      globeRef.current.pointOfView({ lat: 52.9, lng: 5.2, altitude: 0.2 }, 1800)
    }
  }, [filter.region])

  useEffect(() => {
    if (!globeRef.current) return
    globeRef.current.controls().autoRotate = false
  }, [userInteracted])

  useEffect(() => {
    if (!globeRef.current) return
    if (selectedShip) {
      globeRef.current.pointOfView({ lat: selectedShip.lat, lng: selectedShip.lng, altitude: MIN_ALTITUDE }, 1800)
    } else {
      globeRef.current.pointOfView({ lat: 52.5, lng: 5.0, altitude: 1.8 }, 1500)
    }
  }, [selectedShip])

  return <div ref={containerRef} style={{ width: '100%', height: '100%' }} />
}

export default function FleetPage() {
  const [selected, setSelected] = useState(null)
  const [filter, setFilter] = useState({ type: 'all', region: 'all', search: '' })
  const [userInteracted, setUserInteracted] = useState(false)
  const [lightbox, setLightbox] = useState(null)
  const { t, tc } = useLanguage()

  const regionLabels = t('fleet.regionLabels')

  const filtered = ALL_ITEMS.filter(s => {
    if (filter.type !== 'all' && categoryOf(s.type) !== filter.type) return false
    if (filter.region !== 'all' && s.region !== filter.region) return false
    if (!matchesSearch(s, filter.search)) return false
    return true
  })

  const shipCount = filtered.length

  const handleSelect = (item) => {
    setUserInteracted(true)
    setSelected(prev => prev?.id === item.id ? null : item)
  }

  return (
    <div style={{ paddingTop: 68, height: '100vh', overflow: 'hidden', background: '#f4ede1' }}>

      {/* ── Crew notice banner ── */}
      <div style={{ background: 'linear-gradient(90deg, rgba(193,154,82,0.22) 0%, rgba(193,154,82,0.08) 60%, transparent 100%)', borderBottom: '1px solid rgba(193,154,82,0.3)', padding: '18px 40px', display: 'flex', alignItems: 'center', gap: 24 }}>
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

      <div style={{ display: 'grid', gridTemplateColumns: '420px 1fr', height: 'calc(100vh - 68px - 59px)' }} className="fleet-grid">

        {/* ── Left: scrollable ship panel ── */}
        <div style={{ overflowY: 'auto', background: '#efe7d8', display: 'flex', flexDirection: 'column' }}>

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
            <div style={{ display: 'flex', gap: 2, flexWrap: 'wrap', marginBottom: 6 }}>
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
            <div style={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
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
                      <div style={{ width: 7, height: 7, borderRadius: '50%', background: '#c19a52', boxShadow: '0 0 5px rgba(193,154,82,0.6)', flexShrink: 0, animation: 'pulse 2.5s ease-in-out infinite' }} />
                    </div>
                    <div style={{ marginTop: 6, fontSize: 11, color: 'rgba(15,34,56,0.5)', display: 'flex', gap: 14 }}>
                      <span>{item.port}</span>
                      <span>{item.passengers} pax</span>
                    </div>
                    {item.positionUpdatedAt && (
                      <div style={{ marginTop: 4, fontSize: 10, color: 'rgba(15,34,56,0.55)' }}>
                        {t('fleet.positionUpdated')}: {new Date(item.positionUpdatedAt).toLocaleString()}
                      </div>
                    )}
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

        {/* ── Right: globe ── */}
        <div style={{ background: '#f4ede1', position: 'relative' }}>
          <FleetGlobe onShipClick={handleSelect} filter={filter} selectedShip={selected} userInteracted={userInteracted} positionLabel={t('fleet.positionUpdated')} />

          {/* Selected detail card — overlaid top-right over the globe */}
          {selected && (
            <div style={{ position: 'absolute', top: 20, right: 20, width: 320, maxWidth: 'calc(100% - 40px)', zIndex: 20, background: 'rgba(15,34,56,0.94)', border: '1px solid rgba(193,154,82,0.5)', borderRadius: 3, overflow: 'hidden', boxShadow: '0 12px 40px rgba(8,18,34,0.45)', backdropFilter: 'blur(4px)' }}>
              {selected.image && (
                <div style={{ position: 'relative', cursor: 'zoom-in' }} onClick={() => setLightbox(asset(selected.image))}>
                  <img src={asset(selected.image)} alt={selected.name} style={{ width: '100%', height: 160, objectFit: 'cover', display: 'block' }} />
                  <div style={{ position: 'absolute', bottom: 8, right: 8, background: 'rgba(8,18,34,0.7)', borderRadius: 2, padding: '3px 7px', fontSize: 11, color: 'rgba(244,237,225,0.7)', letterSpacing: '0.06em', pointerEvents: 'none' }}>
                    ⤢
                  </div>
                </div>
              )}
              <div style={{ padding: '16px 20px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 }}>
                  <div>
                    <div style={{ fontSize: 10, color: '#c19a52', letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: 4 }}>{selected.type} · {selected.year}</div>
                    <div style={{ fontFamily: "'Playfair Display', serif", fontSize: 18, color: '#f4ede1' }}>{selected.name}</div>
                  </div>
                  <button onClick={() => setSelected(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(244,237,225,0.5)', fontSize: 16, padding: 0, lineHeight: 1 }}>✕</button>
                </div>
                <div style={{ display: 'flex', gap: 20, fontSize: 12, color: 'rgba(244,237,225,0.7)' }}>
                  {[
                    [t('fleet.port'), selected.port],
                    [t('fleet.passengers'), selected.passengers],
                  ].map(([k, v]) => (
                    <div key={k}>
                      <div style={{ fontSize: 10, color: 'rgba(244,237,225,0.45)', marginBottom: 2 }}>{k}</div>
                      <div style={{ color: '#f4ede1' }}>{v}</div>
                    </div>
                  ))}
                </div>
                {selected.positionUpdatedAt && (
                  <div style={{ marginTop: 10, fontSize: 11, color: 'rgba(244,237,225,0.55)', letterSpacing: '0.02em' }}>
                    {t('fleet.positionUpdated')}: {new Date(selected.positionUpdatedAt).toLocaleString()}
                  </div>
                )}
              </div>
            </div>
          )}

          {!selected && (
            <div style={{ position: 'absolute', bottom: 20, left: '50%', transform: 'translateX(-50%)', fontSize: 10, color: 'rgba(193,154,82,0.7)', letterSpacing: '0.15em', textTransform: 'uppercase', pointerEvents: 'none', whiteSpace: 'nowrap' }}>
              {t('fleet.clickHint')}
            </div>
          )}
        </div>
      </div>

      {lightbox && (
        <div
          onClick={() => setLightbox(null)}
          style={{
            position: 'fixed', inset: 0, zIndex: 2000,
            background: 'rgba(0,0,0,0.92)', display: 'flex',
            alignItems: 'center', justifyContent: 'center', cursor: 'zoom-out',
          }}
        >
          <img
            src={lightbox}
            alt=""
            style={{ maxWidth: '90vw', maxHeight: '90vh', objectFit: 'contain', borderRadius: 2 }}
            onClick={e => e.stopPropagation()}
          />
          <button
            onClick={() => setLightbox(null)}
            style={{
              position: 'absolute', top: 20, right: 24,
              background: 'none', border: 'none', cursor: 'pointer',
              color: 'rgba(244,237,225,0.6)', fontSize: 28, lineHeight: 1,
            }}
          >✕</button>
        </div>
      )}

      <style>{`
        @keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.4; } }
        @media (max-width: 768px) {
          .fleet-grid { grid-template-columns: 1fr !important; grid-template-rows: 1fr 1fr; }
        }
      `}</style>
    </div>
  )
}
