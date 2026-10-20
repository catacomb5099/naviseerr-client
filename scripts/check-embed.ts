/** Self-check for the "shown inside Feishin" address; pulled in by check-download-state.ts. */
import { frameParent } from '../src/lib/embed'

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(`check failed: ${message}`)
}

const feishin = 'https://feishin.example.com/#/discover'
assert(frameParent(feishin, true) === feishin, 'framed with from: the sign-in returns to Feishin')
assert(frameParent(feishin, false) === null, 'opened on its own: from is ignored')
assert(frameParent(null, true) === null, 'framed without from: no parent known')
assert(frameParent('javascript:alert(1)', true) === null, 'only web addresses are a way back')
assert(frameParent('not an address', true) === null, 'garbage is ignored')
console.log('check-embed: ok')
