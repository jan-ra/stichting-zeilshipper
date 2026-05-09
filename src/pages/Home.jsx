import { useState, useEffect, useRef, Fragment } from 'react'
import { SHIPS, BLOG_POSTS } from '../data/content.js'
import { useLanguage } from '../context/LanguageContext.jsx'

const GLOBE_CHAPTERS = [
  { lat: 53.0, lng: 5.0, altitude: 0.6, autoRotate: false, regionKey: 'thuiswateren' },
  { lat: 52.0, lng: 12.0, altitude: 2.0, autoRotate: false, regionKey: 'europa' },
  { lat: 20.0, lng: -5.0, altitude: 2.8, autoRotate: true, regionKey: 'wereld' },
  { lat: 53.18, lng: 5.40, altitude: 0.6, autoRotate: false, regionKey: 'thuiswateren' },
]

const CHAPTERS_STRUCT = [
  { index: 0, roman: 'I' },
  { index: 1, roman: 'II' },
  { index: 2, roman: 'III' },
  { index: 3, roman: 'IV' },
]

// Photos shown between chapter panels as the user scrolls (null = no photo after that chapter)
const CHAPTER_PHOTOS = [
  { src: 'jordie-2.webp', position: 'center 70%' },
  { src: 'jordie-4.webp', position: 'center center' },
  { src: 'sven-6.webp',  position: 'center center' },
  null,
]

// All unused pics, combined with the two hero statics, for the scrolling strip
const SCROLL_PHOTOS = [
  'sven-homepage.webp', 'jordie-1.webp', 'sven-2.webp', 'jordie-6.webp',
  'sven-4.webp', 'jordi-morales.webp', 'sven-7.webp', 'jordie-5.jpg',
  'sven-5.webp', 'jordie-3.jpg', 'sven-1.webp', 'sven-3.webp',
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
        g.pointRadius(0.35 * scale)
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
function ShipPanel({ ship, onClose, t }) {
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
      {[
        [t('home.shipPanel.port'), ship.port],
        [t('home.shipPanel.speed'), `${ship.speed} kn`],
        [t('home.shipPanel.yearBuilt'), ship.year],
        [t('home.shipPanel.passengers'), ship.passengers],
        [t('home.shipPanel.region'), ship.region],
      ].map(([k, v]) => (
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

// ── Chapter panel ─────────────────────────────────────────────────────────────
function ChapterPanel({ ch, index, onVisible, chapterLabel }) {
  const ref = useRef(null)

  useEffect(() => {
    const obs = new IntersectionObserver(([e]) => {
      if (e.isIntersecting) onVisible(ch.index)
    }, { threshold: 0.45 })
    if (ref.current) obs.observe(ref.current)
    return () => obs.disconnect()
  }, [ch.index, onVisible])

  return (
    <div ref={ref} style={{ minHeight: '60vh', display: 'flex', flexDirection: 'column', justifyContent: 'center', padding: '48px 64px 48px 4rem', borderTop: '2px solid rgba(193,154,82,0.25)', background: '#f4ede1' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 20 }}>
        <span style={{ fontFamily: "'Playfair Display', serif", fontSize: 13, color: '#c19a52', fontStyle: 'italic' }}>{ch.roman}</span>
        <div style={{ height: 1, width: 40, background: 'rgba(193,154,82,0.5)' }} />
        <span style={{ fontSize: 10, color: '#c19a52', letterSpacing: '0.2em', textTransform: 'uppercase' }}>{chapterLabel} {index + 1}</span>
      </div>
      <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: 'clamp(30px, 3vw, 48px)', color: '#0f2238', lineHeight: 1.1, marginBottom: 8, fontWeight: 400 }}>
        {ch.title}
      </h2>
      <div style={{ fontSize: 13, color: 'rgba(15,34,56,0.4)', fontStyle: 'italic', marginBottom: 18 }}>{ch.sub}</div>
      <p style={{ fontSize: 16, color: '#3a4f65', lineHeight: 1.9, maxWidth: 420 }}>{ch.body}</p>
      <div style={{ display: 'flex', gap: 8, marginTop: 28 }}>
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
  const { t, tc } = useLanguage()

  const chapters = t('home.chapters').map((ch, i) => ({ ...CHAPTERS_STRUCT[i], ...ch }))
  const pillars = t('home.pillars')
  const timeline = t('home.timeline')
  const projects = t('home.projects')
  const oralItems = t('home.oralItems')
  const statLabels = t('home.statLabels')

  return (
    <div>
      {/* ── STICKY SPLIT HERO ── */}
      <div style={{ position: 'relative', background: '#0b1d30' }}>

          {/* Scrolling photo strip — absolutely positioned, full-width, behind the globe */}
          <div style={{ position: 'absolute', top: 68, left: 0, right: 0, height: 220, overflow: 'hidden', zIndex: 1 }}>
            <div className="photo-scroll-track" style={{ display: 'flex', height: '100%', gap: 3 }}>
              {[...SCROLL_PHOTOS, ...SCROLL_PHOTOS].map((photo, i) => (
                <div key={i} style={{ flexShrink: 0, width: 260, height: '100%', overflow: 'hidden' }}>
                  <img src={`${import.meta.env.BASE_URL}pics/${photo}`} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block', filter: 'brightness(0.82) saturate(0.88)' }} />
                </div>
              ))}
            </div>
            <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 64, background: 'linear-gradient(to bottom, transparent, #0b1d30)', pointerEvents: 'none' }} />
          </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', minHeight: '100vh' }} className="hero-grid">

          {/* LEFT: scrollable text */}
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', justifyContent: 'flex-start', padding: '312px 64px 80px 4rem', position: 'relative' }}>

              <div style={{ fontSize: 10, color: '#c19a52', letterSpacing: '0.28em', textTransform: 'uppercase', marginBottom: 24 }}>
                {t('home.badge')}
              </div>
              <h1 style={{ fontFamily: "'Playfair Display', serif", fontSize: 'clamp(28px, 3.2vw, 52px)', color: '#f4ede1', lineHeight: 1.1, marginBottom: 20, fontWeight: 400 }}>
                {t('home.heroTitle').split('\n').map((line, i) => (
                  <span key={i}>{line}{i === 0 && <br />}</span>
                ))}
              </h1>
              <p style={{ fontSize: 16, color: 'rgba(244,237,225,0.65)', lineHeight: 1.85, maxWidth: 460, marginBottom: 16 }}>
                {t('home.heroPara1')}
              </p>
              <p style={{ fontSize: 15, color: 'rgba(244,237,225,0.45)', lineHeight: 1.8, maxWidth: 460, marginBottom: 48 }}>
                {t('home.heroPara2')}
              </p>
              <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap' }}>
                <button onClick={() => navigate('support')} style={{ background: '#c19a52', border: 'none', cursor: 'pointer', fontSize: 12, fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#0f2238', padding: '14px 28px', borderRadius: 2 }}>
                  {t('home.ctaPrimary')}
                </button>
                <button onClick={() => navigate('vloot')} style={{ background: 'none', border: '1px solid rgba(244,237,225,0.25)', cursor: 'pointer', fontSize: 12, fontWeight: 400, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'rgba(244,237,225,0.8)', padding: '14px 28px', borderRadius: 2 }}>
                  {t('home.ctaSecondary')}
                </button>
              </div>

              <div style={{ position: 'absolute', bottom: 36, left: '4rem', display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{ width: 32, height: 1, background: 'rgba(193,154,82,0.4)' }} />
                <span style={{ fontSize: 10, color: 'rgba(244,237,225,0.3)', letterSpacing: '0.2em', textTransform: 'uppercase' }}>{t('home.scrollHint')}</span>
              </div>
            </div>

            {chapters.map((ch, i) => (
              <Fragment key={i}>
                <ChapterPanel ch={ch} index={i} onVisible={setChapter} chapterLabel={t('home.chapterLabel')} />
                {CHAPTER_PHOTOS[i] && (
                  <div style={{ height: 220, overflow: 'hidden', position: 'relative', flexShrink: 0 }}>
                    <img src={`${import.meta.env.BASE_URL}pics/${CHAPTER_PHOTOS[i].src}`} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: CHAPTER_PHOTOS[i].position, display: 'block', filter: 'brightness(0.82) saturate(0.88)' }} />
                    <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to bottom, #f4ede1 0%, transparent 22%, transparent 78%, #f4ede1 100%)' }} />
                    <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to right, rgba(193,154,82,0.08) 0%, transparent 100%)' }} />
                  </div>
                )}
              </Fragment>
            ))}
          </div>

          {/* RIGHT: sticky globe — zIndex: 2 renders it in front of the photo strip (zIndex: 1) */}
          <div style={{ position: 'sticky', top: 0, height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', zIndex: 2 }}>
            <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(ellipse at 50% 50%, rgba(30,74,122,0.25) 0%, transparent 70%)', pointerEvents: 'none' }} />
            <div style={{ position: 'absolute', bottom: 40, left: '50%', transform: 'translateX(-50%)', textAlign: 'center', zIndex: 10, pointerEvents: 'none' }}>
              <div style={{ fontSize: 10, color: '#c19a52', letterSpacing: '0.25em', textTransform: 'uppercase', opacity: 0.8 }}>
                {chapter !== null && t(`regions.${GLOBE_CHAPTERS[chapter]?.regionKey}`)}
              </div>
            </div>
            <div style={{ position: 'absolute', top: 90, right: 24, zIndex: 10, background: 'rgba(10,22,40,0.75)', border: '1px solid rgba(193,154,82,0.3)', padding: '12px 16px', borderRadius: 3, backdropFilter: 'blur(8px)', textAlign: 'center' }}>
              <div style={{ fontFamily: "'Playfair Display', serif", fontSize: 26, color: '#f4ede1', lineHeight: 1 }}>{SHIPS.length}</div>
              <div style={{ fontSize: 10, color: '#c19a52', letterSpacing: '0.12em', textTransform: 'uppercase', marginTop: 4 }}>{t('home.shipCount')}</div>
            </div>
            <div style={{ position: 'absolute', bottom: 64, right: 24, zIndex: 10, fontSize: 10, color: 'rgba(244,237,225,0.25)', letterSpacing: '0.1em', textTransform: 'uppercase', writingMode: 'vertical-rl' }}>
              {t('home.clickShip')}
            </div>
            <StickyGlobe chapter={chapter} onShipClick={setSelectedShip} />
          </div>
        </div>
      </div>

      {/* ── STATS ── */}
      <div style={{ background: '#0a1a2e', borderTop: '1px solid rgba(193,154,82,0.2)', borderBottom: '1px solid rgba(193,154,82,0.2)', padding: '60px 2rem' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '2rem', alignItems: 'center' }} className="stats-grid">
            <StatCounter value={5500} label={statLabels[0]} prefix="~ " suffix="*" />
            <StatCounter value={365} label={statLabels[1]} prefix="~ " />
            <StatCounter value={60} label={statLabels[2]} prefix="> " suffix="*" />
            <StatCounter value={47000} label={statLabels[3]} />
          </div>
          <div style={{ textAlign: 'center', marginTop: 28, fontSize: 12, color: 'rgba(244,237,225,0.3)', lineHeight: 1.7 }}>
            {t('home.statsCaption')}<br />
            <span style={{ fontSize: 11 }}>{t('home.statsEstimate')}</span>
          </div>
        </div>
      </div>

      {/* ── THREE PILLARS ── */}
      <div style={{ background: '#f4ede1', padding: '100px 2rem' }}>
        <div style={{ maxWidth: 1280, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: 64 }}>
            <div style={{ fontSize: 10, color: '#c19a52', letterSpacing: '0.22em', textTransform: 'uppercase', marginBottom: 16 }}>{t('home.craftBadge')}</div>
            <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: 'clamp(26px, 3.5vw, 44px)', color: '#0f2238', fontWeight: 400 }}>
              {t('home.pillarsTitle').split('\n').map((line, i) => (
                <span key={i}>{line}{i === 0 && <br />}</span>
              ))}
            </h2>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '3rem' }}>
            {pillars.map((p, i) => (
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
            <div style={{ fontSize: 10, color: '#c19a52', letterSpacing: '0.22em', textTransform: 'uppercase', marginBottom: 18 }}>{t('home.unescoSectionBadge')}</div>
            <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: 'clamp(24px, 3vw, 40px)', color: '#f4ede1', fontWeight: 400, marginBottom: 20, lineHeight: 1.2 }}>
              {t('home.unescoSectionTitle')}
            </h2>
            <p style={{ fontSize: 15, color: 'rgba(244,237,225,0.6)', lineHeight: 1.85, marginBottom: 32 }}>
              {t('home.unescoSectionBody')}
            </p>
            <button onClick={() => navigate('unesco')} style={{ background: 'none', border: '1px solid #c19a52', cursor: 'pointer', fontSize: 12, fontWeight: 500, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#c19a52', padding: '12px 24px', borderRadius: 2, transition: 'all 0.2s' }}
              onMouseEnter={e => { e.target.style.background = '#c19a52'; e.target.style.color = '#0f2238' }}
              onMouseLeave={e => { e.target.style.background = 'none'; e.target.style.color = '#c19a52' }}>
              {t('home.unescoSectionCta')}
            </button>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
            {timeline.map((step, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 20, paddingBottom: 20 }}>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', paddingTop: 4 }}>
                  <div style={{ width: 10, height: 10, borderRadius: '50%', flexShrink: 0, background: step.done ? '#c19a52' : 'none', border: step.done ? '2px solid #c19a52' : step.active ? '2px solid #c19a52' : '2px solid rgba(193,154,82,0.25)', boxShadow: step.active ? '0 0 0 4px rgba(193,154,82,0.12)' : 'none' }} />
                  {i < timeline.length - 1 && <div style={{ width: 1, height: 28, background: step.done ? 'rgba(193,154,82,0.4)' : 'rgba(193,154,82,0.12)', marginTop: 4 }} />}
                </div>
                <div>
                  <div style={{ fontSize: 11, color: '#c19a52', letterSpacing: '0.1em', marginBottom: 3 }}>{step.year}</div>
                  <div style={{ fontSize: 14, color: step.done ? '#f4ede1' : step.active ? '#f4ede1' : 'rgba(244,237,225,0.35)', fontStyle: step.done || step.active ? 'normal' : 'italic' }}>
                    {step.label}
                    {step.active && <span style={{ fontSize: 9, background: '#c19a52', color: '#0f2238', padding: '2px 6px', borderRadius: 2, marginLeft: 8, fontWeight: 700, letterSpacing: '0.08em' }}>{t('home.timelineNow')}</span>}
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
          <div style={{ fontSize: 10, color: '#c19a52', letterSpacing: '0.22em', textTransform: 'uppercase', marginBottom: 16 }}>{t('home.projectsBadge')}</div>
          <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: 38, color: '#0f2238', marginBottom: 52, fontWeight: 400 }}>{t('home.projectsTitle')}</h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '2px' }}>
            {projects.map((c, i) => (
              <div key={i} onClick={() => navigate(c.action)} style={{ background: '#0f2238', padding: '40px 36px', cursor: 'pointer', transition: 'background 0.3s' }}
                onMouseEnter={e => e.currentTarget.style.background = '#162e4a'}
                onMouseLeave={e => e.currentTarget.style.background = '#0f2238'}>
                <div style={{ fontSize: 10, color: '#c19a52', letterSpacing: '0.22em', marginBottom: 20 }}>{c.n}</div>
                <h3 style={{ fontFamily: "'Playfair Display', serif", fontSize: 21, color: '#f4ede1', marginBottom: 16, lineHeight: 1.3 }}>{c.title}</h3>
                <p style={{ fontSize: 14, color: 'rgba(244,237,225,0.5)', lineHeight: 1.8 }}>{c.body}</p>
                <div style={{ marginTop: 24, fontSize: 12, color: '#c19a52', letterSpacing: '0.06em' }}>{t('home.projectsReadMore')}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── ORAL HISTORY ── */}
      <div style={{ background: '#0a1a2e', padding: '100px 2rem' }}>
        <div style={{ maxWidth: 1280, margin: '0 auto', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '4rem', alignItems: 'start' }} className="grid-2">
          <div>
            <div style={{ fontSize: 10, color: '#c19a52', letterSpacing: '0.22em', textTransform: 'uppercase', marginBottom: 18 }}>{t('home.oralBadge')}</div>
            <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: 'clamp(24px, 3vw, 40px)', color: '#f4ede1', fontWeight: 400, marginBottom: 20, lineHeight: 1.2 }}>
              {t('home.oralTitle')}
            </h2>
            <p style={{ fontSize: 15, color: 'rgba(244,237,225,0.6)', lineHeight: 1.85, marginBottom: 20 }}>{t('home.oralPara1')}</p>
            <p style={{ fontSize: 15, color: 'rgba(244,237,225,0.6)', lineHeight: 1.85, marginBottom: 20 }}>{t('home.oralPara2')}</p>
            <p style={{ fontSize: 15, color: 'rgba(244,237,225,0.6)', lineHeight: 1.85, marginBottom: 32 }}>{t('home.oralPara3')}</p>
            <div style={{ fontSize: 12, color: 'rgba(193,154,82,0.55)', fontStyle: 'italic', borderLeft: '2px solid rgba(193,154,82,0.3)', paddingLeft: 16 }}>
              {t('home.oralNote')}
            </div>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
            {oralItems.map((item, i) => (
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
            <div style={{ fontSize: 10, color: '#c19a52', letterSpacing: '0.22em', textTransform: 'uppercase', marginBottom: 16 }}>{t('home.mediaSpotlightBadge')}</div>
            <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: 32, color: '#f4ede1', fontWeight: 400, marginBottom: 18, lineHeight: 1.2 }}>{t('home.mediaSpotlightTitle')}</h2>
            <p style={{ fontSize: 15, color: 'rgba(244,237,225,0.55)', lineHeight: 1.85, marginBottom: 28 }}>{t('home.mediaSpotlightBody')}</p>
            <button onClick={() => navigate('media')} style={{ background: 'none', border: '1px solid rgba(193,154,82,0.4)', cursor: 'pointer', fontSize: 12, fontWeight: 500, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#c19a52', padding: '10px 20px', borderRadius: 2 }}>
              {t('home.mediaSpotlightCta')}
            </button>
          </div>
        </div>
      </div>

      {/* ── BLOG PREVIEW ── */}
      <div style={{ background: '#f4ede1', padding: '100px 2rem' }}>
        <div style={{ maxWidth: 1280, margin: '0 auto' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 52 }}>
            <div>
              <div style={{ fontSize: 10, color: '#c19a52', letterSpacing: '0.22em', textTransform: 'uppercase', marginBottom: 12 }}>{t('home.newsBadge')}</div>
              <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: 38, color: '#0f2238', fontWeight: 400 }}>{t('home.newsTitle')}</h2>
            </div>
            <button onClick={() => navigate('blog')} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 13, color: '#c19a52', letterSpacing: '0.06em' }}>{t('home.newsAllCta')}</button>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '3rem' }}>
            {BLOG_POSTS.slice(0, 3).map(post => (
              <div key={post.id} style={{ borderTop: '1px solid rgba(15,34,56,0.15)', paddingTop: 28, cursor: 'pointer' }} onClick={() => navigate('blog')}>
                <div style={{ fontSize: 10, color: '#c19a52', letterSpacing: '0.15em', textTransform: 'uppercase', marginBottom: 12 }}>{tc(post, 'category')} · {post.date}</div>
                <h3 style={{ fontFamily: "'Playfair Display', serif", fontSize: 20, color: '#0f2238', marginBottom: 12, lineHeight: 1.35 }}>{tc(post, 'title')}</h3>
                <p style={{ fontSize: 14, color: '#3a4f65', lineHeight: 1.75 }}>{tc(post, 'excerpt')}</p>
                <div style={{ marginTop: 14, fontSize: 12, color: 'rgba(15,34,56,0.35)' }}>{post.readTime} {t('home.readTimeLabel')}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── HOW TO HELP ── */}
      <div style={{ background: '#6b4a2b', padding: '80px 2rem', textAlign: 'center' }}>
        <div style={{ maxWidth: 640, margin: '0 auto' }}>
          <div style={{ fontSize: 10, color: 'rgba(244,237,225,0.45)', letterSpacing: '0.22em', textTransform: 'uppercase', marginBottom: 20 }}>{t('home.helpBadge')}</div>
          <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: 'clamp(24px, 3.5vw, 42px)', color: '#f4ede1', fontWeight: 400, marginBottom: 20, lineHeight: 1.2 }}>{t('home.helpTitle')}</h2>
          <p style={{ fontSize: 16, color: 'rgba(244,237,225,0.65)', lineHeight: 1.8, marginBottom: 44 }}>
            {t('home.helpBody')}
          </p>
          <div style={{ display: 'flex', gap: 14, justifyContent: 'center', flexWrap: 'wrap' }}>
            {[
              { primary: true, action: 'support' },
              { primary: false, action: 'media' },
              { primary: false, action: 'media' },
            ].map((b, i) => (
              <button key={i} onClick={() => navigate(b.action)} style={{ background: b.primary ? '#f4ede1' : 'none', border: b.primary ? 'none' : '1px solid rgba(244,237,225,0.35)', cursor: 'pointer', fontSize: 13, fontWeight: b.primary ? 600 : 400, letterSpacing: '0.06em', color: b.primary ? '#6b4a2b' : '#f4ede1', padding: '13px 26px', borderRadius: 2 }}>
                {t('home.helpButtons')[i]}
              </button>
            ))}
          </div>
        </div>
      </div>

      <ShipPanel ship={selectedShip} onClose={() => setSelectedShip(null)} t={t} />

      <style>{`
        @keyframes photoScroll {
          from { transform: translateX(0); }
          to   { transform: translateX(-50%); }
        }
        .photo-scroll-track {
          animation: photoScroll 90s linear infinite;
        }
        .photo-scroll-track:hover {
          animation-play-state: paused;
        }
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
