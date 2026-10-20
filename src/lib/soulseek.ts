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

/** The one thing "Use my own slskd" has to say: without it, nothing is filed and no playlist file is written. */
export const OWN_SLSKD_FOLDER_HELP =
  "naviseerr must see that slskd's downloads folder: in the install file, point the downloads volume at it."

/** Save and test for your own slskd needs an http(s) address and the API key, unless one is stored for it already. */
export function canSaveSlskd(url: string, apiKey: string, apiKeySet: boolean): boolean {
  return /^https?:\/\/\S+$/.test(url.trim()) && (apiKey !== '' || apiKeySet)
}

/** How long after Save the page keeps asking whether Soulseek accepted the login before calling it refused. */
export const LOGIN_CHECK_MS = 30_000
/** How often it asks during that window; outside it, the page still refreshes the line, less often. */
export const LOGIN_POLL_MS = 2_000
export const IDLE_POLL_MS = 10_000
/**
 * For 2 s after a save the server lets slskd reload its file before asking it to log out, so a client
 * still logged in with the OLD account reads as logged in: that first poll is not "connected" yet.
 */
export const RECONNECT_GRACE_MS = 4_000

export type LoginState = 'connected' | 'checking' | 'not-accepted' | 'not-connected' | 'unknown'

/**
 * What is known about the login, from slskd's answer and when the account was last changed here.
 * `savedAt` null = nothing changed on this page; `loggedIn` null = slskd itself did not answer.
 */
export function loginState(loggedIn: boolean | null, savedAt: number | null, now: number): LoginState {
  const sinceSave = savedAt === null ? Infinity : now - savedAt
  if (loggedIn === true) return sinceSave < RECONNECT_GRACE_MS ? 'checking' : 'connected'
  if (sinceSave < LOGIN_CHECK_MS) return 'checking'
  // slskd not answering is its own state, never blamed on the name or the password.
  if (loggedIn === null) return 'unknown'
  return savedAt === null ? 'not-connected' : 'not-accepted'
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
