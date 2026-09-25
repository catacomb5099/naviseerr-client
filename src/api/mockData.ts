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
// State is derived purely from elapsed time since the mock download was requested, so repeated
// polls see a believable progression rather than jumping straight from 0 to 100. It walks every
// stage the real server can report, including the two that only show up under load (QUEUED, waiting
// for admission; READY_TO_DOWNLOAD, waiting for a transfer slot) and one mid-transfer failover.
//
// Entries are never deleted. The retention window is applied when building the /downloads/active
// response, not to this map, so getMockDownloadsByIds can still resolve a download that has aged
// out of the feed -- which is the whole behaviour the startup reconciliation depends on.

import type {
  ActiveDownloadsResponse, ActiveDownloadView, AllDownloadsResponse, Download,
  DownloadFailureCode, DownloadStage,
} from './types'

interface MockDownloadEntry {
  downloadId: string
  songName: string
  createdAt: number
  outcome: 'SUCCEEDED' | 'FAILED'
  failureCode: DownloadFailureCode
}

// Persisted, because the simulator has to survive a page reload to be worth anything: the client
// behaviours most worth exercising -- cards restored from a snapshot, startup reconciliation, a
// download that finished while the app was closed -- are all reload-crossing by definition. An
// in-memory map makes every reload look like a server that lost its database.
const MOCK_STORAGE_KEY = 'naviseerr.mock.downloads.v1'

function loadMockDownloads(): Map<string, MockDownloadEntry> {
  try {
    const raw = localStorage.getItem(MOCK_STORAGE_KEY)
    if (!raw) return new Map()
    return new Map(JSON.parse(raw) as [string, MockDownloadEntry][])
  } catch {
    return new Map()
  }
}

const mockDownloads = loadMockDownloads()

function persistMockDownloads() {
  try {
    localStorage.setItem(MOCK_STORAGE_KEY, JSON.stringify(Array.from(mockDownloads)))
  } catch {
    // best effort - the simulator degrades to in-memory
  }
}

// Cumulative stage boundaries, ms since the request. Every stage is wider than one poll interval on
// purpose: the point of the simulator is that a manual pass through it actually SEES each stage,
// which a faithful copy of the server's timings would not give you (the real STARTING phase lasts
// one loop tick).
const T_QUEUED_END = 1500
const T_STARTING_END = 3000
const T_SEARCHING_END = 7000
const T_READY_END = 9000
const T_TRANSFER_MS = 12000
const T_FINISHED = T_READY_END + T_TRANSFER_MS

// One simulated candidate failover: the transfer drops back to READY_TO_DOWNLOAD for a beat, then
// restarts from 0%. Both the backwards stage and the backwards percentage are real events the
// client must render without removing or freezing the card.
const T_FAILOVER_AT = T_READY_END + 5000
const T_FAILOVER_MS = 1500

const MOCK_RETENTION_MS = 20000
// Faster than the real server's 5s so the stages above are each observable. The client takes this
// from the response, so it also proves the client is not hardcoding an interval.
const MOCK_POLL_INTERVAL_MS = 1000

const FAILURE_CODES: DownloadFailureCode[] = [
  'NO_CANDIDATES', 'SOURCES_EXHAUSTED', 'TIMED_OUT', 'SEARCH_FAILED', 'TRANSFER_NOT_FOUND',
]

function randomId(): string {
  return 'mock-dl-' + Math.random().toString(36).slice(2, 10)
}

function iso(ms: number): string {
  return new Date(ms).toISOString()
}

export function getMockDownload(songId: string): Download {
  const downloadId = randomId()
  mockDownloads.set(downloadId, {
    downloadId,
    songName: songId,
    createdAt: Date.now(),
    // ~80% succeed, so failures are visible but not the common case
    outcome: Math.random() < 0.8 ? 'SUCCEEDED' : 'FAILED',
    failureCode: FAILURE_CODES[Math.floor(Math.random() * FAILURE_CODES.length)],
  })
  persistMockDownloads()
  return {
    downloadId,
    songName: songId,
    status: 'PENDING',
    createdAt: new Date().toISOString(),
  }
}

/** Where this download is right now, and when that stage began. */
function stageAt(entry: MockDownloadEntry, now: number): {
  stage: DownloadStage
  progressPercent: number | null
  stageEnteredAt: number
} {
  const elapsed = now - entry.createdAt

  if (elapsed < T_QUEUED_END) {
    return { stage: 'QUEUED', progressPercent: null, stageEnteredAt: entry.createdAt }
  }
  if (elapsed < T_STARTING_END) {
    return { stage: 'STARTING', progressPercent: null, stageEnteredAt: entry.createdAt + T_QUEUED_END }
  }
  if (elapsed < T_SEARCHING_END) {
    return {
      stage: 'SEARCHING', progressPercent: null,
      stageEnteredAt: entry.createdAt + T_STARTING_END,
    }
  }
  if (elapsed < T_READY_END) {
    return {
      stage: 'READY_TO_DOWNLOAD', progressPercent: null,
      stageEnteredAt: entry.createdAt + T_SEARCHING_END,
    }
  }
  if (elapsed < T_FINISHED) {
    // The failover: back to waiting for a slot, then transferring again from zero.
    if (elapsed >= T_FAILOVER_AT && elapsed < T_FAILOVER_AT + T_FAILOVER_MS) {
      return {
        stage: 'READY_TO_DOWNLOAD', progressPercent: null,
        stageEnteredAt: entry.createdAt + T_FAILOVER_AT,
      }
    }
    const restartedAt = elapsed >= T_FAILOVER_AT
      ? T_FAILOVER_AT + T_FAILOVER_MS
      : T_READY_END
    const pct = Math.min(99, ((elapsed - restartedAt) / T_TRANSFER_MS) * 100)
    return {
      stage: 'DOWNLOADING',
      progressPercent: Math.round(Math.max(0, pct) * 100) / 100,
      stageEnteredAt: entry.createdAt + restartedAt,
    }
  }
  return {
    stage: entry.outcome,
    // A succeeded download reads 100; a failed one keeps its last observed value, matching the
    // server's own decision not to force FAILED to either end of the bar.
    progressPercent: entry.outcome === 'SUCCEEDED' ? 100 : 87,
    stageEnteredAt: entry.createdAt + T_FINISHED,
  }
}

function toView(entry: MockDownloadEntry, now: number): ActiveDownloadView {
  const { stage, progressPercent, stageEnteredAt } = stageAt(entry, now)
  return {
    downloadId: entry.downloadId,
    songName: entry.songName,
    stage,
    progressPercent,
    stageEnteredAt: iso(stageEnteredAt),
    // Progress moves every poll even when the stage does not, which is exactly why the real server
    // needs a separate updated_at rather than sorting on the stage timestamp.
    updatedAt: iso(stage === 'DOWNLOADING' ? now : stageEnteredAt),
    failureCode: stage === 'FAILED' ? entry.failureCode : null,
  }
}

export function getMockActiveDownloads(): ActiveDownloadsResponse {
  const now = Date.now()
  const downloads: ActiveDownloadView[] = []

  for (const entry of mockDownloads.values()) {
    const elapsed = now - entry.createdAt
    // Past the retention window a finished download drops out of the feed, exactly as it does
    // server-side. The entry itself stays, so getMockDownloadsByIds can still answer for it.
    if (elapsed >= T_FINISHED + MOCK_RETENTION_MS) continue
    downloads.push(toView(entry, now))
  }

  downloads.sort((a, b) => Date.parse(b.updatedAt) - Date.parse(a.updatedAt))
  return {
    pollIntervalMs: MOCK_POLL_INTERVAL_MS,
    terminalRetentionMs: MOCK_RETENTION_MS,
    downloads,
  }
}

/** Ignores the retention window, like the real GET /downloads?ids=. Unknown ids are omitted. */
export function getMockDownloadsByIds(ids: string[]): ActiveDownloadView[] {
  const now = Date.now()
  return ids
    .map(id => mockDownloads.get(id))
    .filter((entry): entry is MockDownloadEntry => entry !== undefined)
    .map(entry => toView(entry, now))
}

/** Ignores the retention window too, like the real GET /downloads/all - every download the server
 *  has ever seen is a candidate row, not just the currently-active ones. */
export function getMockAllDownloads(pageSize: number, pageNumber: number): AllDownloadsResponse {
  const now = Date.now()
  const downloads = Array.from(mockDownloads.values()).map(entry => toView(entry, now))
  downloads.sort((a, b) => Date.parse(b.updatedAt) - Date.parse(a.updatedAt))
  const start = (pageNumber - 1) * pageSize
  const page = downloads.slice(start, start + pageSize)
  return { downloads: page, totalPages: Math.ceil(downloads.length / pageSize) }
}
