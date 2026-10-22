import { useEffect, useState } from 'react'
import { ArrowLeft, Loader2, Plus } from 'lucide-react'
import { Link, useNavigate } from 'react-router-dom'
import { createPlaylist, getPlaylists } from '../api/endpoints'
import { PlaylistSummary } from '../api/types'
import { useRetry } from '../hooks/useRetry'
import { playlistMeta } from '../lib/playlists'
import { providerMessage } from '../lib/utils'
import { AppHeader } from '../components/AppHeader'
import { PageNavButton } from '../components/PageNavButton'
import { PlaylistCover } from '../components/PlaylistCover'

const TILE = 'block text-left rounded focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green-500 focus-visible:ring-offset-2 focus-visible:ring-offset-black'
const SQUARE = 'aspect-square w-full mb-3'

type Load = { status: 'loading' } | { status: 'error'; problem: string | null } | { status: 'ready'; playlists: PlaylistSummary[] }

/**
 * Your playlists (YouTube Music's Library > Playlists, Spotify's Your Library): "New playlist" first, as all
 * three apps put it, then your playlists, last edited first. Reached from the list icon in every page's header.
 */
export function LibraryPage({ onNavigateHome }: { onNavigateHome: () => void }) {
  const navigate = useNavigate()
  const [load, setLoad] = useState<Load>({ status: 'loading' })
  const [attempt, retry] = useRetry('library')
  const [creating, setCreating] = useState(false)
  const [failed, setFailed] = useState(false)

  useEffect(() => {
    const ctrl = new AbortController()
    getPlaylists(ctrl.signal)
      .then(playlists => setLoad({ status: 'ready', playlists }))
      .catch(err => { if (!ctrl.signal.aborted) setLoad({ status: 'error', problem: providerMessage(err) }) })
    return () => ctrl.abort()
  }, [attempt])

  useEffect(() => {
    document.title = 'Your playlists - Naviseerr'
    return () => { document.title = 'Naviseerr' }
  }, [])

  const newPlaylist = async () => {
    if (creating) return
    setCreating(true)
    setFailed(false)
    try {
      const created = await createPlaylist()
      navigate(`/library/${encodeURIComponent(created.id)}`)
    } catch {
      setFailed(true)
      setCreating(false)
    }
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-6 md:px-6">
      <AppHeader action={
        <PageNavButton label="Search" icon={<ArrowLeft className="w-4 h-4" />} onClick={onNavigateHome} />
      } />
      <h2 className="mb-6 text-2xl font-bold">Your playlists</h2>

      {load.status === 'error' && (
        <div className="py-8 text-center text-zinc-400">
          <p role="status">
            Couldn't load your playlists.
            {load.problem && <span className="block mt-1 text-sm">{load.problem}</span>}
          </p>
          <button
            type="button"
            onClick={retry}
            className="mt-3 rounded-full border border-zinc-700 px-4 h-9 text-sm text-white hover:bg-zinc-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green-500"
          >
            Try again
          </button>
        </div>
      )}

      {load.status !== 'error' && (
        <ul className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6" aria-busy={load.status === 'loading'}>
          <li>
            <button type="button" onClick={() => void newPlaylist()} aria-disabled={creating} className={`${TILE} w-full`}>
              <span className={`${SQUARE} flex items-center justify-center rounded-md border border-dashed border-zinc-700 text-zinc-300 hover:bg-zinc-900`}>
                {creating
                  ? <Loader2 className="w-8 h-8 animate-spin motion-reduce:animate-none" aria-hidden="true" />
                  : <Plus className="w-8 h-8" aria-hidden="true" />}
              </span>
              <span className="block text-white font-medium">New playlist</span>
              {failed && <span role="status" className="block text-xs text-red-400">Couldn't make it — try again</span>}
            </button>
          </li>
          {load.status === 'loading' && Array.from({ length: 3 }, (_, i) => (
            <li key={i}><span className={`${SQUARE} block rounded-md bg-zinc-800/60 animate-pulse motion-reduce:animate-none`} /></li>
          ))}
          {load.status === 'ready' && load.playlists.map(p => (
            <li key={p.id}>
              <Link to={`/library/${encodeURIComponent(p.id)}`} className={TILE}>
                <PlaylistCover coverUrl={p.coverUrl} mosaic={p.mosaic} className={SQUARE} />
                <span className="block text-white font-medium truncate mb-1">{p.title}</span>
                <span className="block text-zinc-400 text-sm truncate">{playlistMeta(p)}</span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
