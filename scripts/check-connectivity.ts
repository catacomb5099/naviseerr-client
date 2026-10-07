/**
 * Self-check for the connectivity store; pulled in by check-download-state.ts. The store is pure,
 * so this drives it by hand: the API client's verdicts and the browser's own flag go in, the bar's
 * three readings come out.
 */
import {
  BACK_ONLINE_MS, clock, getConnectivity, reportServer, setBrowserOffline, subscribe,
} from '../src/lib/connectivity'

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(`check-connectivity: ${message}`)
}

let t = 1_000_000
clock.now = () => t
let changeCount = 0
const unsubscribe = subscribe(() => { changeCount++ })
const s = getConnectivity
/** Read through a function: an assert on the variable would narrow it to one value for every later assert. */
const changes = () => changeCount

// Quiet start, and an answered request changes nothing.
assert(!s().browserOffline && !s().serverDown && s().backOnlineUntil === null, 'starts online with nothing to show')
reportServer(true)
assert(changes() === 0, 'an answered request while online is not a change')

// The server stops answering: one change, however many polls fail.
reportServer(false)
assert(s().serverDown && changes() === 1, 'an unanswered request marks the server down')
reportServer(false)
assert(changes() === 1, 'a repeat failure is not a change')

// It answers again: back online for 12 s from that moment.
t += 5_000
reportServer(true)
assert(!s().serverDown && changes() === 2, 'an answer clears the server flag')
assert(s().backOnlineUntil === t + BACK_ONLINE_MS, 'coming back books the green strip for 12 s')

// The browser goes offline: failed requests say nothing about the server.
setBrowserOffline(true)
assert(s().browserOffline && changes() === 3, 'the browser flag is mirrored')
reportServer(false)
assert(!s().serverDown && changes() === 3, 'a failure while offline is not a server verdict')
assert(s().backOnlineUntil === t + BACK_ONLINE_MS, 'going offline does not touch the back-online moment')

// It comes back: back online again, and nothing is still held against the server.
t += 60_000
setBrowserOffline(false)
assert(!s().browserOffline && !s().serverDown && changes() === 4, 'the browser coming back is one change')
assert(s().backOnlineUntil === t + BACK_ONLINE_MS, 'the browser coming back books the green strip')
setBrowserOffline(false)
assert(changes() === 4, 'repeating the same flag is not a change')

// Server down, then the browser drops and returns: the stale verdict goes, the server is asked afresh.
reportServer(false)
setBrowserOffline(true)
assert(s().browserOffline && s().serverDown, 'going offline keeps the server verdict')
setBrowserOffline(false)
assert(!s().serverDown, 'coming back online drops the old server verdict')

unsubscribe()
reportServer(false)
assert(changes() === 7, 'an unsubscribed listener is not called')

console.log('check-connectivity: ok')
