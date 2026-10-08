import React from 'react'

// The site's ship-wheel mark, drawn in the current text colour so it follows the
// admin's black-and-white theme. Replaces Payload's icon in the nav and breadcrumbs.
const SPOKES = [[16, 6.5, 16, 25.5], [6.5, 16, 25.5, 16], [9.3, 9.3, 22.7, 22.7], [22.7, 9.3, 9.3, 22.7]]
const HANDLES = [[16, 6], [16, 26], [6, 16], [26, 16], [8.9, 8.9], [23.1, 23.1], [23.1, 8.9], [8.9, 23.1]]

export function ShipWheel({ size = 24 }: { size?: number }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32" width={size} height={size} aria-hidden="true">
      <circle cx="16" cy="16" r="2.8" fill="currentColor" />
      <circle cx="16" cy="16" r="9.5" fill="none" stroke="currentColor" strokeWidth="1.5" />
      {SPOKES.map(([x1, y1, x2, y2], i) => (
        <line key={i} x1={x1} y1={y1} x2={x2} y2={y2} stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
      ))}
      {HANDLES.map(([cx, cy], i) => <circle key={i} cx={cx} cy={cy} r="1.4" fill="currentColor" />)}
    </svg>
  )
}

export default function BrandIcon() {
  return <ShipWheel size={24} />
}
