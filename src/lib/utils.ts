import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import { Artist } from '../api/types'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Resolve artist IDs to artist names
 * @param artistIds - Array of artist IDs
 * @param artists - Array of all artists from search results
 * @returns Array of artist names
 */
export function getArtistNames(artistIds: string[], artists: Artist[]): string[] {
  const artistMap = new Map(artists.map(a => [a.id, a.name]))
  return artistIds.map(id => artistMap.get(id) || 'Unknown Artist')
}

/** "3:05" - a track length. Floors the seconds too: the server can send fractional durations. */
export function formatDuration(seconds: number): string {
  return `${Math.floor(seconds / 60)}:${String(Math.floor(seconds % 60)).padStart(2, '0')}`
}
