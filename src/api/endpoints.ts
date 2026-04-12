import { apiClient } from './client'
import { SearchResponse, Track, Album, Artist } from './types'
import { getMockSearchResults } from './mockData'

// Toggle between mock and real API
const USE_MOCK_DATA = false


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

/**
 * Search albums only
 * GET /search/{query}/albums
 */
export async function searchAlbums(query: string): Promise<Album[]> {
  if (USE_MOCK_DATA) {
    console.log(`[Mock] searchAlbums called with query: ${query}`)
    const results = getMockSearchResults(query)
    return Promise.resolve(results.albums)
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
 * Download song by ID
 * GET /download/{songId}
 */
export async function download(songId: string): Promise<void> {
  return apiClient<void>(`/download/${encodeURIComponent(songId)}`)
}
