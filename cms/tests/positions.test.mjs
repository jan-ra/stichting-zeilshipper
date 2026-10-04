import assert from 'node:assert/strict'
import { test } from 'node:test'

import { HISTORY_MAX, mergeShipPosition } from '../scripts/lib/positions.mjs'

const fix = (at, lat = 53, lng = 5) => ({ mmsi: '244000000', lat, lng, at })

test('first fix starts a one-point history', () => {
  const r = mergeShipPosition(undefined, fix('2026-08-01T02:00:00Z'))
  assert.equal(r.history.length, 1)
  assert.equal(r.positionUpdatedAt, '2026-08-01T02:00:00Z')
})

test('a new fix time appends', () => {
  const a = mergeShipPosition(undefined, fix('2026-08-01T02:00:00Z'))
  const b = mergeShipPosition(a, fix('2026-08-02T02:00:00Z', 54, 6))
  assert.equal(b.history.length, 2)
  assert.deepEqual([b.lat, b.lng], [54, 6])
})

test('the same fix time corrects in place instead of appending', () => {
  const a = mergeShipPosition(undefined, fix('2026-08-01T02:00:00Z'))
  const b = mergeShipPosition(a, fix('2026-08-01T02:00:00Z', 53.5, 5.5))
  assert.equal(b.history.length, 1)
  assert.equal(b.lat, 53.5)
})

test(`history is capped at ${HISTORY_MAX} points, dropping the oldest`, () => {
  let r
  for (let d = 1; d <= HISTORY_MAX + 3; d++) r = mergeShipPosition(r, fix(`2026-08-${String(d).padStart(2, '0')}T02:00:00Z`))
  assert.equal(r.history.length, HISTORY_MAX)
  assert.equal(r.history[0].at, '2026-08-04T02:00:00Z')
})

test('does not mutate the previous record', () => {
  const a = mergeShipPosition(undefined, fix('2026-08-01T02:00:00Z'))
  const before = JSON.stringify(a)
  mergeShipPosition(a, fix('2026-08-02T02:00:00Z'))
  assert.equal(JSON.stringify(a), before)
})
