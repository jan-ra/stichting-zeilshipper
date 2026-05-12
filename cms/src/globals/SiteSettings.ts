import type { GlobalConfig } from 'payload'

import { isAdminOrEditor } from '../access'

export const SiteSettings: GlobalConfig = {
  slug: 'site-settings',
  admin: { group: 'Site' },
  access: { read: () => true, update: isAdminOrEditor },
  fields: [
    { name: 'orgName',       type: 'text', label: 'Organisation name' },
    { name: 'brandSubtitle', type: 'text', label: 'Brand subtitle (e.g. Bruine Vloot)' },
    { name: 'contactEmail',  type: 'text', label: 'Contact e-mail' },
    { name: 'addressLine1',  type: 'text', label: 'Address line 1' },
    { name: 'addressLine2',  type: 'text', label: 'Address line 2' },
    { name: 'footerTagline', type: 'textarea', label: 'Footer tagline', localized: true },
  ],
}
