import { apiClient } from './client'
import {
  SearchResponse, Track, Artist, Download, ActiveDownloadsResponse, ActiveDownloadView,
  DownloadsByIdResponse,
} from './types'
import {
  getMockSearchResults, getMockDownload, getMockActiveDownloads, getMockDownloadsByIds,
} from './mockData'

// Toggle between mock and real API
export const USE_MOCK_DATA = false


/**
 * Search all (songs, albums, artists)
 * GET /search/{query}
 */
export async function search(query: string): Promise<SearchResponse> {
  if (USE_MOCK_DATA) {
    console.log(`[Mock] search called with query: ${query}`)
    return Promise.resolve(getMockSearchResults(query))
  }
  return apiClient<SearchResponse>(`/search/${encodeURIComponent(query)}`)
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

/** Albums plus the artists needed to resolve their artist IDs to names. */
export type AlbumResults = Pick<SearchResponse, 'albums' | 'artists'>

/**
 * Search albums only
 * GET /search/{query}/albums
 */
export async function searchAlbums(query: string): Promise<AlbumResults> {
  if (USE_MOCK_DATA) {
    console.log(`[Mock] searchAlbums called with query: ${query}`)
    const results = getMockSearchResults(query)
    return Promise.resolve({ albums: results.albums, artists: results.artists })
  }
  const data = await apiClient<SearchResponse>(`/search/${encodeURIComponent(query)}/albums`)
  // Keep the artists from the same response: album.artists holds IDs, and the
  // cards need this list to resolve them to names.
  return { albums: data.albums, artists: data.artists ?? [] }
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
 * Download song by ID
 * POST /download/{songId}
 */
export async function download(songId: string): Promise<Download> {
  if (USE_MOCK_DATA) {
    console.log(`[Mock] download called with songId: ${songId}`)
    return Promise.resolve(getMockDownload(songId))
  }
  return apiClient<Download>(`/download/${encodeURIComponent(songId)}`, {
    method: 'POST',
  })
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
