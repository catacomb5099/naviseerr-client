import { useEffect, useState } from 'react'
import { ListMusic } from 'lucide-react'
import { useSearchParams } from 'react-router-dom'
import { AppHeader } from '../components/AppHeader'
import { PageNavButton } from '../components/PageNavButton'
import { SearchBar } from '../components/SearchBar'
import { FilterPills, FilterType } from '../components/FilterPills'
import { SongCard } from '../components/SongCard'
import { ArtistCard } from '../components/ArtistCard'
import { AlbumCard } from '../components/AlbumCard'
import { CAROUSEL_CONTAINER, GRID_CONTAINER } from '../components/cardLayout'
import { SuggestedPlaylistsShelf } from '../components/SuggestedPlaylistsShelf'
import { search, searchSongs, searchAlbums, searchArtists, searchPlaylists } from '../api/endpoints'
import { useRetry } from '../hooks/useRetry'
import { DownloadType, SearchResponse } from '../api/types'
import { DownloadMetaInput } from '../lib/downloadLibrary'

interface HomePageProps {
  onNavigateToDownloads: () => void
  /** Requests the download and records its metadata; App owns both halves. `id` is the YouTube
   *  videoId for a song or the collection id for an album/playlist. Resolves true once the server
   *  accepted the request. */
  onDownload: (id: string, type: DownloadType, meta: DownloadMetaInput) => Promise<boolean>
  /** Opens the song info pop-up App owns. */
  onInfo: (videoId: string, plays?: string | null) => void
}

const FILTERS: FilterType[] = ['all', 'songs', 'albums', 'artists', 'playlists']

/** A hand-typed or stale `?type=` falls back to All rather than breaking the page. */
function parseFilter(raw: string | null): FilterType {
  return FILTERS.find(f => f === raw) ?? 'all'
}

async function runSearch(query: string, filter: FilterType, fresh: boolean): Promise<SearchResponse> {
  switch (filter) {
    case 'songs': return { tracks: await searchSongs(query, { fresh }), albums: [], artists: [], playlists: [] }
    case 'albums': return { tracks: [], albums: await searchAlbums(query, { fresh }), artists: [], playlists: [] }
    case 'artists': return { tracks: [], albums: [], artists: await searchArtists(query, { fresh }), playlists: [] }
    case 'playlists': return { tracks: [], albums: [], artists: [], playlists: await searchPlaylists(query, { fresh }) }
    default: return search(query, { fresh })
  }
}

type Fetched = { key: string } & ({ results: SearchResponse } | { error: string })

export function HomePage({ onNavigateToDownloads, onDownload, onInfo }: HomePageProps) {
  // The URL is the search state (/?q=...&type=...): opening an album and pressing the browser's
  // back button lands here again and the search re-runs from what the address says.
  const [searchParams, setSearchParams] = useSearchParams()
  const query = searchParams.get('q') ?? ''
  const selectedPill = parseFilter(searchParams.get('type'))
  // Keyed by what was fetched: a result for another query or pill (or an earlier attempt) is not
  // ours yet, which is what "loading" means. No state reset needed when the key changes.
  const subject = `${selectedPill}:${query}`
  const [attempt, retry] = useRetry(subject)
  const key = `${subject}:${attempt}`
  const [fetched, setFetched] = useState<Fetched | null>(null)

  useEffect(() => {
    if (!query) return
    let cancelled = false
    runSearch(query, selectedPill, attempt > 0)
      .then(results => { if (!cancelled) setFetched({ key, results }) })
      .catch(err => {
        if (!cancelled) setFetched({ key, error: err instanceof Error ? err.message : 'Search failed' })
      })
    return () => { cancelled = true }
  }, [query, selectedPill, key, attempt])

  const current = query && fetched?.key === key ? fetched : null
  const loading = query !== '' && current === null
  const results = current && 'results' in current ? current.results : null
  const error = current && 'error' in current ? current.error : null

  const setSearch = (q: string, filter: FilterType) => {
    // Same search again (the way to retry after a failure): the address would not change, so
    // nothing would re-run. Fetch again in place, past the kept answer, rather than pushing a
    // duplicate history entry.
    if (q === query && filter === selectedPill) { retry(); return }
    const params: Record<string, string> = {}
    if (q) params.q = q
    if (filter !== 'all') params.type = filter
    setSearchParams(params)
  }
  const handleSearch = (searchQuery: string) => setSearch(searchQuery, selectedPill)
  const handlePillChange = (filter: FilterType) => setSearch(query, filter)

  const showSongs = selectedPill === 'all' || selectedPill === 'songs'
  const showArtists = selectedPill === 'all' || selectedPill === 'artists'
  const showAlbums = selectedPill === 'all' || selectedPill === 'albums'
  const showPlaylists = selectedPill === 'all' || selectedPill === 'playlists'

  // Standalone Albums / Artists / Playlists views wrap into a grid of double-size cards;
  // the mixed "All" view keeps the horizontally scrolling row of smaller cards.
  const isStandalone = selectedPill !== 'all' && selectedPill !== 'songs'
  const cardLayout = isStandalone ? 'grid' : 'carousel'
  const containerClass = isStandalone ? GRID_CONTAINER : CAROUSEL_CONTAINER

  const hasSongs = results?.tracks && results.tracks.length > 0
  const hasArtists = results?.artists && results.artists.length > 0
  const hasAlbums = results?.albums && results.albums.length > 0
  const hasPlaylists = results?.playlists && results.playlists.length > 0

  return (
    <div className="max-w-7xl mx-auto px-4 py-6 md:px-6">
      <AppHeader action={
        <PageNavButton
          label="Downloads"
          icon={<ListMusic className="w-4 h-4" />}
          onClick={onNavigateToDownloads}
        />
      }>
        {/* Search Bar */}
        {/* Keyed so the box follows the URL when back/forward changes the query. */}
        <SearchBar key={query} onSearch={handleSearch} loading={loading} initialQuery={query} />

        {/* Filter Pills */}
        <div className="mt-4">
          <FilterPills selected={selectedPill} onSelect={handlePillChange} />
        </div>
      </AppHeader>

      {/* Error State */}
      {error && (
        <div className="text-red-500 text-center py-8">
          <p>{error}</p>
        </div>
      )}

      {/* Empty State (no search yet): the search hint, then this week's suggested playlists - the
          shelf the streaming services lead their Home with. Hidden on a server with no curator. */}
      {!loading && !results && !error && (
        <div>
          <p className="text-center py-12 text-zinc-500 text-lg">
            Search for your favorite songs, albums, artists, and playlists
          </p>
          <SuggestedPlaylistsShelf />
        </div>
      )}

      {/* No Results */}
      {!loading && results && !hasSongs && !hasArtists && !hasAlbums && !hasPlaylists && (
        <div className="text-center py-20">
          <p className="text-zinc-500 text-lg">
            No results found for "{query}"
          </p>
        </div>
      )}

      {/* Results */}
      {results && (
        <main className="space-y-12">
          {/* Songs Section */}
          {showSongs && hasSongs && (
            <section>
              <h2 className="text-3xl font-bold text-white mb-6">Songs</h2>
              <div className="space-y-2">
                {results.tracks.map((track, index) => (
                  <SongCard
                    key={track.id || `song-${index}`}
                    track={track}
                    artistNames={track.artists}
                    onInfo={onInfo}
                    onDownload={(downloadedTrack, artistNames) => void onDownload(downloadedTrack.id, 'SONG', {
                      youtubeId: downloadedTrack.id,
                      downloadType: 'SONG',
                      title: downloadedTrack.name,
                      artistNames,
                      // The albums in the same response are the only place a track's album name exists.
                      albumName: results?.albums.find(a => a.id === downloadedTrack.albumId)?.name ?? null,
                      iconURL: downloadedTrack.iconURL || null,
                    })}
                  />
                ))}
              </div>
            </section>
          )}

          {/* Artists Section */}
          {showArtists && hasArtists && (
            <section>
              <h2 className="text-3xl font-bold text-white mb-6">Artists</h2>
              <div className={containerClass}>
                {results.artists.map((artist) => (
                  <ArtistCard key={artist.id} artist={artist} layout={cardLayout} />
                ))}
              </div>
            </section>
          )}

          {/* Albums Section */}
          {showAlbums && hasAlbums && (
            <section>
              <h2 className="text-3xl font-bold text-white mb-6">Albums</h2>
              <div className={containerClass}>
                {results.albums.map((album) => (
                  <AlbumCard key={album.id} item={album} kind="ALBUM" layout={cardLayout} />
                ))}
              </div>
            </section>
          )}

          {/* Playlists Section */}
          {showPlaylists && hasPlaylists && (
            <section>
              <h2 className="text-3xl font-bold text-white mb-6">Playlists</h2>
              <div className={containerClass}>
                {results.playlists.map((playlist) => (
                  <AlbumCard key={playlist.id} item={playlist} kind="PLAYLIST" layout={cardLayout} />
                ))}
              </div>
            </section>
          )}
        </main>
      )}
    </div>
  )
}
