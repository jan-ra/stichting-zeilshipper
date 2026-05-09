import type { CollectionConfig } from 'payload'

// Built-in upload collection. Backs every Image/File field on the editorial
// collections. Public reads so the static load script (and ultimately the
// browser, in dev) can fetch URLs without auth.
export const Media: CollectionConfig = {
  slug: 'media',
  access: {
    read: () => true,
  },
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
