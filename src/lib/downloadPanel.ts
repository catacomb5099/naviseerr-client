import { ActiveDownloadView, DownloadStage, DownloadType } from '../api/types'

export interface DownloadCardState {
  downloadId: string
  youtubeId: string
  downloadType: DownloadType
  /** Server-resolved, or what the client knew when it clicked. Null only for a download this
   *  client never requested that the server has not resolved yet. */
  title: string | null
  artists: string[]
  imageUrl: string | null
  stage: DownloadStage
  progressPercent: number | null
  songCount: number
  songsSucceeded: number
  songsFailed: number
  songsCancelled: number
  failureCode: string | null
  requestedAt: string
  stageEnteredAt: string
  updatedAt: string
  /** When the card last changed, for the auto-dismiss clock only (the panel orders by requestedAt).
   *  Seeded from the server's `updatedAt` on first sight, then bumped to now() on every observed change
   *  so a finished card lingers for its full TTL after its last change. */
  lastChangedAt: number
  lastSeenAt: number
}

export function isTerminal(stage: DownloadStage): boolean {
  return stage === 'SUCCEEDED' || stage === 'FAILED' || stage === 'PARTIAL_SUCCESS'
}

/** A download the user stopped. Both conditions: a live album with one cancelled song carries the code too,
 *  and must not be painted grey. */
export function isCancelled(x: { stage: DownloadStage; failureCode: string | null }): boolean {
  return x.stage === 'FAILED' && x.failureCode === 'CANCELLED'
}

export function displayTitle(card: Pick<DownloadCardState, 'title'>): string {
  return card.title ?? 'Untitled download'
}

/** Newest request first, and nothing else moves a card: a retry or a progress tick used to lift it to
 *  the top, reshuffling the list under the user's pointer. Equal request times fall back to the id, so
 *  two cards never swap between polls. An unreadable time counts as 0 (last): a NaN in a comparator
 *  leaves the whole sort order undefined. */
export function sortCards(cards: DownloadCardState[]): DownloadCardState[] {
  const requested = (card: DownloadCardState) => Date.parse(card.requestedAt) || 0
  return [...cards].sort((a, b) => requested(b) - requested(a) || b.downloadId.localeCompare(a.downloadId))
}

/**
 * How long a terminal card lingers before auto-dismissing, scaled to how many cards are on screen
 * so a busy list doesn't bloat, and clamped to the server's retention window so a card is never
 * still waiting out its TTL long after the server stopped reporting it.
 */
export function dismissTtlMs(cardCount: number, terminalRetentionMs: number): number {
  const base = cardCount <= 3 ? 30000 : cardCount <= 10 ? 10000 : 5000
  return Math.min(base, terminalRetentionMs)
}

/**
 * How long a dismissed id is remembered. Must outlive the server's retention window: the server
 * keeps reporting a finished download for that long, and an id forgotten early makes the card the
 * user dismissed reappear. Doubled for clock skew and for a client that was asleep.
 */
export function dismissedRetentionMs(terminalRetentionMs: number): number {
  return terminalRetentionMs * 2
}

/**
 * What the user reads when a download fails. Deliberately vague and non-technical - the audience is
 * someone who wanted a song, not someone debugging Soulseek. Unrecognised codes (including the free
 * prose the server wrote before it used codes) fall through to the generic message rather than
 * leaking an internal string into the UI.
 */
const FAILURE_COPY: Record<string, string> = {
  NO_CANDIDATES: 'No source found',
  SOURCES_EXHAUSTED: 'No source would send the file',
  TIMED_OUT: 'Timed out',
  SEARCH_FAILED: 'Search failed',
  TRANSFER_NOT_FOUND: 'Source dropped the transfer',
  METADATA_UNAVAILABLE: "Couldn't find this on YouTube Music",
  CANCELLED: 'Cancelled',
}

export function failureCopy(failureCode: string | null): string {
  return (failureCode && FAILURE_COPY[failureCode]) || 'Download failed'
}

/** What each stage says on the card. DOWNLOADING is absent: it renders a percentage instead. */
const STAGE_COPY: Record<Exclude<DownloadStage, 'DOWNLOADING' | 'FAILED'>, string> = {
  QUEUED: 'Waiting',
  STARTING: 'Starting',
  SEARCHING: 'Searching',
  READY_TO_DOWNLOAD: 'Ready to download',
  SUCCEEDED: 'Downloaded',
  PARTIAL_SUCCESS: 'Partly downloaded',
}

/** Stages with no percentage to show: the bar is indeterminate and elapsed time is the honest signal. */
export function isIndeterminate(stage: DownloadStage): boolean {
  return stage === 'QUEUED' || stage === 'STARTING' || stage === 'SEARCHING'
    || stage === 'READY_TO_DOWNLOAD'
}

/** Stages where a running elapsed-seconds counter helps, i.e. the open-ended waits. */
export function showsElapsed(stage: DownloadStage): boolean {
  return stage === 'QUEUED' || stage === 'SEARCHING'
}

export function stageLabel(card: DownloadCardState, elapsedSeconds: number): string {
  if (card.stage === 'DOWNLOADING') return `${Math.round(card.progressPercent ?? 0)}%`
  if (card.stage === 'FAILED') return failureCopy(card.failureCode)
  const base = STAGE_COPY[card.stage]
  return showsElapsed(card.stage) ? `${base}… ${elapsedSeconds}s` : base
}

/**
 * Folds one feed row into the card the client is already showing. Every rule here exists because
 * the server is allowed to know less than the client does at any given moment.
 *
 * - **Crossing between finished and live is decided by the server's `updatedAt`**, which is
 *   monotonic per download (every write stamps it; concluding does not). Finished -> live only if
 *   strictly newer (a retry stamps now(); the two-second row where every song is finished but the
 *   download has not yet concluded shares the finished card's timestamp and must not reopen it).
 *   Live -> finished only if not strictly older (a stale poll answer from before a retry must not
 *   close the reopened card; a fail-before-admission row shares the optimistic card's timestamp
 *   and must land). Live -> live is unaffected: the optimistic card's clock is the server's JVM,
 *   the rows' is Postgres.
 * - **Null never overwrites.** An absent `progressPercent` means "no observation", not zero. The
 *   server refuses to write one over a real value for exactly this reason, and a bar that jumps
 *   backwards on a healthy download is the most trust-destroying thing this feature can do.
 * - **A non-terminal stage is taken as given, even backwards.** DOWNLOADING back to
 *   READY_TO_DOWNLOAD is a real candidate failover, and progress resetting to 0 is a real retry.
 *   Clamping either monotonically would freeze a failed-over download at a stale percentage
 *   forever, which is a worse lie than the honest reset.
 * - **Metadata only ever fills in.** The server reports a null title, empty artists and a null
 *   image while QUEUED; the optimistic card already has all three from the search result, and a
 *   null must not blank them. Same rule as progressPercent. Counts are taken as given.
 */
export function mergeCard(
  existing: DownloadCardState | undefined,
  row: ActiveDownloadView,
): DownloadCardState {
  // Crossing between finished and live is decided by the server's updatedAt, which is monotonic per
  // download (every write stamps it; concluding does not).
  //   finished -> live: only if strictly newer. A retry stamps now(); the two-second row in which
  //     every song is finished but the download is not yet concluded has the SAME timestamp as the
  //     finished card and must not reopen it.
  //   live -> finished: only if not strictly older. A stale poll answer from before a retry must not
  //     close the reopened card; but a fail-before-admission row carries the download's created_at,
  //     equal to the optimistic card's, and must land.
  // Live -> live is merged as before: the optimistic card's clock is the JVM's, the rows' is Postgres.
  const crossing = !!existing && isTerminal(existing.stage) !== isTerminal(row.stage)
  if (existing && crossing) {
    const rowAt = Date.parse(row.updatedAt), knownAt = Date.parse(existing.updatedAt)
    if (isTerminal(existing.stage) ? rowAt <= knownAt : rowAt < knownAt) return existing
  }
  const reopened = !!existing && crossing && isTerminal(existing.stage)

  // A reopened card's old outcome is not an observation about the new attempt.
  const progressPercent = row.progressPercent ?? (reopened ? null : existing?.progressPercent ?? null)
  const failureCode = reopened ? row.failureCode ?? null : row.failureCode ?? existing?.failureCode ?? null
  const songsCancelled = row.songsCancelled ?? 0

  // Compared against the coalesced value, not the raw row: a null sample after a real reading is
  // not a change, and treating it as one restarts the dismiss clock for nothing. Stage is included so
  // a phase transition counts even when the percentage is unchanged.
  const changed = !existing
    || existing.stage !== row.stage
    || existing.progressPercent !== progressPercent
    || existing.songsSucceeded !== row.songsSucceeded
    || existing.songsFailed !== row.songsFailed
    || existing.songsCancelled !== songsCancelled

  return {
    downloadId: row.downloadId,
    youtubeId: row.youtubeId,
    downloadType: row.downloadType,
    title: row.title ?? existing?.title ?? null,
    artists: row.artists.length > 0 ? row.artists : existing?.artists ?? [],
    imageUrl: row.imageUrl ?? existing?.imageUrl ?? null,
    stage: row.stage,
    progressPercent,
    songCount: row.songCount,
    songsSucceeded: row.songsSucceeded,
    songsFailed: row.songsFailed,
    songsCancelled,
    failureCode,
    requestedAt: row.requestedAt,
    stageEnteredAt: row.stageEnteredAt,
    updatedAt: row.updatedAt,
    lastChangedAt: !existing
      ? Date.parse(row.updatedAt)
      : changed ? Date.now() : existing.lastChangedAt,
    lastSeenAt: Date.now(),
  }
}

/** The card after the user's own retry/cancel: the response body is computed after the write, so it is
 *  authoritative on stage, outcome and counts, and it restarts the dismiss clock. Metadata still only
 *  fills in: a re-queued download's body has no title yet. */
export function replaceCard(existing: DownloadCardState | undefined, view: ActiveDownloadView): DownloadCardState {
  const fresh = mergeCard(undefined, view)
  return {
    ...fresh,
    title: fresh.title ?? existing?.title ?? null,
    artists: fresh.artists.length > 0 ? fresh.artists : existing?.artists ?? [],
    imageUrl: fresh.imageUrl ?? existing?.imageUrl ?? null,
    lastChangedAt: Date.now(),
  }
}
