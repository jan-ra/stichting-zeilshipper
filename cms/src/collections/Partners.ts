import type { CollectionConfig } from 'payload'

import { isAdminOrEditor } from '../access'

export const Partners: CollectionConfig = {
  slug: 'partners',
  admin: {
    useAsTitle: 'name',
    defaultColumns: ['name', 'order'],
    defaultSort: 'order',
  },
  access: { read: () => true, create: isAdminOrEditor, update: isAdminOrEditor, delete: isAdminOrEditor },
  fields: [
    { name: 'name', type: 'text', required: true },
    {
      name: 'order',
      type: 'number',
      admin: { description: 'Display order — lower numbers appear first.' },
    },
    { name: 'logo', type: 'upload', relationTo: 'media', label: 'Partner logo' },
    { name: 'url',  type: 'text',   label: 'Partner website URL' },
  ],
}
