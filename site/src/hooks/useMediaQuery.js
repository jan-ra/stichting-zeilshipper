import { useState, useEffect } from 'react'

// Small matchMedia wrapper. The rest of the site does breakpoints in CSS, but the
// globe needs them in JS too: touch devices get bigger hit targets, no hover
// tooltips, and (on the home hero) no drag-rotate so the page still scrolls.
export function useMediaQuery(query) {
  const [matches, setMatches] = useState(
    () => typeof window !== 'undefined' && window.matchMedia(query).matches
  )

  useEffect(() => {
    const mq = window.matchMedia(query)
    const onChange = e => setMatches(e.matches)
    setMatches(mq.matches)
    mq.addEventListener('change', onChange)
    return () => mq.removeEventListener('change', onChange)
  }, [query])

  return matches
}

// True on devices whose primary pointer cannot hover (phones, tablets).
export const useIsTouch = () => !useMediaQuery('(hover: hover) and (pointer: fine)')
