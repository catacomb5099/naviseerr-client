/** Pure helpers for the manual-import table: what a Soulseek file row shows, how rows sort and filter.
 *  Kept free of React so `scripts/check-candidates.ts` can exercise them. */
import { shortDate } from './utils'

/** The suffixes the server treats as lossless (SlskdSearchResultProcessor); such files carry no bitrate. */
const LOSSLESS = new Set(['flac', 'wav', 'aif', 'aiff', 'ape', 'wv'])

/** The last path segment. slskd paths use backslashes, a share alias may start them (`@@abc\...`), and a
 *  few sharers use forward slashes, so both separators split. */
export function basename(path: string): string {
  const parts = path.split(/[\\/]/)
  return parts[parts.length - 1] || path
}

/** Everything before the last path separator: the folder slskd put the file in. "" for a bare name
 *  (and for a leading separator alone). Both separators cut, as in `basename`. */
export function folderOf(path: string): string {
  const cut = Math.max(path.lastIndexOf('\\'), path.lastIndexOf('/'))
  return cut > 0 ? path.slice(0, cut) : ''
}

/** The format from the file name's suffix, lower-case ("flac", "mp3"); "" when there is none. The
 *  server does the same because slskd's own extension field is often blank or wrong. */
export function formatOf(filename: string): string {
  const name = basename(filename)
  const dot = name.lastIndexOf('.')
  return dot > 0 ? name.slice(dot + 1).toLowerCase() : ''
}

export function isLossless(extension: string): boolean {
  return LOSSLESS.has(extension.toLowerCase())
}

/** "Lossless" for a lossless suffix, "320 kbps" for a known bitrate, "—" otherwise. */
export function qualityLabel(c: { extension: string; bitrateKbps: number | null }): string {
  if (isLossless(c.extension)) return 'Lossless'
  if (c.bitrateKbps != null && c.bitrateKbps > 0) return `${Math.round(c.bitrateKbps)} kbps`
  return '—'
}

/** A number to sort quality by: lossless above every bitrate, unknown last (null). */
export function qualityRank(c: { extension: string; bitrateKbps: number | null }): number | null {
  if (isLossless(c.extension)) return 100000
  return c.bitrateKbps != null && c.bitrateKbps > 0 ? c.bitrateKbps : null
}

/** "31.2 MB", "412 MB", "1.2 GB"; "—" when unknown. */
export function formatBytes(bytes: number | null | undefined): string {
  if (bytes == null || bytes < 0) return '—'
  if (bytes < 1024) return `${bytes} B`
  const units = ['KB', 'MB', 'GB', 'TB']
  let value = bytes / 1024
  let unit = 0
  while (value >= 1024 && unit < units.length - 1) { value /= 1024; unit++ }
  return `${value >= 100 ? Math.round(value) : value.toFixed(1)} ${units[unit]}`
}

/** "1.8 MB/s", "245 KB/s"; "—" when slskd gave no speed. */
export function formatSpeed(bytesPerSecond: number | null | undefined): string {
  if (bytesPerSecond == null || bytesPerSecond <= 0) return '—'
  return `${formatBytes(bytesPerSecond)}/s`
}

/** "Free" when the sharer has an upload slot, else how long their queue is. */
export function slotLabel(c: { freeSlot: boolean | null; queueLength: number }): string {
  if (c.freeSlot) return 'Free'
  return c.queueLength > 0 ? `Queue ${c.queueLength}` : c.freeSlot === false ? 'Busy' : '—'
}

/** Sort key for the slot column: a free slot first, then the shortest queue; unknown last. */
export function slotRank(c: { freeSlot: boolean | null; queueLength: number }): number | null {
  if (c.freeSlot) return 0
  if (c.freeSlot === null && c.queueLength === 0) return null
  return c.queueLength + 1
}

export const GRADE_LABEL: Record<string, string> = {
  EXACT: 'Exact',
  OTHER_VERSION: 'Other version',
  UNVERIFIED: 'Unverified',
  NONE: 'Not a match',
}

/** What each badge means, for the hover hint; a person may overrule every one of them. */
export const GRADE_HINT: Record<string, string> = {
  EXACT: 'Naviseerr reads this file as the requested version of the song',
  OTHER_VERSION: 'Naviseerr reads this file as another version: a live take, a remix, an edit',
  UNVERIFIED: 'The file is the song by name, but nothing in its path names the artist',
  NONE: 'Naviseerr reads this file as a different song. It is listed so you can decide for yourself',
}

/** Sort key for the match column: the server's grades in order of confidence. */
export function gradeRank(grade: string): number {
  return grade === 'EXACT' ? 0 : grade === 'OTHER_VERSION' ? 1 : grade === 'UNVERIFIED' ? 2 : 3
}

export type SortDir = 'asc' | 'desc'
export type SortValue = string | number | boolean | null | undefined

/** `rows` ordered by `value`, nulls last in BOTH directions, ties kept in their incoming order. Text
 *  compares case-insensitively. A new array; `rows` is left alone. */
export function sortRows<T>(rows: T[], value: (row: T) => SortValue, dir: SortDir): T[] {
  const sign = dir === 'asc' ? 1 : -1
  return rows
    .map((row, index) => ({ row, index, v: value(row) }))
    .sort((a, b) => {
      const an = a.v == null, bn = b.v == null
      if (an || bn) return an && bn ? a.index - b.index : an ? 1 : -1
      let cmp: number
      if (typeof a.v === 'string' || typeof b.v === 'string') {
        cmp = String(a.v).localeCompare(String(b.v), undefined, { sensitivity: 'base', numeric: true })
      } else {
        cmp = Number(a.v) - Number(b.v)
      }
      return cmp !== 0 ? sign * cmp : a.index - b.index
    })
    .map(x => x.row)
}

/** The rows whose `haystack` texts contain `text`, case-insensitively; every row when `text` is blank. */
export function filterRows<T>(rows: T[], text: string, haystack: (row: T) => (string | null | undefined)[]): T[] {
  const needle = text.trim().toLowerCase()
  if (!needle) return rows
  return rows.filter(row => haystack(row).some(s => s != null && s.toLowerCase().includes(needle)))
}

/** The day lists have been kept since (V15 of the server), named in the sentences so a person knows why an older
 *  download has none. */
const LISTS_KEPT_SINCE = '8 October 2026'

/** " on 5 Oct" from an ISO instant, "" when there is none or it cannot be read. */
function onDate(searchedAt: string | null | undefined): string {
  const date = searchedAt ? new Date(searchedAt) : null
  return date && !Number.isNaN(date.getTime()) ? ` on ${shortDate(date)}` : ''
}

/** The dialog's one line when there is no table to show. `kind` picks the song or album wording;
 *  null means "there is a list" (status READY). `searchedAt` dates the sentences that tell of a search. */
export function statusCopy(
  kind: 'SONG' | 'ALBUM',
  status: string,
  reason: string | null,
  query: string | null,
  searchedAt?: string | null,
): string | null {
  if (status === 'READY') return null
  if (status === 'SEARCHING') {
    return kind === 'SONG'
      ? 'Still searching Soulseek for this song. The list fills in when the search finishes.'
      : 'Still searching Soulseek for this album. The list fills in when the search finishes.'
  }
  const when = onDate(searchedAt)
  switch (reason) {
    case 'BEFORE_CACHE':
      // The song sentence hedges: the server answers BEFORE_CACHE for every song with no completed search
      // that it cannot name a cause for (and, before naviseerr #136, for every failed search), so a
      // confident "searched before lists were kept" would be wrong for those rows.
      return kind === 'SONG'
        ? `No file list was kept for this song: it was searched before lists were kept (${LISTS_KEPT_SINCE}), or its search never completed.`
        : `Naviseerr searched Soulseek for “${query ?? 'this album'}”${when} and found a sharer holding the album, but folder lists were only kept from ${LISTS_KEPT_SINCE}, so there is no list.`
    case 'NO_RESULTS':
      return `Soulseek found nothing for “${query ?? 'this song'}”${when}. Retry the song to search again.`
    case 'ALREADY_IN_LIBRARY':
      return 'This song was already in your library, so nothing was searched.'
    case 'NO_OWN_SEARCH':
      return 'This song was never searched for on its own: its file came from the album search\'s folder. Use the person icon on the album to see every folder found.'
    case 'SEARCH_FAILED':
      return kind === 'SONG'
        ? 'The search for this song never completed: slskd refused it or did not answer, so there is no list.'
        : 'Soulseek could not be asked for this album: slskd refused or did not answer the search, so each song searched on its own. Use the person icon on a song instead.'
    case 'SOULSEEK_OFFLINE':
      return 'The search for this song never completed: Soulseek was offline, so there is no list.'
    case 'NO_WHOLE_FOLDER':
      return 'Nobody shared enough of this album as one folder, so each song was searched on its own. Use the person icon on a song instead.'
    case 'NOTHING_TO_SEARCH':
      return 'Every song had already started on its own when the album search was due, so nothing was searched for the album as a whole. Use the person icon on a song instead.'
    case 'CANCELLED':
      return kind === 'SONG'
        ? `The search for this song was cancelled${when}, so there is no list.`
        : `The album search was cancelled with the download${when}.`
    case 'NO_ALBUM_SEARCH':
      return 'This album was downloaded before folder lists were kept.'
    default:
      return kind === 'SONG' ? 'No file list is available for this song.' : 'No folder list is available for this album.'
  }
}

/** The grey line under the header that lets a person find the search in slskd's own Searches page:
 *  "Soulseek search <id> · 5 Oct 09:23" (local time), the id alone when the time is unknown, null when
 *  slskd never took a search (nothing to look up: that is the point). */
export function searchLine(searchId: string | null | undefined, searchedAt: string | null | undefined): string | null {
  if (!searchId) return null
  const date = searchedAt ? new Date(searchedAt) : null
  if (!date || Number.isNaN(date.getTime())) return `Soulseek search ${searchId}`
  const time = `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`
  return `Soulseek search ${searchId} · ${shortDate(date)} ${time}`
}
