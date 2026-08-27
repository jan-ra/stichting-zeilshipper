import type { CollectionConfig } from 'payload'

import { isAdminOrEditor } from '../access'
import { collectionRebuildHooks } from '../hooks/triggerRebuild'
import { youtubeId } from '../lib/youtube'

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
    { name: 'format', type: 'text', admin: { description: 'e.g. YouTube, ZIP, PDF, Spotify.' } },
    {
      name: 'youtubeUrl',
      type: 'text',
      label: 'YouTube URL',
      admin: {
        condition: (_, siblingData) => siblingData?.type === 'video',
        description: 'Videos are hosted on YouTube. Paste the watch link, e.g. https://www.youtube.com/watch?v=_nyd12t2_j4',
      },
      validate: (value: string | null | undefined, { siblingData }: { siblingData: { type?: string } }) => {
        if (siblingData?.type !== 'video') return true
        if (!value) return 'A YouTube URL is required for videos.'
        return youtubeId(value) ? true : 'Not a recognisable YouTube URL.'
      },
    },
    {
      name: 'file',
      type: 'upload',
      relationTo: 'media',
      admin: {
        condition: (_, siblingData) => siblingData?.type !== 'video',
        description: 'Upload to the Media library. Not used for videos — those live on YouTube.',
      },
    },
    { name: 'externalUrl', type: 'text', label: 'External URL', admin: { condition: (_, siblingData) => siblingData?.type !== 'video', description: 'Use this when the asset lives off-platform (Spotify, R2…).' } },
  ],
}
