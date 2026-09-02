import { ListMusic } from 'lucide-react'
import { AppHeader } from '../components/AppHeader'
import { PageNavButton } from '../components/PageNavButton'
import { SearchBar } from '../components/SearchBar'
import { FilterPills, FilterType } from '../components/FilterPills'
import { SongCard } from '../components/SongCard'
import { ArtistCard } from '../components/ArtistCard'
import { AlbumCard } from '../components/AlbumCard'
import { CAROUSEL_CONTAINER, GRID_CONTAINER } from '../components/cardLayout'
import { SearchResponse } from '../api/types'
import { getArtistNames } from '../lib/utils'
import { DownloadMetaInput } from '../lib/downloadLibrary'

interface HomePageProps {
  query: string
  results: SearchResponse | null
  loading: boolean
  error: string | null
  selectedPill: FilterType
  onSearch: (searchQuery: string, filter?: FilterType) => void
  onPillChange: (filter: FilterType) => void
  onNavigateToDownloads: () => void
  /** Requests the download and records its metadata; App owns both halves. */
  onDownload: (songName: string, meta: DownloadMetaInput) => void
}

export function HomePage({
  query, results, loading, error, selectedPill, onSearch, onPillChange, onNavigateToDownloads, onDownload,
}: HomePageProps) {
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
    <div className="max-w-7xl mx-auto px-4 py-6 md:px-6">
      <AppHeader action={
        <PageNavButton
          label="Downloads"
          icon={<ListMusic className="w-4 h-4" />}
          onClick={onNavigateToDownloads}
        />
      }>
        {/* Search Bar */}
        <SearchBar onSearch={onSearch} loading={loading} initialQuery={query} />

        {/* Filter Pills */}
        <div className="mt-4">
          <FilterPills selected={selectedPill} onSelect={onPillChange} />
        </div>
      </AppHeader>

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
                {results.tracks.map((track, index) => {
                  const trackArtistNames = getArtistNames(track.artists, results.artists)
                  return (
                    <SongCard
                      key={track.id || `song-${index}`}
                      track={track}
                      artistNames={trackArtistNames}
                      onDownload={(songName, downloadedTrack, artistNames) => onDownload(songName, {
                        songName,
                        trackName: downloadedTrack.name,
                        artistNames,
                        // The albums in the same response are the only place a track's album name exists.
                        albumName: results?.albums.find(a => a.id === downloadedTrack.albumId)?.name ?? null,
                        iconURL: downloadedTrack.iconURL || null,
                      })}
                    />
                  )
                })}
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
  )
}
