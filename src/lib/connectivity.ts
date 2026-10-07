/**
 * Whether the app can reach anything right now. Pure: no React, no window. The API client reports
 * each request's fate, the hook mirrors the browser's own online flag in, and the bar reads the
 * snapshot. "Back online" is a moment in time rather than a flag, so nothing here needs a timer.
 */

/** How long the green "Back online." strip stays up after a return. */
export const BACK_ONLINE_MS = 12_000

export interface Connectivity {
  /** The browser says it has no network (navigator.onLine === false). */
  browserOffline: boolean
  /** The last request got no answer from the Naviseerr server (refused, timed out, proxy 502/503). */
  serverDown: boolean
  /** Show "Back online." until this moment; null until something has come back. */
  backOnlineUntil: number | null
}

/** The self-check cannot wait twelve real seconds, so it moves this clock instead. */
export const clock = { now: () => Date.now() }

let state: Connectivity = { browserOffline: false, serverDown: false, backOnlineUntil: null }
const listeners = new Set<() => void>()

export const getConnectivity = (): Connectivity => state

export function subscribe(listener: () => void): () => void {
  listeners.add(listener)
  return () => { listeners.delete(listener) }
}

function update(browserOffline: boolean, serverDown: boolean) {
  if (browserOffline === state.browserOffline && serverDown === state.serverDown) return
  const wasOff = state.browserOffline || state.serverDown
  const isOff = browserOffline || serverDown
  state = {
    browserOffline,
    serverDown,
    backOnlineUntil: wasOff && !isOff ? clock.now() + BACK_ONLINE_MS : state.backOnlineUntil,
  }
  listeners.forEach(listener => listener())
}

/**
 * The API client's verdict on one request: did the Naviseerr server answer at all? Ignored while the
 * browser itself is offline: every request fails then, and that says nothing about the server.
 */
export function reportServer(reached: boolean) {
  if (!reached && state.browserOffline) return
  update(state.browserOffline, !reached)
}

/** The browser's own flag. Coming back clears any server verdict too: it is about to be asked afresh. */
export function setBrowserOffline(offline: boolean) {
  update(offline, offline && state.serverDown)
}
