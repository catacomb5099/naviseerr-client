/**
 * One request per URL at a time, and a short memory of what it answered.
 *
 * Two things this fixes. In development the app runs under React StrictMode, which mounts every
 * component twice, so every mount-time fetch fired twice: the first was discarded but still hit the
 * network. And the router unmounts a page on navigation, so Back re-ran a fetch whose answer we had
 * a moment ago. Sharing the in-flight promise fixes the first; keeping the value briefly fixes the
 * second. Pure, no React: the API client routes GETs through here.
 */

interface Entry {
  key: string
  promise: Promise<unknown>
  controller: AbortController
  /** Callers still waiting on the request. Falls to zero only when everyone detached before it settled. */
  waiting: number
  /** Null while in flight; once resolved, the moment the cached value stops being reused. */
  expiresAt: number | null
}

/** Beyond this many settled entries the oldest go. Plenty for a session of browsing. */
const MAX_ENTRIES = 200

const registry = new Map<string, Entry>()

/** The self-check cannot wait five real minutes, so it moves this clock instead. */
export const clock = { now: () => Date.now() }

/** The same error fetch throws for its own abort, so callers can keep checking `err.name`. */
const abortError = () => new DOMException('The operation was aborted.', 'AbortError')

/**
 * Start `start` for `key`, or join the one already running. Every caller gets the same answer.
 *
 * - A caller's own `signal` detaches only that caller (its promise rejects with an AbortError, like
 *   fetch); the request itself is aborted only when the last waiting caller has gone and nobody has
 *   joined again a tick later.
 * - A resolved value is reused for `cacheMs` (0: forgotten as soon as it arrives). A rejection is
 *   never kept, so a retry really retries.
 * - `fresh` forgets a kept value before starting, but still joins a request in flight: there is no
 *   fresher answer than the one about to arrive.
 */
export function share<T>(
  key: string,
  start: (signal: AbortSignal) => Promise<T>,
  { signal, cacheMs = 0, fresh = false }: { signal?: AbortSignal; cacheMs?: number; fresh?: boolean } = {},
): Promise<T> {
  if (signal?.aborted) return Promise.reject(abortError())

  let entry = registry.get(key)
  if (entry && entry.expiresAt !== null && (fresh || entry.expiresAt <= clock.now())) {
    registry.delete(key)
    entry = undefined
  }
  if (!entry) {
    const controller = new AbortController()
    const created: Entry = { key, controller, waiting: 0, expiresAt: null, promise: Promise.resolve() }
    created.promise = start(controller.signal).then(
      value => {
        created.expiresAt = clock.now() + cacheMs
        if (cacheMs > 0) trim()
        else if (registry.get(key) === created) registry.delete(key)
        return value
      },
      err => {
        if (registry.get(key) === created) registry.delete(key)
        throw err
      })
    // Every caller may have detached by the time this rejects; without a handler of its own the
    // browser would report the abort as an uncaught error.
    created.promise.catch(() => {})
    registry.set(key, created)
    entry = created
  }
  return join(entry, signal) as Promise<T>
}

function join(entry: Entry, signal: AbortSignal | undefined): Promise<unknown> {
  entry.waiting++
  if (!signal) return entry.promise
  return new Promise((resolve, reject) => {
    const onAbort = () => {
      entry.waiting--
      reject(abortError())
      // The request itself is let go a tick later, not now: StrictMode runs effect, cleanup, effect
      // in one go, so the caller that just left is about to come back for the same key. Aborting at
      // once would make its return a second request, the very thing this file exists to prevent.
      setTimeout(() => {
        if (entry.waiting === 0 && entry.expiresAt === null) {
          entry.controller.abort()
          if (registry.get(entry.key) === entry) registry.delete(entry.key)
        }
      })
    }
    signal.addEventListener('abort', onAbort, { once: true })
    const done = () => signal.removeEventListener('abort', onAbort)
    entry.promise.then(value => { done(); resolve(value) }, err => { done(); reject(err) })
  })
}

/** Drops the oldest settled entries past the cap; in-flight ones stay, someone is waiting on them. */
function trim() {
  for (const [key, entry] of registry) {
    if (registry.size <= MAX_ENTRIES) return
    if (entry.expiresAt !== null) registry.delete(key)
  }
}
