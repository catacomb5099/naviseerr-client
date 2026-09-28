import { useCallback, useEffect, useRef, useState } from 'react'
import { getSuggestedRefresh, requestSuggestedRefresh } from '../api/endpoints'
import { ApiError } from '../api/client'
import { CuratorRun } from '../api/types'

export interface SuggestedRefresh {
  /** The run being followed, or the one that just finished. Null before anything was asked for. */
  run: CuratorRun | null
  /** True while the request itself is in flight (the server answers in well under a second). */
  requesting: boolean
  /** Set when the request could not be made at all; the run, if any, is left as it was. */
  error: string | null
  request: () => void
}

/** How often to ask how the run is going. Building takes minutes, so seconds are plenty. */
export const RUN_POLL_MS = 5000

/**
 * "Make this week's playlists now", and following the run until it is over. On mount it looks once for a
 * run already in progress (the weekly one, or one asked for from another tab) and follows that instead of
 * starting cold; a run that is already over is not shown, since the shelf itself says what exists.
 * `onFinished` fires once when a followed run ends, so the caller can fetch the playlists again.
 */
export function useSuggestedRefresh(onFinished: () => void): SuggestedRefresh {
  const [run, setRun] = useState<CuratorRun | null>(null)
  const [requesting, setRequesting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  // The latest callback, so a stale closure in the poll never calls an old one and a parent passing a
  // fresh arrow function each render does not restart the poll timer.
  const onFinishedRef = useRef(onFinished)
  useEffect(() => { onFinishedRef.current = onFinished }, [onFinished])

  // Adopt a run that is already going.
  useEffect(() => {
    const controller = new AbortController()
    getSuggestedRefresh(controller.signal)
      .then(latest => { if (!latest.final) setRun(latest) })
      .catch(() => { /* no run yet, curator off, or unreachable: nothing to follow */ })
    return () => controller.abort()
  }, [])

  // Follow the run until it is over, then tell the caller once.
  const runId = run?.runId ?? null
  const final = run?.final ?? true
  useEffect(() => {
    if (!runId || final) return
    const controller = new AbortController()
    let timer: ReturnType<typeof setTimeout> | undefined
    const tick = () => {
      getSuggestedRefresh(controller.signal)
        .then(latest => {
          if (controller.signal.aborted) return
          setRun(latest)
          if (latest.final) onFinishedRef.current()
          else timer = setTimeout(tick, RUN_POLL_MS)
        })
        .catch(err => {
          if (controller.signal.aborted || (err instanceof Error && err.name === 'AbortError')) return
          // A failed poll is not a failed run: the curator is still working. Ask again next time.
          timer = setTimeout(tick, RUN_POLL_MS)
        })
    }
    timer = setTimeout(tick, RUN_POLL_MS)
    return () => { controller.abort(); if (timer) clearTimeout(timer) }
  }, [runId, final])

  const request = useCallback(() => {
    setRequesting(true)
    setError(null)
    requestSuggestedRefresh()
      .then(started => {
        setRun(started)
        // The curator can answer with a run that is already over (every playlist already made this
        // week); there is nothing to follow, but the caller should still refresh what it shows.
        if (started.final) onFinishedRef.current()
      })
      .catch(err => {
        const off = err instanceof ApiError && err.status === 503
        setError(off ? "Suggested playlists aren't set up on this server." : "Couldn't ask the server to make the playlists.")
      })
      .finally(() => setRequesting(false))
  }, [])

  return { run, requesting, error, request }
}
