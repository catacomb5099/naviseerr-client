/**
 * How often the client asks the server for download progress (GET /downloads/active).
 *
 * Two speeds, chosen here and nowhere else:
 *
 * - ACTIVE_POLL_MS: something is downloading, or the user just asked for a download. This matches
 *   the server's default `pollIntervalMs`; if the server sends a different value that value wins,
 *   because it knows how often its own status actually changes.
 * - IDLE_POLL_MS: nothing to show. One request every 30 seconds is still enough to notice a download
 *   that was started from another tab or device.
 *
 * FAST_WINDOW_AFTER_REQUEST_MS: after the user clicks download, stay at the active speed for this long
 * even if the server has not listed the download yet - the runner can take a few seconds to pick it
 * up, and the user is watching the panel right now.
 */
export const ACTIVE_POLL_MS = 5000
export const IDLE_POLL_MS = 30000
export const FAST_WINDOW_AFTER_REQUEST_MS = 30000
/** While the server does not answer, the gap doubles from the normal speed up to this. */
export const MAX_BACKOFF_MS = 60000

export interface PollingState {
  /** Did the server's last answer list any download that has not finished yet? */
  serverHasLive: boolean
  /** When the user last asked for a download in this tab, or null if never. */
  lastRequestedAt: number | null
  now: number
  /** The server's preferred active-speed interval, if it sent one. */
  serverPollIntervalMs?: number
  /** Polls in a row that got no answer from the server; 0 (or absent) after a success. */
  consecutiveFailures?: number
  /** The browser says it has no network: book nothing, the 'online' event polls. */
  browserOffline?: boolean
}

/**
 * Milliseconds to wait before the next progress request, or null to book none at all. Unanswered
 * polls back off (5 s, 10, 20, 40, then 60 s at most): a restarting server gains nothing from being
 * asked every five seconds, and the first answer resets the speed.
 */
export function nextPollDelayMs(state: PollingState): number | null {
  if (state.browserOffline) return null
  const justRequested = state.lastRequestedAt !== null
    && state.now - state.lastRequestedAt < FAST_WINDOW_AFTER_REQUEST_MS
  const base = state.serverHasLive || justRequested ? state.serverPollIntervalMs ?? ACTIVE_POLL_MS : IDLE_POLL_MS
  const failures = state.consecutiveFailures ?? 0
  return failures === 0 ? base : Math.min(base * 2 ** (failures - 1), MAX_BACKOFF_MS)
}
