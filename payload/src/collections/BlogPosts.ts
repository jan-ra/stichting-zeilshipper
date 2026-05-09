import type { CollectionConfig } from 'payload'

export const BlogPosts: CollectionConfig = {
  slug: 'blog-posts',
  admin: { useAsTitle: 'title', defaultColumns: ['title', 'date', 'category'] },
  access: { read: () => true },
  fields: [
    { name: 'title', type: 'text', required: true, localized: true },
    {
      name: 'slug',
      type: 'text',
      unique: true,
      admin: { description: 'URL slug. Auto-derived from the Dutch title if left blank.' },
      hooks: {
        beforeValidate: [
          ({ value, data }) => {
            if (value) return value
            const title = data?.title
            if (!title) return value
            return String(title)
              .toLowerCase()
              .normalize('NFD')
              .replace(/[̀-ͯ]/g, '')
              .replace(/[^a-z0-9]+/g, '-')
              .replace(/^-+|-+$/g, '')
          },
        ],
      },
    },
    { name: 'date', type: 'date', admin: { date: { pickerAppearance: 'dayOnly' } } },
    { name: 'category', type: 'text', localized: true },
    { name: 'author', type: 'text', label: 'Author name' },
    { name: 'authorPhoto', type: 'upload', relationTo: 'media' },
    { name: 'readTime', type: 'text', admin: { description: 'e.g. "5 min".' } },
    { name: 'coverImage', type: 'upload', relationTo: 'media' },
    { name: 'excerpt', type: 'textarea', localized: true },
    {
      name: 'body',
      type: 'array',
      label: 'Body (paragraphs)',
      labels: { singular: 'Paragraph', plural: 'Paragraphs' },
      localized: true,
      fields: [{ name: 'text', type: 'textarea', required: true }],
    },
    {
      name: 'images',
      type: 'array',
      label: 'Body images',
      labels: { singular: 'Image', plural: 'Images' },
      admin: { description: '"After paragraph" is the 1-based index of the paragraph the image appears below.' },
      fields: [
        { name: 'image', type: 'upload', relationTo: 'media', required: true },
        { name: 'alt', type: 'text', localized: true },
        { name: 'after', type: 'number', label: 'After paragraph', min: 1 },
      ],
    },
  ],
}
