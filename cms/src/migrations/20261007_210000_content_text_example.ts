import type { MigrateDownArgs, MigrateUpArgs } from '@payloadcms/db-sqlite'

import { tableIsEmpty } from '../lib/migrationGuards'

/**
 * Data migration: one example "text" media item, so the new text layout (cover,
 * introduction, link to the full piece) has something to show.
 *
 * PLACEHOLDER agreed with the maintainer (2026-10-07): it introduces the foundation's
 * own article "De schipper als levend erfgoed" with the "De bruine vloot voor Hoorn"
 * photo as cover. Editors replace or delete it in the admin once a real book or press
 * article is chosen.
 *
 * Guarded so it never runs twice or on a fresh database: it only creates the item when
 * the cover photo (media 48) is still the one we expect and no text item exists yet.
 */

const COVER_ID = 48
const COVER_FILENAME = 'Klipper Avondrood - De bruine vloot voor Hoorn.jpg'
const ARTICLE_URL = 'https://stichtingzeilschipper.nl/blog/schipper-bruine-vloot-immaterieel-erfgoed'
const context = { skipRebuild: true }

const NL = {
  title: 'De schipper als levend erfgoed',
  description: 'Waarom het erfgoed van de Bruine Vloot niet in het schip zit, maar in de mensen die ermee varen.',
  tag: 'Artikel',
  source: 'Stichting Zeilschipper, blog',
  body: [
    'Wie een traditioneel zeilschip van de Bruine Vloot in een haven ziet liggen, ziet eerst het schip: de masten, de zeilen, het hout en het staal. Maar het immaterieel erfgoed waar dit artikel over gaat, is niet het schip zelf.',
    'Het erfgoed leeft in de schipper: in de kennis van wind, stroming en getij, in het vakmanschap om een eeuwenoud schip veilig te varen, en in het doorgeven van dat ambacht aan bemanning en passagiers.',
    'Het artikel beschrijft hoe dat vakmanschap wordt overgedragen en waarom erkenning als immaterieel cultureel erfgoed helpt om het levend te houden.',
  ].join('\n\n'),
}

const EN = {
  title: 'The skipper as living heritage',
  description: 'Why the heritage of the Bruine Vloot lives not in the ship but in the people who sail it.',
  tag: 'Article',
  source: 'Stichting Zeilschipper, blog',
  body: [
    'Anyone who sees a traditional Bruine Vloot sailing ship moored in a harbour sees the ship first: the masts, the sails, the wood and the steel. But the intangible heritage this article is about is not the ship itself.',
    'The heritage lives in the skipper: in the knowledge of wind, current and tide, in the craft of sailing a centuries-old ship safely, and in passing that craft on to crew and passengers.',
    'The article describes how this craft is handed down and why recognition as intangible cultural heritage helps to keep it alive.',
  ].join('\n\n'),
}

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  const log = (msg: string) => payload.logger.info(`[content_text_example] ${msg}`)

  // See tableIsEmpty: on an empty database there is no cover photo to use.
  if (await tableIsEmpty(db, 'media')) {
    log('empty database, no example created')
    return
  }

  const cover = await payload.findByID({ collection: 'media', id: COVER_ID, depth: 0, req, disableErrors: true })
  if (!cover || cover.filename !== COVER_FILENAME) {
    log(`media ${COVER_ID} is not the expected cover photo, no example created`)
    return
  }

  const existing = await payload.find({ collection: 'media-items', where: { type: { equals: 'text' } }, limit: 1, depth: 0, req })
  if (existing.totalDocs > 0) {
    log('a text item already exists, no example created')
    return
  }

  const doc = await payload.create({
    collection: 'media-items',
    locale: 'nl',
    data: {
      type: 'text',
      category: 'tekst',
      format: 'Web',
      coverImage: COVER_ID,
      externalUrl: ARTICLE_URL,
      ...NL,
    },
    depth: 0,
    req,
    context,
  })
  await payload.update({ collection: 'media-items', id: doc.id, locale: 'en', data: EN, depth: 0, req, context })
  log(`media-items ${doc.id} created (example text item)`)
}

export async function down({ payload }: MigrateDownArgs): Promise<void> {
  // Content is not un-migrated in code. Delete the item in the admin, or restore the
  // pre-release DB backup (Actions -> Rollback -> restore_db_from).
  payload.logger.warn('[content_text_example] down is a no-op; delete the item in the admin to undo')
}
