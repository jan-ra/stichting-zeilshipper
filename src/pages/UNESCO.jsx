import { useState } from 'react'

const CRITERIA = [
  {
    code: 'R.1',
    title: 'Het element is immaterieel cultureel erfgoed',
    body: 'Het ambacht van de schipper Bruine Vloot omvat traditionele navigatietechnieken, zeilvaardigheid, tij- en weerkennis, scheepsonderhoud en de sociale organisatie van het leven aan boord. Deze kennis wordt mondeling en praktisch overgedragen en leeft in een actieve gemeenschap van circa 280 schippers en duizenden bemanningsleden.',
    evidence: ['Ethnografische documentatie (2021–2024)', 'Videodossier "Handen aan het Roer"', 'Opname Inventaris Immaterieel Erfgoed NL (2024)'],
    status: 'sterk',
  },
  {
    code: 'R.2',
    title: 'Opname bevordert zichtbaarheid en bewustwording',
    body: "UNESCO-erkenning zal de internationale zichtbaarheid van het ambacht vergroten, de status van schippers verhogen en financiering voor kennisoverdracht vergemakkelijken. Nederland heeft een rijke traditie van UNESCO-erfgoedprogramma's waarop wij kunnen voortbouwen.",
    evidence: ['Analyse impact eerdere NL-nominaties', 'Verklaring Ministerie OCW', 'Mediabereik: 2,4M impressies/jaar'],
    status: 'sterk',
  },
  {
    code: 'R.3',
    title: 'Beschermingsmaatregelen zijn getroffen',
    body: 'De stichting hanteert een meester-gezel-systeem voor kennisoverdracht, beheert een digitaal kennisarchief, publiceert informatieborden in twintig havens en coördineert een jaarlijks opleidingsprogramma voor vijftien aspirant-schippers.',
    evidence: ['Opleidingsplan 2024–2029', 'Digitaal kennisarchief (RCE-gecertificeerd)', 'Netwerk van twintig informatieborden'],
    status: 'sterk',
  },
  {
    code: 'R.4',
    title: 'Gemeenschap, groep of individuen hebben ingestemd',
    body: 'De Vereniging Bruine Vloot (VBV, 320 leden), het merendeel van de schippers en de betrokken havengemeenten hebben formeel ingestemd met de nominatie via ondertekende steunverklaringen.',
    evidence: ['Steunverklaring VBV (320 leden)', '187 individuele schipper-handtekeningen', 'Gemeenteraadsbesluiten 8 havengemeenten'],
    status: 'goed',
  },
  {
    code: 'R.5',
    title: 'Het element staat op de nationale inventaris',
    body: 'Op 5 oktober 2024 heeft de Inventaris Immaterieel Erfgoed Nederland het ambacht van de schipper Bruine Vloot formeel opgenomen. Dit is een wettelijk vereiste voor UNESCO-nominatie vanuit Nederland.',
    evidence: ['Opnamebesluit Inventaris IEN (5 okt 2024)', 'Publicatie Staatscourant nr. 48291', 'Bevestiging RCE 12 okt 2024'],
    status: 'afgerond',
  },
]

const TIMELINE = [
  { year: '2020', label: 'Meer dan 150 schepen bijeen bij Pampus', done: true },
  { year: '2021', label: 'Stichting Zeilschipper opgericht', done: true },
  { year: '2022', label: 'Start kennisdocumentatie', done: true },
  { year: '2023', label: 'Opname Inventaris Immaterieel Erfgoed', done: true },
  { year: '2024', label: 'Eerste informatieborden geplaatst', done: true },
  { year: '2025', label: 'Indiening bij Ministerie OCW', done: false, active: true },
  { year: '2026–27', label: 'UNESCO-nominatie & besluit', done: false },
]

const PARTNERS = [
  'Vereniging Bruine Vloot', 'Rijksdienst voor het Cultureel Erfgoed',
  'Ministerie van OCW', 'Gemeente Harlingen', 'Gemeente Enkhuizen',
  'Gemeente Hoorn', 'Zuiderzeemuseum', 'Scheepvaartmuseum Amsterdam',
  'Universiteit van Amsterdam', 'Rijksuniversiteit Groningen',
  'Waddenzee Werelderfgoed', 'Fries Museum',
  'Norsk Maritimt Museum', 'Museet for Søfart (DK)',
  'Stichting Varend Erfgoed NL', 'International Sail Training Association',
]

const statusColor = s => s === 'afgerond' ? '#c19a52' : s === 'sterk' ? '#4a9e6a' : '#7a9ec4'
const statusLabel = s => s === 'afgerond' ? 'Afgerond' : s === 'sterk' ? 'Sterk onderbouwd' : 'Goed onderbouwd'

export default function UNESCOPage() {
  const [openCrit, setOpenCrit] = useState(null)

  return (
    <div style={{ paddingTop: 68 }}>

      {/* Hero */}
      <div style={{ background: '#0f2238', padding: '80px 2rem 64px' }}>
        <div style={{ maxWidth: 860, margin: '0 auto', textAlign: 'center' }}>
          <div style={{ fontSize: 11, color: '#c19a52', letterSpacing: '0.2em', textTransform: 'uppercase', marginBottom: 20 }}>Road to UNESCO</div>
          <h1 style={{ fontFamily: "'Playfair Display', serif", fontSize: 'clamp(30px, 5vw, 58px)', color: '#f4ede1', fontWeight: 400, lineHeight: 1.1, marginBottom: 24 }}>
            Waarom UNESCO-erkenning<br />essentieel is
          </h1>
          <p style={{ fontSize: 17, color: 'rgba(244,237,225,0.65)', lineHeight: 1.85, maxWidth: 640, margin: '0 auto 40px' }}>
            UNESCO-erkenning als Immaterieel Cultureel Erfgoed van de Mensheid geeft het ambacht internationale bescherming, vergroot de financieringsmogelijkheden en verplicht Nederland tot actief beleid voor kennisbehoud.
          </p>
        </div>
      </div>

      {/* Criteria accordion */}
      <div style={{ background: '#f4ede1', padding: '80px 2rem' }}>
        <div style={{ maxWidth: 900, margin: '0 auto' }}>
          <div style={{ fontSize: 11, color: '#c19a52', letterSpacing: '0.2em', textTransform: 'uppercase', marginBottom: 16 }}>Nomineringscriteria</div>
          <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: 38, color: '#0f2238', marginBottom: 48, fontWeight: 400 }}>De vijf UNESCO-criteria</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            {CRITERIA.map((c, i) => (
              <div key={c.code} style={{ background: '#fff', border: '1px solid rgba(15,34,56,0.08)' }}>
                <button onClick={() => setOpenCrit(openCrit === i ? null : i)} style={{
                  width: '100%', background: 'none', border: 'none', cursor: 'pointer',
                  padding: '24px 28px', textAlign: 'left',
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16,
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 20, flex: 1 }}>
                    <span style={{ fontSize: 13, fontWeight: 700, color: '#c19a52', letterSpacing: '0.05em', fontFamily: 'monospace', flexShrink: 0 }}>{c.code}</span>
                    <span style={{ fontFamily: "'Playfair Display', serif", fontSize: 18, color: '#0f2238', textAlign: 'left' }}>{c.title}</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 16, flexShrink: 0 }}>
                    <span style={{ fontSize: 11, color: statusColor(c.status), border: `1px solid ${statusColor(c.status)}`, padding: '3px 10px', borderRadius: 2, letterSpacing: '0.08em' }} className="hide-mobile">
                      {statusLabel(c.status)}
                    </span>
                    <span style={{ color: '#c19a52', fontSize: 18, transform: openCrit === i ? 'rotate(180deg)' : 'none', transition: 'transform 0.25s', display: 'inline-block' }}>▾</span>
                  </div>
                </button>
                {openCrit === i && (
                  <div style={{ padding: '0 28px 28px', borderTop: '1px solid rgba(15,34,56,0.06)' }}>
                    <p style={{ fontSize: 15, color: '#3a4f65', lineHeight: 1.85, marginTop: 20, marginBottom: 20 }}>{c.body}</p>
                    <div style={{ fontSize: 11, color: '#c19a52', letterSpacing: '0.15em', textTransform: 'uppercase', marginBottom: 12 }}>Bewijs & bronnen</div>
                    {c.evidence.map(e => (
                      <div key={e} style={{ fontSize: 13, color: '#3a4f65', padding: '6px 0', borderBottom: '1px solid rgba(15,34,56,0.06)', display: 'flex', alignItems: 'center', gap: 10 }}>
                        <span style={{ color: '#c19a52' }}>→</span> {e}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Timeline */}
      <div style={{ background: '#0f2238', padding: '80px 2rem' }}>
        <div style={{ maxWidth: 900, margin: '0 auto' }}>
          <div style={{ fontSize: 11, color: '#c19a52', letterSpacing: '0.2em', textTransform: 'uppercase', marginBottom: 16 }}>Tijdlijn</div>
          <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: 38, color: '#f4ede1', marginBottom: 48, fontWeight: 400 }}>Van 2020 tot UNESCO-besluit</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
            {TIMELINE.map((step, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 20, paddingBottom: 20 }}>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', paddingTop: 4 }}>
                  <div style={{ width: 10, height: 10, borderRadius: '50%', flexShrink: 0, background: step.done ? '#c19a52' : 'none', border: step.done ? '2px solid #c19a52' : step.active ? '2px solid #c19a52' : '2px solid rgba(193,154,82,0.25)', boxShadow: step.active ? '0 0 0 4px rgba(193,154,82,0.12)' : 'none' }} />
                  {i < TIMELINE.length - 1 && <div style={{ width: 1, height: 28, background: step.done ? 'rgba(193,154,82,0.4)' : 'rgba(193,154,82,0.12)', marginTop: 4 }} />}
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

      {/* Partners wall */}
      <div style={{ background: '#f4ede1', padding: '80px 2rem' }}>
        <div style={{ maxWidth: 1000, margin: '0 auto', textAlign: 'center' }}>
          <div style={{ fontSize: 11, color: '#c19a52', letterSpacing: '0.2em', textTransform: 'uppercase', marginBottom: 16 }}>Draagvlak</div>
          <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: 38, color: '#0f2238', marginBottom: 48, fontWeight: 400 }}>Partners & ondersteuners</h2>
          <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: '12px 20px' }}>
            {PARTNERS.map(p => (
              <span key={p} style={{ fontSize: 13, color: '#0f2238', border: '1px solid rgba(15,34,56,0.2)', padding: '8px 18px', borderRadius: 2 }}>{p}</span>
            ))}
          </div>
        </div>
      </div>

      {/* CTA steunbrief */}
      <div style={{ background: '#0f2238', padding: '80px 2rem', textAlign: 'center' }}>
        <div style={{ maxWidth: 600, margin: '0 auto' }}>
          <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: 36, color: '#f4ede1', fontWeight: 400, marginBottom: 20 }}>
            Dien een steunbrief in
          </h2>
          <p style={{ fontSize: 16, color: 'rgba(244,237,225,0.6)', lineHeight: 1.8, marginBottom: 36 }}>
            Organisaties, gemeenten en individuen kunnen een steunbrief indienen via ons digitale formulier. Elke verklaring versterkt het UNESCO-dossier.
          </p>
          <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
            <button style={{ background: '#c19a52', border: 'none', cursor: 'pointer', fontSize: 13, fontWeight: 600, letterSpacing: '0.08em', color: '#0f2238', padding: '14px 28px', borderRadius: 2 }}>
              Download sjabloon (PDF)
            </button>
            <button style={{ background: 'none', border: '1px solid rgba(193,154,82,0.4)', cursor: 'pointer', fontSize: 13, fontWeight: 400, letterSpacing: '0.06em', color: '#c19a52', padding: '14px 28px', borderRadius: 2 }}>
              Verstuur per e-mail
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
