import type { CollectionConfig } from 'payload'

import { isAdminOrEditor } from '../access'
import { collectionRebuildHooks } from '../hooks/triggerRebuild'
import { publishShipRosterAfterChange, publishShipRosterAfterDelete } from '../hooks/publishShipRoster'

export const Ships: CollectionConfig = {
  slug: 'ships',
  admin: { useAsTitle: 'name', defaultColumns: ['name', 'image', 'type', 'port', 'area'] },
  access: { read: () => true, create: isAdminOrEditor, update: isAdminOrEditor, delete: isAdminOrEditor },
  // Rebuild the site on edit, and re-publish the tracking roster to R2 so the
  // nightly position job picks up MMSI / autoTrack changes.
  hooks: {
    afterChange: [...collectionRebuildHooks.afterChange, publishShipRosterAfterChange],
    afterDelete: [...collectionRebuildHooks.afterDelete, publishShipRosterAfterDelete],
  },
  fields: [
    { name: 'name', type: 'text', required: true },
    { name: 'type', type: 'text' },
    // Still stored as `port`: renaming the column would not be additive. Only the label changed.
    { name: 'port', type: 'text', label: 'Homeport' },
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
    // Positions are no longer stored here — the nightly job owns them on R2
    // (data/positions.json) and the site fetches them at runtime. These two are
    // kept read-only as a rollback safety net and will be dropped once the R2
    // path has proven itself in production. Editing them has no effect.
    {
      name: 'lat',
      type: 'number',
      admin: { readOnly: true, description: 'Unused — positions come from AIS via R2.' },
    },
    {
      name: 'lng',
      type: 'number',
      admin: { readOnly: true, description: 'Unused — positions come from AIS via R2.' },
    },
    {
      name: 'mmsi',
      type: 'text',
      admin: {
        description: '9-digit AIS MMSI for nightly position tracking. Look it up by ship name on marinetraffic.com or vesselfinder.com. Saving this ship republishes the tracking list; the position itself refreshes overnight.',
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
        description: 'Unused — the live value lives in data/positions.json on the media bucket.',
      },
    },
    { name: 'speed', type: 'number', label: 'Speed (kn)' },
    { name: 'year', type: 'number', label: 'Year built' },
    {
      name: 'area',
      type: 'select',
      label: 'Sailing area',
      defaultValue: 'inland',
      options: [
        { label: 'Inland (Binnen)', value: 'inland' },
        { label: 'Sea (Zee)', value: 'sea' },
      ],
      admin: { description: 'Used by the area filter on the fleet page.' },
    },
    { name: 'crew', type: 'number', label: 'Crew', defaultValue: 2, min: 0 },
    {
      name: 'website',
      type: 'text',
      admin: { description: "The ship's own website, e.g. https://www.example.nl. Shown as a link on the ship card." },
      validate: (value: string | null | undefined) =>
        !value || /^https?:\/\/\S+\.\S+$/.test(value) ? true : 'Enter a full URL starting with http:// or https://',
    },
    // No longer shown anywhere. Hidden rather than removed so the column survives and a
    // rollback to the previous image still finds it; drop it in a later contract step.
    { name: 'passengers', type: 'number', admin: { hidden: true } },
  ],
}
