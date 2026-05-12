import type { GlobalConfig } from 'payload'

import { isAdminOrEditor } from '../access'

export const UNESCOPage: GlobalConfig = {
  slug: 'unesco-page',
  admin: { group: 'Site' },
  access: { read: () => true, update: isAdminOrEditor },
  fields: [
    // ── Hero ──────────────────────────────────────────────────────────────────
    { name: 'heroTitle', type: 'text',     localized: true, label: 'Page title' },
    { name: 'heroPara',  type: 'textarea', localized: true, label: 'Hero paragraph' },

    // ── Criteria ──────────────────────────────────────────────────────────────
    {
      name: 'criteria',
      type: 'array',
      label: 'UNESCO criteria (5 items)',
      fields: [
        { name: 'code',   type: 'text', label: 'Code (e.g. R.1)', required: true },
        { name: 'title',  type: 'text',     localized: true, label: 'Criterion title', required: true },
        { name: 'body',   type: 'textarea', localized: true, label: 'Criterion body' },
        {
          name: 'evidence',
          type: 'array',
          label: 'Evidence items',
          fields: [
            { name: 'text', type: 'text', localized: true, label: 'Evidence / source', required: true },
          ],
        },
        {
          name: 'status',
          type: 'select',
          label: 'Status badge',
          options: [
            { label: 'Afgerond / Completed', value: 'afgerond' },
            { label: 'Sterk onderbouwd / Well substantiated', value: 'sterk' },
            { label: 'Goed onderbouwd / Well documented', value: 'goed' },
          ],
          defaultValue: 'goed',
        },
      ],
    },
  ],
}
