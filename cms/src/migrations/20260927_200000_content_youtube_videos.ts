import type { MigrateDownArgs, MigrateUpArgs } from '@payloadcms/db-sqlite'

/**
 * Data migration: move the site's videos to YouTube.
 *
 * Content the 20260806 schema migration makes room for, applied to whatever prod
 * holds at deploy time. Every change is guarded on the value we expect to find, so
 * it is a no-op on a fresh database and never overwrites an edit an editor made
 * after this was written. Runs inside the migration's transaction (`req`), so it
 * lands completely or not at all.
 *
 *   media-items 1   "Waterschatten" MP4 -> YouTube link
 *   media-items 2-7 the other MP4 videos, not on YouTube -> deleted (agreed 2026-09-27)
 *   home-page       media spotlight embeds the Waterschatten video
 *   media-page      featured video embeds it too
 *   blog-posts 2    cover image focus center -> top
 *
 * The MP4 files themselves (media 39-45, ~290 MB on R2) are left alone: deleting a
 * media doc deletes its R2 object, which no DB backup brings back. Remove them in
 * the admin once nobody wants them.
 */

const WATERSCHATTEN = 'https://www.youtube.com/watch?v=_nyd12t2_j4'
const DROPPED_VIDEOS = [2, 3, 4, 5, 6, 7]
const context = { skipRebuild: true }

export async function up({ payload, req }: MigrateUpArgs): Promise<void> {
  const log = (msg: string) => payload.logger.info(`[content_youtube_videos] ${msg}`)
  const find = (id: number) =>
    payload.findByID({ collection: 'media-items', id, depth: 0, req, disableErrors: true })

  const first = await find(1)
  if (first && first.type === 'video' && !first.youtubeUrl && first.format === 'MP4') {
    await payload.update({
      collection: 'media-items',
      id: 1,
      data: { format: 'YouTube', youtubeUrl: WATERSCHATTEN, file: null },
      depth: 0,
      req,
      context,
    })
    log('media-items 1 -> YouTube')
  } else {
    log('media-items 1 not in the expected MP4 state, left as is')
  }

  for (const id of DROPPED_VIDEOS) {
    const doc = await find(id)
    if (doc && doc.type === 'video' && !doc.youtubeUrl && doc.format === 'MP4') {
      await payload.delete({ collection: 'media-items', id, req, context })
      log(`media-items ${id} deleted (MP4 video without YouTube link)`)
    } else {
      log(`media-items ${id} ${doc ? 'changed since, left as is' : 'already gone'}`)
    }
  }

  const home = await payload.findGlobal({ slug: 'home-page', depth: 0, req })
  if (!home.mediaSpotlightYoutubeUrl) {
    await payload.updateGlobal({ slug: 'home-page', data: { mediaSpotlightYoutubeUrl: WATERSCHATTEN }, depth: 0, req, context })
    log('home-page media spotlight -> YouTube')
  }

  const media = await payload.findGlobal({ slug: 'media-page', depth: 0, req })
  if (!media.featuredYoutubeUrl) {
    await payload.updateGlobal({ slug: 'media-page', data: { featuredYoutubeUrl: WATERSCHATTEN }, depth: 0, req, context })
    log('media-page featured video -> YouTube')
  }

  const post = await payload.findByID({ collection: 'blog-posts', id: 2, depth: 0, req, disableErrors: true })
  if (post && post.coverImageFocus === 'center') {
    await payload.update({ collection: 'blog-posts', id: 2, data: { coverImageFocus: 'top' }, depth: 0, req, context })
    log('blog-posts 2 cover focus -> top')
  }
}

export async function down({ payload }: MigrateDownArgs): Promise<void> {
  // Content is not un-migrated in code. To undo, restore the pre-release DB backup
  // (Actions -> Rollback -> restore_db_from).
  payload.logger.warn('[content_youtube_videos] down is a no-op; restore the pre-release backup to undo')
}
