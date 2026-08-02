import { useRef, useEffect, useMemo } from 'react'
import { useGlobeEngine, GLOBE_RADIUS } from './useGlobeEngine.js'
import ShipMarkers from './ShipMarkers.jsx'
import { useLanguage } from '../../context/LanguageContext.jsx'
import { useIsTouch } from '../../hooks/useMediaQuery.js'
import './globe.css'

const CLUSTER_RADIUS_MOUSE = 28
const CLUSTER_RADIUS_TOUCH = 34

// The one globe used by both the home hero and the fleet page. It owns the camera and
// the tiled sphere; ShipMarkers owns everything the user actually points at.
export default function ShipGlobe({
  ships,
  matchedIds = null,
  selectedShip = null,
  onSelectShip,
  onDeselect,                // clicking a group drops the open ship
  pov,                       // { lat, lng, altitude, ms } — flies when it changes
  autoRotate = false,
  autoRotateSpeed = 0.2,
  enableZoom = false,
  enableRotate = true,
  minAltitude = 0.0004,
  maxAltitude = 2.8,
  spotlight = false,         // rotating showcase card — the home hero only
  showRoute = false,         // draw the selected ship's track — the fleet map only
  onUserInteract,
}) {
  const containerRef = useRef(null)
  const { t, lang } = useLanguage()
  const isTouch = useIsTouch()

  const located = useMemo(
    () => ships.filter(s => s.lat != null && s.lng != null).sort((a, b) => a.id - b.id),
    [ships]
  )

  const { globeRef, ready, failed } = useGlobeEngine(containerRef, {
    minDistance: (1 + minAltitude) * GLOBE_RADIUS,
    maxDistance: (1 + maxAltitude) * GLOBE_RADIUS,
    initialPov: pov ?? { lat: 52.5, lng: 5.0, altitude: 1.8 },
  })

  // Controls that the pages toggle over time. `enableRotate` is forced off on touch
  // where the page needs one-finger swipes for scrolling (the home hero); the fleet
  // page passes it through since that screen does not scroll.
  useEffect(() => {
    const globe = globeRef.current
    if (!globe) return
    const c = globe.controls()
    c.autoRotate = autoRotate
    c.autoRotateSpeed = autoRotate ? autoRotateSpeed : 0
    c.enableZoom = enableZoom
    c.enableRotate = enableRotate
  }, [ready, autoRotate, autoRotateSpeed, enableZoom, enableRotate, globeRef])

  useEffect(() => {
    const globe = globeRef.current
    if (!globe || !onUserInteract) return
    const c = globe.controls()
    c.addEventListener('start', onUserInteract)
    return () => c.removeEventListener('start', onUserInteract)
  }, [ready, onUserInteract, globeRef])

  // `seq` lets a page re-issue the same flight (re-selecting a ship it already flew to);
  // without it an identical key would be a no-op.
  const povKey = pov ? `${pov.seq ?? ''}:${pov.lat},${pov.lng},${pov.altitude}` : ''
  useEffect(() => {
    const globe = globeRef.current
    if (!globe || !pov) return
    // `zoomInOnly` flights may pan and move closer, never further away — pulling the
    // camera back out from under someone who has already zoomed in is disorienting.
    const altitude = pov.zoomInOnly
      ? Math.min(pov.altitude, globe.pointOfView().altitude)
      : pov.altitude
    globe.pointOfView({ lat: pov.lat, lng: pov.lng, altitude }, pov.ms ?? 1500)
    // povKey rather than pov: the pages rebuild the object on unrelated renders.
  }, [ready, povKey])

  const labels = useMemo(() => ({
    positionUpdated: t('fleet.positionUpdated'),
    shipsHere: t('fleet.shipsHere'),
    pickShip: t('fleet.pickShip'),
    zoomToSplit: t('fleet.zoomToSplit'),
    close: t('fleet.close'),
  }), [t])

  // With neither rotate nor zoom the globe is display-only, and the canvas must stop
  // claiming touch gestures so the page underneath can still scroll. See globe.css.
  const isStatic = !enableRotate && !enableZoom

  return (
    <div className={'sz-globe' + (isStatic ? ' is-static' : '')}>
      <div className="sz-globe__canvas" ref={containerRef} />
      {failed && <div className="sz-globe__status">{t('fleet.globeUnavailable')}</div>}
      <ShipMarkers
        globeRef={globeRef}
        ready={ready}
        ships={located}
        matchedIds={matchedIds}
        selectedId={selectedShip?.id ?? null}
        selectedRoute={showRoute ? selectedShip?.history ?? null : null}
        routeLocale={lang === 'en' ? 'en-GB' : 'nl-NL'}
        clusterRadiusPx={isTouch ? CLUSTER_RADIUS_TOUCH : CLUSTER_RADIUS_MOUSE}
        isTouch={isTouch}
        canZoom={enableZoom}
        minAltitude={minAltitude}
        labels={labels}
        spotlight={spotlight}
        onSelectShip={onSelectShip}
        onDeselect={onDeselect}
      />
    </div>
  )
}
