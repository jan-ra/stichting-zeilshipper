import { useState, useEffect, useRef, useCallback, Fragment } from 'react'
import { SHIPS, BLOG_POSTS, HOME_PAGE, UNESCO_STEPS } from '../data/content.js'
import { useLanguage } from '../context/LanguageContext.jsx'
import { asset } from '../utils/asset.js'
import { youtubeEmbedUrl } from '../utils/youtube.js'
import ShipGlobe from '../components/globe/ShipGlobe.jsx'
import ShipCard from '../components/ShipCard.jsx'
import { useIsTouch } from '../hooks/useMediaQuery.js'
import { useShips } from '../hooks/useShips.js'

// MapLibre zoom levels: zoom 1.1 is the whole planet in the pane, and each step halves
// what you see. The located fleet spans 1.97 degrees around 52.48N 4.96E, so zoom 6.6
// frames the Netherlands and every ship in it.
const GLOBE_CHAPTERS = [
  { lat: 52.48, lng: 4.96, zoom: 6.6, autoRotate: false, regionKey: 'thuiswateren' },
  // Lower zoom than the hero yet larger on screen: MapLibre sizes the globe by
  // 1/cos(latitude), so this chapter's lat 52 renders ~1.5x the hero's lat 20 at equal
  // zoom. 1.7 lands Europe just filling the column, limb still visible at the edges.
  { lat: 52.0, lng: 12.0, zoom: 1.7, autoRotate: false, regionKey: 'europa' },
  // The world chapter sits just wider than the opening shot — it is the widest the
  // journey ever goes, so it must not read as smaller than the hero it grew out of.
  { lat: 20.0, lng: -5.0, zoom: 1.85, autoRotate: true, regionKey: 'wereld' },
  // Chapter IV closes on Harlingen, the busiest basin (16 ships within a few hundred m),
  // at the same country-wide zoom as chapter I — pushing in further reads as a slam.
  { lat: 53.173, lng: 5.415, zoom: 6.6, autoRotate: false, regionKey: 'thuiswateren' },
]

// Opens on the whole globe, slowly turning; the chapters push in from here.
// Zoom 2.0 fills about 80% of the hero column's width. The chapters above are pitched
// around this, so moving it means moving them.
const INITIAL_VIEW = { lat: 20.0, lng: 4.96, zoom: 2.0, ms: 0 }

const CHAPTERS_STRUCT = [
  { index: 0, roman: 'I' },
  { index: 1, roman: 'II' },
  { index: 2, roman: 'III' },
  { index: 3, roman: 'IV' },
]

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
      <div style={{ fontFamily: "'Playfair Display', serif", fontSize: 48, fontWeight: 400, color: '#0f2238', lineHeight: 1 }}>
        {prefix}{count.toLocaleString('nl-NL')}{suffix}
      </div>
      <div style={{ fontSize: 11, letterSpacing: '0.15em', textTransform: 'uppercase', color: '#a07d33', marginTop: 10 }}>{label}</div>
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
    <div ref={ref} className="hero-chapter" style={{ minHeight: '60vh', display: 'flex', flexDirection: 'column', justifyContent: 'center', padding: '48px 64px 48px 4rem', borderTop: '2px solid rgba(193,154,82,0.25)', background: '#efe7d8' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 20 }}>
        <span style={{ fontFamily: "'Playfair Display', serif", fontSize: 13, color: '#c19a52', fontStyle: 'italic' }}>{ch.roman}</span>
        <div style={{ height: 1, width: 40, background: 'rgba(193,154,82,0.5)' }} />
        <span style={{ fontSize: 10, color: '#a07d33', letterSpacing: '0.2em', textTransform: 'uppercase' }}>{chapterLabel} {index + 1}</span>
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
  const isTouch = useIsTouch()
  // Baked CMS fields merged with the positions fetched from the media bucket.
  const ships = useShips()

  const spotlightEmbed = youtubeEmbedUrl(HOME_PAGE.mediaSpotlightYoutubeUrl)

  const activeChapter = chapter === null ? null : GLOBE_CHAPTERS[Math.min(chapter, GLOBE_CHAPTERS.length - 1)]
  const view = activeChapter
    ? { lat: activeChapter.lat, lng: activeChapter.lng, zoom: activeChapter.zoom, ms: 2200 }
    : INITIAL_VIEW

  const handleShipClick = useCallback(ship => setSelectedShip(ship), [])
  const handleDeselect = useCallback(() => setSelectedShip(null), [])

  const chapters = HOME_PAGE.chapters.map((ch, i) => ({
    ...CHAPTERS_STRUCT[i],
    title: tc(ch, 'title'),
    sub:   tc(ch, 'sub'),
    body:  tc(ch, 'body'),
    photo: ch.photo,
    photoPosition: ch.photoPosition,
  }))
  const pillars  = HOME_PAGE.pillars.map(p => ({ n: p.n, title: tc(p, 'title'), body: tc(p, 'body') }))
  const timeline = UNESCO_STEPS
  const projects = HOME_PAGE.projects.map(p => ({ n: p.n, action: p.action, title: tc(p, 'title'), body: tc(p, 'body') }))
  const oralItems = HOME_PAGE.oralItems.map(item => ({ n: item.n, title: tc(item, 'title'), body: tc(item, 'body') }))

  return (
    <div>
      {/* ── STICKY SPLIT HERO ── */}
      <div style={{ position: 'relative', background: '#f4ede1' }}>

          {/* Scrolling photo strip — absolutely positioned, full-width, behind the globe */}
          <div className="hero-photostrip" style={{ position: 'absolute', top: 68, left: 0, right: 0, height: 220, overflow: 'hidden', zIndex: 1 }}>
            <div className="photo-scroll-track" style={{ display: 'flex', height: '100%', gap: 3 }}>
              {HOME_PAGE.scrollPhotos.length > 0
                ? [...HOME_PAGE.scrollPhotos, ...HOME_PAGE.scrollPhotos].map((photo, i) => (
                    <div key={i} style={{ flexShrink: 0, width: 260, height: '100%', overflow: 'hidden' }}>
                      <img src={asset(photo.src)} alt={photo.alt || ''} style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block', filter: 'saturate(0.96)' }} />
                    </div>
                  ))
                : null}
            </div>
            <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 64, background: 'linear-gradient(to bottom, transparent, #f4ede1)', pointerEvents: 'none' }} />
          </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', minHeight: '100vh' }} className="hero-grid">

          {/* Globe first in DOM order: at <=900px .hero-grid becomes `display: block`,
              which puts the globe above the chapters and — unlike a single-column grid,
              where a sticky item unsticks at the end of its own row — lets it stay
              pinned while the chapters scroll past and fly the camera. */}
          <div className="hero-globe" style={{ gridColumn: 2, gridRow: 1, position: 'sticky', top: 0, height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 2 }}>
            <div style={{ position: 'absolute', bottom: 40, left: '50%', transform: 'translateX(-50%)', textAlign: 'center', zIndex: 10, pointerEvents: 'none' }}>
              <div style={{ fontSize: 10, color: '#c19a52', letterSpacing: '0.25em', textTransform: 'uppercase', opacity: 0.9 }}>
                {chapter !== null && t(`regions.${GLOBE_CHAPTERS[chapter]?.regionKey}`)}
              </div>
            </div>
            {/* Both sit top/bottom-right, where the ship card opens — hide them while
                one is showing rather than stacking chrome on top of chrome. */}
            {!selectedShip && (
              <>
                <div className="hero-shipcount" style={{ position: 'absolute', top: 90, right: 24, zIndex: 10, background: 'rgba(10,22,40,0.82)', border: '1px solid rgba(193,154,82,0.4)', padding: '12px 16px', borderRadius: 3, backdropFilter: 'blur(8px)', textAlign: 'center', pointerEvents: 'none' }}>
                  <div style={{ fontFamily: "'Playfair Display', serif", fontSize: 26, color: '#f4ede1', lineHeight: 1 }}>{SHIPS.length}</div>
                  <div style={{ fontSize: 10, color: '#c19a52', letterSpacing: '0.12em', textTransform: 'uppercase', marginTop: 4 }}>{t('home.shipCount')}</div>
                </div>
                <div className="hero-clickhint" style={{ position: 'absolute', bottom: 64, right: 24, zIndex: 10, fontSize: 10, color: 'rgba(193,154,82,0.6)', letterSpacing: '0.1em', textTransform: 'uppercase', writingMode: 'vertical-rl', pointerEvents: 'none' }}>
                  {t('home.clickShip')}
                </div>
              </>
            )}
            <ShipGlobe
              ships={ships}
              selectedShip={selectedShip}
              onSelectShip={handleShipClick}
              onDeselect={handleDeselect}
              view={view}
              /* The hero opens on the full globe turning; once the chapters take over
                 only "the world" one spins, since the closer framings would drift off. */
              autoRotate={activeChapter ? activeChapter.autoRotate : true}
              autoRotateSpeed={3}
              enableZoom={false}
              /* Rotating showcase: one random ship's card floats beside its marker
                 for a few seconds at a time. Home only. */
              spotlight
              /* On touch the hero has to stay scrollable — the map's drag handler would
                 otherwise swallow every vertical swipe. Markers stay tappable. */
              enableRotate={!isTouch}
            />

            {/* Same card the fleet map uses — the sticky globe column is positioned,
                so it anchors over the globe here just as it does there. */}
            <ShipCard ship={selectedShip} onClose={handleDeselect} />
          </div>

          {/* Scrolling text + chapters */}
          <div className="hero-text-col" style={{ gridColumn: 1, gridRow: 1, display: 'flex', flexDirection: 'column' }}>
            <div className="hero-intro" style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', justifyContent: 'flex-start', padding: '312px 64px 80px 4rem', position: 'relative' }}>

              <div style={{ fontSize: 10, color: '#a07d33', letterSpacing: '0.28em', textTransform: 'uppercase', marginBottom: 24 }}>
                {tc(HOME_PAGE, 'heroBadge')}
              </div>
              <h1 style={{ fontFamily: "'Playfair Display', serif", fontSize: 'clamp(28px, 3.2vw, 52px)', color: '#0f2238', lineHeight: 1.1, marginBottom: 20, fontWeight: 400 }}>
                {tc(HOME_PAGE, 'heroTitle').split('\n').map((line, i) => (
                  <span key={i}>{line}{i === 0 && <br />}</span>
                ))}
              </h1>
              <p style={{ fontSize: 16, color: 'rgba(15,34,56,0.7)', lineHeight: 1.85, maxWidth: 460, marginBottom: 16 }}>
                {tc(HOME_PAGE, 'heroPara1')}
              </p>
              <p style={{ fontSize: 15, color: 'rgba(15,34,56,0.5)', lineHeight: 1.8, maxWidth: 460, marginBottom: 48 }}>
                {tc(HOME_PAGE, 'heroPara2')}
              </p>
              <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap' }}>
                <button onClick={() => navigate('support')} style={{ background: '#c19a52', border: 'none', cursor: 'pointer', fontSize: 12, fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#0f2238', padding: '14px 28px', borderRadius: 2 }}>
                  {tc(HOME_PAGE, 'ctaPrimary')}
                </button>
                <button onClick={() => navigate('vloot')} style={{ background: 'none', border: '1px solid rgba(15,34,56,0.25)', cursor: 'pointer', fontSize: 12, fontWeight: 400, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'rgba(15,34,56,0.75)', padding: '14px 28px', borderRadius: 2 }}>
                  {tc(HOME_PAGE, 'ctaSecondary')}
                </button>
              </div>

              <div className="hero-scrollhint" style={{ position: 'absolute', bottom: 36, left: '4rem', display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{ width: 32, height: 1, background: 'rgba(193,154,82,0.5)' }} />
                <span style={{ fontSize: 10, color: 'rgba(15,34,56,0.4)', letterSpacing: '0.2em', textTransform: 'uppercase' }}>{tc(HOME_PAGE, 'scrollHint')}</span>
              </div>
            </div>

            {chapters.map((ch, i) => (
              <Fragment key={i}>
                <ChapterPanel ch={ch} index={i} onVisible={setChapter} chapterLabel={t('home.chapterLabel')} />
                {ch.photo && (
                  <div style={{ height: 220, overflow: 'hidden', position: 'relative', flexShrink: 0 }}>
                    <img src={asset(ch.photo.src)} alt={ch.photo.alt || ''} style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: ch.photoPosition || 'center center', display: 'block', filter: 'saturate(0.96)' }} />
                    <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to bottom, #efe7d8 0%, transparent 22%, transparent 78%, #efe7d8 100%)' }} />
                    <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to right, rgba(193,154,82,0.08) 0%, transparent 100%)' }} />
                  </div>
                )}
              </Fragment>
            ))}
          </div>
        </div>
      </div>

      {/* ── STATS ── */}
      <div style={{ background: '#ece2d0', borderTop: '1px solid rgba(193,154,82,0.35)', borderBottom: '1px solid rgba(193,154,82,0.35)', padding: '60px 2rem' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '2rem', alignItems: 'center' }} className="stats-grid">
            {HOME_PAGE.stats.map((s, i) => (
              <StatCounter key={i} value={s.value} label={tc(s, 'label')} prefix={s.prefix} suffix={s.suffix} />
            ))}
          </div>
          <div style={{ textAlign: 'center', marginTop: 28, fontSize: 12, color: 'rgba(15,34,56,0.45)', lineHeight: 1.7 }}>
            {tc(HOME_PAGE, 'statsCaption')}<br />
            <span style={{ fontSize: 11 }}>{t('home.statsEstimate')}</span>
          </div>
        </div>
      </div>

      {/* ── THREE PILLARS ── */}
      <div style={{ background: '#f4ede1', padding: '100px 2rem' }}>
        <div style={{ maxWidth: 1280, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: 64 }}>
            <div style={{ fontSize: 10, color: '#a07d33', letterSpacing: '0.22em', textTransform: 'uppercase', marginBottom: 16 }}>{t('home.craftBadge')}</div>
            <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: 'clamp(26px, 3.5vw, 44px)', color: '#0f2238', fontWeight: 400 }}>
              {tc(HOME_PAGE, 'pillarsTitle').split('\n').map((line, i) => (
                <span key={i}>{line}{i === 0 && <br />}</span>
              ))}
            </h2>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '3rem' }}>
            {pillars.map((p, i) => (
              <div key={i} style={{ borderTop: '2px solid #c19a52', paddingTop: 28 }}>
                <div style={{ fontSize: 11, color: '#a07d33', letterSpacing: '0.15em', textTransform: 'uppercase', marginBottom: 18 }}>{p.n}</div>
                <h3 style={{ fontFamily: "'Playfair Display', serif", fontSize: 22, color: '#0f2238', marginBottom: 16, lineHeight: 1.3 }}>{p.title}</h3>
                <p style={{ fontSize: 15, color: '#3a4f65', lineHeight: 1.85 }}>{p.body}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── UNESCO CALLOUT ── */}
      <div style={{ background: '#efe7d8', padding: '80px 2rem' }}>
        <div style={{ maxWidth: 1280, margin: '0 auto', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '4rem', alignItems: 'center' }} className="grid-2">
          <div>
            <div style={{ fontSize: 10, color: '#a07d33', letterSpacing: '0.22em', textTransform: 'uppercase', marginBottom: 18 }}>{tc(HOME_PAGE, 'unescoSectionBadge')}</div>
            <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: 'clamp(24px, 3vw, 40px)', color: '#0f2238', fontWeight: 400, marginBottom: 20, lineHeight: 1.2 }}>
              {tc(HOME_PAGE, 'unescoSectionTitle')}
            </h2>
            <p style={{ fontSize: 15, color: 'rgba(15,34,56,0.65)', lineHeight: 1.85, marginBottom: 32 }}>
              {tc(HOME_PAGE, 'unescoSectionBody')}
            </p>
            <button onClick={() => navigate('unesco')} style={{ background: 'none', border: '1px solid #c19a52', cursor: 'pointer', fontSize: 12, fontWeight: 500, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#a07d33', padding: '12px 24px', borderRadius: 2, transition: 'all 0.2s' }}
              onMouseEnter={e => { e.target.style.background = '#c19a52'; e.target.style.color = '#0f2238' }}
              onMouseLeave={e => { e.target.style.background = 'none'; e.target.style.color = '#a07d33' }}>
              {tc(HOME_PAGE, 'unescoSectionCta')}
            </button>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
            {timeline.map((step, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 20, paddingBottom: 20 }}>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', paddingTop: 4 }}>
                  <div style={{ width: 10, height: 10, borderRadius: '50%', flexShrink: 0, background: step.done ? '#c19a52' : 'none', border: step.done ? '2px solid #c19a52' : step.active ? '2px solid #c19a52' : '2px solid rgba(193,154,82,0.35)', boxShadow: step.active ? '0 0 0 4px rgba(193,154,82,0.18)' : 'none' }} />
                  {i < timeline.length - 1 && <div style={{ width: 1, height: 28, background: step.done ? 'rgba(193,154,82,0.5)' : 'rgba(193,154,82,0.2)', marginTop: 4 }} />}
                </div>
                <div>
                  <div style={{ fontSize: 11, color: '#a07d33', letterSpacing: '0.1em', marginBottom: 3 }}>{step.year}</div>
                  <div style={{ fontSize: 14, color: step.done ? '#0f2238' : step.active ? '#0f2238' : 'rgba(15,34,56,0.4)', fontStyle: step.done || step.active ? 'normal' : 'italic' }}>
                    {tc(step, 'label')}
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
          <div style={{ fontSize: 10, color: '#a07d33', letterSpacing: '0.22em', textTransform: 'uppercase', marginBottom: 16 }}>{tc(HOME_PAGE, 'projectsBadge')}</div>
          <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: 38, color: '#0f2238', marginBottom: 52, fontWeight: 400 }}>{tc(HOME_PAGE, 'projectsTitle')}</h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.5rem' }}>
            {projects.map((c, i) => (
              <div key={i} onClick={() => navigate(c.action)} style={{ background: '#faf6ee', border: '1px solid rgba(15,34,56,0.08)', borderRadius: 3, padding: '40px 36px', cursor: 'pointer', transition: 'transform 0.3s, box-shadow 0.3s', boxShadow: '0 1px 3px rgba(15,34,56,0.05)' }}
                onMouseEnter={e => { e.currentTarget.style.boxShadow = '0 10px 28px rgba(15,34,56,0.13)'; e.currentTarget.style.transform = 'translateY(-3px)' }}
                onMouseLeave={e => { e.currentTarget.style.boxShadow = '0 1px 3px rgba(15,34,56,0.05)'; e.currentTarget.style.transform = 'none' }}>
                <div style={{ fontSize: 10, color: '#c19a52', letterSpacing: '0.22em', marginBottom: 20 }}>{c.n}</div>
                <h3 style={{ fontFamily: "'Playfair Display', serif", fontSize: 21, color: '#0f2238', marginBottom: 16, lineHeight: 1.3 }}>{c.title}</h3>
                <p style={{ fontSize: 14, color: '#3a4f65', lineHeight: 1.8 }}>{c.body}</p>
                <div style={{ marginTop: 24, fontSize: 12, color: '#a07d33', letterSpacing: '0.06em' }}>{tc(HOME_PAGE, 'projectsReadMore')}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── ORAL HISTORY ── */}
      <div style={{ background: '#ece2d0', padding: '100px 2rem' }}>
        <div style={{ maxWidth: 1280, margin: '0 auto', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '4rem', alignItems: 'start' }} className="grid-2">
          <div>
            <div style={{ fontSize: 10, color: '#a07d33', letterSpacing: '0.22em', textTransform: 'uppercase', marginBottom: 18 }}>{tc(HOME_PAGE, 'oralBadge')}</div>
            <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: 'clamp(24px, 3vw, 40px)', color: '#0f2238', fontWeight: 400, marginBottom: 20, lineHeight: 1.2 }}>
              {tc(HOME_PAGE, 'oralTitle')}
            </h2>
            <p style={{ fontSize: 15, color: 'rgba(15,34,56,0.65)', lineHeight: 1.85, marginBottom: 20 }}>{tc(HOME_PAGE, 'oralPara1')}</p>
            <p style={{ fontSize: 15, color: 'rgba(15,34,56,0.65)', lineHeight: 1.85, marginBottom: 20 }}>{tc(HOME_PAGE, 'oralPara2')}</p>
            <p style={{ fontSize: 15, color: 'rgba(15,34,56,0.65)', lineHeight: 1.85, marginBottom: 32 }}>{tc(HOME_PAGE, 'oralPara3')}</p>
            <div style={{ fontSize: 12, color: '#a07d33', fontStyle: 'italic', borderLeft: '2px solid rgba(193,154,82,0.4)', paddingLeft: 16 }}>
              {tc(HOME_PAGE, 'oralNote')}
            </div>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
            {oralItems.map((item, i) => (
              <div key={i} style={{ paddingBottom: 28, borderBottom: i < 2 ? '1px solid rgba(193,154,82,0.2)' : 'none', marginBottom: i < 2 ? 28 : 0 }}>
                <div style={{ fontSize: 10, color: '#c19a52', letterSpacing: '0.2em', marginBottom: 10 }}>{item.n}</div>
                <div style={{ fontFamily: "'Playfair Display', serif", fontSize: 17, color: '#0f2238', marginBottom: 10 }}>{item.title}</div>
                <div style={{ fontSize: 13, color: '#3a4f65', lineHeight: 1.75 }}>{item.body}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── MEDIA SPOTLIGHT ── */}
      <div style={{ background: '#f4ede1', padding: '100px 2rem' }}>
        <div style={{ maxWidth: 1280, margin: '0 auto', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '4rem', alignItems: 'center' }} className="grid-2">
          <div style={{ aspectRatio: '16/9', borderRadius: 2, position: 'relative', overflow: 'hidden', background: '#0a1a2e' }}>
            {spotlightEmbed ? (
              <iframe
                title={tc(HOME_PAGE, 'mediaSpotlightTitle')}
                src={spotlightEmbed}
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                allowFullScreen
                loading="lazy"
                style={{ width: '100%', height: '100%', display: 'block', border: 'none' }}
              />
            ) : (
              <>
                <img src={HOME_PAGE.mediaSpotlightThumbnail ? asset(HOME_PAGE.mediaSpotlightThumbnail.src) : `${import.meta.env.BASE_URL}waterschatten-thumbnail.jpg`} alt={tc(HOME_PAGE, 'mediaSpotlightTitle')} style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
                <div style={{ position: 'absolute', inset: 0, background: 'rgba(10,26,46,0.35)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <div style={{ width: 56, height: 56, borderRadius: '50%', background: 'rgba(193,154,82,0.18)', border: '1px solid rgba(193,154,82,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <div style={{ width: 0, height: 0, borderLeft: '18px solid #c19a52', borderTop: '11px solid transparent', borderBottom: '11px solid transparent', marginLeft: 4 }} />
                  </div>
                </div>
              </>
            )}
          </div>
          <div>
            <div style={{ fontSize: 10, color: '#a07d33', letterSpacing: '0.22em', textTransform: 'uppercase', marginBottom: 16 }}>{tc(HOME_PAGE, 'mediaSpotlightBadge')}</div>
            <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: 32, color: '#0f2238', fontWeight: 400, marginBottom: 18, lineHeight: 1.2 }}>{tc(HOME_PAGE, 'mediaSpotlightTitle')}</h2>
            <p style={{ fontSize: 15, color: 'rgba(15,34,56,0.6)', lineHeight: 1.85, marginBottom: 28 }}>{tc(HOME_PAGE, 'mediaSpotlightBody')}</p>
            <button onClick={() => navigate('media')} style={{ background: 'none', border: '1px solid rgba(193,154,82,0.5)', cursor: 'pointer', fontSize: 12, fontWeight: 500, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#a07d33', padding: '10px 20px', borderRadius: 2 }}>
              {tc(HOME_PAGE, 'mediaSpotlightCta')}
            </button>
          </div>
        </div>
      </div>

      {/* ── BLOG PREVIEW ── */}
      <div style={{ background: '#efe7d8', padding: '100px 2rem' }}>
        <div style={{ maxWidth: 1280, margin: '0 auto' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 52 }}>
            <div>
              <div style={{ fontSize: 10, color: '#a07d33', letterSpacing: '0.22em', textTransform: 'uppercase', marginBottom: 12 }}>{tc(HOME_PAGE, 'newsBadge')}</div>
              <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: 38, color: '#0f2238', fontWeight: 400 }}>{tc(HOME_PAGE, 'newsTitle')}</h2>
            </div>
            <button onClick={() => navigate('blog')} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 13, color: '#a07d33', letterSpacing: '0.06em' }}>{tc(HOME_PAGE, 'newsAllCta')}</button>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '3rem' }}>
            {BLOG_POSTS.slice(0, 3).map(post => (
              <div key={post.id} style={{ borderTop: '1px solid rgba(15,34,56,0.15)', paddingTop: 28, cursor: 'pointer' }} onClick={() => navigate('blog')}>
                <div style={{ fontSize: 10, color: '#a07d33', letterSpacing: '0.15em', textTransform: 'uppercase', marginBottom: 12 }}>{tc(post, 'category')} · {post.date}</div>
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
          <div style={{ fontSize: 10, color: 'rgba(244,237,225,0.45)', letterSpacing: '0.22em', textTransform: 'uppercase', marginBottom: 20 }}>{tc(HOME_PAGE, 'helpBadge')}</div>
          <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: 'clamp(24px, 3.5vw, 42px)', color: '#f4ede1', fontWeight: 400, marginBottom: 20, lineHeight: 1.2 }}>{tc(HOME_PAGE, 'helpTitle')}</h2>
          <p style={{ fontSize: 16, color: 'rgba(244,237,225,0.65)', lineHeight: 1.8, marginBottom: 44 }}>
            {tc(HOME_PAGE, 'helpBody')}
          </p>
          <div style={{ display: 'flex', gap: 14, justifyContent: 'center', flexWrap: 'wrap' }}>
            {(HOME_PAGE.helpButtons || []).map((b, i) => (
              <button key={i} onClick={() => navigate(i === 0 ? 'support' : 'media')} style={{ background: i === 0 ? '#f4ede1' : 'none', border: i === 0 ? 'none' : '1px solid rgba(244,237,225,0.35)', cursor: 'pointer', fontSize: 13, fontWeight: i === 0 ? 600 : 400, letterSpacing: '0.06em', color: i === 0 ? '#6b4a2b' : '#f4ede1', padding: '13px 26px', borderRadius: 2 }}>
                {tc(b, 'label')}
              </button>
            ))}
          </div>
        </div>
      </div>

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
        /* The globe column is sticky at the viewport top, so it runs behind the fixed
           68px nav — push the ship card below it. */
        .hero-globe { --sz-shipcard-top: 88px; }
        @media (max-width: 900px) {
          /* block, not a single-column grid: a sticky grid item unsticks at the end of
             its own row, so the globe would scroll away before the first chapter. In
             normal flow both children share the hero's containing block and the globe
             stays pinned for the whole narrative. */
          .hero-grid { display: block !important; }
          .hero-globe {
            position: sticky !important;
            top: 68px !important;
            height: 48dvh !important;
            z-index: 3 !important;
            /* Pinned below the nav here, so the card needs no extra offset. */
            --sz-shipcard-top: 20px;
          }
          /* The 312px top padding only ever existed to clear the photo strip. */
          .hero-photostrip { display: none !important; }
          .hero-intro { padding: 32px 24px 72px !important; min-height: 0 !important; }
          .hero-chapter { padding: 40px 24px !important; min-height: 52vh !important; }
          .hero-shipcount { top: 12px !important; right: 12px !important; padding: 8px 12px !important; }
          .hero-clickhint { display: none !important; }
          .hero-scrollhint { left: 24px !important; bottom: 24px !important; }

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
