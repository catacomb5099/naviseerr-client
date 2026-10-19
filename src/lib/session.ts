/**
 * Whether somebody is signed in, as far as this tab knows. Pure: no React, no window (same shape as
 * connectivity.ts). The app asks GET /auth/session at start; the API client reports any 401 later; the
 * gate in App.tsx reads the snapshot and shows the login screen or the app.
 */
import type { SessionResponse } from '../api/types'

/** unknown: not asked yet. out: show the login screen. in: show the app. */
export type SessionStatus = 'unknown' | 'out' | 'in'

export interface Session {
  status: SessionStatus
  /** False while this install has no login (Authentik not connected, or turned off, or a server too old
   *  to have one): then nothing is ever asked and no Log out button is shown. */
  authRequired: boolean
}

/** What GET /auth/session is taken to say on a server that does not have it (404): no login here. */
export const NO_LOGIN: SessionResponse = { mode: 'open' }

let state: Session = { status: 'unknown', authRequired: false }
const listeners = new Set<() => void>()

export const getSession = (): Session => state

export function subscribe(listener: () => void): () => void {
  listeners.add(listener)
  return () => { listeners.delete(listener) }
}

function set(next: Session) {
  if (next.status === state.status && next.authRequired === state.authRequired) return
  state = next
  listeners.forEach(listener => listener())
}

/** The server's answer to GET /auth/session. */
export function applySession(r: SessionResponse) {
  if (r.mode !== 'authentik') return set({ status: 'in', authRequired: false })
  set(r.authenticated ? { status: 'in', authRequired: true } : { status: 'out', authRequired: true })
}

/** A call answered 401, or Log out was pressed: show the login screen. The gate then asks the server
 *  again, so a login turned on from another device is picked up too, and a server that is in fact open
 *  puts the app straight back. */
export function reportLoggedOut() {
  set({ status: 'out', authRequired: true })
}
