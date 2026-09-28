import { useCallback, useState } from 'react'

/**
 * How many times the user has asked for `subject` again, and the way to ask. A page keys its fetch
 * by the count, so bumping it re-runs the fetch, and passes `attempt > 0` as `fresh`, so a retry goes
 * past the kept answer.
 *
 * It counts per subject because a page stays mounted while its subject changes (a new search, a hop
 * to a similar artist, another song in the one info pop-up). A plain counter would stay above zero
 * for the rest of the visit after a single "Try again", and every later fetch from that page would
 * skip the cache. Moving on, or coming back, starts at zero.
 */
export function useRetry(subject: string): [attempt: number, retry: () => void] {
  const [retries, setRetries] = useState({ of: subject, n: 0 })
  // React's own way of resetting state that follows a prop: set it during render and React renders
  // again before anything is committed.
  if (retries.of !== subject) setRetries({ of: subject, n: 0 })
  const retry = useCallback(
    () => setRetries(r => ({ of: subject, n: (r.of === subject ? r.n : 0) + 1 })),
    [subject],
  )
  return [retries.n, retry]
}
