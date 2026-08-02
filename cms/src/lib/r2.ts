/**
 * Minimal JSON read/write against the media bucket (R2 in production, MinIO
 * locally). Used by the Ships hook to publish the tracking roster.
 *
 * Reads the same env vars as the s3Storage plugin in payload.config.ts, so a
 * working media setup is automatically a working data setup.
 *
 * There is a near-identical plain-JS copy at scripts/lib/r2.mjs for the
 * standalone scripts — they run outside the Next bundle and cannot import TS.
 */

import { GetObjectCommand, PutObjectCommand, S3Client } from '@aws-sdk/client-s3'

export const BUCKET = process.env.S3_BUCKET ?? 'zeilshipper-media'

// Positions and roster live under data/, alongside the existing db-backups/
// prefix and the media files at the bucket root.
export const ROSTER_KEY = 'data/ships-roster.json'
export const POSITIONS_KEY = 'data/positions.json'

let client: S3Client | null = null

const s3 = (): S3Client => {
  if (!client) {
    client = new S3Client({
      endpoint: process.env.S3_ENDPOINT ?? 'http://localhost:9000',
      region: process.env.S3_REGION ?? 'auto',
      forcePathStyle: true, // required for MinIO; harmless for R2
      credentials: {
        accessKeyId: process.env.S3_ACCESS_KEY_ID ?? 'minioadmin',
        secretAccessKey: process.env.S3_SECRET_ACCESS_KEY ?? 'minioadmin',
      },
    })
  }
  return client
}

/** Returns the parsed object, or null when the key does not exist yet. */
export async function getJson<T = unknown>(key: string): Promise<T | null> {
  try {
    const res = await s3().send(new GetObjectCommand({ Bucket: BUCKET, Key: key }))
    const body = await res.Body?.transformToString()
    return body ? (JSON.parse(body) as T) : null
  } catch (err) {
    const e = err as { name?: string; $metadata?: { httpStatusCode?: number } }
    if (e.name === 'NoSuchKey' || e.$metadata?.httpStatusCode === 404) return null
    throw err
  }
}

export async function putJson(key: string, value: unknown): Promise<void> {
  await s3().send(
    new PutObjectCommand({
      Bucket: BUCKET,
      Key: key,
      Body: JSON.stringify(value, null, 2),
      ContentType: 'application/json',
      // Short TTL: a nightly write should reach visitors within minutes, but
      // we still want the CDN to absorb the traffic.
      CacheControl: 'public, max-age=300',
    }),
  )
}
