/** Links that hand a song to YouTube Music to play. Nothing streams through naviseerr: the listener
 *  leaves for music.youtube.com (or the YouTube Music app, which phones open for these links).
 *  See docs/research/youtube-music-play-links-04-10-2026.md for which links work and why. */
const YTM = 'https://music.youtube.com'

/** A song's YouTube Music link: the player on its videoId, or a YouTube Music search for title and
 *  first artist when there is no real id ("" from search, null on a song admitted before ids were
 *  kept, "legacy-..." on a download row older than that). Null when there is nothing to search for. */
export function songLink(videoId: string | null | undefined, title: string | null | undefined,
                         artists: string[]): string | null {
  if (videoId && !videoId.startsWith('legacy-')) return `${YTM}/watch?v=${encodeURIComponent(videoId)}`
  const query = [title?.trim(), artists[0]].filter(Boolean).join(' ')
  return query ? `${YTM}/search?q=${encodeURIComponent(query)}` : null
}

/** An album or playlist on YouTube Music. With its playlist id and a first track, the player starts
 *  on that track with the rest queued (`watch?list=` alone gives YouTube's generic page, so the track
 *  is needed). Otherwise its page, one press of Play short: an album by browseId, which YouTube
 *  redirects to the album playlist; a playlist by its own id, `VL` prefix dropped. `plays` says which. */
export function collectionLink(type: 'ALBUM' | 'PLAYLIST', id: string, playlistId: string | null | undefined,
                               firstTrackId: string | undefined): { href: string; plays: boolean } {
  const list = playlistId || (type === 'PLAYLIST' ? id.replace(/^VL/, '') : null)
  if (list && firstTrackId) {
    return { href: `${YTM}/watch?v=${encodeURIComponent(firstTrackId)}&list=${encodeURIComponent(list)}`, plays: true }
  }
  return {
    href: type === 'ALBUM' ? `${YTM}/browse/${encodeURIComponent(id)}` : `${YTM}/playlist?list=${encodeURIComponent(list ?? id)}`,
    plays: false,
  }
}
