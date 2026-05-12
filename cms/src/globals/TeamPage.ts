import type { GlobalConfig } from 'payload'

import { isAdminOrEditor } from '../access'
import { globalRebuildHooks } from '../hooks/triggerRebuild'

export const TeamPage: GlobalConfig = {
  slug: 'team-page',
  admin: { group: 'Site' },
  access: { read: () => true, update: isAdminOrEditor },
  hooks: globalRebuildHooks,
  fields: [
    { name: 'title',          type: 'text',     localized: true, label: 'Page title' },
    { name: 'intro',          type: 'textarea', localized: true, label: 'Intro paragraph' },
    { name: 'advisoryTitle',  type: 'text',     localized: true, label: 'Advisory board section title' },
    { name: 'advisoryBody',   type: 'textarea', localized: true, label: 'Advisory board section body' },
  ],
}
