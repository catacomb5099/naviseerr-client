import { useCallback, useEffect, useState } from 'react'
import { getSuggestedPlaylists } from '../api/endpoints'
import { ApiError } from '../api/client'
import { SuggestedPlaylistSummary } from '../api/types'
import { CAROUSEL_CONTAINER } from './cardLayout'
import { SuggestedPlaylistCard } from './SuggestedPlaylistCard'
import { SuggestedRefreshPanel } from './SuggestedRefreshPanel'
import { useSuggestedRefresh } from '../hooks/useSuggestedRefresh'
import { cadenceCopy, sectionsOf } from '../lib/suggested'

type Load =
  /** No curator on this server, or a server that predates the feature: the shelf does not exist. */
  | { status: 'hidden' }
  | { status: 'error' }
  | { status: 'ready'; refreshDay: string | null; playlists: SuggestedPlaylistSummary[] }

const BUTTON = 'rounded-full border border-zinc-700 px-4 h-9 text-sm text-white hover:bg-zinc-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green-500'
const PULSE = 'rounded bg-zinc-800/60 animate-pulse motion-reduce:animate-none'

/**
 * The "Made for you" shelf on the Home page: one card per category, the way the streaming services put
 * their weekly playlists first on Home, in one row per era (all-time hits first, then each decade, newest
 * first) so fifty playlists stay browsable. Fetched once per visit; hidden entirely when the server has no
 * curator, so an install that never set one up does not see an empty promise.
 */
export function SuggestedPlaylistsShelf() {
  // Keyed by attempt, like the pages: a result for an earlier attempt is not ours yet, which is what
  // "loading" means, so no state reset is needed when Try again bumps the key.
  const [attempt, setAttempt] = useState(0)
  const [fetched, setFetched] = useState<(Load & { key: number }) | null>(null)
  // Owned here, not by the panel: the panel unmounts while the shelf fetches again after a run, and the
  // run's outcome has to survive that to be shown if the shelf is still empty.
  const refetch = useCallback(() => setAttempt(a => a + 1), [])
  const refresh = useSuggestedRefresh(refetch)

  useEffect(() => {
    const controller = new AbortController()
    getSuggestedPlaylists(controller.signal)
      .then(res => setFetched({ key: attempt, ...(res.enabled ? { status: 'ready', refreshDay: res.refreshDay, playlists: res.playlists } : { status: 'hidden' }) }))
      .catch(err => {
        if (err instanceof Error && err.name === 'AbortError') return
        // A 404 is a server without the endpoint yet, not a failure worth a message.
        setFetched({ key: attempt, status: err instanceof ApiError && err.status === 404 ? 'hidden' : 'error' })
      })
    return () => controller.abort()
  }, [attempt])

  const load: Load | { status: 'loading' } = fetched?.key === attempt ? fetched : { status: 'loading' }
  if (load.status === 'hidden') return null

  return (
    <section aria-busy={load.status === 'loading'}>
      <h2 className="text-3xl font-bold text-white">Made for you</h2>
      <p className="text-zinc-400 mt-1 mb-6">
        A fresh playlist for every category. {load.status === 'ready' ? cadenceCopy(load.refreshDay) : 'A new edition every week.'}
      </p>

      {load.status === 'loading' && (
        <div className={CAROUSEL_CONTAINER} aria-label="Loading suggested playlists">
          {Array.from({ length: 3 }, (_, i) => (
            <div key={i} className="flex-shrink-0 w-40 md:w-48">
              <div className={`w-40 md:w-48 h-40 md:h-48 mb-3 ${PULSE}`} />
              <div className={`h-5 w-28 mb-2 ${PULSE}`} />
              <div className={`h-4 w-20 ${PULSE}`} />
            </div>
          ))}
        </div>
      )}

      {load.status === 'error' && (
        <div className="text-zinc-400">
          <p role="status">Couldn't load your suggested playlists.</p>
          <button type="button" onClick={() => setAttempt(a => a + 1)} className={`mt-3 ${BUTTON}`}>Try again</button>
        </div>
      )}

      {load.status === 'ready' && load.playlists.length === 0 && (
        <SuggestedRefreshPanel message="This week's playlists aren't ready yet." refresh={refresh} />
      )}

      {load.status === 'ready' && load.playlists.length > 0 && sectionsOf(load.playlists).map(section => (
        <div key={section.era ?? ''} className="mb-6">
          {section.era && <h3 className="text-xl font-semibold text-white mb-4">{section.era}</h3>}
          <div className={CAROUSEL_CONTAINER}>
            {section.playlists.map(playlist => (
              <SuggestedPlaylistCard key={playlist.category} playlist={playlist} />
            ))}
          </div>
        </div>
      ))}
    </section>
  )
}
