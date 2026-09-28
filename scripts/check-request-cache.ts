/**
 * Self-check for the shared-request registry; pulled in by check-download-state.ts. The checks are
 * async, so a failed assertion surfaces as an unhandled rejection, which exits node non-zero like a
 * throw would.
 */
import { clock, share } from '../src/lib/requestCache'

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(`check failed: ${message}`)
}

/** A start() the check settles by hand, remembering how often it ran and the signal it was given.
 *  Read through functions, not fields: an assert on a field narrows it to that one value and the next
 *  assert on it would not compile. */
function fakeStart() {
  let calls = 0
  let signal: AbortSignal | null = null
  let resolve!: (value: string) => void
  let reject!: (reason: unknown) => void
  return {
    start: (s: AbortSignal) => {
      calls++
      signal = s
      return new Promise<string>((res, rej) => { resolve = res; reject = rej })
    },
    calls: () => calls,
    /** Null until start() ran. */
    aborted: () => signal?.aborted ?? null,
    resolve: (value: string) => resolve(value),
    reject: (reason: unknown) => reject(reason),
  }
}

/** The rejection reason, or null if the promise resolved. */
const rejected = (p: Promise<unknown>) => p.then(() => null, (err: unknown) => err)
/** Lets every pending .then run. */
const settled = () => new Promise(resolve => setTimeout(resolve, 0))
const isAbort = (err: unknown) => err instanceof Error && err.name === 'AbortError'

let t = 1_000_000
clock.now = () => t

async function main() {
  // Two callers at once: one request, both get the answer.
  {
    const f = fakeStart()
    const a = share('k1', f.start)
    const b = share('k1', f.start)
    assert(f.calls() === 1, 'concurrent callers share one request')
    f.resolve('v')
    assert(await a === 'v' && await b === 'v', 'both callers get the answer')
  }

  // One caller leaves: only that caller is told; the request runs on for the other.
  {
    const f = fakeStart()
    const ac = new AbortController()
    const a = share('k2', f.start, { signal: ac.signal })
    const b = share('k2', f.start)
    ac.abort()
    assert(isAbort(await rejected(a)), 'the leaving caller gets an AbortError, as from fetch')
    assert(f.aborted() === false, 'the request is not aborted while someone still waits')
    f.resolve('v')
    assert(await b === 'v', 'the other caller still gets the answer')
  }

  // Everyone leaves: the request is aborted and forgotten, so the next caller starts anew.
  {
    const f = fakeStart()
    const ac1 = new AbortController(), ac2 = new AbortController()
    const a = share('k3', f.start, { signal: ac1.signal })
    const b = share('k3', f.start, { signal: ac2.signal })
    ac1.abort()
    assert(isAbort(await rejected(a)) && f.aborted() === false, 'the first to leave does not abort the request')
    ac2.abort()
    assert(isAbort(await rejected(b)) && f.aborted() === true, 'the last to leave aborts the request')
    f.reject(new DOMException('The operation was aborted.', 'AbortError')) // what fetch then does
    await settled()
    void share('k3', f.start)
    assert(f.calls() === 2, 'an abandoned request is not joined later')
  }

  // A signal that is already aborted never starts anything, again as fetch behaves.
  {
    const f = fakeStart()
    assert(isAbort(await rejected(share('k3b', f.start, { signal: AbortSignal.abort() }))) && f.calls() === 0,
      'an already-aborted caller is refused without a request')
  }

  // A kept answer is reused until cacheMs is up, then asked for again.
  {
    const f = fakeStart()
    const p = share('k4', f.start, { cacheMs: 1000 })
    f.resolve('v')
    await p
    assert(await share('k4', f.start, { cacheMs: 1000 }) === 'v' && f.calls() === 1, 'a kept answer is reused')
    t += 999
    await share('k4', f.start, { cacheMs: 1000 })
    assert(f.calls() === 1, 'still kept just before it expires')
    t += 1
    const again = share('k4', f.start, { cacheMs: 1000 })
    assert(f.calls() === 2, 'asked for again once expired')
    f.resolve('v2')
    assert(await again === 'v2', 'the new answer replaces the old')
  }

  // A failure is never kept.
  {
    const f = fakeStart()
    const p = share('k5', f.start, { cacheMs: 1000 })
    f.reject(new Error('boom'))
    assert((await rejected(p)) instanceof Error, 'the failure reaches the caller')
    void share('k5', f.start, { cacheMs: 1000 })
    assert(f.calls() === 2, 'a retry after a failure really retries')
  }

  // fresh forgets a kept answer, but still joins a request in flight.
  {
    const f = fakeStart()
    const p = share('k6', f.start, { cacheMs: 1000 })
    f.resolve('v')
    await p
    const again = share('k6', f.start, { cacheMs: 1000, fresh: true })
    assert(f.calls() === 2, 'fresh asks again despite a kept answer')
    const joined = share('k6', f.start, { cacheMs: 1000, fresh: true })
    assert(f.calls() === 2, 'fresh joins a request already in flight')
    f.resolve('v2')
    assert(await again === 'v2' && await joined === 'v2', 'both get the fresh answer')
  }

  // cacheMs 0: shared while in flight, forgotten the moment it arrives.
  {
    const f = fakeStart()
    const p = share('k7', f.start)
    void share('k7', f.start)
    assert(f.calls() === 1, 'live data still shares one request in flight')
    f.resolve('v')
    await p
    void share('k7', f.start)
    assert(f.calls() === 2, 'live data is asked for again once it arrived')
  }

  // The registry stays bounded: past the cap the oldest kept answers go, the newest stay.
  {
    const f = fakeStart()
    for (let i = 0; i <= 200; i++) {
      const p = share(`cap${i}`, f.start, { cacheMs: 1000 })
      f.resolve('v')
      await p
    }
    const before = f.calls()
    void share('cap0', f.start, { cacheMs: 1000 })
    assert(f.calls() === before + 1, 'the oldest kept answer was dropped past the cap')
    void share('cap200', f.start, { cacheMs: 1000 })
    assert(f.calls() === before + 1, 'the newest kept answer is still there')
  }

  console.log('check-request-cache: ok')
}

void main()
