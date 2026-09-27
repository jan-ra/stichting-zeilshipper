import assert from 'node:assert/strict'
import { test } from 'node:test'

import { assignmentOf, clusterBounds, clusterScreenPoints, clusterSignature } from '../src/components/globe/clusterScreenPoints.js'

const pt = (id, x, y, lat = 0, lng = 0) => ({ x, y, ship: { id, lat, lng } })

test('empty input gives no clusters', () => {
  assert.deepEqual(clusterScreenPoints([], 20), [])
})

test('points within the radius merge, points outside do not', () => {
  const c = clusterScreenPoints([pt(1, 0, 0), pt(2, 10, 0), pt(3, 100, 0)], 20)
  assert.equal(c.length, 2)
  assert.deepEqual(c[0].ships.map(s => s.id), [1, 2])
  assert.equal(c[0].id, 'c1')
})

test('cluster is anchored on its lowest-id seed', () => {
  const [c] = clusterScreenPoints([pt(4, 5, 5), pt(9, 12, 5)], 20)
  assert.deepEqual([c.x, c.y], [5, 5])
})

test('hysteresis keeps a member that drifts just past the radius', () => {
  const first = clusterScreenPoints([pt(1, 0, 0), pt(2, 19, 0)], 20)
  const prev = assignmentOf(first)
  const drifted = clusterScreenPoints([pt(1, 0, 0), pt(2, 24, 0)], 20, prev)
  assert.equal(drifted.length, 1)
  const fresh = clusterScreenPoints([pt(1, 0, 0), pt(2, 24, 0)], 20)
  assert.equal(fresh.length, 2)
})

test('signature changes when membership changes', () => {
  const a = clusterSignature(clusterScreenPoints([pt(1, 0, 0), pt(2, 10, 0)], 20))
  const b = clusterSignature(clusterScreenPoints([pt(1, 0, 0), pt(2, 50, 0)], 20))
  assert.notEqual(a, b)
})

test('bounds span all members', () => {
  const [c] = clusterScreenPoints([pt(1, 0, 0, 52, 4), pt(2, 5, 0, 53, 6)], 20)
  assert.deepEqual(clusterBounds(c), { minLat: 52, maxLat: 53, minLng: 4, maxLng: 6, spanLat: 1, spanLng: 2 })
})
