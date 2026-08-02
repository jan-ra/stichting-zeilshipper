import { useState, useEffect, useRef } from 'react'
import { STYLE_URL, loadMapLibre } from '../components/globe/useMapEngine.js'
import { HARBOURS, INFO_BOARDS_PAGE } from '../data/content.js'
import 'maplibre-gl/dist/maplibre-gl.css'
import { useLanguage } from '../context/LanguageContext.jsx'

const STATUS_COLORS = {
  afgerond: '#4a9e6a',
  ingediend: '#c19a52',
  kandidaat: 'rgba(193,154,82,0.4)',
}

export default function InformatiebPage() {
  const mapRef = useRef(null)
  const mapObjRef = useRef(null)
  const markersRef = useRef([])
  const glRef = useRef(null)   // the lazily imported maplibre-gl namespace
  const [selected, setSelected] = useState(null)
  const [filter, setFilter] = useState('all')
  const { t, tc } = useLanguage()
  const STATUS_LABELS = t('infoBorden.statusLabels')

  const addMarkers = (map, filterVal) => {
    markersRef.current.forEach(m => m.remove())
    markersRef.current = []
    const data = filterVal === 'all' ? HARBOURS : HARBOURS.filter(h => h.status === filterVal)
    data.forEach(h => {
      const color = STATUS_COLORS[h.status]
      const el = document.createElement('div')
      el.style.cssText = `width:14px;height:14px;border-radius:50%;background:${color};border:2px solid rgba(244,237,225,0.7);box-shadow:0 0 8px ${color};cursor:pointer;`
      el.addEventListener('click', () => setSelected(h))
      const marker = new glRef.current.Marker({ element: el }).setLngLat([h.lng, h.lat]).addTo(map)
      markersRef.current.push(marker)
    })
  }

  // The filter can change before the lazy import below resolves, so the mount reads it
  // through a ref rather than trusting the value it started with.
  const filterRef = useRef(filter)
  filterRef.current = filter

  // MapLibre is imported lazily, the same way the fleet globe does it, so visitors who
  // never open a map page do not download it.
  useEffect(() => {
    if (!mapRef.current || mapObjRef.current) return
    let cancelled = false

    const mount = async () => {
      const maplibregl = await loadMapLibre()
      if (cancelled || !mapRef.current) return
      glRef.current = maplibregl

      // Same library, style and tile source as the fleet globe — see useMapEngine.js.
      // Labels stay on here: this map is about named harbours. It also stays flat, since
      // the whole thing fits inside the Netherlands.
      const map = new maplibregl.Map({
        container: mapRef.current,
        style: STYLE_URL,
        center: [5.3, 52.5],
        zoom: 7,
        minZoom: 7,
        maxZoom: 18,
        attributionControl: false,
        dragRotate: false,
        pitchWithRotate: false,
        touchPitch: false,
      })
      map.addControl(new maplibregl.NavigationControl({ showCompass: false }), 'top-left')
      map.addControl(new maplibregl.AttributionControl({ compact: true }))
      mapObjRef.current = map
      addMarkers(map, filterRef.current)
    }

    mount()

    return () => {
      cancelled = true
      mapObjRef.current?.remove()
      mapObjRef.current = null
    }
  }, [])

  useEffect(() => {
    if (!mapObjRef.current) return
    addMarkers(mapObjRef.current, filter)
  }, [filter])

  const counts = {
    all: HARBOURS.length,
    afgerond: HARBOURS.filter(h => h.status === 'afgerond').length,
    ingediend: HARBOURS.filter(h => h.status === 'ingediend').length,
    kandidaat: HARBOURS.filter(h => h.status === 'kandidaat').length,
  }

  const displayedList = filter === 'all' ? HARBOURS : HARBOURS.filter(h => h.status === filter)

  return (
    <div style={{ paddingTop: 68, background: '#0f2238', minHeight: '100vh' }}>
      {/* Header */}
      <div style={{ padding: '48px 2rem 32px', maxWidth: 1280, margin: '0 auto' }}>
        <div style={{ fontSize: 11, color: '#c19a52', letterSpacing: '0.2em', textTransform: 'uppercase', marginBottom: 12 }}>{t('infoBorden.badge')}</div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: '2rem', alignItems: 'flex-end' }} className="info-header">
          <div>
            <h1 style={{ fontFamily: "'Playfair Display', serif", fontSize: 'clamp(26px, 4vw, 44px)', color: '#f4ede1', fontWeight: 400, marginBottom: 12 }}>
              {tc(INFO_BOARDS_PAGE, 'title')}
            </h1>
            <p style={{ fontSize: 15, color: 'rgba(244,237,225,0.55)', lineHeight: 1.75, maxWidth: 560 }}>
              {tc(INFO_BOARDS_PAGE, 'description')}
            </p>
          </div>
          <div style={{ display: 'flex', gap: 20 }}>
            {['afgerond', 'ingediend', 'kandidaat'].map(s => (
              <div key={s} style={{ textAlign: 'center' }}>
                <div style={{ fontFamily: "'Playfair Display', serif", fontSize: 28, color: STATUS_COLORS[s] }}>{counts[s]}</div>
                <div style={{ fontSize: 10, color: 'rgba(244,237,225,0.4)', letterSpacing: '0.1em', textTransform: 'uppercase', marginTop: 2 }}>{STATUS_LABELS[s]}</div>
              </div>
            ))}
          </div>
        </div>

        <div style={{ display: 'flex', gap: 2, marginTop: 28, flexWrap: 'wrap' }}>
          {['all', 'afgerond', 'ingediend', 'kandidaat'].map(f => (
            <button key={f} onClick={() => setFilter(f)} style={{
              background: filter === f ? (STATUS_COLORS[f] || '#c19a52') : 'rgba(255,255,255,0.06)',
              border: 'none', cursor: 'pointer',
              fontSize: 11, fontWeight: 500, letterSpacing: '0.1em', textTransform: 'uppercase',
              color: filter === f ? '#0f2238' : 'rgba(244,237,225,0.5)',
              padding: '8px 18px', borderRadius: 2, transition: 'all 0.2s',
            }}>
              {f === 'all' ? `${t('infoBorden.allLabel')} (${counts.all})` : `${STATUS_LABELS[f]} (${counts[f]})`}
            </button>
          ))}
        </div>
      </div>

      {/* Map + sidebar */}
      <div style={{ display: 'grid', gridTemplateColumns: selected ? '1fr 340px' : '1fr', transition: 'grid-template-columns 0.35s ease', height: '72vh', position: 'relative' }}>
        <div style={{ position: 'relative' }}>
          <div ref={mapRef} style={{ width: '100%', height: '100%' }} />
          <div style={{
            position: 'absolute', bottom: 20, left: 20, zIndex: 1000,
            background: 'rgba(10,22,40,0.92)', border: '1px solid rgba(193,154,82,0.2)',
            padding: '14px 18px', borderRadius: 3, backdropFilter: 'blur(8px)',
          }}>
            <div style={{ fontSize: 10, color: '#c19a52', letterSpacing: '0.15em', textTransform: 'uppercase', marginBottom: 10 }}>{t('infoBorden.legend')}</div>
            {Object.entries(STATUS_LABELS).map(([k, v]) => (
              <div key={k} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                <div style={{ width: 10, height: 10, borderRadius: '50%', background: STATUS_COLORS[k] }} />
                <span style={{ fontSize: 12, color: 'rgba(244,237,225,0.65)' }}>{v}</span>
              </div>
            ))}
          </div>
        </div>

        {selected && (
          <div style={{
            background: 'rgba(10,22,40,0.98)', borderLeft: '1px solid rgba(193,154,82,0.25)',
            padding: '28px 24px', overflowY: 'auto',
            display: 'flex', flexDirection: 'column', gap: 16,
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                  <div style={{ width: 8, height: 8, borderRadius: '50%', background: STATUS_COLORS[selected.status] }} />
                  <span style={{ fontSize: 11, color: STATUS_COLORS[selected.status], letterSpacing: '0.1em', textTransform: 'uppercase' }}>
                    {STATUS_LABELS[selected.status]}
                  </span>
                </div>
                <h3 style={{ fontFamily: "'Playfair Display', serif", fontSize: 24, color: '#f4ede1', lineHeight: 1.2 }}>{selected.name}</h3>
              </div>
              <button onClick={() => setSelected(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(244,237,225,0.4)', fontSize: 18, paddingTop: 4 }}>✕</button>
            </div>

            <div style={{ height: 1, background: 'rgba(193,154,82,0.2)' }} />

            <div>
              <div style={{ fontSize: 11, color: '#c19a52', letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: 8 }}>{t('infoBorden.statusNote')}</div>
              <p style={{ fontSize: 14, color: 'rgba(244,237,225,0.65)', lineHeight: 1.75 }}>{tc(selected, 'notes')}</p>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              {[
                [t('infoBorden.date'), selected.date],
                [t('infoBorden.shipsNearby'), selected.ships],
              ].map(([k, v]) => (
                <div key={k} style={{ background: 'rgba(15,34,56,0.8)', padding: '12px 14px', borderRadius: 2 }}>
                  <div style={{ fontSize: 10, color: 'rgba(244,237,225,0.35)', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 4 }}>{k}</div>
                  <div style={{ fontSize: 16, color: '#f4ede1' }}>{v}</div>
                </div>
              ))}
            </div>

            <div style={{ height: 1, background: 'rgba(193,154,82,0.2)' }} />
            <div style={{ fontSize: 12, color: 'rgba(244,237,225,0.3)', lineHeight: 1.7 }}>
              {t('infoBorden.coordLabel')}: {selected.lat.toFixed(4)}° N, {selected.lng.toFixed(4)}° {t('infoBorden.eastLabel')}
            </div>

            {selected.status === 'kandidaat' && (
              <button style={{ background: '#c19a52', border: 'none', cursor: 'pointer', fontSize: 12, fontWeight: 600, letterSpacing: '0.08em', color: '#0f2238', padding: '11px', borderRadius: 2, textTransform: 'uppercase' }}>
                {t('infoBorden.supportBoard')}
              </button>
            )}
          </div>
        )}
      </div>

      {/* Harbour list */}
      <div style={{ background: '#0a1a2e', padding: '48px 2rem' }}>
        <div style={{ maxWidth: 1280, margin: '0 auto' }}>
          <div style={{ fontSize: 11, color: '#c19a52', letterSpacing: '0.2em', textTransform: 'uppercase', marginBottom: 24 }}>{t('infoBorden.allLocations')}</div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 2 }}>
            {displayedList.map(h => (
              <div key={h.id} onClick={() => setSelected(h)} style={{
                background: selected?.id === h.id ? 'rgba(193,154,82,0.1)' : 'rgba(15,34,56,0.5)',
                border: `1px solid ${selected?.id === h.id ? 'rgba(193,154,82,0.3)' : 'rgba(255,255,255,0.04)'}`,
                padding: '16px 20px', cursor: 'pointer', transition: 'all 0.2s',
              }}
              onMouseEnter={e => e.currentTarget.style.background = 'rgba(193,154,82,0.07)'}
              onMouseLeave={e => e.currentTarget.style.background = selected?.id === h.id ? 'rgba(193,154,82,0.1)' : 'rgba(15,34,56,0.5)'}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: 15, color: '#f4ede1' }}>{h.name}</span>
                  <div style={{ width: 8, height: 8, borderRadius: '50%', background: STATUS_COLORS[h.status] }} />
                </div>
                <div style={{ fontSize: 12, color: 'rgba(244,237,225,0.35)', marginTop: 4 }}>{h.date} · {h.ships} {t('infoBorden.ships')}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
