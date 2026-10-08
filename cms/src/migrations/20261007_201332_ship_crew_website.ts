import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-sqlite'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.run(sql`ALTER TABLE \`ships\` ADD \`crew\` numeric DEFAULT 2;`)
  await db.run(sql`ALTER TABLE \`ships\` ADD \`website\` text;`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.run(sql`ALTER TABLE \`ships\` DROP COLUMN \`crew\`;`)
  await db.run(sql`ALTER TABLE \`ships\` DROP COLUMN \`website\`;`)
}
