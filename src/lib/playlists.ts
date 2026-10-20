import { PlaylistSummary } from '../api/types'

/** Spotify's limits for a playlist's name and description; the server holds the same ones. */
export const TITLE_MAX = 100
export const DESCRIPTION_MAX = 300

/** Up to four different song pictures, in playlist order: what the 2x2 cover is made of. */
export function mosaicOf(images: (string | null | undefined)[]): string[] {
  return Array.from(new Set(images.filter((src): src is string => !!src))).slice(0, 4)
}

/** What a playlist's cover shows: your picture; else four different song pictures as a 2x2 grid (Spotify,
 *  YouTube Music, Navidrome and Jellyfin all do this); with fewer than four, the first one alone; else a
 *  plain square. */
export type Cover =
  | { kind: 'picture'; src: string }
  | { kind: 'grid'; srcs: string[] }
  | { kind: 'single'; src: string }
  | { kind: 'empty' }

export function coverOf(coverUrl: string | null, mosaic: string[]): Cover {
  if (coverUrl) return { kind: 'picture', src: coverUrl }
  if (mosaic.length >= 4) return { kind: 'grid', srcs: mosaic.slice(0, 4) }
  if (mosaic.length > 0) return { kind: 'single', src: mosaic[0] }
  return { kind: 'empty' }
}

/** "Draft · 12 songs" while it can still change, "12 songs" once created; "1 song" for one. */
export function playlistMeta(p: Pick<PlaylistSummary, 'trackCount' | 'downloadedAt'>): string {
  const songs = `${p.trackCount} ${p.trackCount === 1 ? 'song' : 'songs'}`
  return p.downloadedAt ? songs : `Draft · ${songs}`
}

/** True when another of your playlists has this name (case and outer spaces aside): both would write the
 *  same playlist file in your music app, and the last one created wins. */
export function titleClash(title: string, id: string, playlists: Pick<PlaylistSummary, 'id' | 'title'>[]): boolean {
  const key = title.trim().toLowerCase()
  return key !== '' && playlists.some(p => p.id !== id && p.title.trim().toLowerCase() === key)
}

/** The list with the item at `from` moved to `to` (both 0-based); the same list when either is out of range. */
export function moveItem<T>(list: T[], from: number, to: number): T[] {
  if (from === to || from < 0 || to < 0 || from >= list.length || to >= list.length) return list
  const next = [...list]
  next.splice(to, 0, ...next.splice(from, 1))
  return next
}

/** Where a dragged row lands: the number of OTHER rows whose middle is above the pointer. `mids` are the rows'
 *  vertical middles in their current order, the dragged one (`from`) included. */
export function dropIndex(pointerY: number, mids: number[], from: number): number {
  return mids.filter((mid, i) => i !== from && mid < pointerY).length
}

/** What the app says after an add: "Added 9 songs to Road trip · 3 were already in it", "Added Down to Road
 *  trip", "Down is already in Road trip". `song` is the song's name when one song was added, else null. */
export function addedCopy(result: { added: number; alreadyIn: number }, song: string | null, playlist: string): string {
  const { added, alreadyIn } = result
  if (added === 0) {
    if (song) return `${song} is already in ${playlist}`
    return alreadyIn === 1 ? `That song is already in ${playlist}` : `All ${alreadyIn} songs are already in ${playlist}`
  }
  const what = song ?? `${added} ${added === 1 ? 'song' : 'songs'}`
  const already = alreadyIn === 0 ? '' : ` · ${alreadyIn} ${alreadyIn === 1 ? 'was' : 'were'} already in it`
  return `Added ${what} to ${playlist}${already}`
}
