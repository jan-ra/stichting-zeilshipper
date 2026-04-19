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
              Bruine Vloot · UNESCO-nominatie
            </div>
            <p style={{ fontSize: 14, lineHeight: 1.8, color: 'rgba(244,237,225,0.6)', maxWidth: 280 }}>
              Wij werken aan UNESCO-erkenning van het ambacht van de schipper Bruine Vloot als immaterieel cultureel erfgoed van de mensheid.
            </p>
            <div style={{ marginTop: 24, display: 'flex', gap: 12 }}>
              {['ANBI', 'RCE'].map(badge => (
                <span key={badge} style={{
                  fontSize: 10, fontWeight: 600, letterSpacing: '0.12em',
                  border: '1px solid rgba(193,154,82,0.4)', color: '#c19a52',
                  padding: '4px 10px', borderRadius: 2,
                }}>
                  {badge}
                </span>
              ))}
            </div>
          </div>

          <div>
            <div style={{ fontSize: 11, fontWeight: 600, letterSpacing: '0.15em', textTransform: 'uppercase', color: '#c19a52', marginBottom: 20 }}>
              Navigatie
            </div>
            {[
              { id: 'home', label: 'Home' },
              { id: 'vloot', label: 'De Vloot' },
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
              Governance
            </div>
            {[
              ['KvK', '87654321'],
              ['RSIN/fiscaal', '865 432 109'],
              ['ANBI-status', 'Verleend 2021'],
              ['Bestuur', '6 leden'],
              ['Beloningsbeleid', 'Onbezoldigd'],
            ].map(([label, value]) => (
              <div key={label} style={{ display: 'flex', justifyContent: 'space-between', padding: '5px 0', borderBottom: '1px solid rgba(255,255,255,0.05)', fontSize: 13 }}>
                <span style={{ color: 'rgba(244,237,225,0.45)' }}>{label}</span>
                <span style={{ color: 'rgba(244,237,225,0.75)' }}>{value}</span>
              </div>
            ))}
            <div style={{ marginTop: 16, fontSize: 13, color: 'rgba(244,237,225,0.45)', lineHeight: 1.7 }}>
              Jaarrekening en beleidsplan beschikbaar op aanvraag.
            </div>
          </div>

          <div>
            <div style={{ fontSize: 11, fontWeight: 600, letterSpacing: '0.15em', textTransform: 'uppercase', color: '#c19a52', marginBottom: 20 }}>
              Contact
            </div>
            <div style={{ fontSize: 14, lineHeight: 2, color: 'rgba(244,237,225,0.6)' }}>
              <div>info@zeilschipper.nl</div>
              <div>Postbus 114</div>
              <div>8860 AA Harlingen</div>
              <div style={{ marginTop: 12 }}>+31 (0)517 41 23 00</div>
            </div>
            <div style={{ marginTop: 24 }}>
              <div style={{ fontSize: 11, fontWeight: 600, letterSpacing: '0.15em', textTransform: 'uppercase', color: '#c19a52', marginBottom: 12 }}>
                Partners
              </div>
              {['Ministerie OCW', 'RCE', 'VBV', 'Waddenzee Werelderfgoed'].map(p => (
                <div key={p} style={{ fontSize: 13, color: 'rgba(244,237,225,0.45)', padding: '3px 0' }}>{p}</div>
              ))}
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
