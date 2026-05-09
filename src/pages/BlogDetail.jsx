import { BLOG_POSTS } from '../data/content.js'
import { useLanguage } from '../context/LanguageContext.jsx'
import { asset } from '../utils/asset.js'

export default function BlogDetailPage({ navigate, blogSlug }) {
  const { t, tc } = useLanguage()
  const post = BLOG_POSTS.find(p => p.slug === blogSlug) || BLOG_POSTS[0]

  if (!post) {
    return (
      <div style={{ paddingTop: 68, minHeight: '60vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: 13, color: '#c19a52', marginBottom: 16 }}>{t('blogDetail.notFound')}</div>
          <button onClick={() => navigate('blog')} style={{ background: 'none', border: '1px solid rgba(15,34,56,0.3)', cursor: 'pointer', padding: '10px 20px', fontSize: 13 }}>
            {t('blogDetail.backToBlog')}
          </button>
        </div>
      </div>
    )
  }

  const imageAfter = {}
  post.images?.forEach(im => { imageAfter[im.after] = im })

  const body = tc(post, 'body') || post.body

  return (
    <div style={{ paddingTop: 68 }}>

      {/* Hero */}
      <div style={{ background: '#0f2238', padding: '64px 2rem 72px' }}>
        <div style={{ maxWidth: 780, margin: '0 auto' }}>
          <button
            onClick={() => navigate('blog')}
            style={{
              background: 'none', border: 'none', cursor: 'pointer', padding: 0,
              fontSize: 12, color: 'rgba(193,154,82,0.7)', letterSpacing: '0.12em',
              textTransform: 'uppercase', marginBottom: 40, display: 'flex', alignItems: 'center', gap: 8,
            }}
          >
            {t('blogDetail.back')}
          </button>

          <div style={{ display: 'flex', gap: 12, alignItems: 'center', marginBottom: 24, flexWrap: 'wrap' }}>
            <span style={{
              fontSize: 10, color: '#c19a52', letterSpacing: '0.15em', textTransform: 'uppercase',
              border: '1px solid rgba(193,154,82,0.4)', padding: '3px 10px', borderRadius: 2,
            }}>
              {tc(post, 'category')}
            </span>
            <span style={{ fontSize: 12, color: 'rgba(244,237,225,0.4)' }}>{post.date}</span>
            <span style={{ fontSize: 12, color: 'rgba(244,237,225,0.4)' }}>·</span>
            <span style={{ fontSize: 12, color: 'rgba(244,237,225,0.4)' }}>{post.readTime} {t('blogDetail.readTimeLabel')}</span>
          </div>

          <h1 style={{
            fontFamily: "'Playfair Display', serif", fontSize: 'clamp(32px, 5vw, 56px)',
            color: '#f4ede1', fontWeight: 400, lineHeight: 1.12, marginBottom: 32,
          }}>
            {tc(post, 'title')}
          </h1>

          {/* Author byline */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <div style={{
              width: 44, height: 44, borderRadius: '50%', overflow: 'hidden', flexShrink: 0,
              background: 'rgba(193,154,82,0.15)', border: '1px solid rgba(193,154,82,0.3)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              {post.authorPhoto
                ? <img src={asset(post.authorPhoto)} alt={post.author} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                : <span style={{ fontFamily: "'Playfair Display', serif", fontSize: 16, color: '#c19a52' }}>
                    {post.author?.split(' ').map(w => w[0]).join('').slice(0, 2)}
                  </span>
              }
            </div>
            <div>
              <div style={{ fontSize: 13, color: '#f4ede1' }}>{post.author}</div>
              <div style={{ fontSize: 11, color: 'rgba(244,237,225,0.4)', letterSpacing: '0.05em' }}>{t('blogDetail.authorLabel')}</div>
            </div>
          </div>
        </div>
      </div>

      {/* Cover image */}
      {post.coverImage && (
        <div style={{ background: '#0a1a2e', maxHeight: 480, overflow: 'hidden' }}>
          <img
            src={asset(post.coverImage.src)}
            alt={post.coverImage.alt}
            style={{ width: '100%', height: 480, objectFit: 'cover', objectPosition: 'center', display: 'block' }}
          />
        </div>
      )}

      {/* Gold divider */}
      <div style={{ height: 3, background: 'linear-gradient(90deg, #c19a52, rgba(193,154,82,0.2))' }} />

      {/* Body */}
      <div style={{ background: '#f4ede1', padding: '64px 2rem 96px' }}>
        <div style={{ maxWidth: 680, margin: '0 auto' }}>

          {/* Lead paragraph */}
          {body?.[0] && (
            <p style={{
              fontFamily: "'Playfair Display', serif", fontSize: 'clamp(17px, 2vw, 20px)',
              color: '#0f2238', lineHeight: 1.75, marginBottom: 36,
              borderLeft: '3px solid #c19a52', paddingLeft: 24,
            }}>
              {body[0]}
            </p>
          )}

          {/* Remaining paragraphs, with images interspersed */}
          {body?.slice(1).map((paragraph, i) => {
            const paragraphIndex = i + 1
            const inlineImage = imageAfter[paragraphIndex]
            return (
              <div key={i}>
                <p style={{ fontSize: 16, color: '#2a3d52', lineHeight: 1.9, marginBottom: 28 }}>
                  {paragraph}
                </p>
                {inlineImage && (
                  <figure style={{ margin: '8px 0 40px' }}>
                    <img
                      src={asset(inlineImage.src)}
                      alt={inlineImage.alt}
                      style={{ width: '100%', display: 'block', borderRadius: 2 }}
                    />
                    <figcaption style={{ marginTop: 10, fontSize: 12, color: 'rgba(15,34,56,0.45)', fontStyle: 'italic' }}>
                      {inlineImage.alt}
                    </figcaption>
                  </figure>
                )}
              </div>
            )
          })}
        </div>
      </div>

      {/* Footer nav */}
      <div style={{ background: '#0a1a2e', borderTop: '1px solid rgba(193,154,82,0.12)', padding: '40px 2rem' }}>
        <div style={{ maxWidth: 780, margin: '0 auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 16 }}>
          <button
            onClick={() => navigate('blog')}
            style={{
              background: 'none', border: '1px solid rgba(193,154,82,0.35)', cursor: 'pointer',
              fontSize: 12, color: '#c19a52', padding: '10px 20px', borderRadius: 2,
              letterSpacing: '0.08em', textTransform: 'uppercase',
            }}
          >
            {t('blogDetail.allArticles')}
          </button>
          <div style={{ fontSize: 11, color: 'rgba(244,237,225,0.25)', letterSpacing: '0.1em', textTransform: 'uppercase' }}>
            Stichting Zeilschipper
          </div>
        </div>
      </div>

    </div>
  )
}
