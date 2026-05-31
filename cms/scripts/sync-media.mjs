#!/usr/bin/env node
/**
 * Mirror the production R2 bucket into local MinIO.
 *
 * Source: Cloudflare R2 (zeilshipper-media) — creds from .env.pull
 * Dest:   local MinIO (localhost:9000, minioadmin) — same bucket name
 *
 * Skips the db-backups/ prefix (those are private DB snapshots, not media).
 * Idempotent: checks dest size before copying; skips exact matches.
 */

import {
  S3Client,
  ListObjectsV2Command,
  GetObjectCommand,
  PutObjectCommand,
  HeadObjectCommand,
} from '@aws-sdk/client-s3'

const BUCKET = 'zeilshipper-media'

const { R2_ACCOUNT_ID, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY } = process.env
if (!R2_ACCOUNT_ID || !R2_ACCESS_KEY_ID || !R2_SECRET_ACCESS_KEY) {
  console.error('Missing R2 credentials. Copy .env.pull.example to .env.pull and fill in the values.')
  process.exit(1)
}

const r2 = new S3Client({
  endpoint: `https://${R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  region: 'auto',
  credentials: { accessKeyId: R2_ACCESS_KEY_ID, secretAccessKey: R2_SECRET_ACCESS_KEY },
})

const minio = new S3Client({
  endpoint: 'http://localhost:9000',
  region: 'auto',
  forcePathStyle: true,
  credentials: { accessKeyId: 'minioadmin', secretAccessKey: 'minioadmin' },
})

async function destSize(key) {
  try {
    const res = await minio.send(new HeadObjectCommand({ Bucket: BUCKET, Key: key }))
    return res.ContentLength ?? -1
  } catch (e) {
    if (e.name === 'NotFound' || e.$metadata?.httpStatusCode === 404) return null
    throw e
  }
}

async function streamToBuffer(stream) {
  const chunks = []
  for await (const chunk of stream) chunks.push(chunk)
  return Buffer.concat(chunks)
}

let copied = 0, skipped = 0
let ContinuationToken

do {
  const list = await r2.send(new ListObjectsV2Command({
    Bucket: BUCKET,
    ContinuationToken,
    Prefix: '',
  }))

  for (const obj of list.Contents ?? []) {
    const key = obj.Key
    if (key.startsWith('db-backups/')) continue

    const existing = await destSize(key)
    if (existing === obj.Size) {
      process.stdout.write(`= ${key}\n`)
      skipped++
      continue
    }

    const { Body, ContentType } = await r2.send(new GetObjectCommand({ Bucket: BUCKET, Key: key }))
    const body = await streamToBuffer(Body)
    await minio.send(new PutObjectCommand({
      Bucket: BUCKET,
      Key: key,
      Body: body,
      ContentType: ContentType ?? 'application/octet-stream',
    }))
    process.stdout.write(`✓ ${key}\n`)
    copied++
  }

  ContinuationToken = list.NextContinuationToken
} while (ContinuationToken)

console.log(`\nSync complete: ${copied} copied, ${skipped} skipped.`)
