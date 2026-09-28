/**
 * Self-check for the polling speed rules. Pulled in by check-download-state.ts so `npm run check`
 * runs it; any failed assertion throws and exits non-zero.
 */
import {
  ACTIVE_POLL_MS, FAST_WINDOW_AFTER_REQUEST_MS, IDLE_POLL_MS, nextPollDelayMs,
} from '../src/lib/downloadPolling'

function assert(cond: boolean, msg: string): void {
  if (!cond) throw new Error(`check-download-polling: ${msg}`)
}

const now = 1_000_000

// Nothing happening: slow speed.
assert(nextPollDelayMs({ serverHasLive: false, lastRequestedAt: null, now }) === IDLE_POLL_MS,
  'idle with no downloads and no recent request')

// A download in flight: fast speed.
assert(nextPollDelayMs({ serverHasLive: true, lastRequestedAt: null, now }) === ACTIVE_POLL_MS,
  'fast while the server lists a live download')

// The server's own interval wins over our default when it sends one.
assert(nextPollDelayMs({ serverHasLive: true, lastRequestedAt: null, now, serverPollIntervalMs: 3000 }) === 3000,
  'server interval overrides the default active speed')
assert(nextPollDelayMs({ serverHasLive: false, lastRequestedAt: null, now, serverPollIntervalMs: 3000 }) === IDLE_POLL_MS,
  'server interval does not override the idle speed')

// The user just clicked download but the server has not listed it yet: fast anyway, for a while.
assert(nextPollDelayMs({ serverHasLive: false, lastRequestedAt: now, now }) === ACTIVE_POLL_MS,
  'fast immediately after a request')
assert(nextPollDelayMs({ serverHasLive: false, lastRequestedAt: now - FAST_WINDOW_AFTER_REQUEST_MS + 1, now }) === ACTIVE_POLL_MS,
  'still fast just inside the window')
assert(nextPollDelayMs({ serverHasLive: false, lastRequestedAt: now - FAST_WINDOW_AFTER_REQUEST_MS, now }) === IDLE_POLL_MS,
  'back to idle once the window has passed and nothing is live')

assert(IDLE_POLL_MS > ACTIVE_POLL_MS, 'idle must be slower than active')

console.log('check-download-polling: ok')
