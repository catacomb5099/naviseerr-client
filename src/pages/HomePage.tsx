import { ReactNode, useEffect, useRef, useState } from 'react'
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
import { ShelfStatus, ShowMoreButton } from '../components/ShowMoreButton'
import { search, searchSongs, searchAlbums, searchArtists, searchPlaylists } from '../api/endpoints'
import { useRetry } from '../hooks/useRetry'
import { ShowMore, forgetShelves, useFocusFirstNew, useShowMore } from '../hooks/useShowMore'
import { PAGE, looksAlike } from '../lib/showMore'
import { DownloadType, SearchResponse } from '../api/types'
import { DownloadMetaInput } from '../lib/downloadLibrary'
import { RequestOutcome } from '../lib/downloadPanel'

interface HomePageProps {
  onNavigateToDownloads: () => void
  /** Requests the download and records its metadata; App owns both halves. `id` is the YouTube
   *  videoId for a song or the collection id for an album/playlist. Resolves with how the request
   *  ended: accepted, already on the server, or failed. */
  onDownload: (id: string, type: DownloadType, meta: DownloadMetaInput) => Promise<RequestOutcome>
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
    // A pill asks for exactly one page, so "fewer than asked" means that was all (see useShowMore).
    case 'songs': return { tracks: await searchSongs(query, { fresh, limit: PAGE }), albums: [], artists: [], playlists: [] }
    case 'albums': return { tracks: [], albums: await searchAlbums(query, { fresh, limit: PAGE }), artists: [], playlists: [] }
    case 'artists': return { tracks: [], albums: [], artists: await searchArtists(query, { fresh, limit: PAGE }), playlists: [] }
    case 'playlists': return { tracks: [], albums: [], artists: [], playlists: await searchPlaylists(query, { fresh, limit: PAGE }) }
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

  // YouTube gives the song on the All tab's Top result card no play count, but the songs-only search
  // for the same words lists that song with one (15 of 15 searches checked on 30-09-2026). So once the
  // results are showing, ask for that search and copy counts across by id. Afterwards, not alongside:
  // YouTube fails more often when the two run at once. It is the Songs tab's own request, so that tab
  // then opens from the kept answer. Keyed by song id, which gives the same count on any page.
  const [songPlays, setSongPlays] = useState<Record<string, string>>({})
  useEffect(() => {
    if (!results || results.tracks.every(t => t.plays != null)) return
    let cancelled = false
    searchSongs(query, { limit: PAGE })
      .then(tracks => {
        if (cancelled) return
        const found = Object.fromEntries(tracks.flatMap(t => t.plays ? [[t.id, t.plays]] : []))
        setSongPlays(prev => ({ ...prev, ...found }))
      })
      // Nothing to show for a failure: the row just keeps no number, as before.
      .catch(() => {})
    return () => { cancelled = true }
  }, [results, query])

  const setSearch = (q: string, filter: FilterType) => {
    // Same search again (the way to retry after a failure): the address would not change, so
    // nothing would re-run. Fetch again in place, past the kept answer, rather than pushing a
    // duplicate history entry.
    if (q === query && filter === selectedPill) { forgetShelves(subject); retry(); return }
    const params: Record<string, string> = {}
    if (q) params.q = q
    if (filter !== 'all') params.type = filter
    setSearchParams(params)
  }
  const handleSearch = (searchQuery: string) => setSearch(searchQuery, selectedPill)
  const handlePillChange = (filter: FilterType) => setSearch(query, filter)

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
      {!loading && results && !hasSongs && !hasArtists && !hasAlbums && !hasPlaylists && failedShelves(results).length === 0 && (
        <div className="text-center py-20">
          <p className="text-zinc-500 text-lg">
            No results found for "{query}"
          </p>
        </div>
      )}

      {/* Results. Keyed by the search, so a new search starts every shelf from its first page. */}
      {results && (
        <SearchResults
          key={key}
          searchKey={subject}
          query={query}
          selectedPill={selectedPill}
          results={results}
          onDownload={onDownload}
          onInfo={onInfo}
          songPlays={songPlays}
        />
      )}
    </div>
  )
}

/** On All a song list starts this short, so the shelves below it stay in view. */
const ALL_SONGS_SHOWN = 5
const ALL_SONGS_STEP = 10

/** Shelves the server names in `unavailable` (All only); the mixed page is not a shelf of its own. */
function failedShelves(results: SearchResponse): string[] {
  return (results.unavailable ?? []).filter(part => part !== 'mixed')
}

interface SearchResultsProps extends Pick<HomePageProps, 'onDownload' | 'onInfo'> {
  /** The search and pill these shelves belong to; an expanded shelf is remembered under it. */
  searchKey: string
  query: string
  selectedPill: FilterType
  results: SearchResponse
  /** Play counts found for songs the All answer had none for (its Top result card), by song id. */
  songPlays: Record<string, string>
}

/**
 * The shelves of one search. Each starts with the server's first page and has its own "Show more",
 * which asks the category's own search for a longer list: the same one the pill runs. A shelf the
 * server could not load (All only) still shows, with a button that asks its category itself.
 */
function SearchResults({ searchKey, query, selectedPill, results, onDownload, onInfo, songPlays }: SearchResultsProps) {
  const isAll = selectedPill === 'all'
  const failed = failedShelves(results)
  const songs = useShowMore(searchKey, 'songs', results.tracks, looksAlike, limit => searchSongs(query, { limit }),
    isAll ? ALL_SONGS_SHOWN : PAGE, isAll ? ALL_SONGS_STEP : PAGE, false)
  const artists = useShowMore(searchKey, 'artists', results.artists, a => a.id, limit => searchArtists(query, { limit }),
    PAGE, PAGE, failed.includes('artists'))
  const albums = useShowMore(searchKey, 'albums', results.albums, looksAlike, limit => searchAlbums(query, { limit }),
    PAGE, PAGE, failed.includes('albums'))
  const playlists = useShowMore(searchKey, 'playlists', results.playlists, p => p.id, limit => searchPlaylists(query, { limit }),
    PAGE, PAGE, failed.includes('playlists'))
  const songList = useRef<HTMLDivElement>(null)
  useFocusFirstNew(songList, songs)

  // Standalone Albums / Artists / Playlists views wrap into a grid of double-size cards;
  // the mixed "All" view keeps the horizontally scrolling row of smaller cards.
  const isStandalone = !isAll && selectedPill !== 'songs'
  const cardLayout = isStandalone ? 'grid' : 'carousel'

  return (
    <main className="space-y-12">
      {/* Songs Section */}
      {(isAll || selectedPill === 'songs') && songs.shown.length > 0 && (
        <section>
          <h2 className="text-3xl font-bold text-white mb-6">Songs</h2>
          <div ref={songList} className="space-y-2">
            {songs.shown.map((track, index) => (
              <SongCard
                key={track.id || `song-${index}`}
                track={track.plays ? track : { ...track, plays: songPlays[track.id] ?? null }}
                artistNames={track.artists}
                onInfo={onInfo}
                onDownload={(downloadedTrack, artistNames) => void onDownload(downloadedTrack.id, 'SONG', {
                  youtubeId: downloadedTrack.id,
                  downloadType: 'SONG',
                  title: downloadedTrack.name,
                  artistNames,
                  // The albums in the same response are the only place a track's album name exists.
                  albumName: results.albums.find(a => a.id === downloadedTrack.albumId)?.name ?? null,
                  iconURL: downloadedTrack.iconURL || null,
                })}
              />
            ))}
          </div>
          {songs.hasMore && (
            <ShowMoreButton loading={songs.loading} failed={songs.failed} empty={false} onClick={songs.showMore}
              what="songs" place="below" />
          )}
          <ShelfStatus loading={songs.loading} failed={songs.failed} count={songs.shown.length} what="songs" />
        </section>
      )}

      {(isAll || selectedPill === 'artists') && (
        <CardShelf title="Artists" what="artists" shelf={artists} standalone={isStandalone} tile="round"
          unavailable={failed.includes('artists')}
          card={artist => <ArtistCard key={artist.id} artist={artist} layout={cardLayout} />} />
      )}

      {(isAll || selectedPill === 'albums') && (
        <CardShelf title="Albums" what="albums" shelf={albums} standalone={isStandalone} tile="square"
          unavailable={failed.includes('albums')}
          card={album => <AlbumCard key={album.id} item={album} kind="ALBUM" layout={cardLayout} />} />
      )}

      {(isAll || selectedPill === 'playlists') && (
        <CardShelf title="Playlists" what="playlists" shelf={playlists} standalone={isStandalone} tile="square"
          unavailable={failed.includes('playlists')}
          card={playlist => <AlbumCard key={playlist.id} item={playlist} kind="PLAYLIST" layout={cardLayout} />} />
      )}
    </main>
  )
}

interface CardShelfProps<T> {
  title: string
  what: string
  shelf: ShowMore<T>
  /** A pill's own grid rather than a row on All. */
  standalone: boolean
  tile: 'square' | 'round'
  /** The server could not load this shelf the first time (All only). */
  unavailable: boolean
  card: (item: T) => ReactNode
}

/**
 * An artists, albums or playlists shelf. In a scrolling row "Show more" is the last tile, where the
 * row runs out; under a grid, a button.
 */
function CardShelf<T>({ title, what, shelf, standalone, tile, unavailable, card }: CardShelfProps<T>) {
  const list = useRef<HTMLDivElement>(null)
  useFocusFirstNew(list, shelf)
  // Empty and nothing to ask for: no such shelf, unless it failed at first and asking again found
  // none, which is worth saying rather than leaving a blank where the "Try again" was.
  if (shelf.shown.length === 0 && !shelf.hasMore) {
    return unavailable ? (
      <section>
        <h2 className="text-3xl font-bold text-white mb-6">{title}</h2>
        <p role="status" className="text-zinc-500">No {what} found.</p>
      </section>
    ) : null
  }
  const button = shelf.hasMore && (
    <ShowMoreButton loading={shelf.loading} failed={shelf.failed} empty={shelf.shown.length === 0}
      onClick={shelf.showMore} what={what} place={standalone ? 'below' : tile} />
  )
  return (
    <section>
      <h2 className="text-3xl font-bold text-white mb-6">{title}</h2>
      <div ref={list} className={standalone ? GRID_CONTAINER : CAROUSEL_CONTAINER}>
        {shelf.shown.map(card)}
        {!standalone && button}
      </div>
      {standalone && button}
      <ShelfStatus loading={shelf.loading} failed={shelf.failed} count={shelf.shown.length} what={what} />
    </section>
  )
}
