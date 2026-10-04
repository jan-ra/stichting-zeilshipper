// Videos are not stored in the media bucket — they live on YouTube and are
// referenced by their watch link. Accepts the usual public link shapes.
export function youtubeId(url: string | null | undefined): string | null {
  if (!url) return null
  const m = /(?:youtube\.com\/(?:watch\?(?:.*&)?v=|embed\/|shorts\/|live\/)|youtu\.be\/)([A-Za-z0-9_-]{6,})/.exec(url)
  return m ? m[1] : null
}

export function youtubeEmbedUrl(url: string | null | undefined): string | null {
  const id = youtubeId(url)
  return id ? `https://www.youtube.com/embed/${id}` : null
}
