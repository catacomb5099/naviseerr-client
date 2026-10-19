/**
 * Who is signed in, as far as this tab knows. Pure: no React, no window (same shape as connectivity.ts).
 * The app asks GET /auth/session once at start and applies the answer; the API client reports a 401 on
 * any later call; the login and first-run screens report a successful login. The gate in App.tsx reads
 * the snapshot and shows the right screen.
 */
import type { SessionResponse } from '../api/types'

/** unknown: not asked yet. setup: this install has no account, make one. out: log in. in: show the app. */
export type SessionStatus = 'unknown' | 'setup' | 'out' | 'in'

export interface Session {
  status: SessionStatus
  /** The signed-in account's name; null while out, and on a server without a login. */
  username: string | null
  /** False on a server with the login switched off (AUTH_REQUIRED=false) or too old to have one: then
   *  nothing is ever asked and no account menu is shown. */
  authRequired: boolean
}

/** What GET /auth/session is taken to say on a server that does not have it (404): no login here. */
export const NO_LOGIN: SessionResponse = { authRequired: false, setupRequired: false, authenticated: true, username: null }

let state: Session = { status: 'unknown', username: null, authRequired: true }
const listeners = new Set<() => void>()

export const getSession = (): Session => state

export function subscribe(listener: () => void): () => void {
  listeners.add(listener)
  return () => { listeners.delete(listener) }
}

function set(next: Session) {
  if (next.status === state.status && next.username === state.username && next.authRequired === state.authRequired) return
  state = next
  listeners.forEach(listener => listener())
}

/** The server's answer to GET /auth/session. */
export function applySession(r: SessionResponse) {
  if (!r.authRequired) return set({ status: 'in', username: null, authRequired: false })
  if (r.setupRequired) return set({ status: 'setup', username: null, authRequired: true })
  set(r.authenticated ? { status: 'in', username: r.username, authRequired: true } : { status: 'out', username: null, authRequired: true })
}

/** A call answered 401. Ignored where no login exists (then a 401 is somebody else's, a proxy's say)
 *  and on the first-run screen (its own 401s are the wrong-password kind). */
export function reportLoggedOut() {
  if (!state.authRequired || state.status === 'setup') return
  set({ status: 'out', username: null, authRequired: true })
}

/** The login or first-run screen succeeded. */
export function reportLoggedIn(username: string) {
  set({ status: 'in', username, authRequired: true })
}
