import type { CollectionConfig } from 'payload'

import { isAdminOrEditor } from '../access'
import { collectionRebuildHooks } from '../hooks/triggerRebuild'

export const InfoBoards: CollectionConfig = {
  slug: 'info-boards',
  admin: { useAsTitle: 'name', defaultColumns: ['name', 'status', 'ships'] },
  access: { read: () => true, create: isAdminOrEditor, update: isAdminOrEditor, delete: isAdminOrEditor },
  hooks: collectionRebuildHooks,
  fields: [
    { name: 'name', type: 'text', required: true },
    {
      name: 'lat',
      type: 'number',
      admin: { description: 'Decimale graden. Positief = Noord, negatief = Zuid. Bereik: −90 tot 90. Voorbeeld: 52.3738 (Amsterdam). Een antipode op het zuidelijk halfrond heeft een negatieve waarde, bijv. −33.8688 (Sydney).' },
    },
    {
      name: 'lng',
      type: 'number',
      admin: { description: 'Decimale graden. Positief = Oost, negatief = West. Bereik: −180 tot 180. Voorbeeld: 4.8910 (Amsterdam). Locaties ten westen van de nulmeridiaan (Amerika, enz.) hebben een negatieve waarde, bijv. −74.0060 (New York).' },
    },
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
