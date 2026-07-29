/**
 * Push the newly-added ship images from local MinIO to production R2 (additive).
 * Reverse of scripts/sync-media.mjs. Only uploads the filenames listed in
 * /tmp/push_files.txt (the 139 transplanted media). Idempotent: skips objects
 * already present in R2 with the same size.
 *
 * Usage:  cd cms && node --env-file=../.env.pull scripts/push-media-to-r2.mjs
 */
import fs from 'node:fs'
import { S3Client, ListObjectsV2Command, GetObjectCommand, PutObjectCommand, HeadObjectCommand } from '@aws-sdk/client-s3'

const BUCKET = 'zeilshipper-media'
const { R2_ACCOUNT_ID, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY } = process.env
if (!R2_ACCOUNT_ID || !R2_ACCESS_KEY_ID || !R2_SECRET_ACCESS_KEY) { console.error('Missing R2 creds'); process.exit(1) }

const r2 = new S3Client({ endpoint: `https://${R2_ACCOUNT_ID}.r2.cloudflarestorage.com`, region: 'auto',
  credentials: { accessKeyId: R2_ACCESS_KEY_ID, secretAccessKey: R2_SECRET_ACCESS_KEY } })
const minio = new S3Client({ endpoint: 'http://localhost:9000', region: 'auto', forcePathStyle: true,
  credentials: { accessKeyId: 'minioadmin', secretAccessKey: 'minioadmin' } })

const streamToBuffer = async (s) => { const chunks = []; for await (const c of s) chunks.push(c); return Buffer.concat(chunks) }
const files = fs.readFileSync('/tmp/push_files.txt', 'utf8').split('\n').map((s) => s.trim()).filter(Boolean)

let uploaded = 0, skipped = 0, missing = 0
for (const key of files) {
  // source bytes from MinIO
  let body
  try { body = await streamToBuffer((await minio.send(new GetObjectCommand({ Bucket: BUCKET, Key: key }))).Body) }
  catch { console.log(`MISS  ${key} — not in MinIO`); missing++; continue }

  // skip if already in R2 with same size
  try { const h = await r2.send(new HeadObjectCommand({ Bucket: BUCKET, Key: key }))
    if (Number(h.ContentLength) === body.length) { skipped++; continue } } catch {}

  await r2.send(new PutObjectCommand({ Bucket: BUCKET, Key: key, Body: body, ContentType: 'image/jpeg' }))
  uploaded++
  if (uploaded % 20 === 0) console.log(`  ...${uploaded} uploaded`)
}
console.log(`\nDone. ${uploaded} uploaded, ${skipped} already present, ${missing} missing from MinIO.`)
process.exit(missing ? 1 : 0)
