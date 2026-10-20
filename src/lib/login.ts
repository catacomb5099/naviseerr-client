/**
 * The words of the Login section in Settings. Pure, so the check script can read them.
 */
import type { LoginSettings } from '../api/types'

/** What the status line says, from the server's settings answer (null = not loaded yet). */
export function loginStatusCopy(settings: LoginSettings | null): string {
  if (!settings || !settings.clientSecretSet) return 'Authentik login is off: anyone who can reach this web app can use it.'
  if (settings.enabled) return 'Authentik login is on: every visitor signs in through Authentik.'
  return 'Authentik is connected, but the login is not on yet. Sign in once with Continue with Authentik to turn it on.'
}

/** Save and test needs all three values, except that a stored secret may be kept by leaving the field empty. */
export function canSaveLogin(issuer: string, clientId: string, clientSecret: string, clientSecretSet: boolean): boolean {
  return issuer.trim() !== '' && clientId.trim() !== '' && (clientSecret !== '' || clientSecretSet)
}
