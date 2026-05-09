import type { CollectionConfig } from 'payload'

export const Partners: CollectionConfig = {
  slug: 'partners',
  admin: {
    useAsTitle: 'name',
    defaultColumns: ['name', 'order'],
    defaultSort: 'order',
  },
  access: { read: () => true },
  fields: [
    { name: 'name', type: 'text', required: true },
    {
      name: 'order',
      type: 'number',
      admin: { description: 'Display order — lower numbers appear first.' },
    },
  ],
}
