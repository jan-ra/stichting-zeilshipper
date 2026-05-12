import type { GlobalConfig } from 'payload'

import { isAdminOrEditor } from '../access'
import { globalRebuildHooks } from '../hooks/triggerRebuild'

export const HomePage: GlobalConfig = {
  slug: 'home-page',
  admin: { group: 'Site' },
  access: { read: () => true, update: isAdminOrEditor },
  hooks: globalRebuildHooks,
  fields: [
    // ── Hero ──────────────────────────────────────────────────────────────────
    {
      type: 'collapsible',
      label: 'Hero section',
      fields: [
        { name: 'heroBadge',     type: 'text',     localized: true, label: 'Hero badge (small uppercase label)' },
        { name: 'heroTitle',     type: 'text',     localized: true, label: 'Hero title' },
        { name: 'heroPara1',     type: 'textarea', localized: true, label: 'Hero paragraph 1' },
        { name: 'heroPara2',     type: 'textarea', localized: true, label: 'Hero paragraph 2' },
        { name: 'ctaPrimary',    type: 'text',     localized: true, label: 'Primary CTA button label' },
        { name: 'ctaSecondary',  type: 'text',     localized: true, label: 'Secondary CTA button label' },
        { name: 'scrollHint',    type: 'text',     localized: true, label: 'Scroll hint text' },
      ],
    },

    // ── Scroll photos ─────────────────────────────────────────────────────────
    {
      name: 'scrollPhotos',
      type: 'array',
      label: 'Scrolling photo strip',
      admin: { description: 'Photos shown in the animated strip behind the hero. Order matters.' },
      fields: [
        { name: 'photo', type: 'upload', relationTo: 'media', required: true },
      ],
    },

    // ── Chapters ──────────────────────────────────────────────────────────────
    {
      name: 'chapters',
      type: 'array',
      label: 'Globe chapters (4 items — must match globe positions)',
      admin: { description: 'Chapter 1 = Netherlands, 2 = Europe, 3 = World, 4 = Return to port.' },
      fields: [
        { name: 'title',         type: 'text',     localized: true, label: 'Chapter title' },
        { name: 'sub',           type: 'text',     localized: true, label: 'Subtitle (italic, small)' },
        { name: 'body',          type: 'textarea', localized: true, label: 'Body paragraph' },
        { name: 'photo',         type: 'upload',   relationTo: 'media', label: 'Chapter photo (shown between panels)' },
        { name: 'photoPosition', type: 'text',     label: 'CSS object-position (e.g. center 70%)', defaultValue: 'center center' },
      ],
    },

    // ── Stats ─────────────────────────────────────────────────────────────────
    {
      type: 'collapsible',
      label: 'Statistics section',
      fields: [
        { name: 'statsCaption', type: 'textarea', localized: true, label: 'Stats caption (below counters)' },
        {
          name: 'stats',
          type: 'array',
          label: 'Stat counters (4 items)',
          fields: [
            { name: 'value',  type: 'number', label: 'Target value', required: true },
            { name: 'prefix', type: 'text',   label: 'Prefix (e.g. "~ ")' },
            { name: 'suffix', type: 'text',   label: 'Suffix (e.g. "*")' },
            { name: 'label',  type: 'text',   localized: true, label: 'Stat label', required: true },
          ],
        },
      ],
    },

    // ── Pillars ───────────────────────────────────────────────────────────────
    {
      type: 'collapsible',
      label: 'Three pillars section',
      fields: [
        { name: 'pillarsTitle', type: 'text', localized: true, label: 'Section title' },
        {
          name: 'pillars',
          type: 'array',
          label: 'Pillar cards (3 items)',
          fields: [
            { name: 'n',     type: 'text',     label: 'Number (e.g. 01)' },
            { name: 'title', type: 'text',     localized: true, label: 'Pillar title' },
            { name: 'body',  type: 'textarea', localized: true, label: 'Pillar body' },
          ],
        },
      ],
    },

    // ── UNESCO callout ────────────────────────────────────────────────────────
    {
      type: 'collapsible',
      label: 'UNESCO callout section',
      fields: [
        { name: 'unescoSectionBadge', type: 'text',     localized: true, label: 'Badge' },
        { name: 'unescoSectionTitle', type: 'text',     localized: true, label: 'Title' },
        { name: 'unescoSectionBody',  type: 'textarea', localized: true, label: 'Body' },
        { name: 'unescoSectionCta',   type: 'text',     localized: true, label: 'CTA button label' },
      ],
    },

    // ── Projects ──────────────────────────────────────────────────────────────
    {
      type: 'collapsible',
      label: 'Projects section',
      fields: [
        { name: 'projectsBadge',    type: 'text', localized: true, label: 'Badge' },
        { name: 'projectsTitle',    type: 'text', localized: true, label: 'Title' },
        { name: 'projectsReadMore', type: 'text', localized: true, label: '"Read more" link label' },
        {
          name: 'projects',
          type: 'array',
          label: 'Project cards (3 items)',
          fields: [
            { name: 'n',      type: 'text',     label: 'Number (e.g. 01)' },
            { name: 'title',  type: 'text',     localized: true, label: 'Project title' },
            { name: 'body',   type: 'textarea', localized: true, label: 'Project body' },
            { name: 'action', type: 'text',     label: 'Page route key (e.g. unesco, informatieborden, team)' },
          ],
        },
      ],
    },

    // ── Oral history ──────────────────────────────────────────────────────────
    {
      type: 'collapsible',
      label: 'Oral history section',
      fields: [
        { name: 'oralBadge',  type: 'text',     localized: true, label: 'Badge' },
        { name: 'oralTitle',  type: 'text',     localized: true, label: 'Title' },
        { name: 'oralPara1',  type: 'textarea', localized: true, label: 'Paragraph 1' },
        { name: 'oralPara2',  type: 'textarea', localized: true, label: 'Paragraph 2' },
        { name: 'oralPara3',  type: 'textarea', localized: true, label: 'Paragraph 3' },
        { name: 'oralNote',   type: 'textarea', localized: true, label: 'Note (italic, side quote)' },
        {
          name: 'oralItems',
          type: 'array',
          label: 'Oral history items (3 items)',
          fields: [
            { name: 'n',     type: 'text',     label: 'Number (e.g. 01)' },
            { name: 'title', type: 'text',     localized: true, label: 'Item title' },
            { name: 'body',  type: 'textarea', localized: true, label: 'Item body' },
          ],
        },
      ],
    },

    // ── Media spotlight ───────────────────────────────────────────────────────
    {
      type: 'collapsible',
      label: 'Media spotlight section',
      fields: [
        { name: 'mediaSpotlightBadge',     type: 'text',     localized: true, label: 'Badge' },
        { name: 'mediaSpotlightTitle',     type: 'text',     localized: true, label: 'Title' },
        { name: 'mediaSpotlightBody',      type: 'textarea', localized: true, label: 'Body' },
        { name: 'mediaSpotlightCta',       type: 'text',     localized: true, label: 'CTA button label' },
        { name: 'mediaSpotlightThumbnail', type: 'upload',   relationTo: 'media', label: 'Thumbnail image' },
      ],
    },

    // ── News preview ──────────────────────────────────────────────────────────
    {
      type: 'collapsible',
      label: 'News preview section',
      fields: [
        { name: 'newsBadge',   type: 'text', localized: true, label: 'Section badge' },
        { name: 'newsTitle',   type: 'text', localized: true, label: 'Section title' },
        { name: 'newsAllCta',  type: 'text', localized: true, label: '"All posts" link label' },
      ],
    },

    // ── Help / CTA ────────────────────────────────────────────────────────────
    {
      type: 'collapsible',
      label: 'Help / CTA section',
      fields: [
        { name: 'helpBadge', type: 'text',     localized: true, label: 'Badge' },
        { name: 'helpTitle', type: 'text',     localized: true, label: 'Title' },
        { name: 'helpBody',  type: 'textarea', localized: true, label: 'Body' },
        {
          name: 'helpButtons',
          type: 'array',
          label: 'Help CTA buttons (3 items)',
          fields: [
            { name: 'label', type: 'text', localized: true, label: 'Button label', required: true },
          ],
        },
      ],
    },
  ],
}
