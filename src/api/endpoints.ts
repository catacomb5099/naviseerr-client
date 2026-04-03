import { apiClient } from './client'
import { SearchResponse, Song, Album, Artist } from './types'

/**
 * Search all (songs, albums, artists)
 * GET /search/{query}
 */
export async function search(query: string): Promise<SearchResponse> {
  return apiClient<SearchResponse>(`/search/${encodeURIComponent(query)}`)
}

/**
 * Search songs only (future endpoint - mocked for now)
 * GET /search/{query}/songs
 */
export async function searchSongs(query: string): Promise<Song[]> {
  // Mock implementation - return empty array until backend is ready
  console.log(`[Mock] searchSongs called with query: ${query}`)
  return Promise.resolve([])
}

/**
 * Search albums only (future endpoint - mocked for now)
 * GET /search/{query}/albums
 */
export async function searchAlbums(query: string): Promise<Album[]> {
  // Mock implementation - return empty array until backend is ready
  console.log(`[Mock] searchAlbums called with query: ${query}`)
  return Promise.resolve([])
}

/**
 * Search artists only (future endpoint - mocked for now)
 * GET /search/{query}/artists
 */
export async function searchArtists(query: string): Promise<Artist[]> {
  // Mock implementation - return empty array until backend is ready
  console.log(`[Mock] searchArtists called with query: ${query}`)
  return Promise.resolve([])
}

/**
 * Download song by ID
 * GET /download/{songId}
 */
export async function download(songId: string): Promise<void> {
  return apiClient<void>(`/download/${encodeURIComponent(songId)}`)
}
