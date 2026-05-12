import type { GlobalConfig } from 'payload'

import { isAdminOrEditor } from '../access'
import { globalRebuildHooks } from '../hooks/triggerRebuild'

export const SupportLetterPage: GlobalConfig = {
  slug: 'support-letter-page',
  admin: { group: 'Site' },
  access: { read: () => true, update: isAdminOrEditor },
  hooks: globalRebuildHooks,
  fields: [
    // ── Hero ──────────────────────────────────────────────────────────────────
    { name: 'badge', type: 'text',     localized: true, label: 'Page badge' },
    { name: 'title', type: 'text',     localized: true, label: 'Page title' },
    { name: 'intro', type: 'textarea', localized: true, label: 'Intro paragraph' },

    // ── Why it matters pillars ────────────────────────────────────────────────
    {
      name: 'pillars',
      type: 'array',
      label: 'Pillars (3 items)',
      fields: [
        { name: 'n',     type: 'text',     label: 'Number (e.g. 01)' },
        { name: 'title', type: 'text',     localized: true, label: 'Pillar title' },
        { name: 'body',  type: 'textarea', localized: true, label: 'Pillar body' },
      ],
    },

    // ── Thank you state ───────────────────────────────────────────────────────
    {
      type: 'collapsible',
      label: 'Thank you confirmation',
      fields: [
        { name: 'thankYouTitle', type: 'text',     localized: true, label: 'Thank you title' },
        { name: 'thankYouBody',  type: 'textarea', localized: true, label: 'Thank you body' },
        { name: 'backHomeLabel', type: 'text',     localized: true, label: '"Back to home" button label' },
      ],
    },
  ],
}
