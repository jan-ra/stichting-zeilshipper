#!/usr/bin/env node
/**
 * Plain-JS twin of src/lib/r2.ts, for the standalone scripts.
 *
 * Kept as a separate copy rather than shared: the scripts run under bare node
 * with no TS toolchain, and this file is small enough that a build step would
 * cost more than the duplication.
 *
 * Env: S3_ENDPOINT, S3_BUCKET, S3_REGION, S3_ACCESS_KEY_ID, S3_SECRET_ACCESS_KEY
 * — the same vars payload.config.ts uses for media.
 */

import { GetObjectCommand, PutObjectCommand, S3Client } from '@aws-sdk/client-s3'

export const BUCKET = process.env.S3_BUCKET ?? 'zeilshipper-media'

export const ROSTER_KEY = 'data/ships-roster.json'
export const POSITIONS_KEY = 'data/positions.json'

let client = null

const s3 = () => {
  if (!client) {
    client = new S3Client({
      endpoint: process.env.S3_ENDPOINT ?? 'http://localhost:9000',
      region: process.env.S3_REGION ?? 'auto',
      forcePathStyle: true,
      credentials: {
        accessKeyId: process.env.S3_ACCESS_KEY_ID ?? 'minioadmin',
        secretAccessKey: process.env.S3_SECRET_ACCESS_KEY ?? 'minioadmin',
      },
    })
  }
  return client
}

/** Returns the parsed object, or null when the key does not exist yet. */
export async function getJson(key) {
  try {
    const res = await s3().send(new GetObjectCommand({ Bucket: BUCKET, Key: key }))
    const body = await res.Body?.transformToString()
    return body ? JSON.parse(body) : null
  } catch (err) {
    if (err?.name === 'NoSuchKey' || err?.$metadata?.httpStatusCode === 404) return null
    throw err
  }
}

export async function putJson(key, value) {
  await s3().send(new PutObjectCommand({
    Bucket: BUCKET,
    Key: key,
    Body: JSON.stringify(value, null, 2),
    ContentType: 'application/json',
    CacheControl: 'public, max-age=300',
  }))
}

/** Fails fast with a readable message when the bucket credentials are absent. */
export function requireS3Env() {
  const missing = ['S3_ENDPOINT', 'S3_ACCESS_KEY_ID', 'S3_SECRET_ACCESS_KEY']
    .filter(k => !process.env[k])
  if (missing.length) {
    console.error(`Missing ${missing.join(', ')} — see cms/.env.example.`)
    process.exit(1)
  }
}
