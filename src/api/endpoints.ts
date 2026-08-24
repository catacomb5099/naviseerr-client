import { apiClient } from './client'
import { SearchResponse, Track, Artist, Download, ActiveDownloadsResponse } from './types'
import { getMockSearchResults, getMockDownload, getMockActiveDownloads } from './mockData'

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
  return data ?? { pollIntervalMs: 5000, downloads: [] }
}
