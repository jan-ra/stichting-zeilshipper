import { useLanguage } from '../context/LanguageContext.jsx'
import { SITE_SETTINGS } from '../data/content.js'

export default function Footer({ navigate }) {
  const { t, tc } = useLanguage()

  const NAV_LINKS = [
    { id: 'home', label: t('nav.home') },
    { id: 'vloot', label: t('nav.fleet') },
    { id: 'informatieborden', label: t('nav.infoBorden') },
    { id: 'unesco', label: t('nav.unesco') },
    { id: 'team', label: t('nav.team') },
    { id: 'media', label: t('footer.mediaLabel') },
    { id: 'blog', label: t('nav.blog') },
  ]

  return (
    <footer style={{ background: '#0a1a2e', color: 'rgba(244,237,225,0.7)', paddingTop: 64, paddingBottom: 40 }}>
      <div style={{ maxWidth: 1280, margin: '0 auto', padding: '0 2rem' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '3rem', marginBottom: 56 }}>

          <div>
            <div style={{ fontFamily: "'Playfair Display', serif", fontSize: 20, color: '#f4ede1', marginBottom: 8 }}>
              {SITE_SETTINGS.orgName}
            </div>
            <div style={{ fontSize: 11, color: '#c19a52', letterSpacing: '0.15em', textTransform: 'uppercase', marginBottom: 20 }}>
              {SITE_SETTINGS.brandSubtitle}
            </div>
            <p style={{ fontSize: 14, lineHeight: 1.8, color: 'rgba(244,237,225,0.6)', maxWidth: 280 }}>
              {tc(SITE_SETTINGS, 'footerTagline')}
            </p>
          </div>

          <div>
            <div style={{ fontSize: 11, fontWeight: 600, letterSpacing: '0.15em', textTransform: 'uppercase', color: '#c19a52', marginBottom: 20 }}>
              {t('footer.navigation')}
            </div>
            {NAV_LINKS.map(link => (
              <button key={link.id} onClick={() => { navigate(link.id); window.scrollTo(0,0) }} style={{
                display: 'block', background: 'none', border: 'none', cursor: 'pointer',
                fontSize: 14, color: 'rgba(244,237,225,0.6)', padding: '4px 0', textAlign: 'left',
                transition: 'color 0.2s',
              }}
              onMouseEnter={e => e.target.style.color = '#f4ede1'}
              onMouseLeave={e => e.target.style.color = 'rgba(244,237,225,0.6)'}
              >
                {link.label}
              </button>
            ))}
          </div>

          <div>
            <div style={{ fontSize: 11, fontWeight: 600, letterSpacing: '0.15em', textTransform: 'uppercase', color: '#c19a52', marginBottom: 20 }}>
              {t('footer.contact')}
            </div>
            <div style={{ fontSize: 14, lineHeight: 2, color: 'rgba(244,237,225,0.6)' }}>
              <div>{SITE_SETTINGS.contactEmail}</div>
              <div>{SITE_SETTINGS.addressLine1}</div>
              <div>{SITE_SETTINGS.addressLine2}</div>
            </div>
          </div>
        </div>

        <div style={{ borderTop: '1px solid rgba(255,255,255,0.08)', paddingTop: 24, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
          <div style={{ fontSize: 12, color: 'rgba(244,237,225,0.35)' }}>
            {t('footer.copyright')}
          </div>
          <div style={{ fontSize: 12, color: 'rgba(244,237,225,0.35)', display: 'flex', gap: 20 }}>
            {t('footer.legal').map(l => (
              <span key={l} style={{ cursor: 'pointer', transition: 'color 0.2s' }}
                onMouseEnter={e => e.target.style.color = 'rgba(244,237,225,0.65)'}
                onMouseLeave={e => e.target.style.color = 'rgba(244,237,225,0.35)'}
              >{l}</span>
            ))}
          </div>
        </div>
      </div>
    </footer>
  )
}
