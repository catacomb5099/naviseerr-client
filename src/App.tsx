import { useState } from 'react'
import { SearchBar } from './components/SearchBar'
import { FilterPills, FilterType } from './components/FilterPills'
import { SongCard } from './components/SongCard'
import { ArtistCard } from './components/ArtistCard'
import { AlbumCard } from './components/AlbumCard'
import { search, searchSongs, searchAlbums, searchArtists, download } from './api/endpoints'
import { SearchResponse } from './api/types'
import { getArtistNames } from './lib/utils'

function App() {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<SearchResponse | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [selectedPill, setSelectedPill] = useState<FilterType>('all')
  const [downloadingIds, setDownloadingIds] = useState<Set<string>>(new Set())

  const handleSearch = async (searchQuery: string) => {
    setQuery(searchQuery)
    setLoading(true)
    setError(null)

    try {
      let data: SearchResponse

      if (selectedPill === 'all') {
        data = await search(searchQuery)
      } else if (selectedPill === 'songs') {
        const songs = await searchSongs(searchQuery)
        data = { songs, albums: [], artists: [] }
      } else if (selectedPill === 'albums') {
        const albums = await searchAlbums(searchQuery)
        data = { songs: [], albums, artists: [] }
      } else {
        // artists
        const artists = await searchArtists(searchQuery)
        data = { songs: [], albums: [], artists }
      }

      setResults(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Search failed')
      setResults(null)
    } finally {
      setLoading(false)
    }
  }

  const handleDownload = async (songId: string) => {
    setDownloadingIds(prev => new Set(prev).add(songId))
    try {
      await download(songId)
    } catch (err) {
      console.error('Download failed:', err)
      alert('Download failed. Please try again.')
      setDownloadingIds(prev => {
        const next = new Set(prev)
        next.delete(songId)
        return next
      })
    }
  }

  const handlePillChange = (filter: FilterType) => {
    setSelectedPill(filter)
    // Re-run search with new filter if we have a query
    if (query) {
      handleSearch(query)
    }
  }

  const showSongs = selectedPill === 'all' || selectedPill === 'songs'
  const showArtists = selectedPill === 'all' || selectedPill === 'artists'
  const showAlbums = selectedPill === 'all' || selectedPill === 'albums'

  const hasSongs = results?.songs && results.songs.length > 0
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
                  {results.songs.map((song) => (
                    <SongCard
                      key={song.id}
                      song={song}
                      artistNames={getArtistNames(song.artists, results.artists)}
                      onDownload={handleDownload}
                      isDownloading={downloadingIds.has(song.id)}
                    />
                  ))}
                </div>
              </section>
            )}

            {/* Artists Section */}
            {showArtists && hasArtists && (
              <section>
                <h2 className="text-3xl font-bold text-white mb-6">Artists</h2>
                <div className="flex gap-4 overflow-x-auto pb-4">
                  {results.artists.map((artist) => (
                    <ArtistCard key={artist.id} artist={artist} />
                  ))}
                </div>
              </section>
            )}

            {/* Albums Section */}
            {showAlbums && hasAlbums && (
              <section>
                <h2 className="text-3xl font-bold text-white mb-6">Albums</h2>
                <div className="flex gap-4 overflow-x-auto pb-4">
                  {results.albums.map((album) => (
                    <AlbumCard
                      key={album.id}
                      album={album}
                      artistNames={getArtistNames(album.artists, results.artists)}
                    />
                  ))}
                </div>
              </section>
            )}
          </main>
        )}
      </div>
    </div>
  )
}

export default App
