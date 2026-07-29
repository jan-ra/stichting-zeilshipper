import { withPayload } from '@payloadcms/next/withPayload'

/** @type {import('next').NextConfig} */
const nextConfig = {
  // We serve with `next start` (not the standalone bundle) so the container can
  // also run `payload migrate` at boot — see cms/Dockerfile.
  // Allow access from other devices on the local network (e.g. mac-mini → laptop).
  allowedDevOrigins: ['192.168.1.88'],
}

export default withPayload(nextConfig, { devBundleServerPackages: false })
