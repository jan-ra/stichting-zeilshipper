import path from 'node:path'
import { fileURLToPath } from 'node:url'

import { sqliteAdapter } from '@payloadcms/db-sqlite'
import { lexicalEditor } from '@payloadcms/richtext-lexical'
import { s3Storage } from '@payloadcms/storage-s3'
import { de } from '@payloadcms/translations/languages/de'
import { en } from '@payloadcms/translations/languages/en'
import { nl } from '@payloadcms/translations/languages/nl'
import { buildConfig } from 'payload'
import sharp from 'sharp'

import { BlogPosts } from './src/collections/BlogPosts'
import { InfoBoards } from './src/collections/InfoBoards'
import { Media } from './src/collections/Media'
import { MediaItems } from './src/collections/MediaItems'
import { Partners } from './src/collections/Partners'
import { Ships } from './src/collections/Ships'
import { TeamMembers } from './src/collections/TeamMembers'
import { UnescoSteps } from './src/collections/UnescoSteps'
import { Users } from './src/collections/Users'
import { SiteSettings } from './src/globals/SiteSettings'
import { HomePage } from './src/globals/HomePage'
import { UNESCOPage } from './src/globals/UNESCOPage'
import { InfoBoardsPage } from './src/globals/InfoBoardsPage'
import { TeamPage } from './src/globals/TeamPage'
import { MediaPage } from './src/globals/MediaPage'
import { NavSettings } from './src/globals/NavSettings'
import { FleetPage } from './src/globals/FleetPage'
import { BlogPage } from './src/globals/BlogPage'
import { SupportLetterPage } from './src/globals/SupportLetterPage'

const dirname = path.dirname(fileURLToPath(import.meta.url))

const sqliteArgs: Parameters<typeof sqliteAdapter>[0] = {
  client: {
    url: process.env.DATABASE_URI || 'file:./data/payload.db',
  },
  // Schema is managed exclusively through committed migrations (src/migrations),
  // applied identically on local and prod. `push` (dev auto-sync) is OFF so that
  // local schema can never silently drift from what prod will run.
  push: false,
  migrationDir: path.resolve(dirname, 'src/migrations'),
  // WAL lets readers (the site build, admin list views) proceed during a write, and
  // busyTimeout makes a second writer wait instead of failing with SQLITE_BUSY.
  wal: true,
  busyTimeout: 5000,
}

// Transactions: ON for `payload migrate`, OFF for the running server.
//
// The SQLite adapter treats every transaction as a no-op unless transactionOptions
// is set, so without this a migration that fails halfway leaves the DB half-written.
// With it, each migration (schema or data) commits or rolls back as a whole — and at
// boot nothing else is writing, so there is no contention.
//
// It stays off for the server because libsql opens a fresh connection per
// transaction without the busy timeout: concurrent saves then fail instantly with
// SQLITE_BUSY (reproduced by scripts/ci/concurrency-probe.ts). Revisit when that is
// fixed upstream.
//
// A getter because `payload migrate` sets PAYLOAD_MIGRATING after this file is
// evaluated but before the adapter reads its options in payload.init().
Object.defineProperty(sqliteArgs, 'transactionOptions', {
  enumerable: true,
  get: () => (process.env.PAYLOAD_MIGRATING === 'true' ? { behavior: 'immediate' } : undefined),
})

export default buildConfig({
  plugins: [
    s3Storage({
      collections: {
        media: {
          // Override the default URL (S3 API endpoint) with our public host —
          // MinIO bucket path locally, R2 custom subdomain in production.
          generateFileURL: ({ filename, prefix }) => {
            const base = (process.env.MEDIA_BASE_URL ?? 'http://localhost:9000/zeilshipper-media').replace(/\/+$/, '')
            return prefix ? `${base}/${prefix}/${filename}` : `${base}/${filename}`
          },
        },
      },
      bucket: process.env.S3_BUCKET ?? 'zeilshipper-media',
      config: {
        endpoint: process.env.S3_ENDPOINT ?? 'http://localhost:9000',
        region: process.env.S3_REGION ?? 'auto',
        forcePathStyle: true, // required for MinIO; harmless for R2
        credentials: {
          accessKeyId: process.env.S3_ACCESS_KEY_ID ?? 'minioadmin',
          secretAccessKey: process.env.S3_SECRET_ACCESS_KEY ?? 'minioadmin',
        },
      },
    }),
  ],
  admin: {
    user: 'users',
    meta: {
      titleSuffix: '— Stichting Zeilschipper CMS',
    },
    components: {
      graphics: {
        Logo: '@/components/BrandLogo#default',
        Icon: '@/components/BrandIcon#default',
      },
    },
    importMap: {
      baseDir: path.resolve(dirname, 'src'),
    },
    theme: 'dark',
  },
  i18n: {
    supportedLanguages: { de, en, nl },
    fallbackLanguage: 'nl',
  },
  localization: {
    locales: [
      { label: 'Nederlands', code: 'nl' },
      { label: 'English', code: 'en' },
    ],
    defaultLocale: 'nl',
    fallback: true,
  },
  collections: [
    // Editorial collections — same fields as the WordPress ACF groups.
    Ships,
    BlogPosts,
    InfoBoards,
    TeamMembers,
    MediaItems,
    // Supporting collections.
    UnescoSteps,
    Partners,
    // Upload-backing collection.
    Media,
    Users,
  ],
  globals: [
    SiteSettings,
    HomePage,
    UNESCOPage,
    InfoBoardsPage,
    TeamPage,
    MediaPage,
    NavSettings,
    FleetPage,
    BlogPage,
    SupportLetterPage,
  ],
  cors: '*',
  csrf: [],
  db: sqliteAdapter(sqliteArgs),
  editor: lexicalEditor(),
  secret: process.env.PAYLOAD_SECRET || '',
  serverURL: process.env.PAYLOAD_PUBLIC_URL || '',
  sharp,
  typescript: {
    outputFile: path.resolve(dirname, 'src/payload-types.ts'),
  },
  upload: {
    limits: {
      fileSize: 200_000_000, // 200 MB
    },
  },
})
