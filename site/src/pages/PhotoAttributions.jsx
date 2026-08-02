import { useLanguage } from '../context/LanguageContext.jsx'

const CREDITS = [
  {
    section: 'Schepen / Ships',
    items: [
      { description: 'Scheepsfoto\'s bruine vloot', credit: 'Stichting Zeilschipper', license: 'Alle rechten voorbehouden' },
    ],
  },
  {
    section: 'Teamfoto\'s / Team photos',
    items: [
      { description: 'Portretfoto\'s bestuursleden', credit: 'Stichting Zeilschipper', license: 'Alle rechten voorbehouden' },
    ],
  },
  {
    section: 'Overig / Other',
    items: [
      { description: 'Kaartmateriaal / Map tiles', credit: '© Stadia Maps, © Stamen Design, © OpenMapTiles, © OpenStreetMap contributors', license: 'CC BY 4.0 / ODbL' },
      { description: 'Lettertypen / Typefaces', credit: 'Playfair Display — Google Fonts (Claus Eggers Sørensen)', license: 'SIL Open Font License 1.1' },
      { description: 'Lettertypen / Typefaces', credit: 'Source Sans 3 — Google Fonts (Paul D. Hunt)', license: 'SIL Open Font License 1.1' },
    ],
  },
]

export default function PhotoAttributionsPage({ navigate }) {
  const { lang } = useLanguage()
  const isNl = lang !== 'en'

  return (
    <div style={{ paddingTop: 68 }}>
      <div style={{ background: '#0f2238', padding: '64px 2rem 48px' }}>
        <div style={{ maxWidth: 860, margin: '0 auto' }}>
          <div style={{ fontSize: 11, color: '#c19a52', letterSpacing: '0.2em', textTransform: 'uppercase', marginBottom: 16 }}>
            {isNl ? 'Juridisch' : 'Legal'}
          </div>
          <h1 style={{ fontFamily: "'Playfair Display', serif", fontSize: 'clamp(28px, 4vw, 48px)', color: '#f4ede1', fontWeight: 400, lineHeight: 1.15 }}>
            {isNl ? 'Fotoverantwoording & Bronvermelding' : 'Photo Credits & Attributions'}
          </h1>
          <p style={{ fontSize: 15, color: 'rgba(244,237,225,0.55)', lineHeight: 1.8, marginTop: 20, maxWidth: 560 }}>
            {isNl
              ? 'Op deze pagina vermelden wij de bronnen van beeldmateriaal en andere media die op deze website worden gebruikt.'
              : 'This page lists the sources of images and other media used on this website.'}
          </p>
        </div>
      </div>

      <div style={{ background: '#f4ede1', padding: '64px 2rem 96px' }}>
        <div style={{ maxWidth: 860, margin: '0 auto' }}>
          <div style={{ height: 3, background: 'linear-gradient(90deg, #c19a52, rgba(193,154,82,0.2))', marginBottom: 48 }} />

          {CREDITS.map((group) => (
            <section key={group.section} style={{ marginBottom: 48 }}>
              <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: 20, color: '#0f2238', marginBottom: 16, fontWeight: 400, borderBottom: '1px solid rgba(15,34,56,0.12)', paddingBottom: 10 }}>
                {group.section}
              </h2>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                {group.items.map((item, i) => (
                  <div key={i} style={{ display: 'grid', gridTemplateColumns: '2fr 2fr 1fr', gap: '1rem', padding: '14px 0', borderBottom: '1px solid rgba(15,34,56,0.06)', alignItems: 'start' }}>
                    <div style={{ fontSize: 14, color: '#3a4f65' }}>{item.description}</div>
                    <div style={{ fontSize: 14, color: '#3a4f65' }}>{item.credit}</div>
                    <div style={{ fontSize: 12, color: 'rgba(15,34,56,0.45)', fontStyle: 'italic' }}>{item.license}</div>
                  </div>
                ))}
              </div>
            </section>
          ))}

          <div style={{ background: 'rgba(193,154,82,0.08)', border: '1px solid rgba(193,154,82,0.2)', borderRadius: 2, padding: '20px 24px', marginBottom: 48 }}>
            <p style={{ fontSize: 14, color: '#3a4f65', lineHeight: 1.8, margin: 0 }}>
              {isNl
                ? 'Mist u een bronvermelding of heeft u een opmerking over het gebruik van beeldmateriaal? Neem dan contact met ons op via '
                : 'Missing an attribution or have a concern about the use of an image? Please contact us at '}
              <a href="mailto:info@zeilschipper.nl" style={{ color: '#c19a52' }}>info@zeilschipper.nl</a>.
            </p>
          </div>

          <button onClick={() => navigate('home')} style={{
            background: 'none', border: '1px solid rgba(193,154,82,0.5)', cursor: 'pointer',
            fontSize: 12, color: '#c19a52', padding: '10px 20px', borderRadius: 2, letterSpacing: '0.08em',
          }}>
            {isNl ? '← Terug naar home' : '← Back to home'}
          </button>
        </div>
      </div>
    </div>
  )
}
