import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// Where the browser fetches live ship positions from. Derived from MEDIA_BASE_URL —
// which every environment already sets for the media bucket — so there is no separate
// variable to forget. Forgetting one would not fail loudly: the site would quietly
// fall back to the positions baked in at build time and just go stale.
// Set VITE_POSITIONS_URL explicitly only if the file ever moves off the media bucket.
const MEDIA = (process.env.MEDIA_BASE_URL || 'http://localhost:9000/zeilshipper-media').replace(/\/+$/, '')
const POSITIONS_URL = process.env.VITE_POSITIONS_URL || `${MEDIA}/data/positions.json`

export default defineConfig({
  plugins: [react()],
  base: '/',
  define: {
    'import.meta.env.VITE_POSITIONS_URL': JSON.stringify(POSITIONS_URL),
  },
})
