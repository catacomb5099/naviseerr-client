/** Pins the Soulseek account step's rules and status line (src/lib/soulseek.ts). Runs from check-download-state.ts. */
import { LOGIN_CHECK_MS, loginState, loginStatusCopy, soulseekNameProblem } from '../src/lib/soulseek'

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(`check failed: ${message}`)
}

// The rules the server and docker/setup.sh apply, in the same order, so the form refuses what they would.
assert(soulseekNameProblem('alex') === null, 'a plain name is fine')
assert(soulseekNameProblem('a b-c_d.e!') === null, 'spaces inside and punctuation are fine')
assert(soulseekNameProblem('')?.startsWith('Enter'), 'empty asks for a name')
assert(soulseekNameProblem('café')?.includes('does not accept that character'), 'an accent is refused')
assert(soulseekNameProblem('a\tb')?.includes('does not accept that character'), 'a tab is refused')
assert(soulseekNameProblem('abcdefghijklmnopqrstuvwxyz1234') === null, '30 characters pass')
assert(soulseekNameProblem('abcdefghijklmnopqrstuvwxyz12345')?.includes('longer than 30'), '31 characters are refused')
assert(soulseekNameProblem(' alex')?.includes('starts or ends'), 'a leading space is refused')
assert(soulseekNameProblem('alex ')?.includes('starts or ends'), 'a trailing space is refused')

// The status line: logged in wins; after a save it is "checking" for 30 s, then "not accepted".
const t0 = 1_000_000
assert(loginState(true, null, t0) === 'connected', 'logged in, nothing saved')
assert(loginState(true, t0, t0 + 5_000) === 'connected', 'logged in after a save')
assert(loginState(false, null, t0) === 'not-connected', 'not logged in, nothing saved here')
assert(loginState(null, null, t0) === 'unknown', 'slskd not answering, nothing saved')
assert(loginState(false, t0, t0 + LOGIN_CHECK_MS - 1) === 'checking', 'still checking just inside the window')
assert(loginState(null, t0, t0 + 1_000) === 'checking', 'checking even while slskd is slow to answer')
assert(loginState(false, t0, t0 + LOGIN_CHECK_MS) === 'not-accepted', 'the window closes at 30 s')
assert(loginStatusCopy('connected', 'alex') === 'Connected to Soulseek as alex.', 'connected names the account')
assert(loginStatusCopy('not-accepted', 'alex').includes('did not accept this login'), 'the plain failure sentence')
assert(loginStatusCopy('not-connected', 'alex').includes('as alex'), 'not connected names the account')

console.log('check-soulseek: ok')
