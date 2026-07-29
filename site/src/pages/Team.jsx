import { useState } from 'react'
import { TEAM, TEAM_PAGE } from '../data/content.js'
import { useLanguage } from '../context/LanguageContext.jsx'
import { asset } from '../utils/asset.js'

function TeamModal({ member, onClose, t, tc }) {
  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed', inset: 0, zIndex: 1000,
        background: 'rgba(8,18,34,0.88)', backdropFilter: 'blur(6px)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: '2rem',
      }}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{
          background: '#f4ede1', maxWidth: 680, width: '100%', maxHeight: '90vh',
          overflowY: 'auto', borderRadius: 2, position: 'relative',
          boxShadow: '0 32px 80px rgba(0,0,0,0.5)',
        }}
      >
        <button
          onClick={onClose}
          style={{
            position: 'absolute', top: 16, right: 16, zIndex: 10,
            background: 'rgba(15,34,56,0.08)', border: 'none', cursor: 'pointer',
            width: 36, height: 36, borderRadius: '50%', fontSize: 16, color: '#0f2238',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}
        >✕</button>

        {/* Photo */}
        <div style={{ width: '100%', height: 320, overflow: 'hidden', flexShrink: 0 }}>
          <img
            src={asset(member.photo)}
            alt={member.name}
            style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'top', display: 'block' }}
          />
        </div>

        {/* Info */}
        <div style={{ padding: '32px 36px' }}>
          <div style={{ borderTop: '2px solid #c19a52', paddingTop: 20, marginBottom: 24 }}>
            <div style={{ fontSize: 11, color: '#c19a52', letterSpacing: '0.15em', textTransform: 'uppercase', marginBottom: 8 }}>
              {tc(member, 'role')}
            </div>
            <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: 28, color: '#0f2238', marginBottom: 6, lineHeight: 1.2 }}>
              {member.name}
            </h2>
            <div style={{ fontSize: 13, color: 'rgba(15,34,56,0.45)', marginBottom: 0 }}>
              {member.location} · {t('team.memberSinceLabel')} {member.since}
            </div>
          </div>

          {tc(member, 'expertise') && (
            <div style={{ marginBottom: 24, paddingBottom: 24, borderBottom: '1px solid rgba(15,34,56,0.1)' }}>
              <div style={{ fontSize: 11, color: '#c19a52', letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: 8 }}>{t('team.expertiseLabel')}</div>
              <div style={{ fontSize: 14, color: '#3a4f65', lineHeight: 1.6 }}>{tc(member, 'expertise')}</div>
            </div>
          )}

          <p style={{ fontSize: 15, color: '#3a4f65', lineHeight: 1.85 }}>
            {tc(member, 'bio')}
          </p>
        </div>
      </div>
    </div>
  )
}

export default function TeamPage() {
  const [modalMember, setModalMember] = useState(null)
  const { t, tc } = useLanguage()

  return (
    <div style={{ paddingTop: 68 }}>
      <div style={{ background: '#0f2238', padding: '72px 2rem 60px' }}>
        <div style={{ maxWidth: 860, margin: '0 auto' }}>
          <div style={{ fontSize: 11, color: '#c19a52', letterSpacing: '0.2em', textTransform: 'uppercase', marginBottom: 16 }}>{t('team.badge')}</div>
          <h1 style={{ fontFamily: "'Playfair Display', serif", fontSize: 'clamp(28px, 4vw, 50px)', color: '#f4ede1', fontWeight: 400, marginBottom: 20, lineHeight: 1.15 }}>
            {tc(TEAM_PAGE, 'title').split('\n').map((line, i) => (
              <span key={i}>{line}{i === 0 && <br />}</span>
            ))}
          </h1>
          <p style={{ fontSize: 16, color: 'rgba(244,237,225,0.6)', lineHeight: 1.85, maxWidth: 560 }}>
            {tc(TEAM_PAGE, 'intro')}
          </p>
        </div>
      </div>

      <div style={{ background: '#f4ede1', padding: '80px 2rem' }}>
        <div style={{ maxWidth: 1280, margin: '0 auto' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: '3rem' }}>
            {TEAM.map((member) => {
              const bio = tc(member, 'bio')
              const expertise = tc(member, 'expertise')
              return (
                <div key={member.id}>
                  <div style={{ aspectRatio: '3/4', marginBottom: 24, overflow: 'hidden' }}>
                    <img
                      src={asset(member.photo)}
                      alt={member.name}
                      style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'top', display: 'block' }}
                    />
                  </div>

                  <div style={{ borderTop: '2px solid #c19a52', paddingTop: 20 }}>
                    <div style={{ fontSize: 11, color: '#c19a52', letterSpacing: '0.15em', textTransform: 'uppercase', marginBottom: 8 }}>
                      {tc(member, 'role')}
                    </div>
                    <h3 style={{ fontFamily: "'Playfair Display', serif", fontSize: 22, color: '#0f2238', marginBottom: 6, lineHeight: 1.2 }}>
                      {member.name}
                    </h3>
                    <div style={{ fontSize: 13, color: 'rgba(15,34,56,0.45)', marginBottom: 12 }}>
                      {member.location} · {t('team.memberSinceLabel')} {member.since}
                    </div>
                    {expertise && (
                      <div style={{ marginBottom: 14 }}>
                        <div style={{ fontSize: 10, color: '#c19a52', letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: 4 }}>{t('team.expertiseLabel')}</div>
                        <div style={{ fontSize: 13, color: '#3a4f65', lineHeight: 1.5 }}>{expertise}</div>
                      </div>
                    )}
                    <p style={{ fontSize: 14, color: '#3a4f65', lineHeight: 1.8, marginBottom: 12 }}>
                      {bio.slice(0, 160)}…
                    </p>
                    <button onClick={() => setModalMember(member)} style={{
                      background: 'none', border: 'none', cursor: 'pointer',
                      fontSize: 12, color: '#c19a52', letterSpacing: '0.06em', padding: 0,
                    }}>
                      {t('team.showMore')}
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </div>

      <div style={{ background: '#0f2238', padding: '64px 2rem', textAlign: 'center' }}>
        <div style={{ maxWidth: 640, margin: '0 auto' }}>
          <div style={{ fontSize: 11, color: '#c19a52', letterSpacing: '0.2em', textTransform: 'uppercase', marginBottom: 16 }}>{t('team.advisoryBadge')}</div>
          <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: 30, color: '#f4ede1', fontWeight: 400, marginBottom: 16 }}>
            {tc(TEAM_PAGE, 'advisoryTitle')}
          </h2>
          <p style={{ fontSize: 15, color: 'rgba(244,237,225,0.55)', lineHeight: 1.8, marginBottom: 28 }}>
            {tc(TEAM_PAGE, 'advisoryBody')}
          </p>
          <a href="mailto:info@zeilschipper.nl" style={{
            display: 'inline-block', fontSize: 13, fontWeight: 500, letterSpacing: '0.08em', textTransform: 'uppercase',
            color: '#c19a52', border: '1px solid rgba(193,154,82,0.4)', padding: '12px 24px', borderRadius: 2,
          }}>
            {t('team.contact')}
          </a>
        </div>
      </div>

      {modalMember && (
        <TeamModal
          member={modalMember}
          onClose={() => setModalMember(null)}
          t={t}
          tc={tc}
        />
      )}
    </div>
  )
}
