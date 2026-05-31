import { withPayload } from '@payloadcms/next/withPayload'

/** @type {import('next').NextConfig} */
const nextConfig = {
  // Standalone output is required for the multi-stage Dockerfile we ship to fly.io.
  output: 'standalone',
  // Allow access from other devices on the local network (e.g. mac-mini → laptop).
  allowedDevOrigins: ['192.168.1.88'],
}

export default withPayload(nextConfig, { devBundleServerPackages: false })
