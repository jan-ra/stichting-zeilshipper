#!/usr/bin/env node
/**
 * Copy the live ship positions from R2 into local MinIO.
 *
 * `sync-media.mjs` deliberately skips the `data/` prefix, so a fresh local stack
 * has no positions.json and the globe falls back to whatever coordinates were
 * baked into ships.json. This fetches the real one.
 *
 * Env: R2_ACCOUNT_ID / R2_ACCESS_KEY_ID / R2_SECRET_ACCESS_KEY (see .env.pull).
 */
import { GetObjectCommand, PutObjectCommand, S3Client } from '@aws-sdk/client-s3'

const KEY = 'data/positions.json'
const BUCKET = process.env.S3_BUCKET ?? 'zeilshipper-media'

for (const name of ['R2_ACCOUNT_ID', 'R2_ACCESS_KEY_ID', 'R2_SECRET_ACCESS_KEY']) {
  if (!process.env[name]) {
    console.error(`Missing ${name} — run with --env-file=../.env.pull`)
    process.exit(1)
  }
}

const r2 = new S3Client({
  endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  region: 'auto',
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY,
  },
})

const minio = new S3Client({
  endpoint: process.env.S3_ENDPOINT ?? 'http://localhost:9000',
  region: 'auto',
  forcePathStyle: true,
  credentials: {
    accessKeyId: process.env.S3_ACCESS_KEY_ID ?? 'minioadmin',
    secretAccessKey: process.env.S3_SECRET_ACCESS_KEY ?? 'minioadmin',
  },
})

const res = await r2.send(new GetObjectCommand({ Bucket: BUCKET, Key: KEY }))
const body = await res.Body.transformToString()
const parsed = JSON.parse(body)
console.log(`R2 ${KEY}: generatedAt=${parsed.generatedAt}, ${Object.keys(parsed.ships ?? {}).length} ship(s)`)

await minio.send(new PutObjectCommand({
  Bucket: BUCKET,
  Key: KEY,
  Body: body,
  ContentType: 'application/json',
  CacheControl: 'public, max-age=300',
}))
console.log(`Wrote ${KEY} to MinIO.`)
