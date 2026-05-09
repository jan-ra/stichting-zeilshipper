import type { CollectionConfig } from 'payload'

export const TeamMembers: CollectionConfig = {
  slug: 'team-members',
  admin: { useAsTitle: 'name', defaultColumns: ['name', 'role', 'location'] },
  access: { read: () => true },
  fields: [
    { name: 'name', type: 'text', required: true },
    { name: 'role', type: 'text', localized: true },
    { name: 'location', type: 'text' },
    { name: 'since', type: 'text', admin: { description: 'e.g. "2021"' } },
    { name: 'photo', type: 'upload', relationTo: 'media' },
    { name: 'bio', type: 'textarea', localized: true },
    { name: 'expertise', type: 'text', localized: true, admin: { description: 'Comma-separated.' } },
  ],
}
