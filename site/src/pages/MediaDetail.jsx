import { MEDIA_ITEMS } from '../data/content.js'
import { useLanguage } from '../context/LanguageContext.jsx'

const TYPE_ICONS = { video: '▶', photo: '◼', text: '≡', podcast: '◉', project: '◈' }

export default function MediaDetailPage({ navigate, mediaItemId }) {
  const { t, tc } = useLanguage()
  const item = MEDIA_ITEMS.find(i => i.id === mediaItemId) || MEDIA_ITEMS.find(i => i.type === 'video') || MEDIA_ITEMS[0]

  if (!item) {
    return (
      <div style={{ paddingTop: 68, minHeight: '60vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: 13, color: '#c19a52', marginBottom: 16 }}>{t('mediaDetail.notFound')}</div>
          <button onClick={() => navigate('media')} style={{ background: 'none', border: '1px solid rgba(15,34,56,0.3)', cursor: 'pointer', padding: '10px 20px', fontSize: 13 }}>
            {t('mediaDetail.backToMedia')}
          </button>
        </div>
      </div>
    )
  }

  const isVideo   = item.type === 'video'
  const isPodcast = item.type === 'podcast'
  const typeLabel = t('mediaDetail.typeLabels')[item.type] || item.type

  return (
    <div style={{ paddingTop: 68 }}>

      {/* Hero */}
      <div style={{ background: '#0f2238', padding: '64px 2rem 72px' }}>
        <div style={{ maxWidth: 900, margin: '0 auto' }}>
          <button
            onClick={() => navigate('media')}
            style={{
              background: 'none', border: 'none', cursor: 'pointer', padding: 0,
              fontSize: 12, color: 'rgba(193,154,82,0.7)', letterSpacing: '0.12em',
              textTransform: 'uppercase', marginBottom: 40, display: 'flex', alignItems: 'center', gap: 8,
            }}
          >
            {t('mediaDetail.back')}
          </button>

          <div style={{ display: 'flex', gap: 12, alignItems: 'center', marginBottom: 24, flexWrap: 'wrap' }}>
            <span style={{
              fontSize: 10, color: '#c19a52', letterSpacing: '0.15em', textTransform: 'uppercase',
              border: '1px solid rgba(193,154,82,0.4)', padding: '3px 10px', borderRadius: 2,
            }}>
              {typeLabel}
            </span>
            {item.tag && (
              <span style={{ fontSize: 10, color: 'rgba(193,154,82,0.6)', letterSpacing: '0.12em', textTransform: 'uppercase' }}>
                {tc(item, 'tag')}
              </span>
            )}
            <span style={{ fontSize: 12, color: 'rgba(244,237,225,0.3)', fontFamily: 'monospace', letterSpacing: '0.04em' }}>
              {item.format}
            </span>
          </div>

          <h1 style={{
            fontFamily: "'Playfair Display', serif",
            fontSize: 'clamp(26px, 4vw, 48px)',
            color: '#f4ede1', fontWeight: 400, lineHeight: 1.15, marginBottom: 20,
          }}>
            {tc(item, 'title')}
          </h1>

          <p style={{ fontSize: 15, color: 'rgba(244,237,225,0.55)', lineHeight: 1.8, maxWidth: 660 }}>
            {tc(item, 'description')}
          </p>
        </div>
      </div>

      {/* Gold divider */}
      <div style={{ height: 3, background: 'linear-gradient(90deg, #c19a52, rgba(193,154,82,0.2))' }} />

      {/* Content */}
      <div style={{ background: '#0a1a2e', padding: '48px 2rem 80px' }}>
        <div style={{ maxWidth: 900, margin: '0 auto' }}>

          {isVideo && (
            <div style={{ borderRadius: 2, overflow: 'hidden', background: '#000', boxShadow: '0 8px 40px rgba(0,0,0,0.5)' }}>
              <video
                controls
                style={{ width: '100%', display: 'block', maxHeight: 540 }}
                src={item.url}
              >
                Je browser ondersteunt geen video afspelen.
              </video>
            </div>
          )}

          {!isVideo && (
            <div style={{
              border: '1px solid rgba(193,154,82,0.2)', borderRadius: 2,
              padding: '56px 48px', display: 'flex', flexDirection: 'column',
              alignItems: 'center', gap: 28, textAlign: 'center',
            }}>
              <div style={{
                width: 80, height: 80, borderRadius: '50%',
                background: 'rgba(193,154,82,0.1)', border: '1px solid rgba(193,154,82,0.3)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 36, color: '#c19a52',
              }}>
                {TYPE_ICONS[item.type] || '◈'}
              </div>
              <div>
                <div style={{ fontFamily: "'Playfair Display', serif", fontSize: 22, color: '#f4ede1', marginBottom: 10 }}>
                  {tc(item, 'title')}
                </div>
                <div style={{ fontSize: 14, color: 'rgba(244,237,225,0.45)', lineHeight: 1.7, maxWidth: 480 }}>
                  {tc(item, 'description')}
                </div>
              </div>
              <a
                href={item.url}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  background: '#c19a52', color: '#0f2238',
                  fontSize: 13, fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase',
                  padding: '13px 28px', borderRadius: 2, textDecoration: 'none',
                  display: 'inline-block',
                }}
              >
                {isPodcast ? t('mediaDetail.listenNow') : t('mediaDetail.openLink')}
              </a>
            </div>
          )}
        </div>
      </div>

      {/* Footer nav */}
      <div style={{ background: '#0f2238', borderTop: '1px solid rgba(193,154,82,0.12)', padding: '40px 2rem' }}>
        <div style={{ maxWidth: 900, margin: '0 auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 16 }}>
          <button
            onClick={() => navigate('media')}
            style={{
              background: 'none', border: '1px solid rgba(193,154,82,0.35)', cursor: 'pointer',
              fontSize: 12, color: '#c19a52', padding: '10px 20px', borderRadius: 2,
              letterSpacing: '0.08em', textTransform: 'uppercase',
            }}
          >
            {t('mediaDetail.allFiles')}
          </button>
          <div style={{ fontSize: 11, color: 'rgba(244,237,225,0.25)', letterSpacing: '0.1em', textTransform: 'uppercase' }}>
            Stichting Zeilschipper
          </div>
        </div>
      </div>

    </div>
  )
}
