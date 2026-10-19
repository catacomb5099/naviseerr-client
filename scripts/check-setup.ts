/** Pins the first-run setup's pure parts (src/lib/setup.ts). Runs from check-download-state.ts. */
import { loginSummary, soulseekSummary, stepIndex, stepPath } from '../src/lib/setup'

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(`check failed: ${message}`)
}

// The address is the step: /setup/1 is the first screen; anything odd lands on the first screen too.
assert(stepIndex(undefined, 5) === 0, '/setup alone is the first screen')
assert(stepIndex('1', 5) === 0, '/setup/1 is the first screen')
assert(stepIndex('5', 5) === 4, '/setup/5 is the last of five')
assert(stepIndex('6', 5) === 0, 'past the end is the first screen')
assert(stepIndex('0', 5) === 0, 'zero is the first screen')
assert(stepIndex('abc', 5) === 0, 'not a number is the first screen')
assert(stepIndex('2.5', 5) === 0, 'a fraction is the first screen')
assert(stepPath(0) === '/setup/1', 'the first screen\'s address')
assert(stepPath(stepIndex('3', 5) + 1) === '/setup/4', 'next after /setup/3 is /setup/4')

// The done screen says what each step left behind, from the setting itself, never from the wizard.
const account = { username: 'naviseerr-ab12cd', generated: true, password: 'x', loggedIn: null, setInComposeFile: false }
assert(soulseekSummary(account) === 'Soulseek: logging in as naviseerr-ab12cd.', 'the account by name')
assert(soulseekSummary(null).includes('install file'), 'no account in the app: the install file has it')
const noLogin = { issuer: null, clientId: null, clientSecretSet: false, enabled: false, redirectUrl: 'http://x/auth/authentik/callback' }
assert(loginSummary({ mode: 'open' }, noLogin).startsWith('Login: open'), 'nothing connected: open')
assert(loginSummary({ mode: 'open' }, null).startsWith('Login: open'), 'an older server: open')
assert(loginSummary({ mode: 'open' }, { ...noLogin, clientSecretSet: true }).includes('not on yet'), 'saved, never signed in')
assert(loginSummary({ mode: 'authentik', authenticated: true }, { ...noLogin, clientSecretSet: true, enabled: true }) === 'Login: Authentik, on.', 'signed in: on')

console.log('check-setup: ok')
