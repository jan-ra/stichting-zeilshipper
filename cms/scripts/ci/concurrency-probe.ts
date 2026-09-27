/**
 * Run INSIDE a CMS container while its server is up (scripts/rehearse-release.sh):
 *
 *   node node_modules/payload/bin.js run scripts/ci/concurrency-probe.ts rollback
 *   node node_modules/payload/bin.js run scripts/ci/concurrency-probe.ts contention
 *
 * rollback   — in migrate mode (PAYLOAD_MIGRATING=true, as `payload migrate` runs):
 *              writes inside a transaction, aborts it, checks the write is gone. This
 *              is the guarantee every migration relies on. With the adapter default
 *              (no transactionOptions) it FAILS: the write sticks.
 * contention — in server mode: many concurrent writes + reads from this second
 *              process while the server process holds the same file. Any
 *              SQLITE_BUSY / "database is locked" fails.
 *
 * Refuses to run unless PAYLOAD_SECRET is the rehearsal-only value, so it can never
 * be pointed at production by accident.
 */
export {}

const mode = process.argv[2]
if (mode !== 'rollback' && mode !== 'contention') {
  console.error('probe: usage: concurrency-probe.ts rollback|contention')
  process.exit(64)
}
// Must be set before the config is imported — it decides whether transactions exist.
if (mode === 'rollback') process.env.PAYLOAD_MIGRATING = 'true'

const { createLocalReq, getPayload, initTransaction, killTransaction } = await import('payload')
const { default: config } = await import('../../payload.config')

if (process.env.PAYLOAD_SECRET !== 'rehearsal-only-secret') {
  console.error('probe: refusing to run outside a rehearsal container')
  process.exit(1)
}

const payload = await getPayload({ config })
const context = { skipRebuild: true }
let failed = false

// ── 1. Rollback ──────────────────────────────────────────────────────────────
const { docs: [ship] } = mode !== 'rollback' ? { docs: [] } : await payload.find({ collection: 'ships', limit: 1, depth: 0, sort: 'id' })
if (ship) {
  const req = await createLocalReq({ context }, payload)
  await initTransaction(req)
  const hasTx = Boolean(req.transactionID)
  await payload.update({ collection: 'ships', id: ship.id, data: { name: `${ship.name} [probe]` }, req, context })
  await killTransaction(req)
  const after = await payload.findByID({ collection: 'ships', id: ship.id, depth: 0 })
  const rolledBack = after.name === ship.name
  console.log(`probe: transaction ${hasTx ? 'opened' : 'NOT opened'}, aborted write ${rolledBack ? 'rolled back' : 'PERSISTED'}`)
  if (!hasTx || !rolledBack) {
    failed = true
    if (!rolledBack) await payload.update({ collection: 'ships', id: ship.id, data: { name: ship.name }, context })
  }
}

// ── 2. Contention ────────────────────────────────────────────────────────────
if (mode === 'rollback') process.exit(failed ? 1 : 0)
const N = 25
// Distinct documents, as several editors saving at once would. (Many simultaneous
// saves of the SAME localized doc race on its locale rows without transactions —
// a known limitation, not something editors do.)
const { docs: targets } = await payload.find({ collection: 'ships', limit: N, depth: 0, sort: 'id' })
const t0 = Date.now()
const results = await Promise.allSettled([
  ...targets.map(t => payload.update({ collection: 'ships', id: t.id, data: {}, depth: 0, context })),
  ...Array.from({ length: N }, () => payload.find({ collection: 'ships', limit: 50, depth: 1 })),
  ...Array.from({ length: N }, () => fetch('http://localhost:3000/api/ships?limit=20&depth=1').then(r => { if (!r.ok) throw new Error(`HTTP ${r.status}`) })),
])
const errors = results.filter(r => r.status === 'rejected') as PromiseRejectedResult[]
console.log(`probe: ${results.length} concurrent ops (writes, local reads, HTTP reads via the server) in ${Date.now() - t0}ms, ${errors.length} error(s)`)
for (const e of errors.slice(0, 5)) console.log(`probe:   ${String(e.reason?.message ?? e.reason).slice(0, 200)}`)
if (errors.length) failed = true

process.exit(failed ? 1 : 0)
