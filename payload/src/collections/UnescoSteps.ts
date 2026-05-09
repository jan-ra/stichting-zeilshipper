import type { CollectionConfig } from 'payload'

export const UnescoSteps: CollectionConfig = {
  slug: 'unesco-steps',
  admin: {
    useAsTitle: 'label',
    defaultColumns: ['year', 'label', 'done', 'active'],
    defaultSort: 'order',
  },
  access: { read: () => true },
  fields: [
    {
      name: 'year',
      type: 'text',
      required: true,
      admin: { description: 'e.g. "2025" or "2026–27"' },
    },
    { name: 'label', type: 'text', required: true, localized: true },
    {
      name: 'done',
      type: 'checkbox',
      defaultValue: false,
      label: 'Completed',
    },
    {
      name: 'active',
      type: 'checkbox',
      defaultValue: false,
      label: 'Current step',
    },
    {
      name: 'order',
      type: 'number',
      required: true,
      admin: { description: 'Sort order — lower numbers appear first.' },
    },
  ],
}
