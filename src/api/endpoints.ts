import { apiClient } from './client'
import { SearchResponse, Song, Album, Artist } from './types'
import { getMockSearchResults } from './mockData'

// Toggle between mock and real API
const USE_MOCK_DATA = true

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
 * GET /search/{query}/songs
 */
export async function searchSongs(query: string): Promise<Song[]> {
  if (USE_MOCK_DATA) {
    console.log(`[Mock] searchSongs called with query: ${query}`)
    const results = getMockSearchResults(query)
    return Promise.resolve(results.songs)
  }
  return apiClient<Song[]>(`/search/${encodeURIComponent(query)}/songs`)
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
  return apiClient<Album[]>(`/search/${encodeURIComponent(query)}/albums`)
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
  return apiClient<Artist[]>(`/search/${encodeURIComponent(query)}/artists`)
}

/**
 * Download song by ID
 * GET /download/{songId}
 */
export async function download(songId: string): Promise<void> {
  return apiClient<void>(`/download/${encodeURIComponent(songId)}`)
}
