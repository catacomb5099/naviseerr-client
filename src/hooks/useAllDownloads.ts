import { useCallback, useEffect, useRef, useState } from 'react'
import { getAllDownloads } from '../api/endpoints'
import { ActiveDownloadView } from '../api/types'

export interface AllDownloads {
  rows: ActiveDownloadView[]
  totalPages: number
  /** The page `rows` describes, or null before the first response ever lands. Lets a caller tell
   *  "no rows yet" apart from "this page really is empty" - `rows.length === 0` is true in both
   *  cases on the very first render, before any fetch has resolved. */
  loadedPage: number | null
  loading: boolean
  error: string | null
  refresh: () => void
}

/**
 * The Downloads page's data source: the server's full answer to GET /downloads/all for one page,
 * fetched on demand rather than polled. This is deliberately a separate hook from
 * useActiveDownloads - its rows must reach the page only, never the panel's card state, or a page
 * visit would pop the panel open with every finished download the server remembers and start
 * terminal TTL timers on all of them.
 *
 * Fetches on mount and again whenever `pageNumber` or `pageSize` changes, so arriving at the route
 * and paging within it both trigger a request without the caller having to ask.
 */
export function useAllDownloads(pageNumber: number, pageSize?: number): AllDownloads {
  const [rows, setRows] = useState<ActiveDownloadView[]>([])
  const [totalPages, setTotalPages] = useState(0)
  const [loadedPage, setLoadedPage] = useState<number | null>(null)
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
        const result = await getAllDownloads({ pageSize, pageNumber }, controller.signal)
        // Replaces wholesale, not merged: this endpoint is the server's complete answer for the
        // requested page, so folding it into the previous response would keep rows the server has
        // since dropped.
        setRows(result.downloads)
        setTotalPages(result.totalPages)
        setLoadedPage(pageNumber)
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
  }, [pageSize, pageNumber])

  // Keyed on `refresh`, which is itself keyed on [pageSize, pageNumber]: mounting (which is what
  // arriving at the route now means) and changing page both get a fresh fetch this way, with no
  // separate dependency list to keep in sync with refresh's own.
  useEffect(() => {
    refresh()
    return () => abortRef.current?.abort()
  }, [refresh])

  return { rows, totalPages, loadedPage, loading, error, refresh }
}
