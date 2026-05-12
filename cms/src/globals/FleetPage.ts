import type { GlobalConfig } from 'payload'

import { isAdminOrEditor } from '../access'

export const FleetPage: GlobalConfig = {
  slug: 'fleet-page',
  admin: { group: 'Site' },
  access: { read: () => true, update: isAdminOrEditor },
  fields: [
    {
      type: 'collapsible',
      label: 'Crew notice banner',
      fields: [
        { name: 'bannerQuote', type: 'text',     localized: true, label: 'Banner quote (serif, prominent)' },
        { name: 'bannerSub',   type: 'textarea', localized: true, label: 'Banner sub-line (small uppercase)' },
      ],
    },
  ],
}
