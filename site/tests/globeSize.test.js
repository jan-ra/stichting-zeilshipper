import assert from 'node:assert/strict'
import { test } from 'node:test'

import { globeScreenDiameter, scaleGlobeZoom, zoomForGlobeDiameter } from '../src/components/globe/globeSize.js'

const near = (a, b, tol, msg) => assert.ok(Math.abs(a - b) <= tol, `${msg}: ${a} vs ${b}`)

test('matches what MapLibre draws', () => {
  // Measured off screenshots: the home hero at zoom 2.0 / lat 20 in a 900px pane, and
  // the fleet map at zoom 1.8 / lat 52.5 in a 744px pane.
  near(globeScreenDiameter(2.0, 20, 900), 564, 4, 'home hero')
  near(globeScreenDiameter(1.8, 52.5, 744), 688, 6, 'fleet map')
})

test('zoomForGlobeDiameter inverts globeScreenDiameter', () => {
  for (const [d, lat, h] of [[300, 0, 400], [760, 20, 900], [969, 52.5, 744], [1200, -40, 600]]) {
    near(globeScreenDiameter(zoomForGlobeDiameter(d, lat, h), lat, h), d, 1e-6, `${d}px at ${lat} in ${h}px`)
  }
})

test('a shorter pane brings the camera closer, so the same zoom draws a smaller globe', () => {
  assert.ok(globeScreenDiameter(2, 20, 600) < globeScreenDiameter(2, 20, 900))
  assert.ok(zoomForGlobeDiameter(700, 20, 600) > zoomForGlobeDiameter(700, 20, 900))
})

test('scaleGlobeZoom draws the globe at the given fraction of its size', () => {
  for (const [z, lat, h] of [[2.0, 20, 900], [1.8, 52.5, 744], [2.6, 20, 420]]) {
    const before = globeScreenDiameter(z, lat, h)
    const scaled = scaleGlobeZoom(z, lat, h, 0.9)
    assert.ok(scaled < z, 'shrinking zooms out')
    near(globeScreenDiameter(scaled, lat, h), before * 0.9, 1e-6, `${z} at ${lat} in ${h}px`)
  }
})
