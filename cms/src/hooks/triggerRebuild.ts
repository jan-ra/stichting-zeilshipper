/**
 * Trigger a Cloudflare Pages rebuild whenever editorial content changes.
 *
 * Fires a POST to CF_PAGES_DEPLOY_HOOK, debounced so a burst of saves (the
 * editor saving five docs in a row) coalesces into one rebuild. The timer
 * lives in-process, which is fine because Fly runs a single machine.
 */

let timer: NodeJS.Timeout | null = null

const DEBOUNCE_MS = 30_000

const fireNow = (url: string) => {
  fetch(url, { method: 'POST' })
    .then(res => {
      if (!res.ok) {
        console.error(`[rebuild] deploy hook returned ${res.status}`)
      } else {
        console.log('[rebuild] deploy hook fired')
      }
    })
    .catch(err => console.error('[rebuild] deploy hook failed:', err))
}

export const triggerRebuild = () => {
  const url = process.env.CF_PAGES_DEPLOY_HOOK
  if (!url) {
    console.warn('[rebuild] CF_PAGES_DEPLOY_HOOK not set — skipping')
    return
  }
  if (timer) clearTimeout(timer)
  timer = setTimeout(() => {
    timer = null
    fireNow(url)
  }, DEBOUNCE_MS)
}

// Spread these into a CollectionConfig / GlobalConfig under `hooks: {...}`.
export const collectionRebuildHooks = {
  afterChange: [triggerRebuild],
  afterDelete: [triggerRebuild],
}

export const globalRebuildHooks = {
  afterChange: [triggerRebuild],
}
