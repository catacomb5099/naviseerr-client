import { ActiveDownloadView, DownloadStage } from '../api/types'
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

/** What metaFromSource needs to invent a row for a download this client has no cached metadata
 *  for - satisfied by a live card or a /downloads/all row alike. */
export type MetaSource = Pick<DownloadCardState, 'downloadId' | 'songName' | 'stageEnteredAt'>

/** Metadata for a download this client has no cached record of: one requested before this
 *  feature existed, from another browser, or one this browser never requested at all. The song
 *  name is all the source gives us, and it is honest to show that rather than to hide the row. */
export function metaFromSource(source: MetaSource): DownloadMeta {
  return {
    downloadId: source.downloadId,
    songName: source.songName,
    trackName: source.songName,
    artistNames: [],
    albumName: null,
    iconURL: null,
    requestedAt: source.stageEnteredAt,
  }
}

/**
 * The page's rows: exactly what the server returned, in the order it returned them, with locally
 * cached metadata folded in where this browser has it, and the live feed's stage winning over the
 * server's wherever both describe the same download.
 */
export function pageItems(
  serverRows: ActiveDownloadView[],
  metas: Record<string, DownloadMeta>,
  cards: DownloadCardState[],
): DownloadItem[] {
  const byId = new Map(cards.map(card => [card.downloadId, card]))

  return serverRows.map(row => {
    const meta = metas[row.downloadId] ?? metaFromSource(row)
    const card = byId.get(row.downloadId)
    const source = card ?? row
    return {
      ...meta,
      stage: source.stage,
      progressPercent: source.progressPercent,
      failureCode: source.failureCode,
      updatedAt: source.updatedAt,
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
}

/** The page's version of stageLabel: no elapsed counter, because a page row is read at a glance
 *  and a ticking clock per row is noise. */
export function itemStageLabel(item: DownloadItem): string {
  if (item.stage === 'DOWNLOADING') return `${Math.round(item.progressPercent ?? 0)}%`
  if (item.stage === 'FAILED') return failureCopy(item.failureCode)
  return ITEM_STAGE_COPY[item.stage]
}
