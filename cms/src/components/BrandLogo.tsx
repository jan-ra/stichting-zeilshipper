import React from 'react'

import { ShipWheel } from './BrandIcon'

// The wordmark on the login page (and the other auth screens), in place of Payload's.
export default function BrandLogo() {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 16, color: '#000000' }}>
      <ShipWheel size={52} />
      <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
        <span style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: 'clamp(22px, 6vw, 28px)', lineHeight: 1.1 }}>
          Stichting Zeilschipper
        </span>
        <span style={{ fontSize: 12, fontWeight: 600, letterSpacing: '0.2em', textTransform: 'uppercase', color: '#555555' }}>
          CMS
        </span>
      </div>
    </div>
  )
}
