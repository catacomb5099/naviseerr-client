import { ArrowLeft } from 'lucide-react'
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom'
import { useArtist } from '../hooks/useArtist'
import { AppHeader } from '../components/AppHeader'
import { PageNavButton } from '../components/PageNavButton'
import { AlbumCard } from '../components/AlbumCard'
import { DENSE_GRID_CONTAINER } from '../components/cardLayout'

export type ArtistShelf = 'albums' | 'singles'

const TITLES: Record<ArtistShelf, string> = { albums: 'Albums', singles: 'Singles' }

const PULSE = 'bg-zinc-800/60 animate-pulse motion-reduce:animate-none'
const BUTTON = 'rounded-full border border-zinc-700 px-4 h-9 text-sm text-white hover:bg-zinc-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green-500'

/** "Show all" for one row of an artist's page: every card of it in a grid, in the row's own order (albums by
 *  popularity, singles newest first), like YouTube Music's and Spotify's grid pages. Same fetch as the
 *  artist page, so it opens at once from there and still works from a link. */
export function ArtistShelfPage({ shelf }: { shelf: ArtistShelf }) {
  const { id = '' } = useParams()
  const navigate = useNavigate()
  const cameFromApp = useLocation().key !== 'default'
  const [load, retry] = useArtist(id)
  const artist = load.status === 'ready' ? load.artist : null
  const items = artist ? artist[shelf] : []

  return (
    <div className="max-w-7xl mx-auto px-4 py-6 md:px-6">
      <AppHeader action={
        <PageNavButton
          label="Back"
          icon={<ArrowLeft className="w-4 h-4" />}
          onClick={() => cameFromApp ? navigate(-1) : navigate(`/artist/${encodeURIComponent(id)}`)}
        />
      } />

      <main aria-busy={load.status === 'loading'}>
        {load.status === 'notFound' && (
          <div className="py-20 text-center text-zinc-400">
            <p role="status">We couldn't find this artist.</p>
            <Link to="/" className={`mt-3 inline-flex items-center ${BUTTON}`}>Back to search</Link>
          </div>
        )}
        {load.status === 'error' && (
          <div className="py-20 text-center text-zinc-400">
            <p role="status">
              Couldn't load this artist.
              {load.detail && <span className="block mt-1 text-sm">{load.detail}</span>}
            </p>
            <button type="button" onClick={retry} className={`mt-3 ${BUTTON}`}>Try again</button>
          </div>
        )}

        {(load.status === 'loading' || artist) && (
          <>
            <div className="mb-6">
              {artist ? (
                <Link
                  to={`/artist/${encodeURIComponent(id)}`}
                  className="text-sm font-semibold text-zinc-400 hover:text-white hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green-500 rounded"
                >
                  {artist.name}
                </Link>
              ) : (
                <div className={`h-5 w-32 rounded ${PULSE}`} />
              )}
              <h2 className="mt-1 text-3xl md:text-4xl font-bold">{TITLES[shelf]}</h2>
            </div>
            {artist && items.length === 0 && (
              <p role="status" className="py-8 text-center text-zinc-400">Nothing here for this artist yet.</p>
            )}
            <div className={DENSE_GRID_CONTAINER}>
              {artist
                ? items.map(item => <AlbumCard key={item.id} item={item} kind="ALBUM" layout="grid" />)
                : Array.from({ length: 12 }, (_, i) => (
                  <div key={i}>
                    <div className={`w-full aspect-square rounded ${PULSE}`} />
                    <div className={`mt-3 h-4 w-3/4 rounded ${PULSE}`} />
                  </div>
                ))}
            </div>
          </>
        )}
      </main>
    </div>
  )
}
