import { useState } from 'react'
import { MEDIA_ITEMS } from '../data/content.js'

const TYPE_ICONS = { video: '▶', photo: '◼', text: '≡', podcast: '◉', project: '◈' }
const FORMAT_COLORS = { MP4: '#4a6e9e', ZIP: '#6b4a2b', PDF: '#9e4a4a', MP3: '#4a9e6a' }
const CATEGORIES = ['all', 'video', 'foto', 'tekst', 'project', 'podcast']
const CAT_LABELS = { all: 'Alles', video: "Video's", foto: "Foto's", tekst: 'Teksten', project: 'Projecten', podcast: 'Podcast' }

export default function MediaPage() {
  const [filter, setFilter] = useState('all')
  const filtered = filter === 'all' ? MEDIA_ITEMS : MEDIA_ITEMS.filter(i => i.category === filter)

  return (
    <div style={{ paddingTop: 68 }}>
      <div style={{ background: '#0f2238', padding: '72px 2rem 60px' }}>
        <div style={{ maxWidth: 1280, margin: '0 auto' }}>
          <div style={{ fontSize: 11, color: '#c19a52', letterSpacing: '0.2em', textTransform: 'uppercase', marginBottom: 16 }}>Media & Bouwdozen</div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: '2rem', alignItems: 'flex-end' }} className="media-header">
            <div>
              <h1 style={{ fontFamily: "'Playfair Display', serif", fontSize: 'clamp(26px, 4vw, 48px)', color: '#f4ede1', fontWeight: 400, marginBottom: 16 }}>Downloadcentrum</h1>
              <p style={{ fontSize: 15, color: 'rgba(244,237,225,0.55)', lineHeight: 1.75, maxWidth: 520 }}>
                Video's, persfoto's, teksten en podcasts voor pers, onderzoekers en geïnteresseerden. Alle materialen zijn vrij beschikbaar voor niet-commercieel gebruik met bronvermelding.
              </p>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontFamily: "'Playfair Display', serif", fontSize: 36, color: '#f4ede1' }}>{MEDIA_ITEMS.length}</div>
              <div style={{ fontSize: 11, color: '#c19a52', letterSpacing: '0.1em', textTransform: 'uppercase' }}>bestanden</div>
            </div>
          </div>
          <div style={{ display: 'flex', gap: 2, marginTop: 32, flexWrap: 'wrap' }}>
            {CATEGORIES.map(c => (
              <button key={c} onClick={() => setFilter(c)} style={{
                background: filter === c ? '#c19a52' : 'rgba(255,255,255,0.06)',
                border: 'none', cursor: 'pointer',
                fontSize: 11, fontWeight: 500, letterSpacing: '0.1em', textTransform: 'uppercase',
                color: filter === c ? '#0f2238' : 'rgba(244,237,225,0.5)',
                padding: '8px 20px', borderRadius: 2, transition: 'all 0.2s',
              }}>
                {CAT_LABELS[c]}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Featured video */}
      <div style={{ background: '#0a1a2e', padding: '64px 2rem', borderBottom: '1px solid rgba(193,154,82,0.15)' }}>
        <div style={{ maxWidth: 1280, margin: '0 auto' }}>
          <div style={{ fontSize: 11, color: '#c19a52', letterSpacing: '0.2em', textTransform: 'uppercase', marginBottom: 24 }}>Uitgelicht</div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '3rem', alignItems: 'center' }} className="grid-2">
            <div style={{ aspectRatio: '16/9', background: '#0f2238', border: '1px solid rgba(193,154,82,0.2)', borderRadius: 2, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 16, cursor: 'pointer' }}>
              <div style={{ width: 60, height: 60, borderRadius: '50%', background: 'rgba(193,154,82,0.12)', border: '1px solid rgba(193,154,82,0.35)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <div style={{ width: 0, height: 0, borderLeft: '20px solid #c19a52', borderTop: '12px solid transparent', borderBottom: '12px solid transparent', marginLeft: 5 }} />
              </div>
              <div style={{ fontSize: 11, color: 'rgba(244,237,225,0.3)', fontFamily: 'monospace' }}>[ promotiefilm ]</div>
            </div>
            <div>
              <div style={{ fontSize: 11, color: '#c19a52', letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: 12 }}>Promotiefilm · Vloot</div>
              <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: 30, color: '#f4ede1', fontWeight: 400, marginBottom: 16 }}>Waterschatten</h2>
              <p style={{ fontSize: 14, color: 'rgba(244,237,225,0.55)', lineHeight: 1.8, marginBottom: 24 }}>
                Een door de BBZ gemaakte promotiefilm die heel goed gebruikt kan worden om de Bruine Vloot, haar bemanning en de bijbehorende beroepsvelden voor te stellen.
              </p>
              <button style={{ background: '#c19a52', border: 'none', cursor: 'pointer', fontSize: 12, fontWeight: 600, letterSpacing: '0.08em', color: '#0f2238', padding: '11px 22px', borderRadius: 2 }}>
                Download video
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Media grid */}
      <div style={{ background: '#f4ede1', padding: '64px 2rem' }}>
        <div style={{ maxWidth: 1280, margin: '0 auto' }}>
          <div style={{ fontSize: 11, color: '#c19a52', letterSpacing: '0.2em', textTransform: 'uppercase', marginBottom: 28 }}>
            {filter === 'all' ? 'Alle bestanden' : CAT_LABELS[filter]} — {filtered.length} items
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 2 }}>
            {filtered.map(item => (
              <div key={item.id} style={{
                background: '#fff', border: '1px solid rgba(15,34,56,0.08)',
                padding: '24px', cursor: 'pointer', transition: 'all 0.2s',
                display: 'flex', flexDirection: 'column', gap: 12,
              }}
              onMouseEnter={e => e.currentTarget.style.borderColor = 'rgba(193,154,82,0.4)'}
              onMouseLeave={e => e.currentTarget.style.borderColor = 'rgba(15,34,56,0.08)'}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <span style={{ fontSize: 22, color: '#c19a52', opacity: 0.7 }}>{TYPE_ICONS[item.type]}</span>
                  <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.08em', background: FORMAT_COLORS[item.format] || '#3a4f65', color: '#fff', padding: '3px 8px', borderRadius: 2 }}>
                    {item.format}
                  </span>
                </div>
                <div>
                  <div style={{ fontFamily: "'Playfair Display', serif", fontSize: 17, color: '#0f2238', marginBottom: 6, lineHeight: 1.3 }}>{item.title}</div>
                  <div style={{ fontSize: 13, color: 'rgba(15,34,56,0.5)', marginBottom: 10 }}>{item.description}</div>
                  {item.tag && <span style={{ fontSize: 10, color: '#c19a52', letterSpacing: '0.1em', textTransform: 'uppercase', border: '1px solid rgba(193,154,82,0.35)', padding: '2px 8px', borderRadius: 2 }}>{item.tag}</span>}
                </div>
                <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', marginTop: 'auto', paddingTop: 12, borderTop: '1px solid rgba(15,34,56,0.06)' }}>
                  <span style={{ fontSize: 12, color: '#c19a52', letterSpacing: '0.06em' }}>↓ Download</span>
                </div>
              </div>
            ))}
          </div>
          {filtered.length === 0 && (
            <div style={{ textAlign: 'center', padding: '60px 0', color: 'rgba(15,34,56,0.35)', fontSize: 15 }}>
              Geen bestanden gevonden in deze categorie.
            </div>
          )}
        </div>
      </div>

      {/* Podcast spotlight */}
      <div style={{ background: '#0a1a2e', padding: '64px 2rem', borderTop: '1px solid rgba(193,154,82,0.15)' }}>
        <div style={{ maxWidth: 1280, margin: '0 auto' }}>
          <div style={{ fontSize: 11, color: '#c19a52', letterSpacing: '0.2em', textTransform: 'uppercase', marginBottom: 24 }}>Podcasts</div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '3rem', alignItems: 'center' }} className="grid-2">
            <div style={{ aspectRatio: '16/9', background: '#0f2238', border: '1px solid rgba(193,154,82,0.2)', borderRadius: 2, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 16 }}>
              <div style={{ width: 64, height: 64, borderRadius: '50%', background: 'rgba(193,154,82,0.12)', border: '1px solid rgba(193,154,82,0.35)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <span style={{ fontSize: 30, color: '#c19a52', lineHeight: 1 }}>◉</span>
              </div>
              <div style={{ fontSize: 11, color: 'rgba(193,154,82,0.35)', fontFamily: 'monospace' }}>[ podcast ]</div>
            </div>
            <div>
              <div style={{ fontSize: 11, color: '#c19a52', letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: 12 }}>Podcast</div>
              <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: 28, color: '#f4ede1', fontWeight: 400, marginBottom: 16 }}>Roefgesprekken</h2>
              <p style={{ fontSize: 14, color: 'rgba(244,237,225,0.55)', lineHeight: 1.8, marginBottom: 24 }}>
                Podcast met verhalen van zeevarenden: kapiteins, stuurmannen en vrouwen, scheepskoks, matrozen en anderen werkzaam op een schip.
              </p>
              <button style={{ background: '#c19a52', border: 'none', cursor: 'pointer', fontSize: 12, fontWeight: 600, letterSpacing: '0.08em', color: '#0f2238', padding: '11px 22px', borderRadius: 2 }}>
                Luister nu
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Press contact */}
      <div style={{ background: '#0f2238', padding: '64px 2rem', textAlign: 'center' }}>
        <div style={{ maxWidth: 560, margin: '0 auto' }}>
          <div style={{ fontSize: 11, color: '#c19a52', letterSpacing: '0.2em', textTransform: 'uppercase', marginBottom: 16 }}>Pers & media</div>
          <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: 28, color: '#f4ede1', fontWeight: 400, marginBottom: 16 }}>
            Journalisten & onderzoekers
          </h2>
          <p style={{ fontSize: 15, color: 'rgba(244,237,225,0.55)', lineHeight: 1.8, marginBottom: 28 }}>
            Voor exclusief beeldmateriaal, interviews of toegang tot het volledige kennisarchief kunt u contact opnemen via pers@zeilschipper.nl
          </p>
          <a href="mailto:pers@zeilschipper.nl" style={{ fontSize: 13, color: '#c19a52', border: '1px solid rgba(193,154,82,0.4)', padding: '12px 24px', borderRadius: 2, display: 'inline-block', letterSpacing: '0.06em' }}>
            pers@zeilschipper.nl
          </a>
        </div>
      </div>

      <style>{`
        @media (max-width: 768px) {
          .media-header { grid-template-columns: 1fr !important; }
          .grid-2 { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </div>
  )
}
