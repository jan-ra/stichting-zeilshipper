import type { GlobalConfig } from 'payload'

import { isAdminOrEditor } from '../access'
import { globalRebuildHooks } from '../hooks/triggerRebuild'

export const BlogPage: GlobalConfig = {
  slug: 'blog-page',
  admin: { group: 'Site' },
  access: { read: () => true, update: isAdminOrEditor },
  hooks: globalRebuildHooks,
  fields: [
    // ── Page header ───────────────────────────────────────────────────────────
    { name: 'badge', type: 'text', localized: true, label: 'Page badge (e.g. "Nieuws & updates")' },
    { name: 'title', type: 'text', localized: true, label: 'Page title (e.g. "Blog")' },

    // ── Newsletter section ────────────────────────────────────────────────────
    {
      type: 'collapsible',
      label: 'Newsletter section',
      fields: [
        { name: 'newsletterBadge', type: 'text',     localized: true, label: 'Newsletter badge' },
        { name: 'newsletterTitle', type: 'text',     localized: true, label: 'Newsletter title' },
        { name: 'newsletterBody',  type: 'textarea', localized: true, label: 'Newsletter body' },
      ],
    },
  ],
}
