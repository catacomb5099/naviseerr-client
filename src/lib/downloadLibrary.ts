import { DownloadStage } from '../api/types'
import { DownloadCardState, failureCopy } from './downloadPanel'

/** What the client knew about a download at the moment it was requested. The live feed carries
 *  only `songName`, so artwork, artist and album have to be captured here or lost forever. */
export interface DownloadMeta {
  downloadId: string
  /** Exactly the string sent to POST /download/{songName} - what the panel and the server echo. */
  songName: string
  trackName: string
  artistNames: string[]
  albumName: string | null
  iconURL: string | null
  requestedAt: string
}

/** Everything needed to record a download except the id and the clock, both of which only the
 *  hook knows. */
export type DownloadMetaInput = Omit<DownloadMeta, 'downloadId' | 'requestedAt'>

/** The last stage the client ever observed. Persisted because the page outlives the feed: a
 *  finished download ages out of /downloads/active and its card auto-dismisses, and without this
 *  a row the user watched succeed would come back reading "Waiting". */
export interface DownloadStageSnapshot {
  stage: DownloadStage
  progressPercent: number | null
  failureCode: string | null
  updatedAt: string
}

export interface DownloadLibraryEntry {
  meta: DownloadMeta
  snapshot: DownloadStageSnapshot
}

/** A row on the Downloads page: durable metadata joined with the freshest stage available. */
export interface DownloadItem extends DownloadMeta {
  stage: DownloadStage
  progressPercent: number | null
  failureCode: string | null
  updatedAt: string
  /** True when the live feed still reports this download, i.e. the stage is being observed right
   *  now rather than replayed from storage. Only that case animates. */
  live: boolean
}

/** Cap on stored entries. 250 rows is more history than the page can usefully show, and at a few
 *  hundred bytes each it is well under 100KB - two orders of magnitude below the localStorage
 *  quota, which matters because this key shares that quota with the panel snapshot. */
export const LIBRARY_CAP = 250

export function snapshotFromCard(card: DownloadCardState): DownloadStageSnapshot {
  return {
    stage: card.stage,
    progressPercent: card.progressPercent,
    failureCode: card.failureCode,
    updatedAt: card.updatedAt,
  }
}

/** The snapshot a freshly recorded download starts from: accepted by the server, nothing else
 *  promised. Same claim the panel's optimistic card makes. */
export function initialSnapshot(requestedAt: string): DownloadStageSnapshot {
  return { stage: 'QUEUED', progressPercent: null, failureCode: null, updatedAt: requestedAt }
}

export function sameSnapshot(a: DownloadStageSnapshot, b: DownloadStageSnapshot): boolean {
  return a.stage === b.stage
    && a.progressPercent === b.progressPercent
    && a.failureCode === b.failureCode
    && a.updatedAt === b.updatedAt
}

/**
 * Folds the live cards into the stored snapshots. Returns the same object when nothing moved so
 * the hook's state setter can bail out rather than re-render on every poll.
 */
export function applyCardsToEntries(
  entries: Record<string, DownloadLibraryEntry>,
  cards: DownloadCardState[],
): Record<string, DownloadLibraryEntry> {
  let next: Record<string, DownloadLibraryEntry> | null = null
  for (const card of cards) {
    const entry = entries[card.downloadId]
    // A card with no entry is not invented here - joinItems synthesises a row for it instead, so
    // the registry only ever holds downloads this client actually requested.
    if (!entry) continue
    const snapshot = snapshotFromCard(card)
    if (sameSnapshot(entry.snapshot, snapshot)) continue
    next = next ?? { ...entries }
    next[card.downloadId] = { meta: entry.meta, snapshot }
  }
  return next ?? entries
}

/** Metadata for a download this client has no record of: one requested before this feature
 *  existed, or from another browser. The song name is all the feed gives us, and it is honest to
 *  show that rather than to hide the row. */
export function metaFromCard(card: DownloadCardState): DownloadMeta {
  return {
    downloadId: card.downloadId,
    songName: card.songName,
    trackName: card.songName,
    artistNames: [],
    albumName: null,
    iconURL: null,
    requestedAt: card.stageEnteredAt,
  }
}

/**
 * The page's view model: every stored entry, plus any live card with no entry, with the live stage
 * winning over the stored one wherever both exist.
 */
export function joinItems(
  entries: Record<string, DownloadLibraryEntry>,
  cards: DownloadCardState[],
): DownloadItem[] {
  const byId = new Map(cards.map(card => [card.downloadId, card]))
  const items: DownloadItem[] = Object.values(entries).map(entry => {
    const card = byId.get(entry.meta.downloadId)
    const snapshot = card ? snapshotFromCard(card) : entry.snapshot
    return { ...entry.meta, ...snapshot, live: card !== undefined }
  })
  for (const card of cards) {
    if (entries[card.downloadId]) continue
    items.push({ ...metaFromCard(card), ...snapshotFromCard(card), live: true })
  }
  return sortItems(items)
}

/** Newest activity first, matching the panel. `requestedAt` breaks ties and covers an entry whose
 *  `updatedAt` is unparseable, and the id makes the order stable for two identical timestamps. */
export function sortItems(items: DownloadItem[]): DownloadItem[] {
  const key = (item: DownloadItem) =>
    Date.parse(item.updatedAt) || Date.parse(item.requestedAt) || 0
  return [...items].sort((a, b) =>
    key(b) - key(a) || a.downloadId.localeCompare(b.downloadId))
}

/** Oldest-first eviction by request time, so a long-lived client cannot grow the key without
 *  bound. Applied on write only - reading never silently drops rows. */
export function evictToCap(
  entries: Record<string, DownloadLibraryEntry>,
  cap: number = LIBRARY_CAP,
): Record<string, DownloadLibraryEntry> {
  const all = Object.values(entries)
  if (all.length <= cap) return entries
  const keep = all
    .sort((a, b) => Date.parse(b.meta.requestedAt) - Date.parse(a.meta.requestedAt))
    .slice(0, cap)
  const next: Record<string, DownloadLibraryEntry> = {}
  for (const entry of keep) next[entry.meta.downloadId] = entry
  return next
}

/** What each stage says on a page row: no elapsed counter, because a page row is read at a glance
 *  and a ticking clock per row is noise. */
const ITEM_STAGE_COPY: Record<Exclude<DownloadStage, 'DOWNLOADING' | 'FAILED'>, string> = {
  QUEUED: 'Waiting',
  STARTING: 'Starting',
  SEARCHING: 'Searching',
  READY_TO_DOWNLOAD: 'Ready to download',
  SUCCEEDED: 'Downloaded',
}

/** The page's version of stageLabel: no elapsed counter, because a page row is read at a glance
 *  and a ticking clock per row is noise. */
export function itemStageLabel(item: DownloadItem): string {
  if (item.stage === 'DOWNLOADING') return `${Math.round(item.progressPercent ?? 0)}%`
  if (item.stage === 'FAILED') return failureCopy(item.failureCode)
  return ITEM_STAGE_COPY[item.stage]
}

/** A run of rows under one heading. `heading` is null for the ungrouped view: same rows, no
 *  headings, which is what the All and Songs filters show. */
export interface DownloadGroup {
  heading: string | null
  items: DownloadItem[]
}

/** Which captured field the rows are bucketed by; null keeps the flat list. */
export type DownloadGrouping = 'album' | 'artist' | null

export const UNKNOWN_ALBUM_HEADING = 'Unknown Album'
export const UNKNOWN_ARTIST_HEADING = 'Unknown Artist'

/** The heading a row falls under. An item credited to several artists is filed under its first,
 *  which is the one the row's own secondary line leads with; repeating the row under every
 *  collaborator would make the page claim more downloads than happened. */
function headingFor(item: DownloadItem, grouping: 'album' | 'artist'): string {
  if (grouping === 'album') return item.albumName?.trim() || UNKNOWN_ALBUM_HEADING
  return item.artistNames[0]?.trim() || UNKNOWN_ARTIST_HEADING
}

/**
 * Buckets rows under headings for the Albums and Artists filters. Headings sort alphabetically with
 * the unknown bucket forced last - it is the least useful heading to read first, and the only one
 * that groups unrelated rows together. Order inside a bucket is the order given, so `sortItems`'
 * newest-activity-first ordering survives grouping.
 */
export function groupItems(items: DownloadItem[], grouping: DownloadGrouping): DownloadGroup[] {
  if (grouping === null) return [{ heading: null, items }]

  const unknown = grouping === 'album' ? UNKNOWN_ALBUM_HEADING : UNKNOWN_ARTIST_HEADING
  const buckets = new Map<string, DownloadItem[]>()
  for (const item of items) {
    const heading = headingFor(item, grouping)
    const bucket = buckets.get(heading)
    if (bucket) bucket.push(item)
    else buckets.set(heading, [item])
  }

  const groups: { heading: string; items: DownloadItem[] }[] =
    [...buckets].map(([heading, bucketItems]) => ({ heading, items: bucketItems }))
  groups.sort((a, b) => {
    if (a.heading === unknown) return 1
    if (b.heading === unknown) return -1
    return a.heading.localeCompare(b.heading)
  })
  return groups
}
