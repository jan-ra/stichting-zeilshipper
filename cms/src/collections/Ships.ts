import type { CollectionConfig } from 'payload'

import { isAdminOrEditor } from '../access'

export const Ships: CollectionConfig = {
  slug: 'ships',
  admin: { useAsTitle: 'name', defaultColumns: ['name', 'type', 'port', 'region'] },
  access: { read: () => true, create: isAdminOrEditor, update: isAdminOrEditor, delete: isAdminOrEditor },
  fields: [
    { name: 'name', type: 'text', required: true },
    { name: 'type', type: 'text' },
    { name: 'port', type: 'text' },
    {
      name: 'region',
      type: 'select',
      defaultValue: 'thuiswateren',
      options: [
        { label: 'Thuiswateren', value: 'thuiswateren' },
        { label: 'Europa', value: 'europa' },
        { label: 'Wereld', value: 'wereld' },
      ],
    },
    { name: 'image', type: 'upload', relationTo: 'media' },
    { name: 'lat', type: 'number' },
    { name: 'lng', type: 'number' },
    { name: 'speed', type: 'number', label: 'Speed (kn)' },
    { name: 'year', type: 'number', label: 'Year built' },
    { name: 'passengers', type: 'number' },
  ],
}
