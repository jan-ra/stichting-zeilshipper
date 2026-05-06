import { useState, useEffect } from 'react'

const NAV_LINKS = [
  { id: 'vloot', label: 'De schippers en de Vloot' },
  { id: 'informatieborden', label: 'Informatieborden' },
  { id: 'unesco', label: 'Road to UNESCO' },
  { id: 'team', label: 'Team' },
  { id: 'media', label: 'Media' },
  { id: 'blog', label: 'Blog' },
]

export default function Nav({ currentPage, navigate }) {
  const [scrolled, setScrolled] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40)
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  const isHome = currentPage === 'home'
  const needsSolid = !isHome || scrolled
  const bg = needsSolid ? 'rgba(15,34,56,0.98)' : 'transparent'
  const borderB = needsSolid ? '1px solid rgba(193,154,82,0.2)' : '1px solid transparent'

  return (
    <nav style={{
      position: 'fixed', top: 0, left: 0, right: 0, zIndex: 1000,
      background: bg, borderBottom: borderB,
      transition: 'background 0.5s ease, border-color 0.5s ease',
      backdropFilter: needsSolid ? 'blur(12px)' : 'none',
    }}>
      <div style={{
        maxWidth: 1280, margin: '0 auto', padding: '0 2rem',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        height: 68,
      }}>
        <button onClick={() => navigate('home')} style={{
          background: 'none', border: 'none', cursor: 'pointer',
          display: 'flex', flexDirection: 'column', gap: 2, textAlign: 'left',
        }}>
          <span style={{ fontFamily: "'Playfair Display', serif", fontSize: 18, fontWeight: 500, color: '#f4ede1', letterSpacing: '0.02em', lineHeight: 1 }}>
            Stichting Zeilschipper
          </span>
          <span style={{ fontSize: 10, color: '#c19a52', letterSpacing: '0.15em', textTransform: 'uppercase', fontWeight: 400 }}>
            Bruine Vloot
          </span>
        </button>

        <div style={{ display: 'flex', gap: '2rem', alignItems: 'center' }} className="nav-desktop">
          {NAV_LINKS.map(link => (
            <button key={link.id} onClick={() => navigate(link.id)} style={{
              background: 'none', border: 'none', cursor: 'pointer',
              fontSize: 13, fontWeight: 500, letterSpacing: '0.06em', textTransform: 'uppercase',
              color: currentPage === link.id ? '#c19a52' : 'rgba(244,237,225,0.75)',
              transition: 'color 0.2s', paddingBottom: 2,
              borderBottom: currentPage === link.id ? '1px solid #c19a52' : '1px solid transparent',
            }}
            onMouseEnter={e => { if (currentPage !== link.id) e.target.style.color = '#f4ede1' }}
            onMouseLeave={e => { if (currentPage !== link.id) e.target.style.color = 'rgba(244,237,225,0.75)' }}
            >
              {link.label}
            </button>
          ))}
          {currentPage !== 'unesco' && (
            <button onClick={() => navigate('unesco')} style={{
              background: '#c19a52', border: 'none', cursor: 'pointer',
              fontSize: 12, fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase',
              color: '#0f2238', padding: '8px 18px', borderRadius: 2, marginLeft: '0.5rem',
              transition: 'opacity 0.2s',
            }}
            onMouseEnter={e => e.target.style.opacity = '0.85'}
            onMouseLeave={e => e.target.style.opacity = '1'}
            >
              Steun ons dossier
            </button>
          )}
        </div>

        <button onClick={() => setMenuOpen(!menuOpen)} className="nav-hamburger" style={{
          background: 'none', border: 'none', cursor: 'pointer',
          display: 'none', flexDirection: 'column', gap: 5, padding: 4,
        }}>
          {[0,1,2].map(i => (
            <span key={i} style={{
              display: 'block', width: 24, height: 1.5, background: '#f4ede1',
              transform: menuOpen && i === 0 ? 'translateY(6.5px) rotate(45deg)' :
                         menuOpen && i === 2 ? 'translateY(-6.5px) rotate(-45deg)' : 'none',
              transition: 'transform 0.25s, opacity 0.25s',
              opacity: menuOpen && i === 1 ? 0 : 1,
            }} />
          ))}
        </button>
      </div>

      {menuOpen && (
        <div style={{
          background: 'rgba(15,34,56,0.98)', borderTop: '1px solid rgba(193,154,82,0.2)',
          padding: '1rem 2rem 1.5rem',
        }}>
          {[{ id: 'home', label: 'Home' }, ...NAV_LINKS].map(link => (
            <button key={link.id} onClick={() => { navigate(link.id); setMenuOpen(false) }} style={{
              display: 'block', width: '100%', textAlign: 'left',
              background: 'none', border: 'none', cursor: 'pointer',
              fontSize: 15, color: currentPage === link.id ? '#c19a52' : '#f4ede1',
              padding: '0.7rem 0', borderBottom: '1px solid rgba(255,255,255,0.06)',
            }}>
              {link.label}
            </button>
          ))}
        </div>
      )}

      <style>{`
        @media (max-width: 900px) {
          .nav-desktop { display: none !important; }
          .nav-hamburger { display: flex !important; }
        }
      `}</style>
    </nav>
  )
}
