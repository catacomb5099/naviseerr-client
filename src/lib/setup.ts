/**
 * The first-run setup's pure parts (no React, no window): which screen an address names, and the
 * sentences the last screen says about what was set. Checked by scripts/check-setup.ts.
 */
import type { LoginSettings, SessionResponse, SetupStatus, SoulseekAccount } from '../api/types'

/** What GET /settings/setup is taken to say on a server that does not have it (404): nothing to set up. */
export const SETUP_DONE: SetupStatus = { completed: true, libraryRoot: null }

/** The screen /setup/:step names, 0-based: "1" is the first; anything unreadable or out of range is the first too. */
export function stepIndex(step: string | undefined, count: number): number {
  const n = Number(step)
  return Number.isInteger(n) && n >= 1 && n <= count ? n - 1 : 0
}

/** The address of a 0-based screen. */
export const stepPath = (index: number): string => `/setup/${index + 1}`

/** The done screen's Soulseek line; null is the install that keeps its account in the install file (a 404). */
export function soulseekSummary(account: SoulseekAccount | null): string {
  return account ? `Soulseek: logging in as ${account.username}.` : 'Soulseek: the account from the install file.'
}

/** The done screen's login line: on, saved but never signed in, or open. `settings` null = an older server. */
export function loginSummary(session: SessionResponse, settings: LoginSettings | null): string {
  if (session.mode === 'authentik') return 'Login: Authentik, on.'
  if (settings?.clientSecretSet) return 'Login: Authentik is saved but not on yet. Sign in once from Settings → Login to turn it on.'
  return 'Login: open on your network, no login.'
}
