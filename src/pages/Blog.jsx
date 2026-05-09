import { useState } from 'react'
import { BLOG_POSTS } from '../data/content.js'
import { useLanguage } from '../context/LanguageContext.jsx'
import { asset } from '../utils/asset.js'

const ALL_CAT_KEYS = ['Alles', 'Erfgoed']

export default function BlogPage({ navigate }) {
  const [cat, setCat] = useState('Alles')
  const [email, setEmail] = useState('')
  const { t, tc } = useLanguage()

  const catLabels = t('blog.catLabels')
  const filtered = cat === 'Alles' ? BLOG_POSTS : BLOG_POSTS.filter(p => p.category === cat)

  return (
    <div style={{ paddingTop: 68 }}>
      <div style={{ background: '#0f2238', padding: '72px 2rem 56px' }}>
        <div style={{ maxWidth: 1280, margin: '0 auto' }}>
          <div style={{ fontSize: 11, color: '#c19a52', letterSpacing: '0.2em', textTransform: 'uppercase', marginBottom: 16 }}>{t('blog.badge')}</div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: '2rem', alignItems: 'flex-end' }}>
            <h1 style={{ fontFamily: "'Playfair Display', serif", fontSize: 'clamp(28px, 4vw, 50px)', color: '#f4ede1', fontWeight: 400, lineHeight: 1.1 }}>{t('blog.title')}</h1>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontFamily: "'Playfair Display', serif", fontSize: 32, color: '#f4ede1' }}>{BLOG_POSTS.length}</div>
              <div style={{ fontSize: 11, color: '#c19a52', letterSpacing: '0.1em', textTransform: 'uppercase' }}>{t('blog.postsLabel')}</div>
            </div>
          </div>
          <div style={{ display: 'flex', gap: 2, marginTop: 32, flexWrap: 'wrap' }}>
            {ALL_CAT_KEYS.map(c => (
              <button key={c} onClick={() => setCat(c)} style={{
                background: cat === c ? '#c19a52' : 'rgba(255,255,255,0.06)',
                border: 'none', cursor: 'pointer',
                fontSize: 11, fontWeight: 500, letterSpacing: '0.1em', textTransform: 'uppercase',
                color: cat === c ? '#0f2238' : 'rgba(244,237,225,0.5)',
                padding: '8px 18px', borderRadius: 2, transition: 'all 0.2s',
              }}>
                {catLabels[c]}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Featured post */}
      {filtered.length > 0 && (
        <div style={{ background: '#0a1a2e', borderBottom: '1px solid rgba(193,154,82,0.15)' }}>
          <div style={{ maxWidth: 1280, margin: '0 auto' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 0 }} className="featured-grid">
              <div style={{ minHeight: 300, overflow: 'hidden', position: 'relative' }}>
                {filtered[0].coverImage
                  ? <img src={asset(filtered[0].coverImage.src)} alt={filtered[0].coverImage.alt} style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block', position: 'absolute', inset: 0 }} />
                  : <div style={{ width: '100%', height: '100%', background: '#0f2238', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundImage: 'repeating-linear-gradient(135deg, rgba(193,154,82,0.03) 0px, rgba(193,154,82,0.03) 1px, transparent 1px, transparent 14px)' }}><div style={{ fontSize: 11, color: 'rgba(193,154,82,0.3)', fontFamily: 'monospace' }}>[ headerafbeelding ]</div></div>
                }
              </div>
              <div style={{ padding: '52px 48px', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                <div style={{ display: 'flex', gap: 12, alignItems: 'center', marginBottom: 20, flexWrap: 'wrap' }}>
                  <span style={{ fontSize: 10, color: '#c19a52', letterSpacing: '0.15em', textTransform: 'uppercase', border: '1px solid rgba(193,154,82,0.4)', padding: '3px 10px', borderRadius: 2 }}>
                    {tc(filtered[0], 'category')}
                  </span>
                  {filtered[0].author && <span style={{ fontSize: 12, color: 'rgba(244,237,225,0.5)' }}>{t('blog.byLabel')} {filtered[0].author}</span>}
                  <span style={{ fontSize: 12, color: 'rgba(244,237,225,0.35)' }}>{filtered[0].date}</span>
                </div>
                <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: 30, color: '#f4ede1', fontWeight: 400, marginBottom: 16, lineHeight: 1.25 }}>
                  {tc(filtered[0], 'title')}
                </h2>
                <p style={{ fontSize: 15, color: 'rgba(244,237,225,0.6)', lineHeight: 1.8, marginBottom: 24 }}>
                  {tc(filtered[0], 'excerpt')}
                </p>
                <div style={{ display: 'flex', gap: 20, alignItems: 'center' }}>
                  <button onClick={() => navigate('blog-detail', filtered[0].slug)} style={{
                    background: 'none', border: '1px solid rgba(193,154,82,0.4)', cursor: 'pointer',
                    fontSize: 12, color: '#c19a52', padding: '10px 20px', borderRadius: 2, letterSpacing: '0.06em',
                  }}>
                    {t('blog.readMore')}
                  </button>
                  <span style={{ fontSize: 12, color: 'rgba(244,237,225,0.3)' }}>{filtered[0].readTime} {t('blog.readTimeLabel')}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Post grid */}
      <div style={{ background: '#f4ede1', padding: '64px 2rem' }}>
        <div style={{ maxWidth: 1280, margin: '0 auto' }}>
          <div style={{ fontSize: 11, color: '#c19a52', letterSpacing: '0.2em', textTransform: 'uppercase', marginBottom: 32 }}>
            {cat === 'Alles' ? t('blog.allPostsLabel') : catLabels[cat]} — {filtered.length} {t('blog.resultsLabel')}
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '3rem' }}>
            {filtered.slice(1).map(post => (
              <div key={post.id} style={{ cursor: 'pointer' }} onClick={() => navigate('blog-detail', post.slug)}>
                <div style={{
                  aspectRatio: '16/9', background: '#0f2238', marginBottom: 20,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  backgroundImage: 'repeating-linear-gradient(135deg, rgba(193,154,82,0.04) 0px, rgba(193,154,82,0.04) 1px, transparent 1px, transparent 12px)',
                }}>
                  <span style={{ fontSize: 10, color: 'rgba(193,154,82,0.25)', fontFamily: 'monospace' }}>[ foto ]</span>
                </div>
                <div style={{ borderTop: '1px solid rgba(15,34,56,0.15)', paddingTop: 20 }}>
                  <div style={{ display: 'flex', gap: 10, alignItems: 'center', marginBottom: 12 }}>
                    <span style={{ fontSize: 10, color: '#c19a52', letterSpacing: '0.12em', textTransform: 'uppercase', border: '1px solid rgba(193,154,82,0.3)', padding: '2px 8px', borderRadius: 2 }}>
                      {tc(post, 'category')}
                    </span>
                    <span style={{ fontSize: 12, color: 'rgba(15,34,56,0.4)' }}>{post.date}</span>
                  </div>
                  <h3 style={{ fontFamily: "'Playfair Display', serif", fontSize: 20, color: '#0f2238', marginBottom: 10, lineHeight: 1.35 }}>
                    {tc(post, 'title')}
                  </h3>
                  <p style={{ fontSize: 14, color: '#3a4f65', lineHeight: 1.75 }}>{tc(post, 'excerpt')}</p>
                  <div style={{ marginTop: 14, fontSize: 12, color: 'rgba(15,34,56,0.35)' }}>{post.readTime} {t('blog.readTimeLabel')}</div>
                </div>
              </div>
            ))}
          </div>
          {filtered.length <= 1 && cat !== 'Alles' && (
            <div style={{ textAlign: 'center', padding: '40px 0', color: 'rgba(15,34,56,0.35)', fontSize: 15 }}>
              {t('blog.noPosts')}
            </div>
          )}
        </div>
      </div>

      {/* Newsletter */}
      <div style={{ background: '#0f2238', padding: '64px 2rem', textAlign: 'center' }}>
        <div style={{ maxWidth: 480, margin: '0 auto' }}>
          <div style={{ fontSize: 11, color: '#c19a52', letterSpacing: '0.2em', textTransform: 'uppercase', marginBottom: 16 }}>{t('blog.newsletterBadge')}</div>
          <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: 28, color: '#f4ede1', fontWeight: 400, marginBottom: 16 }}>{t('blog.newsletterTitle')}</h2>
          <p style={{ fontSize: 14, color: 'rgba(244,237,225,0.5)', lineHeight: 1.8, marginBottom: 28 }}>
            {t('blog.newsletterBody')}
          </p>
          <div style={{ display: 'flex', gap: 8 }}>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder={t('blog.emailPlaceholder')}
              style={{
                flex: 1, background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(193,154,82,0.3)',
                color: '#f4ede1', padding: '12px 16px', borderRadius: 2, fontSize: 14, outline: 'none',
                fontFamily: "'Source Sans 3', sans-serif",
              }}
            />
            <button style={{
              background: '#c19a52', border: 'none', cursor: 'pointer',
              fontSize: 12, fontWeight: 600, letterSpacing: '0.06em', color: '#0f2238',
              padding: '12px 20px', borderRadius: 2, whiteSpace: 'nowrap',
            }}>
              {t('blog.subscribe')}
            </button>
          </div>
        </div>
      </div>

      <style>{`
        @media (max-width: 768px) {
          .featured-grid { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </div>
  )
}
