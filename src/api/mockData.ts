import {
  Track, Album, Artist, Playlist, SearchResponse, CollectionDetail, CollectionType,
} from './types'

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
    artists: ['Jay Sean'],
    year: 2009
  },
  {
    id: 'album-2',
    iconURL: 'https://lastfm.freetls.fastly.net/i/u/300x300/2a96cbd8b46e442fc41c2b86b821562f.png',
    name: 'My Own Way',
    artists: ['Jay Sean'],
    year: 2008
  },
  {
    id: 'album-3',
    iconURL: 'https://lastfm.freetls.fastly.net/i/u/300x300/2a96cbd8b46e442fc41c2b86b821562f.png',
    name: 'Neon',
    artists: ['Jay Sean'],
    year: 2013
  },
  {
    id: 'album-4',
    iconURL: 'https://lastfm.freetls.fastly.net/i/u/300x300/2a96cbd8b46e442fc41c2b86b821562f.png',
    name: 'Me Against Myself',
    artists: ['Jay Sean'],
    year: 2004
  }
]

export const mockTracks: Track[] = [
  {
    id: 'song-1',
    iconURL: 'https://lastfm.freetls.fastly.net/i/u/300x300/2a96cbd8b46e442fc41c2b86b821562f.png',
    streamURL: 'https://www.last.fm/music/Jay+Sean/_/Down',
    name: 'Down',
    artists: ['Jay Sean', 'Lil Wayne'],
    albumId: 'album-1',
    year: 2009
  },
  {
    id: 'song-2',
    iconURL: 'https://lastfm.freetls.fastly.net/i/u/300x300/2a96cbd8b46e442fc41c2b86b821562f.png',
    streamURL: 'https://www.last.fm/music/Jay+Sean/_/Ride+It',
    name: 'Ride It',
    artists: ['Jay Sean'],
    albumId: 'album-2',
    year: 2008
  },
  {
    id: 'song-3',
    iconURL: 'https://lastfm.freetls.fastly.net/i/u/300x300/2a96cbd8b46e442fc41c2b86b821562f.png',
    streamURL: 'https://www.last.fm/music/Jay+Sean/_/Do+You+Remember',
    name: 'Do You Remember',
    artists: ['Jay Sean', 'Sean Paul'],
    albumId: 'album-1',
    year: 2009
  },
  {
    id: 'song-4',
    iconURL: 'https://lastfm.freetls.fastly.net/i/u/300x300/2a96cbd8b46e442fc41c2b86b821562f.png',
    streamURL: 'https://www.last.fm/music/Jay+Sean/_/Maybe',
    name: 'Maybe',
    artists: ['Jay Sean'],
    albumId: 'album-4',
    year: 2004
  },
  {
    id: 'song-5',
    iconURL: 'https://lastfm.freetls.fastly.net/i/u/300x300/2a96cbd8b46e442fc41c2b86b821562f.png',
    streamURL: 'https://www.last.fm/music/Jay+Sean/_/Stay',
    name: 'Stay',
    artists: ['Jay Sean'],
    albumId: 'album-4',
    year: 2004
  },
  {
    id: 'song-6',
    iconURL: 'https://lastfm.freetls.fastly.net/i/u/300x300/2a96cbd8b46e442fc41c2b86b821562f.png',
    streamURL: 'https://www.last.fm/music/Jay+Sean/_/Tonight',
    name: 'Tonight',
    artists: ['Jay Sean'],
    albumId: 'album-1',
    year: 2009
  },
  {
    id: 'song-7',
    iconURL: 'https://lastfm.freetls.fastly.net/i/u/300x300/2a96cbd8b46e442fc41c2b86b821562f.png',
    streamURL: 'https://www.last.fm/music/Jay+Sean/_/Cry',
    name: 'Cry',
    artists: ['Jay Sean'],
    albumId: 'album-1',
    year: 2009
  },
  {
    id: 'song-8',
    iconURL: 'https://lastfm.freetls.fastly.net/i/u/300x300/2a96cbd8b46e442fc41c2b86b821562f.png',
    streamURL: 'https://www.last.fm/music/Jay+Sean/_/War',
    name: 'War',
    artists: ['Jay Sean'],
    albumId: 'album-3',
    year: 2013
  },
  {
    id: 'song-9',
    iconURL: 'https://lastfm.freetls.fastly.net/i/u/300x300/2a96cbd8b46e442fc41c2b86b821562f.png',
    streamURL: 'https://www.last.fm/music/Jay+Sean/_/Fire',
    name: 'Fire',
    artists: ['Jay Sean'],
    albumId: 'album-3',
    year: 2013
  },
  {
    id: 'song-10',
    iconURL: 'https://lastfm.freetls.fastly.net/i/u/300x300/2a96cbd8b46e442fc41c2b86b821562f.png',
    streamURL: 'https://www.last.fm/music/Jay+Sean/_/2012+(It+Ain%27t+the+End)',
    name: "2012 (It Ain't the End)",
    artists: ['Jay Sean'],
    albumId: 'album-3',
    year: 2013
  }
]


export const mockPlaylists: Playlist[] = [
  {
    id: 'PLmock-jay-sean-essentials',
    iconURL: 'https://lastfm.freetls.fastly.net/i/u/300x300/2a96cbd8b46e442fc41c2b86b821562f.png',
    name: 'Jay Sean Essentials',
    artists: ['YouTube Music'],
    trackCount: 4,
  },
]

export const mockSearchResponse: SearchResponse = {
  tracks: mockTracks,
  albums: mockAlbums,
  artists: mockArtists,
  playlists: mockPlaylists,
}

/**
 * Get mock data that matches a query (case-insensitive search)
 */
export function getMockSearchResults(query: string): SearchResponse {
  const lowerQuery = query.toLowerCase()

  // Filter results based on query
  // `artists` holds display names, like the real server sends - match on them directly.
  const filteredTracks = mockTracks.filter(track =>
    track.name.toLowerCase().includes(lowerQuery) ||
    track.artists.some(name => name.toLowerCase().includes(lowerQuery))
  )

  const filteredAlbums = mockAlbums.filter(album =>
    album.name.toLowerCase().includes(lowerQuery) ||
    album.artists.some(name => name.toLowerCase().includes(lowerQuery))
  )

  const filteredArtists = mockArtists.filter(artist =>
    artist.name.toLowerCase().includes(lowerQuery)
  )

  const filteredPlaylists = mockPlaylists.filter(playlist =>
    playlist.name.toLowerCase().includes(lowerQuery) ||
    playlist.artists.some(name => name.toLowerCase().includes(lowerQuery))
  )

  return {
    tracks: filteredTracks,
    albums: filteredAlbums,
    artists: filteredArtists,
    playlists: filteredPlaylists,
  }
}

/** The four "All or Nothing" tracks stand in for every collection's contents. */
const COLLECTION_TRACKS = mockTracks.filter(t => t.albumId === 'album-1')

/** Mirrors GET /collections/{id}?type=. Any album id resolves to that album; anything else is the
 *  mock playlist. Both expand to the same four tracks. */
export function getMockCollection(id: string, type: CollectionType): CollectionDetail {
  const album = type === 'ALBUM' ? mockAlbums.find(a => a.id === id) : undefined
  const playlist = mockPlaylists[0]
  return {
    id,
    type,
    name: album?.name ?? playlist.name,
    artists: album?.artists ?? playlist.artists,
    iconURL: album?.iconURL ?? playlist.iconURL,
    year: album?.year ?? null,
    trackCount: COLLECTION_TRACKS.length,
    tracks: COLLECTION_TRACKS.map((t, i) => ({
      id: t.id,
      name: t.name,
      artists: t.artists,
      iconURL: t.iconURL,
      durationSeconds: 180 + i * 17,
      position: i + 1,
    })),
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
  ActiveDownloadsResponse, ActiveDownloadView, AllDownloadsResponse, Download, DownloadDetailView,
  DownloadFailureCode, DownloadStage, DownloadType,
} from './types'

interface MockDownloadEntry {
  downloadId: string
  youtubeId: string
  downloadType: DownloadType
  title: string
  artists: string[]
  imageUrl: string
  songCount: number
  createdAt: number
  outcome: 'SUCCEEDED' | 'FAILED'
  failureCode: DownloadFailureCode
}

// Persisted, because the simulator has to survive a page reload to be worth anything: the client
// behaviours most worth exercising -- cards restored from a snapshot, startup reconciliation, a
// download that finished while the app was closed -- are all reload-crossing by definition. An
// in-memory map makes every reload look like a server that lost its database.
const MOCK_STORAGE_KEY = 'naviseerr.mock.downloads.v2'

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

export function getMockDownload(youtubeId: string, downloadType: DownloadType): Download {
  const downloadId = randomId()
  const track = mockTracks.find(t => t.id === youtubeId)
  const collection = downloadType === 'SONG' ? null : getMockCollection(youtubeId, downloadType)
  const createdAt = Date.now()
  mockDownloads.set(downloadId, {
    downloadId,
    youtubeId,
    downloadType,
    title: collection?.name ?? track?.name ?? youtubeId,
    artists: collection?.artists ?? track?.artists ?? [],
    imageUrl: collection?.iconURL ?? track?.iconURL ?? mockArtists[0].iconUrl,
    songCount: collection?.trackCount ?? 1,
    createdAt,
    // ~80% succeed, so failures are visible but not the common case
    outcome: Math.random() < 0.8 ? 'SUCCEEDED' : 'FAILED',
    failureCode: FAILURE_CODES[Math.floor(Math.random() * FAILURE_CODES.length)],
  })
  persistMockDownloads()
  return {
    downloadId,
    youtubeId,
    downloadType,
    status: 'PENDING',
    failureReason: null,
    createdAt: iso(createdAt),
    admittedAt: null,
    finishedAt: null,
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
  const terminal = stage === 'SUCCEEDED' || stage === 'FAILED'
  // Like the real server, metadata is unresolved while QUEUED. The client must keep what it knew.
  const resolved = stage !== 'QUEUED'
  return {
    downloadId: entry.downloadId,
    youtubeId: entry.youtubeId,
    downloadType: entry.downloadType,
    title: resolved ? entry.title : null,
    artists: resolved ? entry.artists : [],
    imageUrl: resolved ? entry.imageUrl : null,
    stage,
    progressPercent,
    songCount: resolved ? entry.songCount : 0,
    songsSucceeded: stage === 'SUCCEEDED' ? entry.songCount : 0,
    songsFailed: stage === 'FAILED' ? entry.songCount : 0,
    requestedAt: iso(entry.createdAt),
    stageEnteredAt: iso(stageEnteredAt),
    // Progress moves every poll even when the stage does not, which is exactly why the real server
    // needs a separate updated_at rather than sorting on the stage timestamp.
    updatedAt: iso(stage === 'DOWNLOADING' ? now : stageEnteredAt),
    finishedAt: terminal ? iso(stageEnteredAt) : null,
    failureCode: stage === 'FAILED' ? entry.failureCode : null,
  }
}

// --- Static collection fixtures ----------------------------------------
// The simulator only walks single-outcome downloads. These two rows show the collection-only
// shapes the UI has to render - a mid-flight album with a mixed song tally, and a finished one that
// ended PARTIAL_SUCCESS - and stay put so they can be looked at. Timestamps are relative to module
// load so they read as recent on every visit.

const FIXTURE_BOOT = Date.now()
const FIXTURE_ALBUM_ID = 'mock-fixture-album-downloading'
const FIXTURE_PARTIAL_ID = 'mock-fixture-partial'
const FIXTURE_IMAGE = mockAlbums[0].iconURL

const fixtureAlbum: ActiveDownloadView = {
  downloadId: FIXTURE_ALBUM_ID,
  youtubeId: 'album-1',
  downloadType: 'ALBUM',
  title: 'All or Nothing',
  artists: ['Jay Sean'],
  imageUrl: FIXTURE_IMAGE,
  stage: 'DOWNLOADING',
  progressPercent: 62,
  songCount: 4,
  songsSucceeded: 2,
  songsFailed: 1,
  requestedAt: iso(FIXTURE_BOOT - 90000),
  stageEnteredAt: iso(FIXTURE_BOOT - 60000),
  updatedAt: iso(FIXTURE_BOOT - 1000),
  finishedAt: null,
  failureCode: null,
}

const fixturePartial: ActiveDownloadView = {
  downloadId: FIXTURE_PARTIAL_ID,
  youtubeId: 'PLmock-jay-sean-essentials',
  downloadType: 'PLAYLIST',
  title: 'Jay Sean Essentials',
  artists: ['YouTube Music'],
  imageUrl: FIXTURE_IMAGE,
  stage: 'PARTIAL_SUCCESS',
  progressPercent: 100,
  songCount: 4,
  songsSucceeded: 3,
  songsFailed: 1,
  requestedAt: iso(FIXTURE_BOOT - 300000),
  stageEnteredAt: iso(FIXTURE_BOOT - 5000),
  updatedAt: iso(FIXTURE_BOOT - 5000),
  finishedAt: iso(FIXTURE_BOOT - 5000),
  failureCode: null,
}

const FIXTURES: Record<string, ActiveDownloadView> = {
  [FIXTURE_ALBUM_ID]: fixtureAlbum,
  [FIXTURE_PARTIAL_ID]: fixturePartial,
}

const FIXTURE_SONG_STAGES: DownloadStage[] = ['SUCCEEDED', 'SUCCEEDED', 'FAILED', 'DOWNLOADING']

const fixtureAlbumDetail: DownloadDetailView = {
  download: fixtureAlbum,
  songs: COLLECTION_TRACKS.map((t, i) => {
    const stage = FIXTURE_SONG_STAGES[i]
    const terminal = stage === 'SUCCEEDED' || stage === 'FAILED'
    return {
      taskId: `${FIXTURE_ALBUM_ID}-song-${i + 1}`,
      youtubeId: t.id,
      position: i + 1,
      title: t.name,
      artists: t.artists,
      imageUrl: t.iconURL,
      durationSeconds: 180 + i * 17,
      stage,
      progressPercent: stage === 'SUCCEEDED' ? 100 : stage === 'DOWNLOADING' ? 48 : null,
      failureCode: stage === 'FAILED' ? 'NO_CANDIDATES' : null,
      stageEnteredAt: iso(FIXTURE_BOOT - 50000 + i * 10000),
      updatedAt: iso(FIXTURE_BOOT - 1000),
      finishedAt: terminal ? iso(FIXTURE_BOOT - 40000 + i * 10000) : null,
      candidateCount: 3,
      candidateIndex: stage === 'FAILED' ? 3 : 1,
      retryIndex: 0,
      slskdUsername: terminal ? 'mock-peer' : null,
      slskdFilename: terminal ? `Jay Sean - ${t.name}.flac` : null,
      lastError: stage === 'FAILED' ? 'no candidates matched' : null,
    }
  }),
}

/** Mirrors GET /downloads/{id}. Throws for an unknown id, like the server's 404. */
export function getMockDownloadDetail(downloadId: string): DownloadDetailView {
  if (downloadId === FIXTURE_ALBUM_ID) return fixtureAlbumDetail
  const fixture = FIXTURES[downloadId]
  if (fixture) return { download: fixture, songs: [] }
  const entry = mockDownloads.get(downloadId)
  if (!entry) throw new Error(`Mock: no download ${downloadId}`)
  return { download: toView(entry, Date.now()), songs: [] }
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
  downloads.push(...Object.values(FIXTURES))

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
    .map(id => {
      const entry = mockDownloads.get(id)
      return entry ? toView(entry, now) : FIXTURES[id]
    })
    .filter((view): view is ActiveDownloadView => view !== undefined)
}

/** Ignores the retention window too, like the real GET /downloads/all - every download the server
 *  has ever seen is a candidate row, not just the currently-active ones. */
export function getMockAllDownloads(pageSize: number, pageNumber: number): AllDownloadsResponse {
  const now = Date.now()
  const downloads = Array.from(mockDownloads.values()).map(entry => toView(entry, now))
  downloads.push(...Object.values(FIXTURES))
  downloads.sort((a, b) => Date.parse(b.updatedAt) - Date.parse(a.updatedAt))
  const start = (pageNumber - 1) * pageSize
  const page = downloads.slice(start, start + pageSize)
  return { downloads: page, totalPages: Math.ceil(downloads.length / pageSize) }
}
