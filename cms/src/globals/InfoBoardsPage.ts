import type { GlobalConfig } from 'payload'

import { isAdminOrEditor } from '../access'

export const InfoBoardsPage: GlobalConfig = {
  slug: 'info-boards-page',
  admin: { group: 'Site' },
  access: { read: () => true, update: isAdminOrEditor },
  fields: [
    { name: 'title',       type: 'text',     localized: true, label: 'Page title' },
    { name: 'description', type: 'textarea', localized: true, label: 'Page description' },
  ],
}
