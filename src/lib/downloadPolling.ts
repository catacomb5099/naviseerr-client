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

export interface PollingState {
  /** Did the server's last answer list any download that has not finished yet? */
  serverHasLive: boolean
  /** When the user last asked for a download in this tab, or null if never. */
  lastRequestedAt: number | null
  now: number
  /** The server's preferred active-speed interval, if it sent one. */
  serverPollIntervalMs?: number
}

/** Milliseconds to wait before the next progress request. */
export function nextPollDelayMs(state: PollingState): number {
  const justRequested = state.lastRequestedAt !== null
    && state.now - state.lastRequestedAt < FAST_WINDOW_AFTER_REQUEST_MS
  if (state.serverHasLive || justRequested) return state.serverPollIntervalMs ?? ACTIVE_POLL_MS
  return IDLE_POLL_MS
}
