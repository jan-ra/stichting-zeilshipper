import type { CollectionConfig } from 'payload'

import { isAdmin } from '../access'
import { collectionRebuildHooks } from '../hooks/triggerRebuild'

// Built-in upload collection. Public reads; only admins can create/update/delete.
export const Media: CollectionConfig = {
  slug: 'media',
  access: {
    read:   () => true,
    create: isAdmin,
    update: isAdmin,
    delete: isAdmin,
  },
  hooks: collectionRebuildHooks,
  upload: {
    mimeTypes: ['image/*', 'video/*', 'audio/*', 'application/pdf', 'application/zip'],
  },
  fields: [
    {
      name: 'alt',
      type: 'text',
      label: 'Alt text',
    },
  ],
}
