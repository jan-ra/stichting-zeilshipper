import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { fileURLToPath } from 'node:url'
import seo from './scripts/seo-plugin.mjs'

// Where the browser fetches live ship positions from. Derived from MEDIA_BASE_URL —
// which every environment already sets for the media bucket — so there is no separate
// variable to forget. Forgetting one would not fail loudly: the site would quietly
// fall back to the positions baked in at build time and just go stale.
// Set VITE_POSITIONS_URL explicitly only if the file ever moves off the media bucket.
const MEDIA = (process.env.MEDIA_BASE_URL || 'http://localhost:9000/zeilshipper-media').replace(/\/+$/, '')
const POSITIONS_URL = process.env.VITE_POSITIONS_URL || `${MEDIA}/data/positions.json`

// Which commit this build is. Workers Builds sets WORKERS_CI_COMMIT_SHA; the release
// workflow polls the live site for this tag to know its deploy actually went out.
const RELEASE = process.env.WORKERS_CI_COMMIT_SHA || process.env.GITHUB_SHA || 'local'

const releaseMeta = {
  name: 'release-meta',
  transformIndexHtml: html => html.replace('</head>', `  <meta name="release" content="${RELEASE}">\n  </head>`),
}

export default defineConfig({
  plugins: [react(), releaseMeta, seo({ generatedDir: fileURLToPath(new URL('./src/data/generated', import.meta.url)) })],
  base: '/',
  // MapLibre v6 spawns its tile-parsing worker with `{ type: 'module' }`, so the worker
  // bundle Vite builds for it has to be an ES module too — the default IIFE output is
  // rejected. See loadMapLibre() in useMapEngine.js.
  worker: { format: 'es' },
  define: {
    'import.meta.env.VITE_POSITIONS_URL': JSON.stringify(POSITIONS_URL),
  },
})
