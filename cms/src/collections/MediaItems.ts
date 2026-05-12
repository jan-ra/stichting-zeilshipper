import type { CollectionConfig } from 'payload'

import { isAdminOrEditor } from '../access'
import { collectionRebuildHooks } from '../hooks/triggerRebuild'

// "Media items" are editorial download/spotlight entries (videos, podcasts,
// PDFs) — not to be confused with the upload-backing `media` collection.
export const MediaItems: CollectionConfig = {
  slug: 'media-items',
  admin: { useAsTitle: 'title', defaultColumns: ['title', 'type', 'category'] },
  access: { read: () => true, create: isAdminOrEditor, update: isAdminOrEditor, delete: isAdminOrEditor },
  hooks: collectionRebuildHooks,
  fields: [
    {
      name: 'type',
      type: 'select',
      defaultValue: 'video',
      options: [
        { label: 'Video', value: 'video' },
        { label: 'Photo', value: 'photo' },
        { label: 'Text', value: 'text' },
        { label: 'Podcast', value: 'podcast' },
        { label: 'Project', value: 'project' },
      ],
    },
    { name: 'title', type: 'text', required: true, localized: true },
    { name: 'description', type: 'textarea', localized: true },
    { name: 'category', type: 'text' },
    { name: 'tag', type: 'text', localized: true },
    { name: 'format', type: 'text', admin: { description: 'e.g. MP4, ZIP, PDF, MP3.' } },
    { name: 'file', type: 'upload', relationTo: 'media', admin: { description: 'Upload to the Media library.' } },
    { name: 'externalUrl', type: 'text', label: 'External URL', admin: { description: 'Use this when the asset lives off-platform (Vimeo, Spotify, R2…).' } },
  ],
}
