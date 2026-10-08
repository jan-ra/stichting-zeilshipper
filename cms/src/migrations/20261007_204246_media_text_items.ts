import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-sqlite'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.run(sql`ALTER TABLE \`media_items\` ADD \`cover_image_id\` integer REFERENCES media(id);`)
  await db.run(sql`CREATE INDEX \`media_items_cover_image_idx\` ON \`media_items\` (\`cover_image_id\`);`)
  await db.run(sql`ALTER TABLE \`media_items_locales\` ADD \`source\` text;`)
  await db.run(sql`ALTER TABLE \`media_items_locales\` ADD \`body\` text;`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.run(sql`PRAGMA foreign_keys=OFF;`)
  await db.run(sql`CREATE TABLE \`__new_media_items\` (
  	\`id\` integer PRIMARY KEY NOT NULL,
  	\`type\` text DEFAULT 'video',
  	\`category\` text,
  	\`format\` text,
  	\`youtube_url\` text,
  	\`file_id\` integer,
  	\`external_url\` text,
  	\`updated_at\` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
  	\`created_at\` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
  	FOREIGN KEY (\`file_id\`) REFERENCES \`media\`(\`id\`) ON UPDATE no action ON DELETE set null
  );
  `)
  await db.run(sql`INSERT INTO \`__new_media_items\`("id", "type", "category", "format", "youtube_url", "file_id", "external_url", "updated_at", "created_at") SELECT "id", "type", "category", "format", "youtube_url", "file_id", "external_url", "updated_at", "created_at" FROM \`media_items\`;`)
  await db.run(sql`DROP TABLE \`media_items\`;`)
  await db.run(sql`ALTER TABLE \`__new_media_items\` RENAME TO \`media_items\`;`)
  await db.run(sql`PRAGMA foreign_keys=ON;`)
  await db.run(sql`CREATE INDEX \`media_items_file_idx\` ON \`media_items\` (\`file_id\`);`)
  await db.run(sql`CREATE INDEX \`media_items_updated_at_idx\` ON \`media_items\` (\`updated_at\`);`)
  await db.run(sql`CREATE INDEX \`media_items_created_at_idx\` ON \`media_items\` (\`created_at\`);`)
  await db.run(sql`ALTER TABLE \`media_items_locales\` DROP COLUMN \`source\`;`)
  await db.run(sql`ALTER TABLE \`media_items_locales\` DROP COLUMN \`body\`;`)
}
