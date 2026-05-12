import type { GlobalConfig } from 'payload'

import { isAdminOrEditor } from '../access'

export const NavSettings: GlobalConfig = {
  slug: 'nav-settings',
  admin: { group: 'Site' },
  access: { read: () => true, update: isAdminOrEditor },
  fields: [
    { name: 'homeLabel',       type: 'text', localized: true, label: 'Home label' },
    { name: 'fleetLabel',      type: 'text', localized: true, label: 'Fleet nav label' },
    { name: 'infoBordenLabel', type: 'text', localized: true, label: 'Info boards nav label' },
    { name: 'unescoLabel',     type: 'text', localized: true, label: 'UNESCO nav label' },
    { name: 'teamLabel',       type: 'text', localized: true, label: 'Team nav label' },
    { name: 'mediaLabel',      type: 'text', localized: true, label: 'Media nav label' },
    { name: 'blogLabel',       type: 'text', localized: true, label: 'Blog nav label' },
    { name: 'ctaLabel',        type: 'text', localized: true, label: 'CTA button label (e.g. "Steun ons dossier")' },
  ],
}
