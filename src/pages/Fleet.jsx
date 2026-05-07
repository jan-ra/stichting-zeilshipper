import { useState, useEffect, useRef } from 'react'
import { SHIPS } from '../data/content.js'
import { useLanguage } from '../context/LanguageContext.jsx'

const EASTER_EGGS = [
  { id: 'bbz', name: 'BBZ', type: 'Organisatie', year: 1995, port: 'Amsterdam', address: 'Aambeeldstraat 20, Amsterdam', region: 'thuiswateren', lat: 52.399, lng: 4.895, isEasterEgg: true },
  { id: 'ezs', name: 'Enkhuizer Zeevaartschool', type: 'Zeevaartschool', year: 1875, port: 'Enkhuizen', address: 'Kuipersdijk 15, Enkhuizen', region: 'thuiswateren', lat: 52.702, lng: 5.287, isEasterEgg: true },
]

const ALL_ITEMS = [...SHIPS, ...EASTER_EGGS]

const TYPES = ['all', 'Tjalk', 'Klipper', 'Schoener', 'Galjas', 'Botter', 'Topzeilschoener', 'Volschip', 'Bark', 'Barkentijn', 'Schoenerbrik', 'Aak', 'Klipperaak', 'Stevenaak', 'Brig', 'easter-egg']
const REGIONS = ['all', 'thuiswateren', 'europa', 'wereld']

function FleetGlobe({ onShipClick, filter, selectedShip, userInteracted }) {
  const containerRef = useRef(null)
  const globeRef = useRef(null)
  const filterRef = useRef(filter)
  const updatePointsRef = useRef(null)
  const suppressRingsRef = useRef(null)

  const getFiltered = (f) => ALL_ITEMS.filter(s => {
    if (f.type === 'easter-egg') return s.isEasterEgg
    if (s.isEasterEgg) return f.type === 'all'
    if (f.type !== 'all' && s.type !== f.type) return false
    if (f.region !== 'all' && s.region !== f.region) return false
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
        .atmosphereColor('#1a3a5c')
        .atmosphereAltitude(0.15)
        .pointsData(ALL_ITEMS)
        .pointLat('lat').pointLng('lng')
        .pointColor(() => '#c19a52')
        .pointRadius(0.35)
        .pointAltitude(0.001)
        .pointResolution(8)
        .ringsData(ALL_ITEMS)
        .ringLat('lat').ringLng('lng')
        .ringColor(() => t => `rgba(193,154,82,${Math.pow(1 - t, 1.5) * 0.9})`)
        .ringMaxRadius(4)
        .ringPropagationSpeed(1.5)
        .ringRepeatPeriod(3000)
        .htmlElementsData(ALL_ITEMS)
        .htmlLat('lat').htmlLng('lng')
        .htmlAltitude(0.001)
        .htmlElement(d => {
          const tip = document.createElement('div')
          tip.className = '_ship-tip'
          tip.style.cssText = 'position:fixed;pointer-events:none;display:none;z-index:9999;background:rgba(15,34,56,0.95);border:1px solid rgba(193,154,82,0.5);padding:10px 14px;border-radius:3px;font-family:sans-serif;min-width:150px;'
          tip.innerHTML = `<strong style="color:#f4ede1;font-size:14px">${d.name}</strong><br><span style="color:#c19a52;font-size:11px">${d.type}</span><br><span style="color:rgba(244,237,225,0.6);font-size:12px">${d.port}</span>`
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
          .ringColor(d => filteredIds.has(d.id)
            ? t => `rgba(193,154,82,${Math.pow(1 - t, 1.5) * 0.9})`
            : () => 'rgba(0,0,0,0)')
          .ringMaxRadius(4 * scale)
      }
      updatePointsRef.current = updatePoints

      let suppressTimer = null
      const suppressRings = () => {
        globe.ringsData([])
        clearTimeout(suppressTimer)
        suppressTimer = setTimeout(() => { globe.ringsData(ALL_ITEMS); updatePoints() }, 400)
      }
      suppressRingsRef.current = suppressRings

      let lastAlt = REF_ALT
      globe.controls().addEventListener('change', () => {
        const alt = globe.pointOfView().altitude
        if (Math.abs(alt - lastAlt) > 0.001) { lastAlt = alt; updatePoints(); suppressRings() }
      })

      globe.controls().autoRotate = true
      globe.controls().autoRotateSpeed = 0.18
      globe.controls().enableZoom = true
      globe.controls().enablePan = false
      globe.controls().minDistance = 120
      globe.controls().maxDistance = 380
      globe.controls().addEventListener('start', () => { globe.controls().autoRotate = false }, { once: true })
      globe.pointOfView({ lat: 52.5, lng: 5.0, altitude: 1.8 }, 0)
    }

    const ro = new ResizeObserver(entries => {
      const { width, height } = entries[0].contentRect
      if (!globe && width > 0 && height > 0) initGlobe(width, height)
      else if (globe) { globe.width(width).height(height); suppressRingsRef.current?.() }
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
    globeRef.current.controls().autoRotate = false
  }, [userInteracted])

  useEffect(() => {
    if (!globeRef.current) return
    if (selectedShip) {
      globeRef.current.pointOfView({ lat: selectedShip.lat, lng: selectedShip.lng, altitude: 1.0 }, 1800)
    } else {
      globeRef.current.pointOfView({ lat: 52.5, lng: 5.0, altitude: 1.8 }, 1500)
    }
  }, [selectedShip])

  return <div ref={containerRef} style={{ width: '100%', height: '100%' }} />
}

export default function FleetPage() {
  const [selected, setSelected] = useState(null)
  const [filter, setFilter] = useState({ type: 'all', region: 'all' })
  const [userInteracted, setUserInteracted] = useState(false)
  const { t } = useLanguage()

  const regionLabels = t('fleet.regionLabels')

  const filtered = ALL_ITEMS.filter(s => {
    if (filter.type === 'easter-egg') return s.isEasterEgg
    if (s.isEasterEgg) return filter.type === 'all'
    if (filter.type !== 'all' && s.type !== filter.type) return false
    if (filter.region !== 'all' && s.region !== filter.region) return false
    return true
  })

  const shipCount = filtered.filter(s => !s.isEasterEgg).length

  const handleSelect = (item) => {
    setUserInteracted(true)
    setSelected(prev => prev?.id === item.id ? null : item)
  }

  return (
    <div style={{ paddingTop: 68, height: '100vh', overflow: 'hidden', background: '#0f2238' }}>
      <div style={{ display: 'grid', gridTemplateColumns: '420px 1fr', height: 'calc(100vh - 68px)' }} className="fleet-grid">

        {/* ── Left: scrollable ship panel ── */}
        <div style={{ overflowY: 'auto', background: '#0a1a2e', display: 'flex', flexDirection: 'column' }}>

          {/* Sticky header + filters */}
          <div style={{ position: 'sticky', top: 0, zIndex: 10, background: '#0a1a2e', padding: '28px 24px 16px', borderBottom: '1px solid rgba(193,154,82,0.12)' }}>
            <div style={{ fontSize: 10, color: '#c19a52', letterSpacing: '0.2em', textTransform: 'uppercase', marginBottom: 6 }}>{t('fleet.badge')}</div>
            <div style={{ fontFamily: "'Playfair Display', serif", fontSize: 22, color: '#f4ede1', fontWeight: 400, marginBottom: 16 }}>
              {shipCount} <span style={{ fontSize: 14, color: 'rgba(244,237,225,0.4)', fontFamily: 'inherit', fontWeight: 400 }}>{t('fleet.of')} {SHIPS.length} {t('fleet.ships')}</span>
            </div>
            <div style={{ display: 'flex', gap: 2, flexWrap: 'wrap', marginBottom: 6 }}>
              {TYPES.map(o => (
                <button key={o} onClick={() => setFilter(f => ({ ...f, type: o }))} style={{
                  background: filter.type === o ? '#c19a52' : 'rgba(15,34,56,0.7)',
                  border: 'none', cursor: 'pointer',
                  fontSize: 10, fontWeight: 500, letterSpacing: '0.08em', textTransform: 'uppercase',
                  color: filter.type === o ? '#0f2238' : 'rgba(244,237,225,0.5)',
                  padding: '5px 10px', borderRadius: 2, transition: 'all 0.2s', whiteSpace: 'nowrap',
                }}>
                  {o === 'all' ? t('fleet.allTypes') : o === 'easter-egg' ? '🥚 Easter Eggs' : o}
                </button>
              ))}
            </div>
            <div style={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
              {REGIONS.map(o => (
                <button key={o} onClick={() => setFilter(f => ({ ...f, region: o }))} style={{
                  background: filter.region === o ? '#c19a52' : 'rgba(15,34,56,0.7)',
                  border: 'none', cursor: 'pointer',
                  fontSize: 10, fontWeight: 500, letterSpacing: '0.08em', textTransform: 'uppercase',
                  color: filter.region === o ? '#0f2238' : 'rgba(244,237,225,0.5)',
                  padding: '5px 10px', borderRadius: 2, transition: 'all 0.2s', whiteSpace: 'nowrap',
                }}>
                  {regionLabels[o]}
                </button>
              ))}
            </div>
          </div>

          {/* Selected detail card */}
          {selected && (
            <div style={{ margin: '12px 16px 0', padding: '16px 20px', background: 'rgba(193,154,82,0.1)', border: '1px solid rgba(193,154,82,0.4)', borderRadius: 3 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 }}>
                <div>
                  <div style={{ fontSize: 10, color: '#c19a52', letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: 4 }}>{selected.type} · {selected.year}</div>
                  <div style={{ fontFamily: "'Playfair Display', serif", fontSize: 18, color: '#f4ede1' }}>{selected.name}</div>
                </div>
                <button onClick={() => setSelected(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(244,237,225,0.4)', fontSize: 16, padding: 0, lineHeight: 1 }}>✕</button>
              </div>
              {selected.isEasterEgg ? (
                <div style={{ fontSize: 13, color: 'rgba(244,237,225,0.55)', lineHeight: 1.6 }}>
                  📍 {selected.address}
                </div>
              ) : (
                <div style={{ display: 'flex', gap: 20, fontSize: 12, color: 'rgba(244,237,225,0.55)' }}>
                  {[
                    [t('fleet.port'), selected.port],
                    [t('fleet.speed'), `${selected.speed} kn`],
                    [t('fleet.passengers'), selected.passengers],
                  ].map(([k, v]) => (
                    <div key={k}>
                      <div style={{ fontSize: 10, color: 'rgba(244,237,225,0.35)', marginBottom: 2 }}>{k}</div>
                      <div style={{ color: '#f4ede1' }}>{v}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* List */}
          <div style={{ padding: '12px 16px 24px', display: 'flex', flexDirection: 'column', gap: 2, flex: 1 }}>
            {filtered.map(item => (
              <div
                key={item.id}
                onClick={() => handleSelect(item)}
                style={{
                  background: selected?.id === item.id ? 'rgba(193,154,82,0.12)' : 'rgba(15,34,56,0.5)',
                  border: `1px solid ${selected?.id === item.id ? 'rgba(193,154,82,0.4)' : 'rgba(255,255,255,0.04)'}`,
                  padding: '14px 18px', cursor: 'pointer', transition: 'all 0.2s',
                }}
                onMouseEnter={e => { if (selected?.id !== item.id) e.currentTarget.style.background = 'rgba(193,154,82,0.07)' }}
                onMouseLeave={e => { if (selected?.id !== item.id) e.currentTarget.style.background = 'rgba(15,34,56,0.5)' }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <div style={{ fontSize: 10, color: '#c19a52', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 3 }}>{item.type} · {item.year}</div>
                    <div style={{ fontFamily: "'Playfair Display', serif", fontSize: 15, color: '#f4ede1' }}>{item.name}</div>
                  </div>
                  <div style={{ width: 7, height: 7, borderRadius: '50%', background: '#c19a52', boxShadow: '0 0 5px rgba(193,154,82,0.6)', flexShrink: 0, animation: 'pulse 2.5s ease-in-out infinite' }} />
                </div>
                <div style={{ marginTop: 6, fontSize: 11, color: 'rgba(244,237,225,0.38)', display: 'flex', gap: 14 }}>
                  {item.isEasterEgg ? (
                    <span>📍 {item.address}</span>
                  ) : (
                    <>
                      <span>📍 {item.port}</span>
                      <span>⚡ {item.speed} kn</span>
                      <span>👥 {item.passengers}</span>
                    </>
                  )}
                </div>
              </div>
            ))}
            {filtered.length === 0 && (
              <div style={{ textAlign: 'center', padding: '40px 0', color: 'rgba(244,237,225,0.35)', fontSize: 14 }}>
                {t('fleet.noShips')}
              </div>
            )}
          </div>
        </div>

        {/* ── Right: globe ── */}
        <div style={{ background: '#0b1d30', position: 'relative' }}>
          <FleetGlobe onShipClick={handleSelect} filter={filter} selectedShip={selected} userInteracted={userInteracted} />
          {!selected && (
            <div style={{ position: 'absolute', bottom: 20, left: '50%', transform: 'translateX(-50%)', fontSize: 10, color: 'rgba(244,237,225,0.22)', letterSpacing: '0.15em', textTransform: 'uppercase', pointerEvents: 'none', whiteSpace: 'nowrap' }}>
              {t('fleet.clickHint')}
            </div>
          )}
        </div>
      </div>

      <style>{`
        @keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.4; } }
        @media (max-width: 768px) {
          .fleet-grid { grid-template-columns: 1fr !important; grid-template-rows: 1fr 1fr; }
        }
      `}</style>
    </div>
  )
}
