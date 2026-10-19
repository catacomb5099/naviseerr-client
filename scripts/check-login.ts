/**
 * Self-check for the Login section's words. Pulled in by check-download-state.ts so `npm run check`
 * runs it; any failed assertion throws and exits non-zero.
 */
import { canSaveLogin, loginStatusCopy } from '../src/lib/login'

function assert(cond: boolean, msg: string): void {
  if (!cond) throw new Error(`check-login: ${msg}`)
}

const off = { issuer: null, clientId: null, clientSecretSet: false, enabled: false, redirectUrl: 'http://nas:5056/api/auth/authentik/callback' }
const connected = { ...off, issuer: 'https://auth.example.com/application/o/naviseerr/', clientId: 'abc', clientSecretSet: true }

assert(loginStatusCopy(null).startsWith('Authentik login is off'), 'not loaded reads as off')
assert(loginStatusCopy(off).startsWith('Authentik login is off'), 'nothing connected reads as off')
assert(loginStatusCopy(connected).startsWith('Authentik login is off'), 'saved but turned off reads as off: on or off, nothing in between')
assert(!loginStatusCopy(connected).includes('not on yet'), 'no "not on yet" state since Save and test turns the login on')
assert(loginStatusCopy({ ...connected, enabled: true }).startsWith('Authentik login is on'), 'enabled reads as on')

assert(!canSaveLogin('', 'abc', 's', false), 'no address: cannot save')
assert(!canSaveLogin('https://a/', '', 's', false), 'no client id: cannot save')
assert(!canSaveLogin('https://a/', 'abc', '', false), 'no secret and none stored: cannot save')
assert(canSaveLogin('https://a/', 'abc', '', true), 'no secret typed but one stored: the stored one is kept')
assert(canSaveLogin(' https://a/ ', 'abc', 's', false), 'all three: can save')

console.log('check-login: ok')
