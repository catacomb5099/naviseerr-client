import { useEffect, useState } from 'react'
import { getArtist } from '../api/endpoints'
import { ApiError } from '../api/client'
import { ArtistDetail } from '../api/types'
import { providerMessage } from '../lib/utils'
import { useRetry } from './useRetry'

export type ArtistLoad =
  | { status: 'loading' }
  | { status: 'error'; detail: string | null }
  | { status: 'notFound' }
  | { status: 'ready'; artist: ArtistDetail }

/** One artist by id, for the artist page and its "Show all" pages. Both read the same answer, which the
 *  API layer keeps for five minutes, so a Show all page opened from the artist page needs no new fetch. */
export function useArtist(id: string): [load: ArtistLoad, retry: () => void] {
  // Keyed by what was fetched: a result for another artist (or an earlier attempt) is simply not
  // ours yet, which is what "loading" means. No state reset needed when the key changes.
  const [fetched, setFetched] = useState<(ArtistLoad & { key: string }) | null>(null)
  const [attempt, retry] = useRetry(id)

  const key = `${id}:${attempt}`
  useEffect(() => {
    let cancelled = false
    getArtist(id, { fresh: attempt > 0 })
      .then(artist => { if (!cancelled) setFetched({ key, status: 'ready', artist }) })
      .catch(err => {
        if (cancelled) return
        const notFound = err instanceof ApiError && err.status === 404
        setFetched(notFound ? { key, status: 'notFound' } : { key, status: 'error', detail: providerMessage(err) })
      })
    return () => { cancelled = true }
  }, [id, key, attempt])

  return [fetched?.key === key ? fetched : { status: 'loading' }, retry]
}
