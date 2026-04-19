import { useState, useEffect, useRef } from 'react'
import { SHIPS } from '../data/content.js'

function FleetGlobe({ onShipClick, filter, selectedShip }) {
  const containerRef = useRef(null)
  const globeRef = useRef(null)

  const getFiltered = (f) => SHIPS.filter(s => {
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
        .globeImageUrl('https://unpkg.com/three-globe/example/img/earth-dark.jpg')
        .backgroundColor('rgba(0,0,0,0)')
        .showAtmosphere(true)
        .atmosphereColor('#1a3a5c')
        .atmosphereAltitude(0.15)
        .pointsData(SHIPS)
        .pointLat('lat').pointLng('lng')
        .pointColor(d => getFiltered({ type: 'all', region: 'all' }).find(f => f.id === d.id) ? '#c19a52' : 'rgba(193,154,82,0.2)')
        .pointRadius(0.22)
        .pointAltitude(0.005)
        .pointResolution(8)
        .pointLabel(d => `<div style="background:rgba(15,34,56,0.95);border:1px solid rgba(193,154,82,0.5);padding:10px 14px;border-radius:3px;font-family:sans-serif;min-width:150px"><strong style="color:#f4ede1;font-size:14px">${d.name}</strong><br><span style="color:#c19a52;font-size:11px">${d.type}</span><br><span style="color:rgba(244,237,225,0.6);font-size:12px">${d.port}</span></div>`)
        .onPointClick(onShipClick)

      fetch('https://raw.githubusercontent.com/vasturiano/globe.gl/master/example/datasets/ne_110m_admin_0_countries.geojson')
        .then(r => r.json())
        .then(countries => {
          if (!globe) return
          globe.polygonsData(countries.features)
               .polygonCapColor(() => 'rgba(15,34,56,0)')
               .polygonSideColor(() => 'transparent')
               .polygonStrokeColor(() => 'rgba(193,154,82,0.35)')
               .polygonAltitude(0.002)
        })
        .catch(() => {})

      globe.controls().autoRotate = true
      globe.controls().autoRotateSpeed = 0.18
      globe.controls().enableZoom = false
      globe.controls().enablePan = false
      globe.pointOfView({ lat: 52.5, lng: 5.0, altitude: 1.8 }, 0)
    }

    const ro = new ResizeObserver(entries => {
      const { width, height } = entries[0].contentRect
      if (!globe && width > 0 && height > 0) initGlobe(width, height)
      else if (globe) globe.width(width).height(height)
    })
    ro.observe(containerRef.current)

    return () => {
      ro.disconnect()
      try { globe?._destructor?.() } catch(e) {}
    }
  }, [])

  useEffect(() => {
    if (!globeRef.current) return
    const filtered = getFiltered(filter)
    globeRef.current
      .pointColor(d => filtered.find(f => f.id === d.id) ? '#c19a52' : 'rgba(193,154,82,0.15)')
      .pointRadius(d => filtered.find(f => f.id === d.id) ? 0.22 : 0.12)
  }, [filter])

  useEffect(() => {
    if (!globeRef.current) return
    if (selectedShip) {
      globeRef.current.controls().autoRotate = false
      globeRef.current.pointOfView({ lat: selectedShip.lat, lng: selectedShip.lng, altitude: 1.0 }, 1800)
    } else {
      globeRef.current.controls().autoRotate = true
      globeRef.current.pointOfView({ lat: 52.5, lng: 5.0, altitude: 1.8 }, 1500)
    }
  }, [selectedShip])

  return <div ref={containerRef} style={{ width: '100%', height: '100%' }} />
}

const TYPES = ['all', 'Tjalk', 'Klipper', 'Schoener', 'Galjas', 'Botter']
const REGIONS = ['all', 'thuiswateren', 'europa', 'wereld']
const REGION_LABELS = { all: "Alle regio's", thuiswateren: 'Nederland', europa: 'Europa', wereld: 'Wereld' }

export default function FleetPage() {
  const [selected, setSelected] = useState(null)
  const [filter, setFilter] = useState({ type: 'all', region: 'all' })

  const filtered = SHIPS.filter(s => {
    if (filter.type !== 'all' && s.type !== filter.type) return false
    if (filter.region !== 'all' && s.region !== filter.region) return false
    return true
  })

  const handleSelect = (ship) => setSelected(prev => prev?.id === ship.id ? null : ship)

  return (
    <div style={{ paddingTop: 68, height: '100vh', overflow: 'hidden', background: '#0f2238' }}>
      <div style={{ display: 'grid', gridTemplateColumns: '420px 1fr', height: 'calc(100vh - 68px)' }} className="fleet-grid">

        {/* ── Left: scrollable ship panel ── */}
        <div style={{ overflowY: 'auto', background: '#0a1a2e', display: 'flex', flexDirection: 'column' }}>

          {/* Sticky header + filters */}
          <div style={{ position: 'sticky', top: 0, zIndex: 10, background: '#0a1a2e', padding: '28px 24px 16px', borderBottom: '1px solid rgba(193,154,82,0.12)' }}>
            <div style={{ fontSize: 10, color: '#c19a52', letterSpacing: '0.2em', textTransform: 'uppercase', marginBottom: 6 }}>De Bruine Vloot</div>
            <div style={{ fontFamily: "'Playfair Display', serif", fontSize: 22, color: '#f4ede1', fontWeight: 400, marginBottom: 16 }}>
              {filtered.length} <span style={{ fontSize: 14, color: 'rgba(244,237,225,0.4)', fontFamily: 'inherit', fontWeight: 400 }}>van {SHIPS.length} schepen</span>
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
                  {o === 'all' ? 'Alle types' : o}
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
                  {REGION_LABELS[o]}
                </button>
              ))}
            </div>
          </div>

          {/* Selected ship detail card */}
          {selected && (
            <div style={{ margin: '12px 16px 0', padding: '16px 20px', background: 'rgba(193,154,82,0.1)', border: '1px solid rgba(193,154,82,0.4)', borderRadius: 3 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 }}>
                <div>
                  <div style={{ fontSize: 10, color: '#c19a52', letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: 4 }}>{selected.type} · {selected.year}</div>
                  <div style={{ fontFamily: "'Playfair Display', serif", fontSize: 18, color: '#f4ede1' }}>{selected.name}</div>
                </div>
                <button onClick={() => setSelected(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(244,237,225,0.4)', fontSize: 16, padding: 0, lineHeight: 1 }}>✕</button>
              </div>
              <div style={{ display: 'flex', gap: 20, fontSize: 12, color: 'rgba(244,237,225,0.55)' }}>
                {[['Haven', selected.port], ['Snelheid', `${selected.speed} kn`], ['Passagiers', selected.passengers]].map(([k, v]) => (
                  <div key={k}>
                    <div style={{ fontSize: 10, color: 'rgba(244,237,225,0.35)', marginBottom: 2 }}>{k}</div>
                    <div style={{ color: '#f4ede1' }}>{v}</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Ship list */}
          <div style={{ padding: '12px 16px 24px', display: 'flex', flexDirection: 'column', gap: 2, flex: 1 }}>
            {filtered.map(ship => (
              <div
                key={ship.id}
                onClick={() => handleSelect(ship)}
                style={{
                  background: selected?.id === ship.id ? 'rgba(193,154,82,0.12)' : 'rgba(15,34,56,0.5)',
                  border: `1px solid ${selected?.id === ship.id ? 'rgba(193,154,82,0.4)' : 'rgba(255,255,255,0.04)'}`,
                  padding: '14px 18px', cursor: 'pointer', transition: 'all 0.2s',
                }}
                onMouseEnter={e => { if (selected?.id !== ship.id) e.currentTarget.style.background = 'rgba(193,154,82,0.07)' }}
                onMouseLeave={e => { if (selected?.id !== ship.id) e.currentTarget.style.background = 'rgba(15,34,56,0.5)' }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <div style={{ fontSize: 10, color: '#c19a52', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 3 }}>{ship.type} · {ship.year}</div>
                    <div style={{ fontFamily: "'Playfair Display', serif", fontSize: 15, color: '#f4ede1' }}>{ship.name}</div>
                  </div>
                  <div style={{ width: 7, height: 7, borderRadius: '50%', background: '#c19a52', boxShadow: '0 0 5px rgba(193,154,82,0.6)', flexShrink: 0, animation: 'pulse 2.5s ease-in-out infinite' }} />
                </div>
                <div style={{ marginTop: 6, fontSize: 11, color: 'rgba(244,237,225,0.38)', display: 'flex', gap: 14 }}>
                  <span>📍 {ship.port}</span>
                  <span>⚡ {ship.speed} kn</span>
                  <span>👥 {ship.passengers}</span>
                </div>
              </div>
            ))}
            {filtered.length === 0 && (
              <div style={{ textAlign: 'center', padding: '40px 0', color: 'rgba(244,237,225,0.35)', fontSize: 14 }}>
                Geen schepen gevonden met de huidige filters.
              </div>
            )}
          </div>
        </div>

        {/* ── Right: globe ── */}
        <div style={{ background: '#0b1d30', position: 'relative' }}>
          <FleetGlobe onShipClick={handleSelect} filter={filter} selectedShip={selected} />
          {!selected && (
            <div style={{ position: 'absolute', bottom: 20, left: '50%', transform: 'translateX(-50%)', fontSize: 10, color: 'rgba(244,237,225,0.22)', letterSpacing: '0.15em', textTransform: 'uppercase', pointerEvents: 'none', whiteSpace: 'nowrap' }}>
              Klik een schip voor details
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
