import path from 'node:path'
import { fileURLToPath } from 'node:url'

import { withPayload } from '@payloadcms/next/withPayload'

/** @type {import('next').NextConfig} */
const nextConfig = {
  // We serve with `next start` (not the standalone bundle) so the container can
  // also run `payload migrate` at boot — see cms/Dockerfile.
  // Allow access from other devices on the local network (e.g. mac-mini → laptop).
  allowedDevOrigins: ['192.168.1.88'],
  // scripts/verify.sh builds into its own directory so it never trips over a running
  // `npm run dev`, which owns .next.
  // The repo root has its own lockfile (Playwright); pin the app root to cms/.
  outputFileTracingRoot: path.dirname(fileURLToPath(import.meta.url)),
  distDir: process.env.NEXT_DIST_DIR || '.next',
}

export default withPayload(nextConfig, { devBundleServerPackages: false })
