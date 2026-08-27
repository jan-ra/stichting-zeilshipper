import type { GlobalConfig } from 'payload'

import { isAdminOrEditor } from '../access'
import { globalRebuildHooks } from '../hooks/triggerRebuild'

export const MediaPage: GlobalConfig = {
  slug: 'media-page',
  admin: { group: 'Site' },
  access: { read: () => true, update: isAdminOrEditor },
  hooks: globalRebuildHooks,
  fields: [
    // ── Page hero ─────────────────────────────────────────────────────────────
    { name: 'title',       type: 'text',     localized: true, label: 'Page title' },
    { name: 'description', type: 'textarea', localized: true, label: 'Page description' },

    // ── Featured / spotlight ──────────────────────────────────────────────────
    {
      type: 'collapsible',
      label: 'Featured video section',
      fields: [
        { name: 'promotionLabel',    type: 'text',     localized: true, label: 'Promotion label (e.g. "Promotional film · Fleet")' },
        { name: 'featuredTitle',     type: 'text',     localized: true, label: 'Featured title' },
        { name: 'featuredBody',      type: 'textarea', localized: true, label: 'Featured body' },
        { name: 'featuredYoutubeUrl', type: 'text',    label: 'YouTube URL', admin: { description: 'Watch link of the featured video, e.g. https://www.youtube.com/watch?v=_nyd12t2_j4' } },
        { name: 'featuredThumbnail', type: 'upload',   relationTo: 'media', label: 'Thumbnail image', admin: { description: 'Fallback shown when no YouTube URL is set.' } },
      ],
    },

    // ── Podcast section ───────────────────────────────────────────────────────
    {
      type: 'collapsible',
      label: 'Podcast section',
      fields: [
        { name: 'podcastTitle', type: 'text',     localized: true, label: 'Podcast title' },
        { name: 'podcastBody',  type: 'textarea', localized: true, label: 'Podcast description' },
      ],
    },

    // ── Press section ─────────────────────────────────────────────────────────
    {
      type: 'collapsible',
      label: 'Press section',
      fields: [
        { name: 'pressTitle', type: 'text',     localized: true, label: 'Press section title' },
        { name: 'pressBody',  type: 'textarea', localized: true, label: 'Press section body' },
      ],
    },
  ],
}
