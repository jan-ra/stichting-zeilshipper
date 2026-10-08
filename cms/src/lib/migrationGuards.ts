import type { MigrateUpArgs } from '@payloadcms/db-sqlite'
import { sql } from '@payloadcms/db-sqlite'

/**
 * True when `table` has no rows. Uses raw SQL on purpose.
 *
 * Content migrations read and write through the local API, and that always queries the
 * schema of the *current* config. On an empty database, migrating from zero, a content
 * migration runs before the schema migrations that come after it, so a column a later
 * migration adds is not there yet and the query fails. Content migrations only ever
 * touch existing content, so they check this first and skip on an empty table.
 */
export async function tableIsEmpty(db: MigrateUpArgs['db'], table: string): Promise<boolean> {
  const row = (await db.get(sql.raw(`SELECT count(*) AS n FROM "${table}"`))) as { n: number } | undefined
  return !row || Number(row.n) === 0
}
