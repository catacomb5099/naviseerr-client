import { ReactNode, useEffect, useState } from 'react'
import { ArrowLeft, ChevronDown, ChevronUp } from 'lucide-react'
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom'
import { getArtist } from '../api/endpoints'
import { ApiError } from '../api/client'
import { ArtistDetail, DownloadType } from '../api/types'
import { DownloadMetaInput } from '../lib/downloadLibrary'
import { AppHeader } from '../components/AppHeader'
import { PageNavButton } from '../components/PageNavButton'
import { SongCard } from '../components/SongCard'
import { AlbumCard } from '../components/AlbumCard'
import { ArtistCard } from '../components/ArtistCard'
import { CAROUSEL_CONTAINER } from '../components/cardLayout'

interface ArtistPageProps {
  /** Same plumbing as HomePage's song rows: App requests the download and records its metadata. */
  onDownload: (id: string, type: DownloadType, meta: DownloadMetaInput) => Promise<boolean>
  /** Opens the song info pop-up App owns. */
  onInfo: (videoId: string) => void
}

type Load =
  | { status: 'error' }
  | { status: 'notFound' }
  | { status: 'ready'; artist: ArtistDetail }

/** Top songs shows this many rows until "See more"; the server caps the list at 10. */
const COLLAPSED_SONGS = 5

const PULSE = 'bg-zinc-800/60 animate-pulse motion-reduce:animate-none'
const BUTTON = 'rounded-full border border-zinc-700 px-4 h-9 text-sm text-white hover:bg-zinc-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green-500'

/** A titled horizontally scrolling row of cards. Callers skip it when the list is empty. */
function Shelf({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section>
      <h3 className="text-xl font-semibold text-white mb-4">{title}</h3>
      <div className={CAROUSEL_CONTAINER}>{children}</div>
    </section>
  )
}

/** An artist as its own page. Everything comes from the URL and one fetch, so a deep link, a
 *  refresh, or a hop from one artist to a similar one all work the same way: skeleton until the
 *  detail arrives. */
export function ArtistPage({ onDownload, onInfo }: ArtistPageProps) {
  const { id = '' } = useParams()
  const navigate = useNavigate()
  // The router gives the very first entry of a session the key 'default': a deep link or a
  // refresh. Anything else was reached from inside the app, so the browser's back is the right way
  // out and keeps whatever the user came from.
  const cameFromApp = useLocation().key !== 'default'
  // Keyed by what was fetched: a result for another artist (or an earlier attempt) is simply not
  // ours yet, which is what "loading" means. No state reset needed when the key changes.
  const [fetched, setFetched] = useState<(Load & { key: string }) | null>(null)
  const [attempt, setAttempt] = useState(0)
  // Which artist's Top songs is expanded - so hopping to a similar artist starts collapsed again
  // without an effect to reset it.
  const [expandedId, setExpandedId] = useState<string | null>(null)

  const key = `${id}:${attempt}`
  useEffect(() => {
    let cancelled = false
    getArtist(id)
      .then(artist => { if (!cancelled) setFetched({ key, status: 'ready', artist }) })
      .catch(err => {
        if (cancelled) return
        const notFound = err instanceof ApiError && err.status === 404
        setFetched({ key, status: notFound ? 'notFound' : 'error' })
      })
    return () => { cancelled = true }
  }, [id, key])

  const load: Load | { status: 'loading' } = fetched?.key === key ? fetched : { status: 'loading' }
  const artist = load.status === 'ready' ? load.artist : null
  const loading = load.status === 'loading'

  const expanded = expandedId === id
  const songs = artist?.topSongs ?? []
  const shownSongs = expanded ? songs : songs.slice(0, COLLAPSED_SONGS)

  return (
    <div className="max-w-7xl mx-auto px-4 py-6 md:px-6">
      <AppHeader action={
        <PageNavButton
          label="Back"
          icon={<ArrowLeft className="w-4 h-4" />}
          onClick={() => cameFromApp ? navigate(-1) : navigate('/')}
        />
      } />

      <main aria-busy={loading}>
        {load.status === 'notFound' && (
          <div className="py-20 text-center text-zinc-400">
            <p role="status">We couldn't find this artist.</p>
            <Link to="/" className={`mt-3 inline-flex items-center ${BUTTON}`}>Back to search</Link>
          </div>
        )}
        {load.status === 'error' && (
          <div className="py-20 text-center text-zinc-400">
            <p role="status">Couldn't load this artist.</p>
            <button type="button" onClick={() => setAttempt(a => a + 1)} className={`mt-3 ${BUTTON}`}>
              Try again
            </button>
          </div>
        )}

        {(loading || artist) && (
          <div className="space-y-10">
            {/* Header: stacked and centred on phones, side by side from tablet up. */}
            <div className="flex flex-col items-center text-center gap-4 md:flex-row md:items-end md:text-left md:gap-8">
              {artist?.iconURL ? (
                <img src={artist.iconURL} alt="" referrerPolicy="no-referrer" className="h-40 w-40 md:h-56 md:w-56 flex-shrink-0 rounded-full object-cover shadow-lg" />
              ) : (
                <div className={`h-40 w-40 md:h-56 md:w-56 flex-shrink-0 rounded-full bg-zinc-800 shadow-lg ${artist ? '' : 'animate-pulse motion-reduce:animate-none'}`} />
              )}
              <div className="min-w-0 max-w-full">
                {artist ? (
                  <>
                    <h2 className="text-3xl md:text-5xl font-bold truncate">{artist.name}</h2>
                    {artist.subscribers && <p className="mt-2 text-zinc-400">{artist.subscribers} subscribers</p>}
                  </>
                ) : (
                  <>
                    {/* Same heights as the real name and subscriber line, so nothing jumps when they land. */}
                    <div className={`h-9 md:h-12 w-64 rounded ${PULSE}`} />
                    <div className={`mt-2 h-6 w-32 rounded ${PULSE}`} />
                  </>
                )}
              </div>
            </div>

            {/* Top songs: always rendered, so the page keeps its shape even for an artist with none. */}
            <section>
              <h3 className="text-xl font-semibold text-white mb-4">Top songs</h3>
              {loading && (
                <ol aria-label="Loading songs" className="space-y-2">
                  {Array.from({ length: COLLAPSED_SONGS }, (_, i) => (
                    <li key={i} className="flex items-center gap-3">
                      <span className="w-6" />
                      <div className={`flex-1 h-24 rounded-md ${PULSE}`} />
                    </li>
                  ))}
                </ol>
              )}
              {artist && songs.length === 0 && (
                <p role="status" className="py-8 text-center text-zinc-400">No songs found for this artist yet.</p>
              )}
              {artist && songs.length > 0 && (
                <>
                  <ol id="top-songs" className="space-y-2">
                    {shownSongs.map((track, i) => (
                      <li key={i} className="flex items-center gap-3">
                        <span className="w-6 text-right text-sm text-zinc-500 tabular-nums">{i + 1}</span>
                        <div className="flex-1 min-w-0">
                          <SongCard
                            track={track}
                            artistNames={track.artists}
                            onInfo={onInfo}
                            onDownload={(t, artistNames) => void onDownload(t.id, 'SONG', {
                              youtubeId: t.id,
                              downloadType: 'SONG',
                              title: t.name,
                              artistNames,
                              // The server names no album id for a top song, so there is nothing to look up.
                              albumName: null,
                              iconURL: t.iconURL || null,
                            })}
                          />
                        </div>
                      </li>
                    ))}
                  </ol>
                  {/* Under the list, so focus stays on the button when the list collapses. */}
                  {songs.length > COLLAPSED_SONGS && (
                    <button
                      type="button"
                      onClick={() => setExpandedId(expanded ? null : id)}
                      aria-expanded={expanded}
                      aria-controls="top-songs"
                      className="mt-3 inline-flex items-center gap-1 text-sm font-semibold text-zinc-400 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green-500 rounded"
                    >
                      {expanded ? <ChevronUp className="w-4 h-4" aria-hidden="true" /> : <ChevronDown className="w-4 h-4" aria-hidden="true" />}
                      {expanded ? 'See less' : 'See more'}
                    </button>
                  )}
                </>
              )}
            </section>

            {loading && (
              <section aria-hidden="true">
                <div className={`h-6 w-32 rounded mb-4 ${PULSE}`} />
                <div className={CAROUSEL_CONTAINER}>
                  {Array.from({ length: 5 }, (_, i) => (
                    <div key={i} className="flex-shrink-0 w-40 md:w-48">
                      <div className={`h-40 w-40 md:h-48 md:w-48 rounded ${PULSE}`} />
                      <div className={`mt-3 h-4 w-3/4 rounded ${PULSE}`} />
                      <div className={`mt-2 h-3 w-1/2 rounded ${PULSE}`} />
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* Empty shelves are left out, the way Spotify and Apple Music do. */}
            {artist && artist.albums.length > 0 && (
              <Shelf title="Albums">
                {artist.albums.map(album => <AlbumCard key={album.id} item={album} kind="ALBUM" />)}
              </Shelf>
            )}
            {artist && artist.singles.length > 0 && (
              <Shelf title="Singles">
                {artist.singles.map(single => <AlbumCard key={single.id} item={single} kind="ALBUM" />)}
              </Shelf>
            )}
            {artist && artist.playlists.length > 0 && (
              <Shelf title="Playlists">
                {artist.playlists.map(playlist => <AlbumCard key={playlist.id} item={playlist} kind="PLAYLIST" />)}
              </Shelf>
            )}
            {artist && artist.similarArtists.length > 0 && (
              <Shelf title="Similar artists">
                {artist.similarArtists.map(similar => <ArtistCard key={similar.id} artist={similar} />)}
              </Shelf>
            )}
          </div>
        )}
      </main>
    </div>
  )
}
