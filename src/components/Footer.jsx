export default function Footer({ navigate }) {
  return (
    <footer style={{ background: '#0a1a2e', color: 'rgba(244,237,225,0.7)', paddingTop: 64, paddingBottom: 40 }}>
      <div style={{ maxWidth: 1280, margin: '0 auto', padding: '0 2rem' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '3rem', marginBottom: 56 }}>

          <div>
            <div style={{ fontFamily: "'Playfair Display', serif", fontSize: 20, color: '#f4ede1', marginBottom: 8 }}>
              Stichting Zeilschipper
            </div>
            <div style={{ fontSize: 11, color: '#c19a52', letterSpacing: '0.15em', textTransform: 'uppercase', marginBottom: 20 }}>
              Bruine Vloot
            </div>
            <p style={{ fontSize: 14, lineHeight: 1.8, color: 'rgba(244,237,225,0.6)', maxWidth: 280 }}>
              Wij werken aan UNESCO-erkenning van het ambacht van de schipper Bruine Vloot als immaterieel cultureel erfgoed van de mensheid.
            </p>
          </div>

          <div>
            <div style={{ fontSize: 11, fontWeight: 600, letterSpacing: '0.15em', textTransform: 'uppercase', color: '#c19a52', marginBottom: 20 }}>
              Navigatie
            </div>
            {[
              { id: 'home', label: 'Home' },
              { id: 'vloot', label: 'De schippers en de Vloot' },
              { id: 'informatieborden', label: 'Informatieborden' },
              { id: 'unesco', label: 'Road to UNESCO' },
              { id: 'team', label: 'Team' },
              { id: 'media', label: 'Media & Bouwdozen' },
              { id: 'blog', label: 'Blog' },
            ].map(link => (
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
              Contact
            </div>
            <div style={{ fontSize: 14, lineHeight: 2, color: 'rgba(244,237,225,0.6)' }}>
              <div>info@zeilschipper.nl</div>
              <div>Aambeeldstraat 20</div>
              <div>1021 KB Amsterdam</div>
            </div>
          </div>
        </div>

        <div style={{ borderTop: '1px solid rgba(255,255,255,0.08)', paddingTop: 24, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
          <div style={{ fontSize: 12, color: 'rgba(244,237,225,0.35)' }}>
            © 2025 Stichting Zeilschipper. Alle rechten voorbehouden.
          </div>
          <div style={{ fontSize: 12, color: 'rgba(244,237,225,0.35)', display: 'flex', gap: 20 }}>
            {['Privacybeleid', 'Disclaimer', 'Toegankelijkheid'].map(l => (
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
