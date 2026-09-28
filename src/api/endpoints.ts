import { apiClient } from './client'
import {
  SearchResponse, Track, Album, Artist, Playlist, Download, DownloadType, ActiveDownloadsResponse,
  ActiveDownloadView, DownloadsByIdResponse, DownloadDetailView, AllDownloadsResponse,
  CollectionDetail, CollectionType, ArtistDetail, SongInfo, SuggestedPlaylist, SuggestedPlaylistsResponse,
  CuratorRun,
} from './types'
import {
  getMockSearchResults, getMockDownload, getMockActiveDownloads, getMockDownloadsByIds,
  getMockDownloadDetail, getMockAllDownloads, getMockCollection, getMockArtist, getMockSongInfo,
  getMockSuggestedPlaylists, getMockSuggestedPlaylist, requestMockSuggestedRefresh, getMockSuggestedRefresh,
} from './mockData'

// Toggle between mock and real API
export const USE_MOCK_DATA = false

/** How long a search result or a page (album, artist, playlist, song info) is reused for the same
 *  address: long enough for a browse and a Back, short enough that this week's new edition shows up
 *  in the same sitting. Downloads endpoints are not kept at all; their data has to stay live. */
const BROWSE_CACHE_MS = 5 * 60 * 1000

/** `fresh` asks the server again instead of reusing a kept answer: "Try again" and a repeated search. */
type Freshness = { fresh?: boolean }


/**
 * Search all (songs, albums, artists, playlists)
 * GET /search/{query}
 */
export async function search(query: string, opts?: Freshness): Promise<SearchResponse> {
  if (USE_MOCK_DATA) {
    console.log(`[Mock] search called with query: ${query}`)
    return Promise.resolve(getMockSearchResults(query))
  }
  const data = await apiClient<SearchResponse>(`/search/${encodeURIComponent(query)}`, { ...opts, cacheMs: BROWSE_CACHE_MS })
  // Tolerate a server that predates playlists in the mixed response.
  return { ...data, playlists: data.playlists ?? [] }
}

/**
 * Search songs only
 * GET /search/{query}/tracks
 */
export async function searchSongs(query: string, opts?: Freshness): Promise<Track[]> {
  if (USE_MOCK_DATA) {
    console.log(`[Mock] searchSongs called with query: ${query}`)
    const results = getMockSearchResults(query)
    return Promise.resolve(results.tracks)
  }
  return (await apiClient<SearchResponse>(`/search/${encodeURIComponent(query)}/tracks`, { ...opts, cacheMs: BROWSE_CACHE_MS })).tracks
}

/**
 * Search albums only
 * GET /search/{query}/albums
 */
export async function searchAlbums(query: string, opts?: Freshness): Promise<Album[]> {
  if (USE_MOCK_DATA) {
    console.log(`[Mock] searchAlbums called with query: ${query}`)
    return Promise.resolve(getMockSearchResults(query).albums)
  }
  return (await apiClient<SearchResponse>(`/search/${encodeURIComponent(query)}/albums`, { ...opts, cacheMs: BROWSE_CACHE_MS })).albums
}

/**
 * Search artists only
 * GET /search/{query}/artists
 */
export async function searchArtists(query: string, opts?: Freshness): Promise<Artist[]> {
  if (USE_MOCK_DATA) {
    console.log(`[Mock] searchArtists called with query: ${query}`)
    const results = getMockSearchResults(query)
    return Promise.resolve(results.artists)
  }
  return (await apiClient<SearchResponse>(`/search/${encodeURIComponent(query)}/artists`, { ...opts, cacheMs: BROWSE_CACHE_MS })).artists
}

/**
 * Search playlists only
 * GET /search/{query}/playlists
 */
export async function searchPlaylists(query: string, opts?: Freshness): Promise<Playlist[]> {
  if (USE_MOCK_DATA) {
    console.log(`[Mock] searchPlaylists called with query: ${query}`)
    return Promise.resolve(getMockSearchResults(query).playlists)
  }
  const data = await apiClient<SearchResponse>(`/search/${encodeURIComponent(query)}/playlists`, { ...opts, cacheMs: BROWSE_CACHE_MS })
  return data.playlists ?? []
}

/**
 * Expand an album or playlist to its tracks
 * GET /collections/{id}?type=ALBUM|PLAYLIST
 *
 * `id` must be the same id later posted to downloadCollection: the server keys the download by it.
 */
export async function getCollection(id: string, type: CollectionType, opts?: Freshness): Promise<CollectionDetail> {
  if (USE_MOCK_DATA) {
    console.log(`[Mock] getCollection called with id: ${id}, type: ${type}`)
    return Promise.resolve(getMockCollection(id, type))
  }
  return apiClient<CollectionDetail>(`/collections/${encodeURIComponent(id)}?type=${type}`, { ...opts, cacheMs: BROWSE_CACHE_MS })
}

/**
 * An artist's page: header, top songs, albums, singles, playlists, similar artists
 * GET /artists/{channelId}  (404 for an id the adapter does not know)
 */
export async function getArtist(id: string, opts?: Freshness): Promise<ArtistDetail> {
  if (USE_MOCK_DATA) {
    console.log(`[Mock] getArtist called with id: ${id}`)
    return Promise.resolve(getMockArtist(id))
  }
  return apiClient<ArtistDetail>(`/artists/${encodeURIComponent(id)}`, { ...opts, cacheMs: BROWSE_CACHE_MS })
}

/**
 * One song's info page: header, album, numbers and credits
 * GET /songs/{videoId}  (404 for an id YouTube Music does not know)
 */
export async function getSongInfo(id: string, opts?: Freshness): Promise<SongInfo> {
  if (USE_MOCK_DATA) {
    console.log(`[Mock] getSongInfo called with id: ${id}`)
    return Promise.resolve(getMockSongInfo(id))
  }
  return apiClient<SongInfo>(`/songs/${encodeURIComponent(id)}`, { ...opts, cacheMs: BROWSE_CACHE_MS })
}

/**
 * The playlist curator's latest edition per category - what the "Made for you" shelf shows
 * GET /suggested-playlists
 */
export async function getSuggestedPlaylists(signal?: AbortSignal, opts?: Freshness): Promise<SuggestedPlaylistsResponse> {
  if (USE_MOCK_DATA) return Promise.resolve(getMockSuggestedPlaylists())
  const data = await apiClient<SuggestedPlaylistsResponse>('/suggested-playlists', { ...opts, signal, cacheMs: BROWSE_CACHE_MS })
  // apiClient returns `undefined` for a non-JSON (e.g. empty) response body.
  return data ?? { enabled: false, refreshDay: null, playlists: [] }
}

/**
 * One suggested playlist with every song
 * GET /suggested-playlists/{category}  (404 before the first edition; 503 on a server with no curator)
 */
export async function getSuggestedPlaylist(category: string, opts?: Freshness): Promise<SuggestedPlaylist> {
  if (USE_MOCK_DATA) return Promise.resolve(getMockSuggestedPlaylist(category))
  return apiClient<SuggestedPlaylist>(`/suggested-playlists/${encodeURIComponent(category)}`, { ...opts, cacheMs: BROWSE_CACHE_MS })
}

/**
 * "Make this week's playlists now": asks the server to run the curator. Answers at once with the run;
 * asking during a run returns that run.
 * POST /suggested-playlists/refresh  (503 on a server with no curator)
 */
export async function requestSuggestedRefresh(): Promise<CuratorRun> {
  if (USE_MOCK_DATA) return Promise.resolve(requestMockSuggestedRefresh())
  return apiClient<CuratorRun>('/suggested-playlists/refresh', { method: 'POST' })
}

/**
 * The most recent curator run, to follow one in progress
 * GET /suggested-playlists/refresh  (404 when the curator never ran)
 */
export async function getSuggestedRefresh(signal?: AbortSignal): Promise<CuratorRun> {
  if (USE_MOCK_DATA) return Promise.resolve(getMockSuggestedRefresh())
  return apiClient<CuratorRun>('/suggested-playlists/refresh', { signal })
}

/**
 * Download one song by YouTube videoId
 * POST /download/song/{videoId}
 */
export async function downloadSong(videoId: string): Promise<Download> {
  if (USE_MOCK_DATA) {
    console.log(`[Mock] downloadSong called with videoId: ${videoId}`)
    return Promise.resolve(getMockDownload(videoId, 'SONG'))
  }
  return apiClient<Download>(`/download/song/${encodeURIComponent(videoId)}`, { method: 'POST' })
}

/**
 * Download every track of an album or playlist, or every song of a suggested playlist's edition
 * POST /download/collection/{id}?type=ALBUM|PLAYLIST|CURATED
 *
 * For CURATED, `id` is the curator's category key, the same one GET /suggested-playlists/{category} takes.
 */
export async function downloadCollection(id: string, type: Exclude<DownloadType, 'SONG'>): Promise<Download> {
  if (USE_MOCK_DATA) {
    console.log(`[Mock] downloadCollection called with id: ${id}, type: ${type}`)
    return Promise.resolve(getMockDownload(id, type))
  }
  return apiClient<Download>(
    `/download/collection/${encodeURIComponent(id)}?type=${type}`, { method: 'POST' })
}

/**
 * One download with its per-song breakdown
 * GET /downloads/{id}  (404 for an unknown id; `songs` is [] before admission)
 */
export async function getDownloadDetail(
  downloadId: string,
  signal?: AbortSignal,
): Promise<DownloadDetailView> {
  if (USE_MOCK_DATA) return Promise.resolve(getMockDownloadDetail(downloadId))
  return apiClient<DownloadDetailView>(`/downloads/${encodeURIComponent(downloadId)}`, { signal })
}

/**
 * Active (non-terminal, plus recently-finished) downloads
 * GET /downloads/active
 */
export async function getActiveDownloads(signal?: AbortSignal): Promise<ActiveDownloadsResponse> {
  if (USE_MOCK_DATA) {
    return Promise.resolve(getMockActiveDownloads())
  }
  const data = await apiClient<ActiveDownloadsResponse>('/downloads/active', { signal })
  // apiClient returns `undefined` for a non-JSON (e.g. empty) response body.
  return data ?? { pollIntervalMs: 5000, terminalRetentionMs: 600000, downloads: [] }
}

/** Server-side cap on GET /downloads?ids= */
const RESOLVE_CHUNK = 100

/**
 * Resolve specific downloads by id, ignoring both the terminal filter and the retention window.
 * GET /downloads?ids=a,b,c
 *
 * This is how a client that was closed for an hour finds out what happened to the cards it kept:
 * their outcomes have long since aged out of /downloads/active, and without asking directly the
 * client can only guess between "finished while I was gone" and "still running". An id that comes
 * back absent has no row on the server at all, which is the one signal that justifies dropping a
 * card the user never dismissed.
 */
export async function resolveDownloads(
  ids: string[],
  signal?: AbortSignal,
): Promise<ActiveDownloadView[]> {
  if (ids.length === 0) return []
  if (USE_MOCK_DATA) return getMockDownloadsByIds(ids)

  const chunks: string[][] = []
  for (let i = 0; i < ids.length; i += RESOLVE_CHUNK) {
    chunks.push(ids.slice(i, i + RESOLVE_CHUNK))
  }
  const responses = await Promise.all(chunks.map(chunk =>
    apiClient<DownloadsByIdResponse>(
      `/downloads?ids=${chunk.map(encodeURIComponent).join(',')}`, { signal })))
  return responses.flatMap(r => r?.downloads ?? [])
}

/** Server-side default page size for GET /downloads/all. */
export const DEFAULT_DOWNLOADS_PAGE_SIZE = 20
/** Server-side default page for GET /downloads/all. 1-based: page 1 is the first page, not page 0. */
export const FIRST_DOWNLOADS_PAGE = 1

/**
 * Every download the server knows about, newest first, ignoring both the terminal filter and the
 * retention window - the Downloads page's seed, as opposed to /downloads/active's live window.
 * GET /downloads/all?pageSize=&pageNumber=
 *
 * Both query params are required server-side, so they are always sent, even when the caller wants
 * the server's own defaults - `pageNumber` is 1-based.
 */
export async function getAllDownloads(
  page?: { pageSize?: number; pageNumber?: number },
  signal?: AbortSignal,
): Promise<AllDownloadsResponse> {
  const pageSize = page?.pageSize ?? DEFAULT_DOWNLOADS_PAGE_SIZE
  const pageNumber = page?.pageNumber ?? FIRST_DOWNLOADS_PAGE
  if (USE_MOCK_DATA) return getMockAllDownloads(pageSize, pageNumber)
  const data = await apiClient<AllDownloadsResponse>(
    `/downloads/all?pageSize=${pageSize}&pageNumber=${pageNumber}`, { signal })
  // apiClient returns `undefined` for a non-JSON (e.g. empty) response body.
  return data ?? { downloads: [], totalPages: 0 }
}
