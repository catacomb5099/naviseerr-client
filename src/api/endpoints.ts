import { apiClient } from './client'
import {
  SearchResponse, Track, Album, Artist, Playlist, Download, ActiveDownloadsResponse,
  ActiveDownloadView, DownloadsByIdResponse, DownloadDetailView, AllDownloadsResponse,
  CollectionDetail, CollectionType,
} from './types'
import {
  getMockSearchResults, getMockDownload, getMockActiveDownloads, getMockDownloadsByIds,
  getMockDownloadDetail, getMockAllDownloads, getMockCollection,
} from './mockData'

// Toggle between mock and real API
export const USE_MOCK_DATA = false


/**
 * Search all (songs, albums, artists, playlists)
 * GET /search/{query}
 */
export async function search(query: string): Promise<SearchResponse> {
  if (USE_MOCK_DATA) {
    console.log(`[Mock] search called with query: ${query}`)
    return Promise.resolve(getMockSearchResults(query))
  }
  const data = await apiClient<SearchResponse>(`/search/${encodeURIComponent(query)}`)
  // Tolerate a server that predates playlists in the mixed response.
  return { ...data, playlists: data.playlists ?? [] }
}

/**
 * Search songs only
 * GET /search/{query}/tracks
 */
export async function searchSongs(query: string): Promise<Track[]> {
  if (USE_MOCK_DATA) {
    console.log(`[Mock] searchSongs called with query: ${query}`)
    const results = getMockSearchResults(query)
    return Promise.resolve(results.tracks)
  }
  return (await apiClient<SearchResponse>(`/search/${encodeURIComponent(query)}/tracks`)).tracks
}

/**
 * Search albums only
 * GET /search/{query}/albums
 */
export async function searchAlbums(query: string): Promise<Album[]> {
  if (USE_MOCK_DATA) {
    console.log(`[Mock] searchAlbums called with query: ${query}`)
    return Promise.resolve(getMockSearchResults(query).albums)
  }
  return (await apiClient<SearchResponse>(`/search/${encodeURIComponent(query)}/albums`)).albums
}

/**
 * Search artists only
 * GET /search/{query}/artists
 */
export async function searchArtists(query: string): Promise<Artist[]> {
  if (USE_MOCK_DATA) {
    console.log(`[Mock] searchArtists called with query: ${query}`)
    const results = getMockSearchResults(query)
    return Promise.resolve(results.artists)
  }
  return (await apiClient<SearchResponse>(`/search/${encodeURIComponent(query)}/artists`)).artists
}

/**
 * Search playlists only
 * GET /search/{query}/playlists
 */
export async function searchPlaylists(query: string): Promise<Playlist[]> {
  if (USE_MOCK_DATA) {
    console.log(`[Mock] searchPlaylists called with query: ${query}`)
    return Promise.resolve(getMockSearchResults(query).playlists)
  }
  const data = await apiClient<SearchResponse>(`/search/${encodeURIComponent(query)}/playlists`)
  return data.playlists ?? []
}

/**
 * Expand an album or playlist to its tracks
 * GET /collections/{id}?type=ALBUM|PLAYLIST
 *
 * `id` must be the same id later posted to downloadCollection: the server keys the download by it.
 */
export async function getCollection(id: string, type: CollectionType): Promise<CollectionDetail> {
  if (USE_MOCK_DATA) {
    console.log(`[Mock] getCollection called with id: ${id}, type: ${type}`)
    return Promise.resolve(getMockCollection(id, type))
  }
  return apiClient<CollectionDetail>(`/collections/${encodeURIComponent(id)}?type=${type}`)
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
 * Download every track of an album or playlist
 * POST /download/collection/{id}?type=ALBUM|PLAYLIST
 */
export async function downloadCollection(id: string, type: CollectionType): Promise<Download> {
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
