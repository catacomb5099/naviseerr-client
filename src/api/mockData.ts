import { Track, Album, Artist, SearchResponse } from './types'

/**
 * Mock data based on Last.fm API response for "jay sean"
 * Used for testing when backend is not available
 */

export const mockArtists: Artist[] = [
  {
    id: 'artist-1',
    iconUrl: 'https://lastfm.freetls.fastly.net/i/u/300x300/2a96cbd8b46e442fc41c2b86b821562f.png',
    name: 'Jay Sean'
  },
  {
    id: 'artist-2',
    iconUrl: 'https://lastfm.freetls.fastly.net/i/u/300x300/2a96cbd8b46e442fc41c2b86b821562f.png',
    name: 'Lil Wayne'
  },
  {
    id: 'artist-3',
    iconUrl: 'https://lastfm.freetls.fastly.net/i/u/300x300/2a96cbd8b46e442fc41c2b86b821562f.png',
    name: 'Sean Paul'
  }
]

export const mockAlbums: Album[] = [
  {
    id: 'album-1',
    iconURL: 'https://lastfm.freetls.fastly.net/i/u/300x300/2a96cbd8b46e442fc41c2b86b821562f.png',
    name: 'All or Nothing',
    artists: ['artist-1'], // Jay Sean
    year: 2009
  },
  {
    id: 'album-2',
    iconURL: 'https://lastfm.freetls.fastly.net/i/u/300x300/2a96cbd8b46e442fc41c2b86b821562f.png',
    name: 'My Own Way',
    artists: ['artist-1'], // Jay Sean
    year: 2008
  },
  {
    id: 'album-3',
    iconURL: 'https://lastfm.freetls.fastly.net/i/u/300x300/2a96cbd8b46e442fc41c2b86b821562f.png',
    name: 'Neon',
    artists: ['artist-1'], // Jay Sean
    year: 2013
  },
  {
    id: 'album-4',
    iconURL: 'https://lastfm.freetls.fastly.net/i/u/300x300/2a96cbd8b46e442fc41c2b86b821562f.png',
    name: 'Me Against Myself',
    artists: ['artist-1'], // Jay Sean
    year: 2004
  }
]

export const mockTracks: Track[] = [
  {
    id: 'song-1',
    iconURL: 'https://lastfm.freetls.fastly.net/i/u/300x300/2a96cbd8b46e442fc41c2b86b821562f.png',
    streamURL: 'https://www.last.fm/music/Jay+Sean/_/Down',
    name: 'Down',
    artists: ['artist-1', 'artist-2'], // Jay Sean, Lil Wayne
    albumId: 'album-1',
    year: 2009
  },
  {
    id: 'song-2',
    iconURL: 'https://lastfm.freetls.fastly.net/i/u/300x300/2a96cbd8b46e442fc41c2b86b821562f.png',
    streamURL: 'https://www.last.fm/music/Jay+Sean/_/Ride+It',
    name: 'Ride It',
    artists: ['artist-1'], // Jay Sean
    albumId: 'album-2',
    year: 2008
  },
  {
    id: 'song-3',
    iconURL: 'https://lastfm.freetls.fastly.net/i/u/300x300/2a96cbd8b46e442fc41c2b86b821562f.png',
    streamURL: 'https://www.last.fm/music/Jay+Sean/_/Do+You+Remember',
    name: 'Do You Remember',
    artists: ['artist-1', 'artist-3'], // Jay Sean, Sean Paul
    albumId: 'album-1',
    year: 2009
  },
  {
    id: 'song-4',
    iconURL: 'https://lastfm.freetls.fastly.net/i/u/300x300/2a96cbd8b46e442fc41c2b86b821562f.png',
    streamURL: 'https://www.last.fm/music/Jay+Sean/_/Maybe',
    name: 'Maybe',
    artists: ['artist-1'], // Jay Sean
    albumId: 'album-4',
    year: 2004
  },
  {
    id: 'song-5',
    iconURL: 'https://lastfm.freetls.fastly.net/i/u/300x300/2a96cbd8b46e442fc41c2b86b821562f.png',
    streamURL: 'https://www.last.fm/music/Jay+Sean/_/Stay',
    name: 'Stay',
    artists: ['artist-1'], // Jay Sean
    albumId: 'album-4',
    year: 2004
  },
  {
    id: 'song-6',
    iconURL: 'https://lastfm.freetls.fastly.net/i/u/300x300/2a96cbd8b46e442fc41c2b86b821562f.png',
    streamURL: 'https://www.last.fm/music/Jay+Sean/_/Tonight',
    name: 'Tonight',
    artists: ['artist-1'], // Jay Sean
    albumId: 'album-1',
    year: 2009
  },
  {
    id: 'song-7',
    iconURL: 'https://lastfm.freetls.fastly.net/i/u/300x300/2a96cbd8b46e442fc41c2b86b821562f.png',
    streamURL: 'https://www.last.fm/music/Jay+Sean/_/Cry',
    name: 'Cry',
    artists: ['artist-1'], // Jay Sean
    albumId: 'album-1',
    year: 2009
  },
  {
    id: 'song-8',
    iconURL: 'https://lastfm.freetls.fastly.net/i/u/300x300/2a96cbd8b46e442fc41c2b86b821562f.png',
    streamURL: 'https://www.last.fm/music/Jay+Sean/_/War',
    name: 'War',
    artists: ['artist-1'], // Jay Sean
    albumId: 'album-3',
    year: 2013
  },
  {
    id: 'song-9',
    iconURL: 'https://lastfm.freetls.fastly.net/i/u/300x300/2a96cbd8b46e442fc41c2b86b821562f.png',
    streamURL: 'https://www.last.fm/music/Jay+Sean/_/Fire',
    name: 'Fire',
    artists: ['artist-1'], // Jay Sean
    albumId: 'album-3',
    year: 2013
  },
  {
    id: 'song-10',
    iconURL: 'https://lastfm.freetls.fastly.net/i/u/300x300/2a96cbd8b46e442fc41c2b86b821562f.png',
    streamURL: 'https://www.last.fm/music/Jay+Sean/_/2012+(It+Ain%27t+the+End)',
    name: "2012 (It Ain't the End)",
    artists: ['artist-1'], // Jay Sean
    albumId: 'album-3',
    year: 2013
  }
]


export const mockSearchResponse: SearchResponse = {
  tracks: mockTracks,
  albums: mockAlbums,
  artists: mockArtists
}

/**
 * Get mock data that matches a query (case-insensitive search)
 */
export function getMockSearchResults(query: string): SearchResponse {
  const lowerQuery = query.toLowerCase()

  // Filter results based on query
  const filteredTracks = mockTracks.filter(track =>
    track.name.toLowerCase().includes(lowerQuery) ||
    mockArtists.some(artist =>
      track.artists.includes(artist.id) &&
      artist.name.toLowerCase().includes(lowerQuery)
    )
  )

  const filteredAlbums = mockAlbums.filter(album =>
    album.name.toLowerCase().includes(lowerQuery) ||
    mockArtists.some(artist =>
      album.artists.includes(artist.id) &&
      artist.name.toLowerCase().includes(lowerQuery)
    )
  )

  const filteredArtists = mockArtists.filter(artist =>
    artist.name.toLowerCase().includes(lowerQuery)
  )

  return {
    tracks: filteredTracks,
    albums: filteredAlbums,
    artists: filteredArtists
  }
}

// --- Mock active-downloads simulator -----------------------------------
// The real backend has no artificial latency either, but its progress is
// driven by real transfer time. Here we fake that by deriving state purely
// from elapsed time since the mock download was requested, so repeated
// polls (getMockActiveDownloads) see a believable progression instead of
// jumping straight from 0 to 100.

interface MockDownloadEntry {
  downloadId: string
  songName: string
  createdAt: number
  outcome: 'SUCCEEDED' | 'FAILED'
}

const mockDownloads = new Map<string, MockDownloadEntry>()

const MOCK_SEARCH_MS = 2500
const MOCK_TRANSFER_MS = 9000
const MOCK_RESET_AT_MS = MOCK_SEARCH_MS + 4000 // one simulated retry mid-transfer
const MOCK_RETENTION_MS = 20000 // how long a terminal row keeps appearing

function randomId(): string {
  return 'mock-dl-' + Math.random().toString(36).slice(2, 10)
}

export function getMockDownload(songId: string): import('./types').Download {
  const downloadId = randomId()
  mockDownloads.set(downloadId, {
    downloadId,
    songName: songId,
    createdAt: Date.now(),
    // ~80% succeed, so failures are visible but not the common case
    outcome: Math.random() < 0.8 ? 'SUCCEEDED' : 'FAILED',
  })
  return {
    downloadId,
    songName: songId,
    status: 'PENDING',
    createdAt: new Date().toISOString(),
  }
}

export function getMockActiveDownloads(): import('./types').ActiveDownloadsResponse {
  const now = Date.now()
  const downloads: import('./types').ActiveDownloadView[] = []

  for (const [downloadId, entry] of mockDownloads) {
    const elapsed = now - entry.createdAt
    const phaseEnteredAt = new Date(entry.createdAt).toISOString()

    if (elapsed < MOCK_SEARCH_MS) {
      downloads.push({
        downloadId,
        songName: entry.songName,
        status: 'PENDING',
        progressPercent: null,
        phaseEnteredAt,
      })
      continue
    }

    const transferElapsed = elapsed - MOCK_SEARCH_MS
    if (transferElapsed < MOCK_TRANSFER_MS) {
      const sinceReset = elapsed > MOCK_RESET_AT_MS ? elapsed - MOCK_RESET_AT_MS : transferElapsed
      const pct = Math.min(99, (sinceReset / MOCK_TRANSFER_MS) * 100)
      downloads.push({
        downloadId,
        songName: entry.songName,
        status: 'IN_PROGRESS',
        progressPercent: Math.round(pct * 100) / 100,
        phaseEnteredAt: new Date(entry.createdAt + MOCK_SEARCH_MS).toISOString(),
      })
      continue
    }

    const terminalElapsed = transferElapsed - MOCK_TRANSFER_MS
    if (terminalElapsed < MOCK_RETENTION_MS) {
      downloads.push({
        downloadId,
        songName: entry.songName,
        status: entry.outcome,
        progressPercent: entry.outcome === 'SUCCEEDED' ? 100 : 87,
        phaseEnteredAt: new Date(entry.createdAt + MOCK_SEARCH_MS + MOCK_TRANSFER_MS).toISOString(),
      })
    } else {
      mockDownloads.delete(downloadId)
    }
  }

  return { pollIntervalMs: 5000, downloads }
}
