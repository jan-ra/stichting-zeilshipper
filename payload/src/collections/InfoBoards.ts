import type { CollectionConfig } from 'payload'

export const InfoBoards: CollectionConfig = {
  slug: 'info-boards',
  admin: { useAsTitle: 'name', defaultColumns: ['name', 'status', 'ships'] },
  access: { read: () => true },
  fields: [
    { name: 'name', type: 'text', required: true },
    { name: 'lat', type: 'number' },
    { name: 'lng', type: 'number' },
    {
      name: 'status',
      type: 'select',
      defaultValue: 'kandidaat',
      options: [
        { label: 'Afgerond / Completed', value: 'afgerond' },
        { label: 'Ingediend / Submitted', value: 'ingediend' },
        { label: 'Kandidaat / Candidate', value: 'kandidaat' },
      ],
    },
    { name: 'ships', type: 'number', label: 'Ship count' },
    { name: 'notes', type: 'textarea', localized: true },
    { name: 'date', type: 'text', label: 'Date label', admin: { description: 'e.g. "Afgerond 2023" or "Kandidaat".' } },
  ],
}
