/**
 * Publish the ship tracking roster to the media bucket whenever ships change.
 *
 * The nightly position job reads this file instead of querying Payload, which
 * is what lets it run on GitHub Actions without waking the Fly machine. So this
 * hook is the single link between "editor changed a ship in the CMS" and "the
 * tracker knows about it".
 *
 * Debounced like triggerRebuild — a burst of saves coalesces into one write.
 * The timer lives in-process, which is fine because Fly runs a single machine.
 *
 * Failures are logged and swallowed: a save must never fail because R2 is down.
 * Use `npm run publish-roster` to repair the file if that ever happens.
 */

import type { CollectionAfterChangeHook, CollectionAfterDeleteHook, Payload } from 'payload'

import { ROSTER_KEY, putJson } from '../lib/r2'

const DEBOUNCE_MS = 5_000

let timer: NodeJS.Timeout | null = null

export type RosterShip = {
  id: number | string
  name: string
  mmsi: string
  autoTrack: boolean
}

export type Roster = {
  generatedAt: string
  ships: RosterShip[]
}

/** Shape the roster from a set of raw ship docs. Only tracked ships make it in. */
export const buildRoster = (docs: Array<Record<string, unknown>>): Roster => ({
  generatedAt: new Date().toISOString(),
  ships: docs
    .map(d => ({
      id: d.id as number | string,
      name: String(d.name ?? ''),
      mmsi: String(d.mmsi ?? '').trim(),
      autoTrack: d.autoTrack !== false,
    }))
    .filter(s => s.mmsi && s.autoTrack)
    .sort((a, b) => String(a.id).localeCompare(String(b.id), undefined, { numeric: true })),
})

const write = async (payload: Payload) => {
  const { docs } = await payload.find({
    collection: 'ships',
    limit: 1000,
    depth: 0,
    pagination: false,
  })
  const roster = buildRoster(docs as unknown as Array<Record<string, unknown>>)
  await putJson(ROSTER_KEY, roster)
  payload.logger.info(`[roster] published ${roster.ships.length} tracked ship(s) to ${ROSTER_KEY}`)
}

const schedule = (payload: Payload) => {
  if (timer) clearTimeout(timer)
  timer = setTimeout(() => {
    timer = null
    write(payload).catch(err => payload.logger.error(`[roster] publish failed: ${err?.message ?? err}`))
  }, DEBOUNCE_MS)
}

export const publishShipRosterAfterChange: CollectionAfterChangeHook = ({ req }) => {
  schedule(req.payload)
}

export const publishShipRosterAfterDelete: CollectionAfterDeleteHook = ({ req }) => {
  schedule(req.payload)
}
