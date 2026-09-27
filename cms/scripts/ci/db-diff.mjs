#!/usr/bin/env node
/**
 * Row-level diff of two Payload SQLite files — "what did this release do to the data?"
 *
 *   node scripts/ci/db-diff.mjs <before.db> <after.db> [--json]
 *
 * Compares every table over the columns both files share (so a new column is not a
 * "change" by itself), keyed by `id` where there is one. Locale/array tables get fresh
 * ids whenever their parent is saved, so they are compared by content instead.
 *
 * Exit codes:
 *   0  no rows lost
 *   2  rows present in <before> are missing from <after>  (data loss)
 *   3  a table or column present in <before> is missing from <after>
 * Set ALLOW_DATA_LOSS=1 to report deletions without failing — only for a release
 * that deletes content on purpose, and say so in the PR.
 */
import { DatabaseSync } from 'node:sqlite'

const [beforePath, afterPath] = process.argv.slice(2).filter(a => !a.startsWith('--'))
const asJson = process.argv.includes('--json')
if (!beforePath || !afterPath) {
  console.error('usage: db-diff.mjs <before.db> <after.db> [--json]')
  process.exit(64)
}

const A = new DatabaseSync(beforePath, { readOnly: true })
const B = new DatabaseSync(afterPath, { readOnly: true })

// Churn that says nothing about content: sessions, admin UI prefs, lock rows.
const IGNORE = new Set(['users_sessions', 'payload_preferences', 'payload_preferences_rels', 'payload_locked_documents', 'payload_locked_documents_rels'])

const tables = db => db.prepare("select name from sqlite_master where type='table' and name not like 'sqlite_%' order by 1").all().map(r => r.name)
const cols = (db, t) => db.prepare(`select name from pragma_table_info('${t}')`).all().map(r => r.name)
// Child tables carry `_parent_id`; their `id` is not stable across saves.
const isChild = c => c.includes('_parent_id')

const bTables = new Set(tables(B))
const report = []
let lost = 0
let structureLost = 0

for (const t of tables(A)) {
  if (IGNORE.has(t)) continue
  if (!bTables.has(t)) { report.push({ table: t, missingTable: true }); structureLost++; continue }
  const aCols = cols(A, t)
  const bColSet = new Set(cols(B, t))
  const droppedCols = aCols.filter(c => !bColSet.has(c))
  if (droppedCols.length) structureLost++
  const common = aCols.filter(c => bColSet.has(c))
  const byContent = isChild(common) || !common.includes('id')
  const keyCols = byContent ? common.filter(c => c !== 'id') : common
  const sel = `select ${keyCols.map(c => `"${c}"`).join(',')} from "${t}"`
  const key = r => (byContent ? JSON.stringify(r) : String(r.id))
  const ra = new Map(A.prepare(sel).all().map(r => [key(r), r]))
  const rb = new Map(B.prepare(sel).all().map(r => [key(r), r]))

  const removed = [...ra.keys()].filter(k => !rb.has(k))
  const added = [...rb.keys()].filter(k => !ra.has(k))
  const changed = byContent ? [] : [...ra.keys()].filter(k => rb.has(k) && JSON.stringify(ra.get(k)) !== JSON.stringify(rb.get(k)))

  // For content-keyed tables an edit shows up as removed+added; only count the net loss.
  const netRemoved = byContent ? Math.max(0, removed.length - added.length) : removed.length
  lost += netRemoved

  if (removed.length || added.length || changed.length || droppedCols.length) {
    report.push({
      table: t,
      before: ra.size,
      after: rb.size,
      added: added.length,
      removed: removed.length,
      changed: changed.length,
      ...(byContent ? { keyedBy: 'content' } : { removedIds: removed.slice(0, 20), changedIds: changed.slice(0, 20) }),
      ...(droppedCols.length ? { droppedColumns: droppedCols } : {}),
    })
  }
}

if (asJson) {
  console.log(JSON.stringify({ lost, structureLost, tables: report }, null, 2))
} else {
  if (!report.length) console.log('  no row differences')
  for (const r of report) {
    if (r.missingTable) { console.log(`  ! ${r.table}: TABLE MISSING in after`); continue }
    const parts = [`${r.before}→${r.after}`]
    if (r.added) parts.push(`+${r.added}`)
    if (r.removed) parts.push(`-${r.removed}${r.removedIds?.length ? ` [ids ${r.removedIds.join(',')}]` : ''}`)
    if (r.changed) parts.push(`~${r.changed}${r.changedIds?.length ? ` [ids ${r.changedIds.join(',')}]` : ''}`)
    if (r.droppedColumns) parts.push(`DROPPED COLUMNS ${r.droppedColumns.join(',')}`)
    console.log(`  ${r.table}: ${parts.join('  ')}${r.keyedBy ? '  (by content)' : ''}`)
  }
}

if (structureLost) { console.error(`db-diff: ${structureLost} table(s)/column(s) from before are gone`); process.exit(3) }
if (lost && process.env.ALLOW_DATA_LOSS !== '1') { console.error(`db-diff: ${lost} row(s) from before are gone (set ALLOW_DATA_LOSS=1 if intended)`); process.exit(2) }
