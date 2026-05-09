import { useState } from 'react'
import { useLanguage } from '../context/LanguageContext.jsx'
import { PARTNERS as PARTNERS_DATA } from '../data/content.js'

const PARTNERS = PARTNERS_DATA.length > 0
  ? PARTNERS_DATA.map(p => p.name)
  : [
      'Vereniging Bruine Vloot', 'Rijksdienst voor het Cultureel Erfgoed',
      'Ministerie van OCW', 'Gemeente Harlingen', 'Gemeente Enkhuizen',
      'Gemeente Hoorn', 'Zuiderzeemuseum', 'Scheepvaartmuseum Amsterdam',
      'Universiteit van Amsterdam', 'Rijksuniversiteit Groningen',
      'Waddenzee Werelderfgoed', 'Fries Museum',
      'Norsk Maritimt Museum', 'Museet for Søfart (DK)',
      'Stichting Varend Erfgoed NL', 'International Sail Training Association',
    ]

const statusColor = s => s === 'afgerond' ? '#c19a52' : s === 'sterk' ? '#4a9e6a' : '#7a9ec4'

export default function UNESCOPage() {
  const [openCrit, setOpenCrit] = useState(null)
  const { t } = useLanguage()

  const criteria = t('unesco.criteria')
  const timeline = t('home.timeline')
  const statusLabels = t('unesco.statusLabels')

  return (
    <div style={{ paddingTop: 68 }}>

      {/* Hero */}
      <div style={{ background: '#0f2238', padding: '80px 2rem 64px' }}>
        <div style={{ maxWidth: 860, margin: '0 auto', textAlign: 'center' }}>
          <div style={{ fontSize: 11, color: '#c19a52', letterSpacing: '0.2em', textTransform: 'uppercase', marginBottom: 20 }}>{t('unesco.badge')}</div>
          <h1 style={{ fontFamily: "'Playfair Display', serif", fontSize: 'clamp(30px, 5vw, 58px)', color: '#f4ede1', fontWeight: 400, lineHeight: 1.1, marginBottom: 24 }}>
            {t('unesco.title').split('\n').map((line, i) => (
              <span key={i}>{line}{i === 0 && <br />}</span>
            ))}
          </h1>
          <p style={{ fontSize: 17, color: 'rgba(244,237,225,0.65)', lineHeight: 1.85, maxWidth: 640, margin: '0 auto 40px' }}>
            {t('unesco.heroPara')}
          </p>
        </div>
      </div>

      {/* Criteria accordion */}
      <div style={{ background: '#f4ede1', padding: '80px 2rem' }}>
        <div style={{ maxWidth: 900, margin: '0 auto' }}>
          <div style={{ fontSize: 11, color: '#c19a52', letterSpacing: '0.2em', textTransform: 'uppercase', marginBottom: 16 }}>{t('unesco.criteriaBadge')}</div>
          <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: 38, color: '#0f2238', marginBottom: 48, fontWeight: 400 }}>{t('unesco.criteriaTitle')}</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            {criteria.map((c, i) => (
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
                      {statusLabels[c.status]}
                    </span>
                    <span style={{ color: '#c19a52', fontSize: 18, transform: openCrit === i ? 'rotate(180deg)' : 'none', transition: 'transform 0.25s', display: 'inline-block' }}>▾</span>
                  </div>
                </button>
                {openCrit === i && (
                  <div style={{ padding: '0 28px 28px', borderTop: '1px solid rgba(15,34,56,0.06)' }}>
                    <p style={{ fontSize: 15, color: '#3a4f65', lineHeight: 1.85, marginTop: 20, marginBottom: 20 }}>{c.body}</p>
                    <div style={{ fontSize: 11, color: '#c19a52', letterSpacing: '0.15em', textTransform: 'uppercase', marginBottom: 12 }}>{t('unesco.evidenceLabel')}</div>
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
          <div style={{ fontSize: 11, color: '#c19a52', letterSpacing: '0.2em', textTransform: 'uppercase', marginBottom: 16 }}>{t('unesco.timelineBadge')}</div>
          <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: 38, color: '#f4ede1', marginBottom: 48, fontWeight: 400 }}>{t('unesco.timelineTitle')}</h2>
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

      {/* Partners wall */}
      <div style={{ background: '#f4ede1', padding: '80px 2rem' }}>
        <div style={{ maxWidth: 1000, margin: '0 auto', textAlign: 'center' }}>
          <div style={{ fontSize: 11, color: '#c19a52', letterSpacing: '0.2em', textTransform: 'uppercase', marginBottom: 16 }}>{t('unesco.partnersBadge')}</div>
          <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: 38, color: '#0f2238', marginBottom: 48, fontWeight: 400 }}>{t('unesco.partnersTitle')}</h2>
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
            {t('unesco.ctaTitle')}
          </h2>
          <p style={{ fontSize: 16, color: 'rgba(244,237,225,0.6)', lineHeight: 1.8, marginBottom: 36 }}>
            {t('unesco.ctaBody')}
          </p>
          <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
            <button style={{ background: '#c19a52', border: 'none', cursor: 'pointer', fontSize: 13, fontWeight: 600, letterSpacing: '0.08em', color: '#0f2238', padding: '14px 28px', borderRadius: 2 }}>
              {t('unesco.ctaDownload')}
            </button>
            <button style={{ background: 'none', border: '1px solid rgba(193,154,82,0.4)', cursor: 'pointer', fontSize: 13, fontWeight: 400, letterSpacing: '0.06em', color: '#c19a52', padding: '14px 28px', borderRadius: 2 }}>
              {t('unesco.ctaEmail')}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
