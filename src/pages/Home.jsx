import { useState, useEffect, useRef } from 'react'
import { SHIPS, BLOG_POSTS } from '../data/content.js'

const GLOBE_CHAPTERS = [
  { lat: 53.0, lng: 5.0, altitude: 0.6, autoRotate: false, label: 'Nederland' },
  { lat: 52.0, lng: 12.0, altitude: 2.0, autoRotate: false, label: 'Europa' },
  { lat: 20.0, lng: -5.0, altitude: 2.8, autoRotate: true, label: 'De wereld' },
  { lat: 53.18, lng: 5.40, altitude: 0.6, autoRotate: false, label: 'Nederland' },
]

const CHAPTERS_DATA = [
  { index: 0, roman: 'I', title: 'Nederland', sub: 'Nederlandse wateren', body: 'De Waddenzee, het IJsselmeer en de binnenwateren zijn de wieg van de Bruine Vloot. Hier leerden generaties schippers lezen: het tij, de wind, de bodem. Kennis die nergens anders verworven kan worden.' },
  { index: 1, roman: 'II', title: 'Europa', sub: 'European Waters', body: 'Van de Baltische Zee tot de Middellandse Zee bevaren Bruine Vloot schippers routes die al eeuwen bestaan. De kennis zit niet op kaarten — die zit in handen en geheugen.' },
  { index: 2, roman: 'III', title: 'De wereld', sub: 'Worldwide', body: 'Trans-Atlantisch. Kaap Hoorn. Antarctica. Schippers van de Bruine Vloot hebben de zwaarste wateren ter wereld bedwongen met schepen van hout en staal die soms meer dan een eeuw oud zijn.' },
  { index: 3, roman: 'IV', title: 'Terug naar de haven', sub: 'Return to Port', body: 'En dan is er de thuiskomst — in een van de tientallen historische havens verspreid over Nederland. Plekken waar informatieborden staan, waar kennisoverdracht plaatsvindt, waar de volgende schipper zijn eerste les krijgt op de kade.' },
]

const PILLARS = [
  { n: '01', title: 'De schipper als spil', body: 'De schipper van de Bruine Vloot stuurt niet alleen het schip — hij ontvangt gasten, instrueert de bemanning, draagt kennis over, onderhoudt het schip en bewaakt continu de veiligheid. Daarbij staat hij in verbinding met een compleet ecosysteem van bemanningsleden, werven en zeil- en mastenmakers, met de schipper als centrale schakel.' },
  { n: '02', title: 'Veel kennis & vaardigheden', body: 'Van traditionele navigatie en zeiltrimmen tot meteorologie, scheepsonderhoud en crisismanagement op open water. Vrijwel elke schipper begon als maat of \'deckie\' — het vak wordt geleerd van dag één, in de praktijk. Via collega\'s, experts en zeilevenementen zoals de Strontrace en de Beurtveer worden kennis en vaardigheden steeds verder verdiept.' },
  { n: '03', title: 'Kennisoverdracht', body: 'Een goede schipper investeert actief in de volgende generatie: hij legt uit, corrigeert en begeleidt. De tienduizenden passagiers die jaarlijks meevaren worden regelmatig betrokken bij het zeilen — ze hijsen zeilen, bedienen zwaarden, lopen wacht — altijd onder toezicht van de schipper. Zo groeit het begrip voor dit levende erfgoed.' },
]

// ── Globe ──────────────────────────────────────────────────────────────────────
function StickyGlobe({ chapter, onShipClick }) {
  const ref = useRef(null)
  const globeRef = useRef(null)

  useEffect(() => {
    if (!ref.current || !window.Globe) return
    let g = null

    const initGlobe = (w, h) => {
      if (g) return
      g = window.Globe()(ref.current)
      globeRef.current = g
      g.width(w).height(h)

      g
        .globeTileEngineUrl((x, y, l) => `https://a.basemaps.cartocdn.com/dark_nolabels/${l}/${x}/${y}.png`)
        .backgroundColor('rgba(0,0,0,0)')
        .showAtmosphere(true)
        .atmosphereColor('#1a3a5c')
        .atmosphereAltitude(0.15)
        .pointsData(SHIPS)
        .pointLat('lat').pointLng('lng')
        .pointColor(() => '#c19a52')
        .pointRadius(0.35)
        .pointAltitude(0.001)
        .pointResolution(8)
        .ringsData(SHIPS)
        .ringLat('lat').ringLng('lng')
        .ringColor(() => t => `rgba(193,154,82,${Math.pow(1 - t, 1.5) * 0.9})`)
        .ringMaxRadius(4)
        .ringPropagationSpeed(1.5)
        .ringRepeatPeriod(3000)
        .htmlElementsData(SHIPS)
        .htmlLat('lat').htmlLng('lng')
        .htmlAltitude(0.001)
        .htmlElement(d => {
          const tip = document.createElement('div')
          tip.className = '_ship-tip-home'
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
      g.controls().addEventListener('change', () => {
        const scale = g.pointOfView().altitude / REF_ALT
        g.pointRadius(0.35 * scale).ringMaxRadius(4 * scale)
      })

      g.controls().autoRotate = true
      g.controls().autoRotateSpeed = 0.3
      g.controls().enableZoom = false
      g.controls().enablePan = false
      g.pointOfView({ lat: 52.0, lng: 10.0, altitude: 1.8 }, 0)
    }

    const ro = new ResizeObserver(entries => {
      const { width, height } = entries[0].contentRect
      if (!g && width > 0 && height > 0) initGlobe(width, height)
      else if (g) g.width(width).height(height)
    })
    ro.observe(ref.current)

    return () => {
      ro.disconnect()
      document.querySelectorAll('._ship-tip-home').forEach(el => el.remove())
      try { g?._destructor?.() } catch(e) {}
    }
  }, [])

  useEffect(() => {
    if (!globeRef.current || chapter === null) return
    const ch = GLOBE_CHAPTERS[Math.min(chapter, GLOBE_CHAPTERS.length - 1)]
    globeRef.current.controls().autoRotate = ch.autoRotate
    globeRef.current.controls().autoRotateSpeed = ch.autoRotate ? 0.35 : 0
    globeRef.current.pointOfView({ lat: ch.lat, lng: ch.lng, altitude: ch.altitude }, 2200)
  }, [chapter])

  return <div ref={ref} style={{ width: '100%', height: '100%' }} />
}

// ── Ship panel ────────────────────────────────────────────────────────────────
function ShipPanel({ ship, onClose }) {
  if (!ship) return null
  return (
    <div style={{
      position: 'fixed', right: 0, top: 0, bottom: 0, width: 300, zIndex: 600,
      background: 'rgba(8,18,34,0.97)', borderLeft: '1px solid rgba(193,154,82,0.3)',
      padding: '80px 24px 24px', display: 'flex', flexDirection: 'column', gap: 18,
      backdropFilter: 'blur(12px)', animation: 'slideInRight 0.35s cubic-bezier(0.16,1,0.3,1)',
    }}>
      <style>{`@keyframes slideInRight { from { transform: translateX(60px); opacity: 0; } to { transform: none; opacity: 1; } }`}</style>
      <button onClick={onClose} style={{ position: 'absolute', top: 80, right: 20, background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(244,237,225,0.4)', fontSize: 20 }}>✕</button>
      <div style={{ fontSize: 11, color: '#c19a52', letterSpacing: '0.15em', textTransform: 'uppercase' }}>{ship.type} · {ship.year}</div>
      <h3 style={{ fontFamily: "'Playfair Display', serif", fontSize: 24, color: '#f4ede1', lineHeight: 1.2 }}>{ship.name}</h3>
      <div style={{ height: 1, background: 'rgba(193,154,82,0.2)' }} />
      {[['Haven', ship.port], ['Snelheid', `${ship.speed} kn`], ['Bouwjaar', ship.year], ['Passagiers', ship.passengers], ['Regio', ship.region]].map(([k,v]) => (
        <div key={k} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 14 }}>
          <span style={{ color: 'rgba(244,237,225,0.4)' }}>{k}</span>
          <span style={{ color: '#f4ede1' }}>{v}</span>
        </div>
      ))}
    </div>
  )
}

// ── Stat counter ──────────────────────────────────────────────────────────────
function StatCounter({ value, label, suffix = '', prefix = '' }) {
  const [count, setCount] = useState(0)
  const ref = useRef(null)

  useEffect(() => {
    const obs = new IntersectionObserver(([e]) => {
      if (!e.isIntersecting) return
      obs.disconnect()
      let n = 0
      const step = Math.ceil(value / 50)
      const timer = setInterval(() => {
        n = Math.min(n + step, value)
        setCount(n)
        if (n >= value) clearInterval(timer)
      }, 22)
    }, { threshold: 0.5 })
    if (ref.current) obs.observe(ref.current)
    return () => obs.disconnect()
  }, [value])

  return (
    <div ref={ref} style={{ textAlign: 'center', padding: '0 1.5rem' }}>
      <div style={{ fontFamily: "'Playfair Display', serif", fontSize: 48, fontWeight: 400, color: '#f4ede1', lineHeight: 1 }}>
        {prefix}{count.toLocaleString('nl-NL')}{suffix}
      </div>
      <div style={{ fontSize: 11, letterSpacing: '0.15em', textTransform: 'uppercase', color: '#c19a52', marginTop: 10 }}>{label}</div>
    </div>
  )
}

// ── Chapter panel (extracted to respect rules of hooks) ───────────────────────
function ChapterPanel({ ch, index, onVisible }) {
  const ref = useRef(null)

  useEffect(() => {
    const obs = new IntersectionObserver(([e]) => {
      if (e.isIntersecting) onVisible(ch.index)
    }, { threshold: 0.45 })
    if (ref.current) obs.observe(ref.current)
    return () => obs.disconnect()
  }, [ch.index, onVisible])

  return (
    <div ref={ref} style={{ minHeight: '85vh', display: 'flex', flexDirection: 'column', justifyContent: 'center', padding: '80px 64px 80px 4rem', borderTop: '2px solid rgba(193,154,82,0.25)', background: '#f4ede1' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 28 }}>
        <span style={{ fontFamily: "'Playfair Display', serif", fontSize: 13, color: '#c19a52', fontStyle: 'italic' }}>{ch.roman}</span>
        <div style={{ height: 1, width: 40, background: 'rgba(193,154,82,0.5)' }} />
        <span style={{ fontSize: 10, color: '#c19a52', letterSpacing: '0.2em', textTransform: 'uppercase' }}>Hoofdstuk {index + 1}</span>
      </div>
      <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: 'clamp(30px, 3vw, 48px)', color: '#0f2238', lineHeight: 1.1, marginBottom: 10, fontWeight: 400 }}>
        {ch.title}
      </h2>
      <div style={{ fontSize: 13, color: 'rgba(15,34,56,0.4)', fontStyle: 'italic', marginBottom: 24 }}>{ch.sub}</div>
      <p style={{ fontSize: 16, color: '#3a4f65', lineHeight: 1.9, maxWidth: 420 }}>{ch.body}</p>
      <div style={{ display: 'flex', gap: 8, marginTop: 40 }}>
        {GLOBE_CHAPTERS.map((_, di) => (
          <div key={di} style={{ width: di === index ? 24 : 6, height: 6, borderRadius: 3, background: di === index ? '#c19a52' : 'rgba(193,154,82,0.3)', transition: 'width 0.4s, background 0.4s' }} />
        ))}
      </div>
    </div>
  )
}

// ── Home page ─────────────────────────────────────────────────────────────────
export default function HomePage({ navigate }) {
  const [selectedShip, setSelectedShip] = useState(null)
  const [chapter, setChapter] = useState(null)

  return (
    <div>
      {/* ── STICKY SPLIT HERO ── */}
      <div style={{ position: 'relative', background: '#0b1d30' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', minHeight: '100vh' }} className="hero-grid">

          {/* LEFT: scrollable text */}
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', justifyContent: 'center', padding: '120px 64px 80px 4rem', position: 'relative', background: '#0b1d30' }}>
              <div style={{ fontSize: 10, color: '#c19a52', letterSpacing: '0.28em', textTransform: 'uppercase', marginBottom: 24 }}>
                Stichting Zeilschipper — UNESCO-nominatie
              </div>
              <h1 style={{ fontFamily: "'Playfair Display', serif", fontSize: 'clamp(28px, 3.2vw, 52px)', color: '#f4ede1', lineHeight: 1.1, marginBottom: 20, fontWeight: 400 }}>
                Voor velen meer dan een beroep —<br />het is een levensstijl
              </h1>
              <p style={{ fontSize: 16, color: 'rgba(244,237,225,0.65)', lineHeight: 1.85, maxWidth: 460, marginBottom: 16 }}>
                Deze website is een initiatief van een groep mensen die zich inzet voor het behoud van het beroep <em>zeilschipper</em>, ook wel Schipper Bruine Vloot genoemd.
              </p>
              <p style={{ fontSize: 15, color: 'rgba(244,237,225,0.45)', lineHeight: 1.8, maxWidth: 460, marginBottom: 48 }}>
                Een zeilschipper vaart samen met passagiers op traditionele zeilschepen voor recreatieve en educatieve doeleinden — op de Nederlandse binnenwateren, de Waddenzee en wereldwijd op zee. Schippers kiezen het vak uit liefde voor het varen, voor de traditionele schepen en voor de omgang met mensen.
              </p>
              <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap' }}>
                <button onClick={() => navigate('unesco')} style={{ background: '#c19a52', border: 'none', cursor: 'pointer', fontSize: 12, fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#0f2238', padding: '14px 28px', borderRadius: 2 }}>
                  Steun het dossier
                </button>
                <button onClick={() => navigate('vloot')} style={{ background: 'none', border: '1px solid rgba(244,237,225,0.25)', cursor: 'pointer', fontSize: 12, fontWeight: 400, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'rgba(244,237,225,0.8)', padding: '14px 28px', borderRadius: 2 }}>
                  Bekijk de vloot
                </button>
              </div>
              <div style={{ position: 'absolute', bottom: 36, left: '4rem', display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{ width: 32, height: 1, background: 'rgba(193,154,82,0.4)' }} />
                <span style={{ fontSize: 10, color: 'rgba(244,237,225,0.3)', letterSpacing: '0.2em', textTransform: 'uppercase' }}>Scroll voor de reis</span>
              </div>
            </div>

            {CHAPTERS_DATA.map((ch, i) => (
              <ChapterPanel key={i} ch={ch} index={i} onVisible={setChapter} />
            ))}
          </div>

          {/* RIGHT: sticky globe */}
          <div style={{ position: 'sticky', top: 0, height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
            <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(ellipse at 50% 50%, rgba(30,74,122,0.25) 0%, transparent 70%)', pointerEvents: 'none' }} />
            <div style={{ position: 'absolute', bottom: 40, left: '50%', transform: 'translateX(-50%)', textAlign: 'center', zIndex: 10, pointerEvents: 'none' }}>
              <div style={{ fontSize: 10, color: '#c19a52', letterSpacing: '0.25em', textTransform: 'uppercase', opacity: 0.8 }}>
                {GLOBE_CHAPTERS[chapter]?.label}
              </div>
            </div>
            <div style={{ position: 'absolute', top: 90, right: 24, zIndex: 10, background: 'rgba(10,22,40,0.75)', border: '1px solid rgba(193,154,82,0.3)', padding: '12px 16px', borderRadius: 3, backdropFilter: 'blur(8px)', textAlign: 'center' }}>
              <div style={{ fontFamily: "'Playfair Display', serif", fontSize: 26, color: '#f4ede1', lineHeight: 1 }}>{SHIPS.length}</div>
              <div style={{ fontSize: 10, color: '#c19a52', letterSpacing: '0.12em', textTransform: 'uppercase', marginTop: 4 }}>schepen</div>
            </div>
            <div style={{ position: 'absolute', bottom: 64, right: 24, zIndex: 10, fontSize: 10, color: 'rgba(244,237,225,0.25)', letterSpacing: '0.1em', textTransform: 'uppercase', writingMode: 'vertical-rl' }}>
              Klik een schip
            </div>
            <StickyGlobe chapter={chapter} onShipClick={setSelectedShip} />
          </div>
        </div>
      </div>

      {/* ── STATS ── */}
      <div style={{ background: '#0a1a2e', borderTop: '1px solid rgba(193,154,82,0.2)', borderBottom: '1px solid rgba(193,154,82,0.2)', padding: '60px 2rem' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '2rem', alignItems: 'center' }} className="stats-grid">
            <StatCounter value={5500} label="Schippers & Matrozen" prefix="~ " suffix="*" />
            <StatCounter value={365} label="Schepen" prefix="~ " />
            <StatCounter value={60} label="Bestaansjaren" prefix="> " suffix="*" />
            <StatCounter value={47000} label="Vaardagen (2024)" />
          </div>
          <div style={{ textAlign: 'center', marginTop: 28, fontSize: 12, color: 'rgba(244,237,225,0.3)', lineHeight: 1.7 }}>
            Het ecosysteem van het immaterieel erfgoed Schipper Bruine Vloot in cijfers.<br />
            <span style={{ fontSize: 11 }}>* schatting</span>
          </div>
        </div>
      </div>

      {/* ── THREE PILLARS ── */}
      <div style={{ background: '#f4ede1', padding: '100px 2rem' }}>
        <div style={{ maxWidth: 1280, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: 64 }}>
            <div style={{ fontSize: 10, color: '#c19a52', letterSpacing: '0.22em', textTransform: 'uppercase', marginBottom: 16 }}>Het ambacht</div>
            <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: 'clamp(26px, 3.5vw, 44px)', color: '#0f2238', fontWeight: 400 }}>
              Wat maakt de schipper<br />tot immaterieel erfgoed?
            </h2>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '3rem' }}>
            {PILLARS.map((p, i) => (
              <div key={i} style={{ borderTop: '2px solid #c19a52', paddingTop: 28 }}>
                <div style={{ fontSize: 11, color: '#c19a52', letterSpacing: '0.15em', textTransform: 'uppercase', marginBottom: 18 }}>{p.n}</div>
                <h3 style={{ fontFamily: "'Playfair Display', serif", fontSize: 22, color: '#0f2238', marginBottom: 16, lineHeight: 1.3 }}>{p.title}</h3>
                <p style={{ fontSize: 15, color: '#3a4f65', lineHeight: 1.85 }}>{p.body}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── UNESCO CALLOUT ── */}
      <div style={{ background: '#0f2238', padding: '80px 2rem' }}>
        <div style={{ maxWidth: 1280, margin: '0 auto', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '4rem', alignItems: 'center' }} className="grid-2">
          <div>
            <div style={{ fontSize: 10, color: '#c19a52', letterSpacing: '0.22em', textTransform: 'uppercase', marginBottom: 18 }}>Road to UNESCO</div>
            <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: 'clamp(24px, 3vw, 40px)', color: '#f4ede1', fontWeight: 400, marginBottom: 20, lineHeight: 1.2 }}>
              Wij bouwen het sterkste dossier dat de Bruine Vloot ooit heeft gehad
            </h2>
            <p style={{ fontSize: 15, color: 'rgba(244,237,225,0.6)', lineHeight: 1.85, marginBottom: 32 }}>
              Tijdens de Corona-epidemie bleek hoe kwetsbaar de situatie was. In juni 2020 kwamen meer dan 150 schepen samen bij Pampus — de steun die volgde maakte duidelijk dat dit erfgoed ertoe doet. In 2023 werd het ambacht opgenomen in de Inventaris Immaterieel Erfgoed Nederland. Ons ultieme doel is erkenning door UNESCO.
            </p>
            <button onClick={() => navigate('unesco')} style={{ background: 'none', border: '1px solid #c19a52', cursor: 'pointer', fontSize: 12, fontWeight: 500, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#c19a52', padding: '12px 24px', borderRadius: 2, transition: 'all 0.2s' }}
              onMouseEnter={e => { e.target.style.background = '#c19a52'; e.target.style.color = '#0f2238' }}
              onMouseLeave={e => { e.target.style.background = 'none'; e.target.style.color = '#c19a52' }}>
              Bekijk het traject →
            </button>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
            {[
              { year: '2020', label: 'Meer dan 150 schepen bijeen bij Pampus', done: true },
              { year: '2021', label: 'Stichting Zeilschipper opgericht', done: true },
              { year: '2022', label: 'Start kennisdocumentatie', done: true },
              { year: '2023', label: 'Opname Inventaris Immaterieel Erfgoed', done: true },
              { year: '2024', label: 'Eerste informatieborden geplaatst', done: true },
              { year: '2025', label: 'Indiening bij Ministerie OCW', done: false, active: true },
              { year: '2026–27', label: 'UNESCO-nominatie & besluit', done: false },
            ].map((step, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 20, paddingBottom: 20 }}>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', paddingTop: 4 }}>
                  <div style={{ width: 10, height: 10, borderRadius: '50%', flexShrink: 0, background: step.done ? '#c19a52' : 'none', border: step.done ? '2px solid #c19a52' : step.active ? '2px solid #c19a52' : '2px solid rgba(193,154,82,0.25)', boxShadow: step.active ? '0 0 0 4px rgba(193,154,82,0.12)' : 'none' }} />
                  {i < 6 && <div style={{ width: 1, height: 28, background: step.done ? 'rgba(193,154,82,0.4)' : 'rgba(193,154,82,0.12)', marginTop: 4 }} />}
                </div>
                <div>
                  <div style={{ fontSize: 11, color: '#c19a52', letterSpacing: '0.1em', marginBottom: 3 }}>{step.year}</div>
                  <div style={{ fontSize: 14, color: step.done ? '#f4ede1' : step.active ? '#f4ede1' : 'rgba(244,237,225,0.35)', fontStyle: step.done || step.active ? 'normal' : 'italic' }}>
                    {step.label}
                    {step.active && <span style={{ fontSize: 9, background: '#c19a52', color: '#0f2238', padding: '2px 6px', borderRadius: 2, marginLeft: 8, fontWeight: 700, letterSpacing: '0.08em' }}>NU</span>}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── PROJECT CARDS ── */}
      <div style={{ background: '#f4ede1', padding: '100px 2rem' }}>
        <div style={{ maxWidth: 1280, margin: '0 auto' }}>
          <div style={{ fontSize: 10, color: '#c19a52', letterSpacing: '0.22em', textTransform: 'uppercase', marginBottom: 16 }}>Projecten</div>
          <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: 38, color: '#0f2238', marginBottom: 52, fontWeight: 400 }}>Wat wij doen</h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '2px' }}>
            {[
              { n: '01', title: 'UNESCO-nomineringsdossier', body: 'Documentatie, wetenschappelijke onderbouwing en internationale lobby voor opname op de Representatieve Lijst van Immaterieel Cultureel Erfgoed.', action: 'unesco' },
              { n: '02', title: 'Informatieborden-netwerk', body: 'In twintig Nederlandse havens plaatsen wij borden die het verhaal van de schipper Bruine Vloot vertellen aan omwonenden en bezoekers.', action: 'informatieborden' },
              { n: '03', title: 'Kennisoverdracht & opleiding', body: 'Via het meester-gezel-systeem koppelen wij aspirant-schippers aan ervaren mentors. Jaarlijks vijftien nieuwe deelnemers in een intensief programma.', action: 'team' },
            ].map((c, i) => (
              <div key={i} onClick={() => navigate(c.action)} style={{ background: '#0f2238', padding: '40px 36px', cursor: 'pointer', transition: 'background 0.3s' }}
                onMouseEnter={e => e.currentTarget.style.background = '#162e4a'}
                onMouseLeave={e => e.currentTarget.style.background = '#0f2238'}>
                <div style={{ fontSize: 10, color: '#c19a52', letterSpacing: '0.22em', marginBottom: 20 }}>{c.n}</div>
                <h3 style={{ fontFamily: "'Playfair Display', serif", fontSize: 21, color: '#f4ede1', marginBottom: 16, lineHeight: 1.3 }}>{c.title}</h3>
                <p style={{ fontSize: 14, color: 'rgba(244,237,225,0.5)', lineHeight: 1.8 }}>{c.body}</p>
                <div style={{ marginTop: 24, fontSize: 12, color: '#c19a52', letterSpacing: '0.06em' }}>Lees meer →</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── ORAL HISTORY ── */}
      <div style={{ background: '#0a1a2e', padding: '100px 2rem' }}>
        <div style={{ maxWidth: 1280, margin: '0 auto', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '4rem', alignItems: 'start' }} className="grid-2">
          <div>
            <div style={{ fontSize: 10, color: '#c19a52', letterSpacing: '0.22em', textTransform: 'uppercase', marginBottom: 18 }}>Project</div>
            <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: 'clamp(24px, 3vw, 40px)', color: '#f4ede1', fontWeight: 400, marginBottom: 20, lineHeight: 1.2 }}>
              Oral History
            </h2>
            <p style={{ fontSize: 15, color: 'rgba(244,237,225,0.6)', lineHeight: 1.85, marginBottom: 20 }}>
              Stichting Zeilschipper wil een aantal eerste generatie Bruine Vloot schippers interviewen en deze interviews laten opnemen in een museumcollectie.
            </p>
            <p style={{ fontSize: 15, color: 'rgba(244,237,225,0.6)', lineHeight: 1.85, marginBottom: 20 }}>
              Er heeft nooit historisch onderzoek plaatsgevonden naar deze beroepsgroep die al ruim vijftig jaar bestaat. Hoe is de sector ontstaan? Hoe zag de dagelijkse praktijk eruit? Wat bewoog schippers om dit vak te kiezen?
            </p>
            <p style={{ fontSize: 15, color: 'rgba(244,237,225,0.6)', lineHeight: 1.85, marginBottom: 32 }}>
              Aangezien veel schippers die in de jaren 1960 en 1970 begonnen nu al op hoge leeftijd zijn, is het vastleggen van hun verhalen en ervaring urgent.
            </p>
            <div style={{ fontSize: 12, color: 'rgba(193,154,82,0.55)', fontStyle: 'italic', borderLeft: '2px solid rgba(193,154,82,0.3)', paddingLeft: 16 }}>
              Samenwerkingspartners en mogelijkheden worden momenteel onderzocht.
            </div>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
            {[
              { n: '01', title: 'Interviews eerste generatie', body: 'Diepte-interviews met schippers die begonnen in de jaren 1960 en 1970 — over het ontstaan van de sector, de dagelijkse praktijk en de persoonlijke drijfveren om dit vak uit te oefenen.' },
              { n: '02', title: 'Onderzoekspotentie', body: 'Er zijn wel publieksboeken over de Bruine Vloot verschenen, maar wetenschappelijk onderzoek naar deze beroepsgroep ontbreekt. De oral history vormt een unieke primaire bron voor toekomstig onderzoek.' },
              { n: '03', title: 'Museumcollectie', body: 'De interviews worden opgenomen in een erkende museumcollectie voor duurzame bewaring en toegankelijkheid voor onderzoekers, schippers en geïnteresseerden.' },
            ].map((item, i) => (
              <div key={i} style={{ paddingBottom: 28, borderBottom: i < 2 ? '1px solid rgba(193,154,82,0.12)' : 'none', marginBottom: i < 2 ? 28 : 0 }}>
                <div style={{ fontSize: 10, color: '#c19a52', letterSpacing: '0.2em', marginBottom: 10 }}>{item.n}</div>
                <div style={{ fontFamily: "'Playfair Display', serif", fontSize: 17, color: '#f4ede1', marginBottom: 10 }}>{item.title}</div>
                <div style={{ fontSize: 13, color: 'rgba(244,237,225,0.5)', lineHeight: 1.75 }}>{item.body}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── MEDIA SPOTLIGHT ── */}
      <div style={{ background: '#0f2238', padding: '100px 2rem' }}>
        <div style={{ maxWidth: 1280, margin: '0 auto', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '4rem', alignItems: 'center' }} className="grid-2">
          <div style={{ aspectRatio: '16/9', borderRadius: 2, cursor: 'pointer', position: 'relative', overflow: 'hidden' }}>
            <img src={`${import.meta.env.BASE_URL}waterschatten-thumbnail.jpg`} alt="Waterschatten" style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
            <div style={{ position: 'absolute', inset: 0, background: 'rgba(10,26,46,0.35)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <div style={{ width: 56, height: 56, borderRadius: '50%', background: 'rgba(193,154,82,0.18)', border: '1px solid rgba(193,154,82,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <div style={{ width: 0, height: 0, borderLeft: '18px solid #c19a52', borderTop: '11px solid transparent', borderBottom: '11px solid transparent', marginLeft: 4 }} />
              </div>
            </div>
          </div>
          <div>
            <div style={{ fontSize: 10, color: '#c19a52', letterSpacing: '0.22em', textTransform: 'uppercase', marginBottom: 16 }}>Media spotlight</div>
            <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: 32, color: '#f4ede1', fontWeight: 400, marginBottom: 18, lineHeight: 1.2 }}>Waterschatten</h2>
            <p style={{ fontSize: 15, color: 'rgba(244,237,225,0.55)', lineHeight: 1.85, marginBottom: 28 }}>Een door de BBZ gemaakte promotiefilm die heel goed gebruikt kan worden om de Bruine Vloot, haar bemanning en de bijbehorende beroepsvelden voor te stellen.</p>
            <button onClick={() => navigate('media')} style={{ background: 'none', border: '1px solid rgba(193,154,82,0.4)', cursor: 'pointer', fontSize: 12, fontWeight: 500, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#c19a52', padding: '10px 20px', borderRadius: 2 }}>
              Alle media →
            </button>
          </div>
        </div>
      </div>

      {/* ── BLOG PREVIEW ── */}
      <div style={{ background: '#f4ede1', padding: '100px 2rem' }}>
        <div style={{ maxWidth: 1280, margin: '0 auto' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 52 }}>
            <div>
              <div style={{ fontSize: 10, color: '#c19a52', letterSpacing: '0.22em', textTransform: 'uppercase', marginBottom: 12 }}>Nieuws</div>
              <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: 38, color: '#0f2238', fontWeight: 400 }}>Laatste berichten</h2>
            </div>
            <button onClick={() => navigate('blog')} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 13, color: '#c19a52', letterSpacing: '0.06em' }}>Alle berichten →</button>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '3rem' }}>
            {BLOG_POSTS.slice(0, 3).map(post => (
              <div key={post.id} style={{ borderTop: '1px solid rgba(15,34,56,0.15)', paddingTop: 28, cursor: 'pointer' }} onClick={() => navigate('blog')}>
                <div style={{ fontSize: 10, color: '#c19a52', letterSpacing: '0.15em', textTransform: 'uppercase', marginBottom: 12 }}>{post.category} · {post.date}</div>
                <h3 style={{ fontFamily: "'Playfair Display', serif", fontSize: 20, color: '#0f2238', marginBottom: 12, lineHeight: 1.35 }}>{post.title}</h3>
                <p style={{ fontSize: 14, color: '#3a4f65', lineHeight: 1.75 }}>{post.excerpt}</p>
                <div style={{ marginTop: 14, fontSize: 12, color: 'rgba(15,34,56,0.35)' }}>{post.readTime} leestijd</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── HOW TO HELP ── */}
      <div style={{ background: '#6b4a2b', padding: '80px 2rem', textAlign: 'center' }}>
        <div style={{ maxWidth: 640, margin: '0 auto' }}>
          <div style={{ fontSize: 10, color: 'rgba(244,237,225,0.45)', letterSpacing: '0.22em', textTransform: 'uppercase', marginBottom: 20 }}>Doe mee</div>
          <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: 'clamp(24px, 3.5vw, 42px)', color: '#f4ede1', fontWeight: 400, marginBottom: 20, lineHeight: 1.2 }}>Hoe u kunt bijdragen</h2>
          <p style={{ fontSize: 16, color: 'rgba(244,237,225,0.65)', lineHeight: 1.8, marginBottom: 44 }}>
            UNESCO-erkenning vereist brede maatschappelijke steun. Elke bijdrage telt — of het nu een steunbrief is, een donatie, of het delen van dit verhaal.
          </p>
          <div style={{ display: 'flex', gap: 14, justifyContent: 'center', flexWrap: 'wrap' }}>
            {[
              { label: 'Schrijf een steunbrief', primary: true, action: 'unesco' },
              { label: 'Word donateur', primary: false, action: 'media' },
              { label: 'Deel het verhaal', primary: false, action: 'media' },
            ].map((b, i) => (
              <button key={i} onClick={() => navigate(b.action)} style={{ background: b.primary ? '#f4ede1' : 'none', border: b.primary ? 'none' : '1px solid rgba(244,237,225,0.35)', cursor: 'pointer', fontSize: 13, fontWeight: b.primary ? 600 : 400, letterSpacing: '0.06em', color: b.primary ? '#6b4a2b' : '#f4ede1', padding: '13px 26px', borderRadius: 2 }}>
                {b.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <ShipPanel ship={selectedShip} onClose={() => setSelectedShip(null)} />

      <style>{`
        @media (max-width: 900px) {
          .hero-grid { grid-template-columns: 1fr !important; }
          .stats-grid { grid-template-columns: repeat(2, 1fr) !important; }
          .grid-2 { grid-template-columns: 1fr !important; }
        }
        @media (max-width: 480px) {
          .stats-grid { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </div>
  )
}
