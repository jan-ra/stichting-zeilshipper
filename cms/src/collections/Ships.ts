import type { CollectionConfig } from 'payload'

import { isAdminOrEditor } from '../access'
import { collectionRebuildHooks } from '../hooks/triggerRebuild'

export const Ships: CollectionConfig = {
  slug: 'ships',
  admin: { useAsTitle: 'name', defaultColumns: ['name', 'image', 'type', 'port', 'region'] },
  access: { read: () => true, create: isAdminOrEditor, update: isAdminOrEditor, delete: isAdminOrEditor },
  hooks: collectionRebuildHooks,
  fields: [
    { name: 'name', type: 'text', required: true },
    { name: 'type', type: 'text' },
    { name: 'port', type: 'text' },
    {
      name: 'region',
      type: 'select',
      defaultValue: 'thuiswateren',
      options: [
        { label: 'Thuiswateren', value: 'thuiswateren' },
        { label: 'Europa', value: 'europa' },
        { label: 'Wereld', value: 'wereld' },
      ],
    },
    {
      name: 'image',
      type: 'upload',
      relationTo: 'media',
      admin: {
        components: {
          Cell: '@/components/ShipImageCell#default',
        },
      },
    },
    { name: 'lat', type: 'number' },
    { name: 'lng', type: 'number' },
    {
      name: 'mmsi',
      type: 'text',
      admin: {
        description: '9-digit AIS MMSI for nightly position tracking. Look it up by ship name on marinetraffic.com or vesselfinder.com.',
      },
    },
    {
      name: 'autoTrack',
      type: 'checkbox',
      defaultValue: true,
      label: 'Auto-update position from AIS',
    },
    {
      name: 'positionUpdatedAt',
      type: 'date',
      admin: {
        readOnly: true,
        description: 'Last time the position was refreshed from AIS.',
      },
    },
    { name: 'speed', type: 'number', label: 'Speed (kn)' },
    { name: 'year', type: 'number', label: 'Year built' },
    { name: 'passengers', type: 'number' },
  ],
}
