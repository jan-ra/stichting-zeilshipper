import type { CollectionConfig } from 'payload'

export const Ships: CollectionConfig = {
  slug: 'ships',
  admin: { useAsTitle: 'name', defaultColumns: ['name', 'type', 'port', 'region'] },
  access: { read: () => true },
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
    { name: 'lat', type: 'number' },
    { name: 'lng', type: 'number' },
    { name: 'speed', type: 'number', label: 'Speed (kn)' },
    { name: 'year', type: 'number', label: 'Year built' },
    { name: 'passengers', type: 'number' },
  ],
}
