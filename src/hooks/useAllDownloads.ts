import { useCallback, useEffect, useRef, useState } from 'react'
import { getAllDownloads } from '../api/endpoints'
import { ActiveDownloadView } from '../api/types'

export interface AllDownloads {
  rows: ActiveDownloadView[]
  loading: boolean
  error: string | null
  refresh: () => void
}

/**
 * The Downloads page's data source: the server's full answer to GET /downloads/all, fetched on
 * demand rather than polled. This is deliberately a separate hook from useActiveDownloads - its
 * rows must reach the page only, never the panel's card state, or a page visit would pop the
 * panel open with every finished download the server remembers and start terminal TTL timers on
 * all of them.
 *
 * Fetches page 1 at the default size on mount. Mounting is what arriving at the route now means,
 * since the route unmounts the page when you leave it.
 */
export function useAllDownloads(): AllDownloads {
  const [rows, setRows] = useState<ActiveDownloadView[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const abortRef = useRef<AbortController | null>(null)

  const refresh = useCallback(() => {
    abortRef.current?.abort()
    const controller = new AbortController()
    abortRef.current = controller
    setLoading(true)
    setError(null)
    void (async () => {
      try {
        const result = await getAllDownloads(undefined, controller.signal)
        // Replaces wholesale, not merged: this endpoint is the server's complete answer, so
        // folding it into the previous response would keep rows the server has since dropped.
        setRows(result.downloads)
      } catch (err) {
        if (err instanceof Error && err.name === 'AbortError') return
        // Same posture as reconcile() in useActiveDownloads: a failed fetch is not evidence about
        // the existing rows, so they are left alone rather than cleared.
        console.error('Failed to fetch all downloads:', err)
        setError(err instanceof Error ? err.message : 'Failed to load downloads')
      } finally {
        if (abortRef.current === controller) setLoading(false)
      }
    })()
  }, [])

  useEffect(() => {
    refresh()
    return () => abortRef.current?.abort()
  }, [refresh])

  return { rows, loading, error, refresh }
}
