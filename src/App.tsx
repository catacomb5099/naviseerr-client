import { useState } from 'react'
import { SearchBar } from './components/SearchBar'
import { FilterPills, FilterType } from './components/FilterPills'
import { SongCard } from './components/SongCard'
import { ArtistCard } from './components/ArtistCard'
import { AlbumCard } from './components/AlbumCard'
import { DownloadPanel } from './components/DownloadPanel'
import { CAROUSEL_CONTAINER, GRID_CONTAINER } from './components/cardLayout'
import { search, searchSongs, searchAlbums, searchArtists } from './api/endpoints'
import { SearchResponse } from './api/types'
import { getArtistNames } from './lib/utils'
import { useActiveDownloads } from './hooks/useActiveDownloads'
import { useDismissSound } from './hooks/useDismissSound'

function App() {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<SearchResponse | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [selectedPill, setSelectedPill] = useState<FilterType>('all')

  const { muted, toggleMuted, playSwoosh } = useDismissSound()
  const {
    cards: downloadCards,
    exiting: exitingDownloadIds,
    pollIntervalMs,
    minimized: downloadsMinimized,
    setMinimized: setDownloadsMinimized,
    dismiss: dismissDownload,
    requestDownload,
  } = useActiveDownloads(playSwoosh)

  const handleSearch = async (searchQuery: string, filter?: FilterType) => {
    setQuery(searchQuery)
    setResults(null) // Clear old results before new search
    setLoading(true)
    setError(null)

    // Use provided filter or fall back to current selectedPill
    const activeFilter = filter ?? selectedPill

    try {
      let data: SearchResponse

      if (activeFilter === 'all') {
        data = await search(searchQuery)
      } else if (activeFilter === 'songs') {
        const tracks = await searchSongs(searchQuery)
        data = { tracks, albums: [], artists: [] }
      } else if (activeFilter === 'albums') {
        const { albums, artists } = await searchAlbums(searchQuery)
        data = { tracks: [], albums, artists }
      } else {
        // artists
        const artists = await searchArtists(searchQuery)
        data = { tracks: [], albums: [], artists }
      }

      setResults(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Search failed')
      setResults(null)
    } finally {
      setLoading(false)
    }
  }

  const handlePillChange = (filter: FilterType) => {
    setSelectedPill(filter)
    // Re-run search with new filter if we have a query
    if (query) {
      handleSearch(query, filter) // Pass the new filter directly
    }
  }

  const showSongs = selectedPill === 'all' || selectedPill === 'songs'
  const showArtists = selectedPill === 'all' || selectedPill === 'artists'
  const showAlbums = selectedPill === 'all' || selectedPill === 'albums'

  // Standalone Albums / Artists views wrap into a grid of double-size cards;
  // the mixed "All" view keeps the horizontally scrolling row of smaller cards.
  const isStandalone = selectedPill === 'albums' || selectedPill === 'artists'
  const cardLayout = isStandalone ? 'grid' : 'carousel'
  const containerClass = isStandalone ? GRID_CONTAINER : CAROUSEL_CONTAINER

  const hasSongs = results?.tracks && results.tracks.length > 0
  const hasArtists = results?.artists && results.artists.length > 0
  const hasAlbums = results?.albums && results.albums.length > 0

  return (
    <div className="min-h-screen bg-black text-white">
      <div className="max-w-7xl mx-auto px-4 py-6 md:px-6">
        {/* Header */}
        <header className="mb-8">
          <h1 className="text-3xl md:text-4xl font-bold mb-4 md:mb-6 bg-gradient-to-r from-green-400 to-blue-500 bg-clip-text text-transparent">
            Naviseerr
          </h1>

          {/* Search Bar */}
          <SearchBar onSearch={handleSearch} loading={loading} />

          {/* Filter Pills */}
          <div className="mt-4">
            <FilterPills selected={selectedPill} onSelect={handlePillChange} />
          </div>
        </header>

        {/* Error State */}
        {error && (
          <div className="text-red-500 text-center py-8">
            <p>{error}</p>
          </div>
        )}

        {/* Empty State (no search yet) */}
        {!loading && !results && !error && (
          <div className="text-center py-20">
            <p className="text-zinc-500 text-lg">
              Search for your favorite songs, albums, and artists
            </p>
          </div>
        )}

        {/* No Results */}
        {!loading && results && !hasSongs && !hasArtists && !hasAlbums && (
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
                      artistNames={getArtistNames(track.artists, results.artists)}
                      onDownload={requestDownload}
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
                    <AlbumCard
                      key={album.id}
                      album={album}
                      artistNames={getArtistNames(album.artists, results.artists)}
                      layout={cardLayout}
                    />
                  ))}
                </div>
              </section>
            )}
          </main>
        )}
      </div>

      <DownloadPanel
        cards={downloadCards}
        exiting={exitingDownloadIds}
        pollIntervalMs={pollIntervalMs}
        minimized={downloadsMinimized}
        onToggleMinimized={() => setDownloadsMinimized(m => !m)}
        onDismiss={dismissDownload}
        muted={muted}
        onToggleMuted={toggleMuted}
      />
    </div>
  )
}

export default App
