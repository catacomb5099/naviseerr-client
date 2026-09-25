import { ActiveDownloadView, DownloadStage, DownloadType } from '../api/types'
import { DownloadCardState, displayTitle, failureCopy } from './downloadPanel'

/** What the client knew about a download at the moment it was requested. The server reports
 *  nothing but ids until it has resolved metadata (i.e. while QUEUED), so this is what the row
 *  shows until then - and the album name has no server counterpart at all. */
export interface DownloadMeta {
  downloadId: string
  /** The id posted: a videoId for a song, the collection id for an album or playlist. */
  youtubeId: string
  downloadType: DownloadType
  title: string
  artistNames: string[]
  albumName: string | null
  iconURL: string | null
  requestedAt: string
}

/** Everything needed to record a download except the id and the clock, both of which only the
 *  hook knows. */
export type DownloadMetaInput = Omit<DownloadMeta, 'downloadId' | 'requestedAt'>

/** A row on the Downloads page: the server's row joined with the freshest stage available.
 *  Display fields are RESOLVED - the server's value where it reported one, else the client's. */
export interface DownloadItem {
  downloadId: string
  youtubeId: string
  downloadType: DownloadType
  title: string
  artistNames: string[]
  albumName: string | null
  iconURL: string | null
  stage: DownloadStage
  progressPercent: number | null
  failureCode: string | null
  songCount: number
  songsSucceeded: number
  songsFailed: number
  updatedAt: string
  requestedAt: string
  /** True when the live feed still reports this download, i.e. the stage is being observed right
   *  now rather than read once from /downloads/all. Only that case animates. */
  live: boolean
}

/** Cap on stored entries. 250 rows is more history than the page can usefully show, and at a few
 *  hundred bytes each it is well under 100KB - two orders of magnitude below the localStorage
 *  quota, which matters because this key shares that quota with the panel snapshot. */
export const LIBRARY_CAP = 250

/**
 * The page's rows: exactly what the server returned, in the order it returned them. Title, artists
 * and artwork are server-first: the row's once the server has resolved them, else the live card's
 * (what the client knew when it clicked), else the cached meta's. Stage and tallies come from the
 * live card wherever there is one - the feed is polled, this page is not - else from the row.
 */
export function pageItems(
  serverRows: ActiveDownloadView[],
  metas: Record<string, DownloadMeta>,
  cards: DownloadCardState[],
): DownloadItem[] {
  const byId = new Map(cards.map(card => [card.downloadId, card]))

  return serverRows.map(row => {
    const card = byId.get(row.downloadId)
    const meta = metas[row.downloadId]
    const source = card ?? row
    return {
      downloadId: row.downloadId,
      youtubeId: row.youtubeId,
      downloadType: row.downloadType,
      title: displayTitle({ title: row.title ?? card?.title ?? meta?.title ?? null }),
      artistNames: row.artists.length > 0 ? row.artists
        : card && card.artists.length > 0 ? card.artists
        : meta?.artistNames ?? [],
      albumName: meta?.albumName ?? null,
      iconURL: row.imageUrl ?? card?.imageUrl ?? meta?.iconURL ?? null,
      stage: source.stage,
      progressPercent: source.progressPercent,
      failureCode: source.failureCode,
      songCount: source.songCount,
      songsSucceeded: source.songsSucceeded,
      songsFailed: source.songsFailed,
      updatedAt: source.updatedAt,
      requestedAt: row.requestedAt,
      live: card !== undefined,
    }
  })
}

/** Oldest-first eviction by request time, so a long-lived client cannot grow the key without
 *  bound. Applied on write only - reading never silently drops rows. */
export function evictToCap(
  metas: Record<string, DownloadMeta>,
  cap: number = LIBRARY_CAP,
): Record<string, DownloadMeta> {
  const all = Object.values(metas)
  if (all.length <= cap) return metas
  const keep = all
    .sort((a, b) => Date.parse(b.requestedAt) - Date.parse(a.requestedAt))
    .slice(0, cap)
  const next: Record<string, DownloadMeta> = {}
  for (const meta of keep) next[meta.downloadId] = meta
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
  PARTIAL_SUCCESS: 'Partly downloaded',
}

/** The page's version of stageLabel: no elapsed counter, because a page row is read at a glance
 *  and a ticking clock per row is noise. */
export function itemStageLabel(item: DownloadItem): string {
  if (item.stage === 'DOWNLOADING') return `${Math.round(item.progressPercent ?? 0)}%`
  if (item.stage === 'FAILED') return failureCopy(item.failureCode)
  return ITEM_STAGE_COPY[item.stage]
}
