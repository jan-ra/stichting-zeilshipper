import type { GlobalConfig } from 'payload'

import { isAdminOrEditor } from '../access'
import { globalRebuildHooks } from '../hooks/triggerRebuild'

export const InfoBoardsPage: GlobalConfig = {
  slug: 'info-boards-page',
  admin: { group: 'Site' },
  access: { read: () => true, update: isAdminOrEditor },
  hooks: globalRebuildHooks,
  fields: [
    { name: 'title',       type: 'text',     localized: true, label: 'Page title' },
    { name: 'description', type: 'textarea', localized: true, label: 'Page description' },
  ],
}
