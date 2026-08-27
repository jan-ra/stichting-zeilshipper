import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-sqlite'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.run(sql`ALTER TABLE \`media_items\` ADD \`youtube_url\` text;`)
  await db.run(sql`ALTER TABLE \`home_page\` ADD \`media_spotlight_youtube_url\` text;`)
  await db.run(sql`ALTER TABLE \`media_page\` ADD \`featured_youtube_url\` text;`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.run(sql`ALTER TABLE \`media_items\` DROP COLUMN \`youtube_url\`;`)
  await db.run(sql`ALTER TABLE \`home_page\` DROP COLUMN \`media_spotlight_youtube_url\`;`)
  await db.run(sql`ALTER TABLE \`media_page\` DROP COLUMN \`featured_youtube_url\`;`)
}
