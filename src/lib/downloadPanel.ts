import { ActiveDownloadView, DownloadStage } from '../api/types'

export interface DownloadCardState {
  downloadId: string
  songName: string
  stage: DownloadStage
  progressPercent: number | null
  failureCode: string | null
  stageEnteredAt: string
  updatedAt: string
  /** Sort key. Seeded from the server's `updatedAt` on first sight so a cold load restores the
   *  real order, then bumped to now() on every observed change so live updates float to the top. */
  lastChangedAt: number
  lastSeenAt: number
}

export function isTerminal(stage: DownloadStage): boolean {
  return stage === 'SUCCEEDED' || stage === 'FAILED'
}

/** Most-recently-changed first: a newly requested download appears at the top, and anything that
 *  moves is pushed back to the top as it moves. The list sorts itself with no explicit grouping. */
export function sortCards(cards: DownloadCardState[]): DownloadCardState[] {
  return [...cards].sort((a, b) => b.lastChangedAt - a.lastChangedAt)
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
 * - **A terminal stage is final.** Once the user has been told a download succeeded or failed, no
 *   later response walks it back to an active stage.
 * - **Null never overwrites.** An absent `progressPercent` means "no observation", not zero. The
 *   server refuses to write one over a real value for exactly this reason, and a bar that jumps
 *   backwards on a healthy download is the most trust-destroying thing this feature can do.
 * - **A non-terminal stage is taken as given, even backwards.** DOWNLOADING back to
 *   READY_TO_DOWNLOAD is a real candidate failover, and progress resetting to 0 is a real retry.
 *   Clamping either monotonically would freeze a failed-over download at a stale percentage
 *   forever, which is a worse lie than the honest reset.
 */
export function mergeCard(
  existing: DownloadCardState | undefined,
  row: ActiveDownloadView,
): DownloadCardState {
  if (existing && isTerminal(existing.stage) && !isTerminal(row.stage)) {
    return existing
  }

  const progressPercent = row.progressPercent ?? existing?.progressPercent ?? null
  const failureCode = row.failureCode ?? existing?.failureCode ?? null

  // Compared against the coalesced value, not the raw row: a null sample after a real reading is
  // not a change, and treating it as one reorders the list for nothing. Stage is included so a
  // phase transition pushes the card to the top even when the percentage is unchanged.
  const changed = !existing
    || existing.stage !== row.stage
    || existing.progressPercent !== progressPercent

  return {
    downloadId: row.downloadId,
    songName: row.songName,
    stage: row.stage,
    progressPercent,
    failureCode,
    stageEnteredAt: row.stageEnteredAt,
    updatedAt: row.updatedAt,
    lastChangedAt: !existing
      ? Date.parse(row.updatedAt)
      : changed ? Date.now() : existing.lastChangedAt,
    lastSeenAt: Date.now(),
  }
}
