/**
 * The words of the Login section in Settings. Pure, so the check script can read them.
 */
import type { LoginSettings } from '../api/types'

/** What the status line says, from the server's settings answer (null = not loaded yet): on or off, nothing in between
 *  (since 19-10-2026 22:40 a successful Save and test turns the login on by itself). */
export function loginStatusCopy(settings: LoginSettings | null): string {
  if (settings?.enabled) return 'Authentik login is on: every visitor signs in through Authentik.'
  return 'Authentik login is off: anyone who can reach this web app can use it.'
}

/** Save and test needs all three values, except that a stored secret may be kept by leaving the field empty. */
export function canSaveLogin(issuer: string, clientId: string, clientSecret: string, clientSecretSet: boolean): boolean {
  return issuer.trim() !== '' && clientId.trim() !== '' && (clientSecret !== '' || clientSecretSet)
}
