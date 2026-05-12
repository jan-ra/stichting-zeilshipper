import { useState } from 'react'
import { SUPPORT_LETTER_PAGE } from '../data/content.js'
import { useLanguage } from '../context/LanguageContext.jsx'

export default function SupportLetterPage({ navigate }) {
  const { t, tc } = useLanguage()
  const s = t('supportLetter')

  const [form, setForm] = useState({ name: '', org: '', role: '', email: '', type: 'individual', message: '' })
  const [sent, setSent] = useState(false)

  const set = k => e => setForm(f => ({ ...f, [k]: e.target.value }))

  const handleSubmit = e => {
    e.preventDefault()
    // Construct mailto link with form data
    const subject = encodeURIComponent(s.emailSubject)
    const body = encodeURIComponent(
      `${s.emailFields.name}: ${form.name}\n` +
      `${s.emailFields.org}: ${form.org}\n` +
      `${s.emailFields.role}: ${form.role}\n` +
      `${s.emailFields.type}: ${form.type}\n\n` +
      `${s.emailFields.message}:\n${form.message}`
    )
    window.location.href = `mailto:info@zeilschipper.nl?subject=${subject}&body=${body}`
    setSent(true)
  }

  const inputStyle = {
    width: '100%', boxSizing: 'border-box',
    background: 'rgba(244,237,225,0.06)', border: '1px solid rgba(193,154,82,0.25)',
    color: '#f4ede1', fontSize: 14, padding: '12px 14px', borderRadius: 2,
    fontFamily: "'Source Sans 3', sans-serif", outline: 'none',
  }

  const labelStyle = {
    display: 'block', fontSize: 10, color: '#c19a52',
    letterSpacing: '0.15em', textTransform: 'uppercase', marginBottom: 8,
  }

  return (
    <div style={{ paddingTop: 68, background: '#0b1d30', minHeight: '100vh' }}>

      {/* Hero */}
      <div style={{ background: '#0f2238', padding: '72px 2rem 64px', borderBottom: '1px solid rgba(193,154,82,0.15)' }}>
        <div style={{ maxWidth: 720, margin: '0 auto' }}>
          <button
            onClick={() => navigate('home')}
            style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, fontSize: 12, color: 'rgba(193,154,82,0.6)', letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: 40, display: 'flex', alignItems: 'center', gap: 8 }}
          >
            ← {s.back}
          </button>
          <div style={{ fontSize: 10, color: '#c19a52', letterSpacing: '0.22em', textTransform: 'uppercase', marginBottom: 18 }}>{tc(SUPPORT_LETTER_PAGE, 'badge')}</div>
          <h1 style={{ fontFamily: "'Playfair Display', serif", fontSize: 'clamp(28px, 4vw, 48px)', color: '#f4ede1', fontWeight: 400, lineHeight: 1.15, marginBottom: 20 }}>
            {tc(SUPPORT_LETTER_PAGE, 'title')}
          </h1>
          <p style={{ fontSize: 16, color: 'rgba(244,237,225,0.6)', lineHeight: 1.85, maxWidth: 560 }}>
            {tc(SUPPORT_LETTER_PAGE, 'intro')}
          </p>
        </div>
      </div>

      {/* Gold divider */}
      <div style={{ height: 3, background: 'linear-gradient(90deg, #c19a52, rgba(193,154,82,0.15))' }} />

      <div style={{ maxWidth: 720, margin: '0 auto', padding: '64px 2rem 100px' }}>

        {sent ? (
          /* Confirmation */
          <div style={{ textAlign: 'center', padding: '80px 0' }}>
            <div style={{ fontFamily: "'Playfair Display', serif", fontSize: 32, color: '#f4ede1', marginBottom: 20 }}>{tc(SUPPORT_LETTER_PAGE, 'thankYouTitle')}</div>
            <p style={{ fontSize: 15, color: 'rgba(244,237,225,0.55)', lineHeight: 1.8, maxWidth: 440, margin: '0 auto 40px' }}>{tc(SUPPORT_LETTER_PAGE, 'thankYouBody')}</p>
            <button onClick={() => navigate('home')} style={{ background: 'none', border: '1px solid rgba(193,154,82,0.4)', cursor: 'pointer', fontSize: 12, color: '#c19a52', padding: '11px 24px', borderRadius: 2, letterSpacing: '0.08em', textTransform: 'uppercase' }}>
              {tc(SUPPORT_LETTER_PAGE, 'backHomeLabel')}
            </button>
          </div>
        ) : (
          <>
            {/* Why it matters */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: '1.5rem', marginBottom: 64 }} className="support-pillars">
              {(SUPPORT_LETTER_PAGE.pillars || []).map((p, i) => (
                <div key={i} style={{ borderTop: '2px solid rgba(193,154,82,0.4)', paddingTop: 20 }}>
                  <div style={{ fontSize: 10, color: '#c19a52', letterSpacing: '0.15em', textTransform: 'uppercase', marginBottom: 10 }}>{p.n}</div>
                  <div style={{ fontFamily: "'Playfair Display', serif", fontSize: 16, color: '#f4ede1', marginBottom: 8, lineHeight: 1.3 }}>{tc(p, 'title')}</div>
                  <div style={{ fontSize: 13, color: 'rgba(244,237,225,0.45)', lineHeight: 1.7 }}>{tc(p, 'body')}</div>
                </div>
              ))}
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.25rem', marginBottom: '1.25rem' }} className="support-grid-2">
                <div>
                  <label style={labelStyle}>{s.fields.name} *</label>
                  <input required style={inputStyle} value={form.name} onChange={set('name')} placeholder={s.placeholders.name} />
                </div>
                <div>
                  <label style={labelStyle}>{s.fields.org}</label>
                  <input style={inputStyle} value={form.org} onChange={set('org')} placeholder={s.placeholders.org} />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.25rem', marginBottom: '1.25rem' }} className="support-grid-2">
                <div>
                  <label style={labelStyle}>{s.fields.role}</label>
                  <input style={inputStyle} value={form.role} onChange={set('role')} placeholder={s.placeholders.role} />
                </div>
                <div>
                  <label style={labelStyle}>{s.fields.email} *</label>
                  <input required type="email" style={inputStyle} value={form.email} onChange={set('email')} placeholder={s.placeholders.email} />
                </div>
              </div>

              <div style={{ marginBottom: '1.25rem' }}>
                <label style={labelStyle}>{s.fields.type}</label>
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  {s.types.map(({ value, label }) => (
                    <button
                      key={value} type="button"
                      onClick={() => setForm(f => ({ ...f, type: value }))}
                      style={{
                        background: form.type === value ? '#c19a52' : 'rgba(244,237,225,0.06)',
                        border: `1px solid ${form.type === value ? '#c19a52' : 'rgba(193,154,82,0.25)'}`,
                        color: form.type === value ? '#0f2238' : 'rgba(244,237,225,0.7)',
                        cursor: 'pointer', fontSize: 12, padding: '8px 16px', borderRadius: 2,
                        letterSpacing: '0.06em', transition: 'all 0.15s',
                      }}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </div>

              <div style={{ marginBottom: '2rem' }}>
                <label style={labelStyle}>{s.fields.message} *</label>
                <textarea
                  required rows={6}
                  style={{ ...inputStyle, resize: 'vertical', lineHeight: 1.7 }}
                  value={form.message} onChange={set('message')}
                  placeholder={s.placeholders.message}
                />
                <div style={{ fontSize: 11, color: 'rgba(193,154,82,0.45)', marginTop: 8 }}>{s.messageHint}</div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: 20, flexWrap: 'wrap' }}>
                <button
                  type="submit"
                  style={{ background: '#c19a52', border: 'none', cursor: 'pointer', fontSize: 13, fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#0f2238', padding: '14px 32px', borderRadius: 2 }}
                >
                  {s.submit}
                </button>
                <span style={{ fontSize: 12, color: 'rgba(244,237,225,0.3)' }}>{s.privacy}</span>
              </div>
            </form>
          </>
        )}
      </div>

      <style>{`
        input::placeholder, textarea::placeholder { color: rgba(244,237,225,0.25); }
        input:focus, textarea:focus { border-color: rgba(193,154,82,0.6) !important; }
        @media (max-width: 640px) {
          .support-pillars { grid-template-columns: 1fr !important; }
          .support-grid-2 { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </div>
  )
}
