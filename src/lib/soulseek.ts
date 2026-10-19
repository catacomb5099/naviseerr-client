/**
 * The Soulseek account step (Settings → Soulseek, and the first-run wizard's second step once that
 * lands): the username rules and what the status line says. Pure, so scripts/check-soulseek.ts can
 * pin them.
 */

/** Soulseek's rules on a name, in the words the form shows under the box. */
export const SOULSEEK_NAME_RULES =
  '1 to 30 characters: plain letters, digits and punctuation, no accents or emoji, no space at the start or end.'

/** Why a name would be refused, as the server (and the install's setup step) check it; null when it is fine. */
export function soulseekNameProblem(name: string): string | null {
  if (name === '') return 'Enter a Soulseek username.'
  if (!/^[\x20-\x7e]*$/.test(name)) {
    return 'Soulseek does not accept that character (accents, emoji, tabs...): plain letters, digits and punctuation only.'
  }
  if (name.length > 30) return 'The username is longer than 30 characters.'
  if (name.startsWith(' ') || name.endsWith(' ')) return 'The username starts or ends with a space.'
  return null
}

/** How long after Save the page keeps asking whether Soulseek accepted the login before calling it refused. */
export const LOGIN_CHECK_MS = 30_000
/** How often it asks during that window; outside it, the page still refreshes the line, less often. */
export const LOGIN_POLL_MS = 2_000
export const IDLE_POLL_MS = 10_000

export type LoginState = 'connected' | 'checking' | 'not-accepted' | 'not-connected' | 'unknown'

/**
 * What is known about the login, from slskd's answer and when the account was last changed here.
 * `savedAt` null = nothing changed on this page; `loggedIn` null = slskd itself did not answer.
 */
export function loginState(loggedIn: boolean | null, savedAt: number | null, now: number): LoginState {
  if (loggedIn === true) return 'connected'
  if (savedAt !== null) return now - savedAt < LOGIN_CHECK_MS ? 'checking' : 'not-accepted'
  return loggedIn === null ? 'unknown' : 'not-connected'
}

/** The one sentence under the account, per state. Plain words: nothing here is an error the person caused. */
export function loginStatusCopy(state: LoginState, username: string): string {
  switch (state) {
    case 'connected': return `Connected to Soulseek as ${username}.`
    case 'checking': return 'Checking with Soulseek…'
    case 'not-accepted':
      return 'Soulseek did not accept this login: the name may be taken, or the password wrong. Downloads wait until a login works.'
    case 'not-connected':
      return `Not connected to Soulseek as ${username} right now; downloads wait until it is. If this stays, the name may be taken or the password wrong.`
    case 'unknown': return 'The Soulseek client is not answering right now.'
  }
}
