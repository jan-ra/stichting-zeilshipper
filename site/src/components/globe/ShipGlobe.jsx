import { useRef, useEffect, useMemo } from 'react'
import { useMapEngine } from './useMapEngine.js'
import ShipMarkers from './ShipMarkers.jsx'
import { useLanguage } from '../../context/LanguageContext.jsx'
import { useIsTouch } from '../../hooks/useMediaQuery.js'
import 'maplibre-gl/dist/maplibre-gl.css'
import './globe.css'

const CLUSTER_RADIUS_MOUSE = 28
const CLUSTER_RADIUS_TOUCH = 34

const NO_PADDING = { top: 0, right: 0, bottom: 0, left: 0 }

// How long after a gesture ends before autorotate may take the camera back — long
// enough for MapLibre's drag inertia to play out.
const GESTURE_COOLDOWN_MS = 900

// The one globe used by both the home hero and the fleet page. It owns the camera and
// the vector basemap on its sphere; ShipMarkers owns everything the user points at.
export default function ShipGlobe({
  ships,
  matchedIds = null,
  selectedShip = null,
  onSelectShip,
  onDeselect,                // clicking a group drops the open ship
  view,                      // { lat, lng, zoom, padding, ms } — flies when it changes
  autoRotate = false,
  autoRotateSpeed = 3,       // degrees of longitude per second
  enableZoom = false,
  enableRotate = true,
  minZoom = 1.1,
  maxZoom = 14,
  spotlight = false,         // rotating showcase card — the home hero only
  showRoute = false,         // draw the selected ship's track — the fleet map only
  onUserInteract,
}) {
  const containerRef = useRef(null)
  const { t, lang } = useLanguage()
  const isTouch = useIsTouch()
  // Autorotate drives the camera itself, so it has to stand down while a flight of ours
  // is running — setCenter would cancel the flyTo mid-animation.
  const flyingRef = useRef(false)
  // True while the visitor is working the camera, plus a short tail for drag inertia.
  const gestureRef = useRef(false)
  const gestureTimer = useRef(0)

  const located = useMemo(
    () => ships.filter(s => s.lat != null && s.lng != null).sort((a, b) => a.id - b.id),
    [ships]
  )

  const { mapRef, viewRef, ready, failed } = useMapEngine(containerRef, {
    minZoom,
    maxZoom,
    initialView: view ?? { lat: 52.5, lng: 5.0, zoom: 1.7 },
  })

  // Handlers that the pages toggle over time. `enableRotate` is forced off on touch
  // where the page needs one-finger swipes for scrolling (the home hero); the fleet
  // page passes it through since that screen does not scroll.
  useEffect(() => {
    const map = mapRef.current
    if (!map) return
    const toggle = (handler, on) => (on ? handler.enable() : handler.disable())
    toggle(map.dragPan, enableRotate)
    toggle(map.keyboard, enableRotate || enableZoom)
    toggle(map.scrollZoom, enableZoom)
    toggle(map.doubleClickZoom, enableZoom)
    toggle(map.touchZoomRotate, enableZoom)
  }, [ready, enableZoom, enableRotate, mapRef])

  // Interaction is read off the raw input events rather than MapLibre's `movestart`.
  // While autorotate is running the map is *already* moving, so a drag does not start a
  // new move and `movestart` never arrives carrying an `originalEvent` — which left the
  // fleet globe inert until something else marked it as touched.
  useEffect(() => {
    const map = mapRef.current
    if (!map) return
    const canvas = map.getCanvas()

    const begin = () => { gestureRef.current = true; onUserInteract?.() }
    // Inertia keeps the camera gliding after the finger lifts, so hold the rotation off
    // a little longer rather than fighting the throw.
    const end = () => {
      clearTimeout(gestureTimer.current)
      gestureTimer.current = setTimeout(() => { gestureRef.current = false }, GESTURE_COOLDOWN_MS)
    }
    const wheel = () => { onUserInteract?.(); begin(); end() }

    canvas.addEventListener('pointerdown', begin)
    canvas.addEventListener('pointerup', end)
    canvas.addEventListener('pointercancel', end)
    canvas.addEventListener('wheel', wheel, { passive: true })
    return () => {
      clearTimeout(gestureTimer.current)
      canvas.removeEventListener('pointerdown', begin)
      canvas.removeEventListener('pointerup', end)
      canvas.removeEventListener('pointercancel', end)
      canvas.removeEventListener('wheel', wheel)
    }
  }, [ready, onUserInteract, mapRef])

  // MapLibre has no equivalent of globe.gl's controls.autoRotate, so the hero drives it
  // itself: nudge the centre longitude westward each frame. It stands down while the
  // user is dragging and while one of our own flights is running, so it never competes
  // for the camera. The home hero lets it pick back up afterwards; the fleet page turns
  // it off for good the first time the visitor touches the globe.
  useEffect(() => {
    const map = mapRef.current
    if (!map || !ready || !autoRotate) return

    let raf = 0
    let last = 0
    const step = now => {
      raf = requestAnimationFrame(step)
      const dt = last ? (now - last) / 1000 : 0
      last = now
      if (!dt || flyingRef.current || gestureRef.current) return
      const c = map.getCenter()
      map.setCenter([c.lng + autoRotateSpeed * dt, c.lat])
    }
    raf = requestAnimationFrame(step)
    return () => cancelAnimationFrame(raf)
  }, [ready, autoRotate, autoRotateSpeed, mapRef])

  // `seq` lets a page re-issue the same flight (re-selecting a ship it already flew to);
  // without it an identical key would be a no-op.
  const viewKey = view ? `${view.seq ?? ''}:${view.lat},${view.lng},${view.zoom}` : ''
  useEffect(() => {
    const map = mapRef.current
    if (!map || !view) return
    // `zoomInOnly` flights may pan and move closer, never further away — pulling the
    // camera back out from under someone who has already zoomed in is disorienting.
    const zoom = view.zoomInOnly ? Math.max(view.zoom, map.getZoom()) : view.zoom
    flyingRef.current = true
    map.flyTo({
      center: [view.lng, view.lat],
      zoom,
      // Padding keeps the target clear of the ship card. It sticks to the map, so every
      // flight has to state it — otherwise the last selection's offset lingers.
      padding: view.padding ?? NO_PADDING,
      duration: view.ms ?? 1500,
    })
    // viewKey rather than view: the pages rebuild the object on unrelated renders.
  }, [ready, viewKey])

  useEffect(() => {
    const map = mapRef.current
    if (!map) return
    const done = () => { flyingRef.current = false }
    map.on('moveend', done)
    return () => { map.off('moveend', done) }
  }, [ready, mapRef])

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
        viewRef={viewRef}
        ready={ready}
        ships={located}
        matchedIds={matchedIds}
        selectedId={selectedShip?.id ?? null}
        selectedRoute={showRoute ? selectedShip?.history ?? null : null}
        routeLocale={lang === 'en' ? 'en-GB' : 'nl-NL'}
        clusterRadiusPx={isTouch ? CLUSTER_RADIUS_TOUCH : CLUSTER_RADIUS_MOUSE}
        isTouch={isTouch}
        canZoom={enableZoom}
        maxZoom={maxZoom}
        labels={labels}
        spotlight={spotlight}
        onSelectShip={onSelectShip}
        onDeselect={onDeselect}
      />
    </div>
  )
}
