import {
  Track, Album, Artist, Playlist, SearchResponse, CollectionDetail, CollectionType, ArtistDetail,
  SongInfo, SuggestedPlaylist, SuggestedPlaylistsResponse, SuggestedPlaylistSummary, CuratorRun,
} from './types'
import { ApiError } from './client'

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
    artistIds: ['artist-1'],
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

/** `plays` is null on the first, like the real search's Top result row, and on one more. */
export const mockTracks: Track[] = [
  {
    id: 'song-1',
    iconURL: 'https://lastfm.freetls.fastly.net/i/u/300x300/2a96cbd8b46e442fc41c2b86b821562f.png',
    streamURL: 'https://www.last.fm/music/Jay+Sean/_/Down',
    name: 'Down',
    artists: ['Jay Sean', 'Lil Wayne'],
    artistIds: ['artist-1', null], // one linked, one plain, like a real row with a nameless channel
    albumId: 'album-1',
    year: 2009,
    plays: null
  },
  {
    id: 'song-2',
    iconURL: 'https://lastfm.freetls.fastly.net/i/u/300x300/2a96cbd8b46e442fc41c2b86b821562f.png',
    streamURL: 'https://www.last.fm/music/Jay+Sean/_/Ride+It',
    name: 'Ride It',
    artists: ['Jay Sean'],
    artistIds: ['artist-1'],
    albumId: 'album-2',
    year: 2008,
    plays: '96M plays'
  },
  {
    id: 'song-3',
    iconURL: 'https://lastfm.freetls.fastly.net/i/u/300x300/2a96cbd8b46e442fc41c2b86b821562f.png',
    streamURL: 'https://www.last.fm/music/Jay+Sean/_/Do+You+Remember',
    name: 'Do You Remember',
    artists: ['Jay Sean', 'Sean Paul'],
    albumId: 'album-1',
    year: 2009,
    plays: '41M plays'
  },
  {
    id: 'song-4',
    iconURL: 'https://lastfm.freetls.fastly.net/i/u/300x300/2a96cbd8b46e442fc41c2b86b821562f.png',
    streamURL: 'https://www.last.fm/music/Jay+Sean/_/Maybe',
    name: 'Maybe',
    artists: ['Jay Sean'],
    albumId: 'album-4',
    year: 2004,
    plays: '7.2M plays'
  },
  {
    id: 'song-5',
    iconURL: 'https://lastfm.freetls.fastly.net/i/u/300x300/2a96cbd8b46e442fc41c2b86b821562f.png',
    streamURL: 'https://www.last.fm/music/Jay+Sean/_/Stay',
    name: 'Stay',
    artists: ['Jay Sean'],
    albumId: 'album-4',
    year: 2004,
    plays: '3.9M plays'
  },
  {
    id: 'song-6',
    iconURL: 'https://lastfm.freetls.fastly.net/i/u/300x300/2a96cbd8b46e442fc41c2b86b821562f.png',
    streamURL: 'https://www.last.fm/music/Jay+Sean/_/Tonight',
    name: 'Tonight',
    artists: ['Jay Sean'],
    albumId: 'album-1',
    year: 2009,
    plays: '18M plays'
  },
  {
    id: 'song-7',
    iconURL: 'https://lastfm.freetls.fastly.net/i/u/300x300/2a96cbd8b46e442fc41c2b86b821562f.png',
    streamURL: 'https://www.last.fm/music/Jay+Sean/_/Cry',
    name: 'Cry',
    artists: ['Jay Sean'],
    albumId: 'album-1',
    year: 2009,
    plays: '880K plays'
  },
  {
    id: 'song-8',
    iconURL: 'https://lastfm.freetls.fastly.net/i/u/300x300/2a96cbd8b46e442fc41c2b86b821562f.png',
    streamURL: 'https://www.last.fm/music/Jay+Sean/_/War',
    name: 'War',
    artists: ['Jay Sean'],
    albumId: 'album-3',
    year: 2013,
    plays: '2.1M plays'
  },
  {
    id: 'song-9',
    iconURL: 'https://lastfm.freetls.fastly.net/i/u/300x300/2a96cbd8b46e442fc41c2b86b821562f.png',
    streamURL: 'https://www.last.fm/music/Jay+Sean/_/Fire',
    name: 'Fire',
    artists: ['Jay Sean'],
    albumId: 'album-3',
    year: 2013,
    plays: null
  },
  {
    id: 'song-10',
    iconURL: 'https://lastfm.freetls.fastly.net/i/u/300x300/2a96cbd8b46e442fc41c2b86b821562f.png',
    streamURL: 'https://www.last.fm/music/Jay+Sean/_/2012+(It+Ain%27t+the+End)',
    name: "2012 (It Ain't the End)",
    artists: ['Jay Sean'],
    albumId: 'album-3',
    year: 2013,
    plays: '12M plays'
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
      // Like the real server: YouTube's wording for album tracks, nothing for playlist tracks.
      plays: type === 'ALBUM' ? `${28 - i * 7}M plays` : null,
      position: i + 1,
    })),
  }
}

/** Two categories, one built today and one a few days old, so the shelf shows both freshness labels. */
function daysAgo(days: number): string {
  const d = new Date()
  d.setDate(d.getDate() - days)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

/** A few of the curator's categories, one or two per era, so the shelf's sections show in mock mode. */
const MOCK_CATEGORIES: Record<string, { title: string; filters: Record<string, string> }> = {
  'rock-hits': { title: 'Rock hits', filters: { year: '1950-2026', genre: 'Rock' } },
  'current-pop': { title: 'Current pop', filters: { year: '2024-2026', genre: 'Pop' } },
  '2010s-hits': { title: '2010s hits', filters: { year: '2010-2019' } },
  '90s-dance': { title: '90s dance', filters: { year: '1990-1999', style: 'Eurodance' } },
  '80s-indie-pop': { title: '80s indie pop', filters: { year: '1980-1989', style: 'Indie Pop' } },
  '70s-party': { title: '70s party', filters: { year: '1970-1979', style: 'Disco' } },
}
const MOCK_SUGGESTED: SuggestedPlaylistSummary[] = Object.entries(MOCK_CATEGORIES).map(([category, c], i) => ({
  category, title: c.title, year: c.filters.year, editionDate: daysAgo(i % 4), trackCount: mockTracks.length,
}))

/** Mirrors GET /suggested-playlists. */
export function getMockSuggestedPlaylists(): SuggestedPlaylistsResponse {
  return { enabled: true, refreshDay: 'MONDAY', playlists: MOCK_SUGGESTED }
}

/** Mirrors GET /suggested-playlists/{category}: the ten mock tracks with the three tiers cycled through
 *  them. An unknown category is the server's 404. */
export function getMockSuggestedPlaylist(category: string): SuggestedPlaylist {
  const summary = MOCK_SUGGESTED.find(p => p.category === category)
  if (!summary) throw new ApiError('API request failed: Not Found', 404, 'Not Found')
  const tiers = ['top', 'top', 'mid', 'random'] as const
  return {
    category,
    title: summary.title,
    filters: MOCK_CATEGORIES[category].filters,
    editionDate: summary.editionDate,
    trackCount: mockTracks.length,
    tracks: mockTracks.map((t, i) => {
      const tier = tiers[i % tiers.length]
      return {
        id: t.id,
        name: t.name,
        artists: t.artists,
        album: mockAlbums.find(a => a.id === t.albumId)?.name ?? null,
        albumYear: t.year,
        popularity: (mockTracks.length - i) * 1_250_000,
        tier,
        reason: tier === 'top' ? `#${i + 1} of 1036 by plays`
          : tier === 'mid' ? `#${100 + i * 7} of 1036, middle band, one per artist/album`
          : 'random pick (seed 1738171583) from 1006 remaining',
        iconURL: t.iconURL,
        position: i + 1,
      }
    }),
  }
}

/** The mock curator run: each GET moves it one step, so a page that polls sees queued, running with one
 *  category done, then partial (one written, one nothing found). */
let mockRunStep = -1

export function requestMockSuggestedRefresh(): CuratorRun {
  if (mockRunStep < 0 || mockRunStep >= 3) mockRunStep = 0
  return getMockSuggestedRefresh(false)
}

export function getMockSuggestedRefresh(advance = true): CuratorRun {
  if (mockRunStep < 0) throw new ApiError('API request failed: Not Found', 404, 'Not Found')
  if (advance && mockRunStep < 3) mockRunStep += 1
  const step = mockRunStep
  const cat = (key: string, index: number) => {
    const done = step > index + 1
    const running = step === index + 1
    const nothing = key === '90s-grime'
    return {
      key,
      status: done ? (nothing ? 'no_albums' : 'written') : running ? 'running' : 'queued',
      editionDate: done && !nothing ? MOCK_SUGGESTED[0].editionDate : null,
      trackCount: done && !nothing ? 40 : null,
      message: done ? (nothing ? "Discogs returned no albums for {'year': '1990-1999', 'style': 'Grime'}" : 'wrote 40 tracks') : null,
    }
  }
  const categories = [cat('80s-indie-pop', 0), cat('90s-grime', 1)]
  const final = step >= 3
  return {
    runId: 'mock-run',
    status: step === 0 ? 'queued' : final ? 'partial' : 'running',
    requestedAt: '2026-09-28T10:14:39Z',
    startedAt: step > 0 ? '2026-09-28T10:14:40Z' : null,
    finishedAt: final ? '2026-09-28T10:17:28Z' : null,
    final,
    categories,
  }
}

/** Mirrors GET /artists/{id}. Only the three mock artists exist; anything else is the server's 404.
 *  Every artist gets the same shelves: all ten tracks (so "See more" has something to reveal), the
 *  albums, the playlist, and the other two artists as similar. */
export function getMockArtist(id: string): ArtistDetail {
  const artist = mockArtists.find(a => a.id === id)
  if (!artist) throw new ApiError('API request failed: Not Found', 404, 'Not Found')
  return {
    id,
    name: artist.name,
    iconURL: artist.iconUrl,
    description: null,
    subscribers: '1.2M',
    topSongs: mockTracks,
    albums: mockAlbums,
    singles: mockAlbums.slice(0, 2),
    playlists: mockPlaylists,
    similarArtists: mockArtists.filter(a => a.id !== id),
  }
}

/** The mock artist's id for a display name; null for anyone else, which is the server's "no page". */
function mockArtistId(name: string): string | null {
  return mockArtists.find(a => a.name === name)?.id ?? null
}

/** Any mock track id resolves; the first one carries credits, the rest show the empty-credits copy. */
export function getMockSongInfo(id: string): SongInfo {
  const track = mockTracks.find(t => t.id === id)
  if (!track) throw new ApiError('API request failed: Not Found', 404, 'Not Found')
  const album = mockAlbums.find(a => a.id === track.albumId)
  return {
    id,
    name: track.name,
    artists: track.artists.map(name => ({ id: mockArtistId(name), name })),
    album: album ? { id: album.id, name: album.name } : null,
    durationSeconds: 212,
    year: track.year,
    // The lists' count; song-1 has none (like the Top result), so its pop-up falls back to views.
    plays: track.plays,
    viewCount: 1_234_567,
    iconURL: track.iconURL,
    explicit: track.id === 'song-1',
    credits: track.id === 'song-1' ? [
      { role: 'Performed by', names: track.artists },
      { role: 'Written by', names: ['Jay Sean', 'Jared Cotter', 'J-Remy', 'Bobby Bass'] },
      { role: 'Produced by', names: ['J-Remy', 'Bobby Bass'] },
    ] : [],
  }
}

/** Mirrors GET /songs/views?ids=: a made-up but stable count for every mock track except song-7, which
 *  stays absent like a video YouTube gave no count for. Other ids are absent too. */
export function getMockSongViews(ids: string[]): Record<string, number> {
  const counts: Record<string, number> = {}
  for (const id of ids) {
    const i = mockTracks.findIndex(t => t.id === id)
    if (i >= 0 && id !== 'song-7') counts[id] = (mockTracks.length - i) * 1_933_442
  }
  return counts
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
  DownloadFailureCode, DownloadSongView, DownloadStage, DownloadType, DownloadTypeFilter, SongCandidate,
  SongCandidatesResponse,
} from './types'

interface MockDownloadEntry {
  downloadId: string
  youtubeId: string
  downloadType: DownloadType
  title: string
  artists: string[]
  imageUrl: string
  songCount: number
  /** The simulator's clock: every stage is measured from it, so a retry or cancel moves it. */
  createdAt: number
  /** When the user asked, which a retry leaves alone, like the server's created_at. */
  requestedAt: number
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
    const entries = JSON.parse(raw) as [string, MockDownloadEntry][]
    // An entry saved before requestedAt existed takes its request time from createdAt now, before a
    // retry or cancel moves that clock and the download jumps to the top.
    for (const [, entry] of entries) entry.requestedAt ??= entry.createdAt
    return new Map(entries)
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
  // A curated download is keyed by the category; its name, picture and size come from the edition.
  const suggested = downloadType === 'CURATED' ? getMockSuggestedPlaylist(youtubeId) : null
  const collection = downloadType === 'SONG' || downloadType === 'CURATED'
    ? null
    : getMockCollection(youtubeId, downloadType === 'RADIO' ? 'PLAYLIST' : downloadType)
  const createdAt = Date.now()
  mockDownloads.set(downloadId, {
    downloadId,
    youtubeId,
    downloadType,
    title: suggested?.title ?? collection?.name ?? track?.name ?? youtubeId,
    artists: suggested ? ['Naviseerr'] : collection?.artists ?? track?.artists ?? [],
    imageUrl: suggested?.tracks[0]?.iconURL ?? collection?.iconURL ?? track?.iconURL ?? mockArtists[0].iconUrl,
    songCount: suggested?.trackCount ?? collection?.trackCount ?? 1,
    createdAt,
    requestedAt: createdAt,
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
  const cancelled = stage === 'FAILED' && entry.failureCode === 'CANCELLED'
  // Like the real server, metadata is unresolved while QUEUED. The client must keep what it knew.
  const resolved = stage !== 'QUEUED'
  return {
    downloadId: entry.downloadId,
    youtubeId: entry.youtubeId,
    downloadType: entry.downloadType,
    title: resolved ? entry.title : null,
    artists: resolved ? entry.artists : [],
    artistIds: resolved ? entry.artists.map(mockArtistId) : [],
    imageUrl: resolved ? entry.imageUrl : null,
    stage,
    progressPercent,
    songCount: resolved ? entry.songCount : 0,
    songsSucceeded: stage === 'SUCCEEDED' ? entry.songCount : 0,
    songsFailed: stage === 'FAILED' && !cancelled ? entry.songCount : 0,
    songsCancelled: cancelled ? entry.songCount : 0,
    requestedAt: iso(entry.requestedAt),
    stageEnteredAt: iso(stageEnteredAt),
    // Progress moves every poll even when the stage does not, which is exactly why the real server
    // needs a separate updated_at rather than sorting on the stage timestamp.
    updatedAt: iso(stage === 'DOWNLOADING' ? now : stageEnteredAt),
    finishedAt: terminal ? iso(stageEnteredAt) : null,
    failureCode: stage === 'FAILED' ? entry.failureCode : null,
  }
}

// --- Static collection fixtures ----------------------------------------
// The simulator only walks single-outcome downloads. These rows show the collection-only shapes the
// UI has to render - a mid-flight album with a mixed song tally, a finished playlist that ended
// PARTIAL_SUCCESS, and a live playlist with a song still searching - and stay put so they can be
// looked at. Timestamps are relative to module load so they read as recent on every visit. Their
// song lists are plain mutable state: a manual pick (pickMockSongCandidate) rewrites a song in place,
// the way the server does.

const FIXTURE_BOOT = Date.now()
const FIXTURE_ALBUM_ID = 'mock-fixture-album-downloading'
const FIXTURE_PARTIAL_ID = 'mock-fixture-partial'
const FIXTURE_LIVE_PLAYLIST_ID = 'mock-fixture-playlist-live'
const FIXTURE_IMAGE = mockAlbums[0].iconURL

const fixtureAlbum: ActiveDownloadView = {
  downloadId: FIXTURE_ALBUM_ID,
  youtubeId: 'album-1',
  downloadType: 'ALBUM',
  title: 'All or Nothing',
  artists: ['Jay Sean'],
  artistIds: ['artist-1'],
  imageUrl: FIXTURE_IMAGE,
  stage: 'DOWNLOADING',
  progressPercent: 62,
  songCount: 4,
  songsSucceeded: 2,
  songsFailed: 1,
  songsCancelled: 0,
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
  // A playlist's author has no artist page, so this stays plain text.
  artistIds: [null],
  imageUrl: FIXTURE_IMAGE,
  stage: 'PARTIAL_SUCCESS',
  progressPercent: 100,
  songCount: 4,
  songsSucceeded: 3,
  songsFailed: 1,
  songsCancelled: 0,
  requestedAt: iso(FIXTURE_BOOT - 300000),
  stageEnteredAt: iso(FIXTURE_BOOT - 5000),
  updatedAt: iso(FIXTURE_BOOT - 5000),
  finishedAt: iso(FIXTURE_BOOT - 5000),
  failureCode: null,
}

const fixtureLivePlaylist: ActiveDownloadView = {
  downloadId: FIXTURE_LIVE_PLAYLIST_ID,
  youtubeId: 'PLmock-summer-mix',
  downloadType: 'PLAYLIST',
  title: 'Summer Mix 2026',
  artists: ['YouTube Music'],
  artistIds: [null],
  imageUrl: mockTracks[4].iconURL,
  stage: 'DOWNLOADING',
  progressPercent: 48,
  songCount: 4,
  songsSucceeded: 1,
  songsFailed: 0,
  songsCancelled: 0,
  requestedAt: iso(FIXTURE_BOOT - 40000),
  stageEnteredAt: iso(FIXTURE_BOOT - 20000),
  updatedAt: iso(FIXTURE_BOOT - 1000),
  finishedAt: null,
  failureCode: null,
}

const FIXTURES: Record<string, ActiveDownloadView> = {
  [FIXTURE_ALBUM_ID]: fixtureAlbum,
  [FIXTURE_PARTIAL_ID]: fixturePartial,
  [FIXTURE_LIVE_PLAYLIST_ID]: fixtureLivePlaylist,
}

/** The four collection tracks as a download's songs, one stage each. `stageAt` positions the row's
 *  timestamps so later songs read as more recent. */
function fixtureSongs(downloadId: string, stages: DownloadStage[], failureCode: DownloadFailureCode): DownloadSongView[] {
  return COLLECTION_TRACKS.map((t, i) => {
    const stage = stages[i]
    const terminal = stage === 'SUCCEEDED' || stage === 'FAILED'
    const started = stage !== 'QUEUED' && stage !== 'STARTING' && stage !== 'SEARCHING'
    return {
      taskId: `${downloadId}-song-${i + 1}`,
      youtubeId: t.id,
      position: i + 1,
      title: t.name,
      artists: t.artists,
      artistIds: t.artists.map(mockArtistId),
      imageUrl: t.iconURL,
      durationSeconds: 180 + i * 17,
      stage,
      progressPercent: stage === 'SUCCEEDED' ? 100 : stage === 'DOWNLOADING' ? 48 : null,
      failureCode: stage === 'FAILED' ? failureCode : null,
      stageEnteredAt: iso(FIXTURE_BOOT - 50000 + i * 10000),
      updatedAt: iso(FIXTURE_BOOT - 1000),
      finishedAt: terminal ? iso(FIXTURE_BOOT - 40000 + i * 10000) : null,
      candidateCount: 3,
      candidateIndex: stage === 'FAILED' ? 3 : 1,
      retryIndex: 0,
      slskdUsername: started && stage !== 'FAILED' ? 'mock-peer' : null,
      slskdFilename: started && stage !== 'FAILED' ? `@@mock\\Music\\Jay Sean\\All or Nothing\\${String(i + 1).padStart(2, '0')} - ${t.name}.flac` : null,
      lastError: stage === 'FAILED' ? 'no candidates matched' : null,
    }
  })
}

const FIXTURE_SONGS: Record<string, DownloadSongView[]> = {
  [FIXTURE_ALBUM_ID]: fixtureSongs(FIXTURE_ALBUM_ID, ['SUCCEEDED', 'SUCCEEDED', 'FAILED', 'DOWNLOADING'], 'NO_CANDIDATES'),
  [FIXTURE_PARTIAL_ID]: fixtureSongs(FIXTURE_PARTIAL_ID, ['SUCCEEDED', 'SUCCEEDED', 'SUCCEEDED', 'FAILED'], 'SOURCES_EXHAUSTED'),
  [FIXTURE_LIVE_PLAYLIST_ID]: fixtureSongs(FIXTURE_LIVE_PLAYLIST_ID, ['SUCCEEDED', 'DOWNLOADING', 'SEARCHING', 'QUEUED'], 'NO_CANDIDATES'),
}

/** Files chosen by hand for simulator songs (taskId -> file); fixture songs are rewritten in place. */
const mockPicks = new Map<string, { username: string; filename: string }>()

/** A single-song simulator download as its one song row, so the per-song endpoints have a taskId. */
function simulatorSong(entry: MockDownloadEntry, view: ActiveDownloadView): DownloadSongView {
  const track = mockTracks.find(t => t.id === entry.youtubeId)
  const started = view.stage === 'DOWNLOADING' || view.stage === 'SUCCEEDED' || view.stage === 'READY_TO_DOWNLOAD'
  const picked = mockPicks.get(`${entry.downloadId}-song-1`)
  return {
    taskId: `${entry.downloadId}-song-1`,
    youtubeId: entry.youtubeId,
    position: null,
    title: entry.title,
    artists: entry.artists,
    artistIds: entry.artists.map(mockArtistId),
    imageUrl: entry.imageUrl,
    durationSeconds: track ? 200 : null,
    stage: view.stage,
    progressPercent: view.progressPercent,
    failureCode: view.failureCode,
    stageEnteredAt: view.stageEnteredAt,
    updatedAt: view.updatedAt,
    finishedAt: view.finishedAt,
    candidateCount: 3,
    candidateIndex: 1,
    retryIndex: 0,
    slskdUsername: started ? picked?.username ?? 'mock-peer' : null,
    slskdFilename: started ? picked?.filename ?? `@@mock\\Music\\Jay Sean\\${entry.title}.flac` : null,
    lastError: null,
  }
}

/** Mirrors GET /downloads/{id}. Throws for an unknown id, like the server's 404. */
export function getMockDownloadDetail(downloadId: string): DownloadDetailView {
  const fixture = FIXTURES[downloadId]
  if (fixture) return { download: fixture, songs: FIXTURE_SONGS[downloadId] ?? [] }
  const entry = mockDownloads.get(downloadId)
  if (!entry) throw new ApiError('not found', 404, 'Not Found', { message: 'No such download' })
  const view = toView(entry, Date.now())
  return { download: view, songs: entry.downloadType === 'SONG' && view.stage !== 'QUEUED' ? [simulatorSong(entry, view)] : [] }
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

/** Mirrors POST /downloads/{id}/cancel. The simulator has no songs, so it cancels the whole download:
 *  the clock is rewound so the entry reads finished now. 409 with the current card when there is
 *  nothing left to cancel (and for the fixtures, which stay put); 404 for an unknown id. */
export function cancelMockDownload(id: string): ActiveDownloadView {
  const fixture = FIXTURES[id]
  if (fixture) throw new ApiError('conflict', 409, 'Conflict', fixture)
  const entry = mockDownloads.get(id)
  if (!entry) throw new ApiError('not found', 404, 'Not Found')
  const { stage } = stageAt(entry, Date.now())
  if (stage === 'SUCCEEDED' || stage === 'FAILED') {
    throw new ApiError('conflict', 409, 'Conflict', toView(entry, Date.now()))
  }
  entry.outcome = 'FAILED'
  entry.failureCode = 'CANCELLED'
  entry.createdAt = Date.now() - T_FINISHED
  persistMockDownloads()
  return toView(entry, Date.now())
}

/** Mirrors POST /downloads/{id}/retry[?taskId=]. The simulator has no per-song state, so a retry
 *  (of the whole download or of one song) starts the whole download over, exactly like a fresh
 *  request: the clock resets and a new outcome is picked. 409 with the current card when the whole
 *  download is retried while still running (one song may be, as on the server) and for the fixtures,
 *  which stay put; 404 for an unknown id. */
export function retryMockDownload(id: string, taskId?: string): ActiveDownloadView {
  const fixture = FIXTURES[id]
  if (fixture) throw new ApiError('conflict', 409, 'Conflict', fixture)
  const entry = mockDownloads.get(id)
  if (!entry) throw new ApiError('not found', 404, 'Not Found')
  const { stage } = stageAt(entry, Date.now())
  if (!taskId && stage !== 'SUCCEEDED' && stage !== 'FAILED') {
    throw new ApiError('conflict', 409, 'Conflict', toView(entry, Date.now()))
  }
  entry.createdAt = Date.now()
  entry.outcome = Math.random() < 0.8 ? 'SUCCEEDED' : 'FAILED'
  entry.failureCode = FAILURE_CODES[Math.floor(Math.random() * FAILURE_CODES.length)]
  persistMockDownloads()
  return toView(entry, Date.now())
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
 *  has ever seen is a candidate row, not just the currently-active ones. Filters before paging, like
 *  the server, so `totalPages` counts pages of the type asked for; PLAYLIST takes CURATED too. */
export function getMockAllDownloads(
  pageSize: number, pageNumber: number, type?: DownloadTypeFilter,
): AllDownloadsResponse {
  const now = Date.now()
  const all = Array.from(mockDownloads.values()).map(entry => toView(entry, now))
  all.push(...Object.values(FIXTURES))
  const downloads = type
    ? all.filter(d => d.downloadType === type || (type === 'PLAYLIST' && (d.downloadType === 'CURATED' || d.downloadType === 'RADIO')))
    : all
  downloads.sort((a, b) => Date.parse(b.requestedAt) - Date.parse(a.requestedAt))
  const start = (pageNumber - 1) * pageSize
  const page = downloads.slice(start, start + pageSize)
  return { downloads: page, totalPages: Math.ceil(downloads.length / pageSize) }
}

// --- Manual import: the files Soulseek found for a song ------------------
// Deterministic per task (seeded by the taskId), so the list is the same on every poll and after a
// reload, the way the server's cached search is. About forty rows mixing formats, bitrates, lengths,
// speeds, sharers and grades, in the server's order: grade first, then a free slot, then speed.

const MOCK_SHARERS = [
  'alice', 'bob_shares', 'vinylvault', 'DJ-Mixtape', 'lossless_lou', 'ritmo', 'tapehead', 'kmusic',
  'oldskool77', 'flacfan', 'mp3mike', 'soundhoard',
]
const MOCK_FOLDERS = ['Music', 'Musik\\Pop', 'Downloads\\soulseek', 'Shared\\Albums', 'Archive\\2009']

/** A small seeded random, so one task's list never changes between calls. */
function seeded(seed: string): () => number {
  let h = 2166136261
  for (let i = 0; i < seed.length; i++) h = Math.imul(h ^ seed.charCodeAt(i), 16777619)
  return () => {
    h = Math.imul(h ^ (h >>> 15), 2246822507); h = Math.imul(h ^ (h >>> 13), 3266489909)
    return ((h ^= h >>> 16) >>> 0) / 4294967296
  }
}

function mockCandidateList(song: DownloadSongView, taskId: string): SongCandidate[] {
  const rnd = seeded(taskId)
  const title = song.title ?? 'Untitled'
  const artist = song.artists[0] ?? 'Unknown Artist'
  const length = song.durationSeconds ?? 200
  const rows: SongCandidate[] = []
  for (let i = 0; i < 40; i++) {
    const sharer = MOCK_SHARERS[Math.floor(rnd() * MOCK_SHARERS.length)]
    const folder = MOCK_FOLDERS[Math.floor(rnd() * MOCK_FOLDERS.length)]
    const r = rnd()
    const extension = r < 0.4 ? 'flac' : r < 0.85 ? 'mp3' : 'm4a'
    const bitrateKbps = extension === 'flac' ? null : extension === 'm4a' ? 256 : [128, 192, 245, 256, 320][Math.floor(rnd() * 5)]
    const g = rnd()
    const grade: SongCandidate['grade'] = g < 0.7 ? 'EXACT' : g < 0.9 ? 'OTHER_VERSION' : 'UNVERIFIED'
    const suffix = grade === 'OTHER_VERSION' ? [' (Live)', ' (Remix)', ' (Acoustic)'][Math.floor(rnd() * 3)] : ''
    const name = grade === 'UNVERIFIED' ? `${title.toLowerCase().replace(/\s+/g, '_')}${suffix}` : `${String(1 + Math.floor(rnd() * 12)).padStart(2, '0')} - ${artist} - ${title}${suffix}`
    const seconds = grade === 'OTHER_VERSION' ? length + Math.floor(rnd() * 90) : length + Math.floor(rnd() * 5) - 2
    const freeRoll = rnd()
    rows.push({
      username: sharer,
      filename: `@@${sharer.slice(0, 4)}\\${folder}\\${artist}\\${name}.${extension}`,
      size: extension === 'flac' ? Math.round((25 + rnd() * 20) * 1024 * 1024) : Math.round(((bitrateKbps ?? 256) * 1000 / 8) * seconds),
      bitrateKbps,
      lengthSeconds: rnd() < 0.05 ? null : seconds,
      extension,
      uploadSpeed: rnd() < 0.08 ? null : Math.round((50 + rnd() * 4950) * 1024),
      freeSlot: freeRoll < 0.55 ? true : freeRoll < 0.9 ? false : null,
      queueLength: freeRoll < 0.55 ? 0 : Math.floor(rnd() * 30),
      grade,
      isCurrent: false,
    })
  }
  const gradeOrder = { EXACT: 0, OTHER_VERSION: 1, UNVERIFIED: 2 }
  rows.sort((a, b) => gradeOrder[a.grade] - gradeOrder[b.grade]
    || Number(b.freeSlot === true) - Number(a.freeSlot === true)
    || (b.uploadSpeed ?? 0) - (a.uploadSpeed ?? 0))
  return rows
}

/** The song behind a (download, task) pair: a fixture's row or the simulator's one song. */
function findMockSong(downloadId: string, taskId: string): DownloadSongView | undefined {
  return getMockDownloadDetail(downloadId).songs.find(s => s.taskId === taskId)
}

/** Mirrors GET /downloads/{id}/tasks/{taskId}/candidates. A song still searching answers SEARCHING; a
 *  song that failed for want of candidates answers NONE/NO_RESULTS; the rest get the list, with the
 *  row that matches the song's own file marked current (the server's first pick when no pick was
 *  made yet). 404 for unknown ids. */
export function getMockSongCandidates(downloadId: string, taskId: string): SongCandidatesResponse {
  const song = findMockSong(downloadId, taskId)
  if (!song) throw new ApiError('not found', 404, 'Not Found', { message: 'No such song in this download' })
  const query = song.title ?? 'Untitled'
  const base = { taskId, query, searchedAt: iso(FIXTURE_BOOT - 30000), songStage: song.stage }
  if (song.stage === 'QUEUED' || song.stage === 'STARTING' || song.stage === 'SEARCHING') {
    return { ...base, status: 'SEARCHING', reason: null, searchedAt: null, current: null, candidates: [] }
  }
  if (song.stage === 'FAILED' && song.failureCode === 'NO_CANDIDATES') {
    return { ...base, status: 'NONE', reason: 'NO_RESULTS', current: null, candidates: [] }
  }
  const list = mockCandidateList(song, taskId)
  // The server's own pick is the best-ranked row; a manual pick rewrote the song's file to one of these.
  const current = song.slskdFilename && song.slskdUsername
    ? list.find(c => c.username === song.slskdUsername && c.filename === song.slskdFilename) ?? (song.stage === 'FAILED' ? undefined : list[0])
    : undefined
  const candidates = list.map(c => ({ ...c, isCurrent: c === current }))
  return {
    ...base,
    status: 'READY',
    reason: null,
    current: current ? { username: current.username, filename: current.filename } : null,
    candidates,
  }
}

/** Mirrors POST /downloads/{id}/tasks/{taskId}/pick. The song restarts in place with the chosen file:
 *  a fixture song is rewritten (stage DOWNLOADING from 0 %, its parent reopened and re-tallied), a
 *  simulator song's clock is moved to the start of its transfer. 409 with the current card when the
 *  song is already downloaded and filed or the file is not in its list; 404 for unknown ids. */
export function pickMockSongCandidate(downloadId: string, taskId: string, body: { username: string; filename: string }): ActiveDownloadView {
  const song = findMockSong(downloadId, taskId)
  if (!song) throw new ApiError('not found', 404, 'Not Found', { message: 'No such song in this download' })
  const card = () => FIXTURES[downloadId] ?? toView(mockDownloads.get(downloadId)!, Date.now())
  if (song.stage === 'SUCCEEDED') throw new ApiError('conflict', 409, 'Conflict', card())
  const list = getMockSongCandidates(downloadId, taskId).candidates
  if (!list.some(c => c.username === body.username && c.filename === body.filename)) {
    throw new ApiError('conflict', 409, 'Conflict', card())
  }
  const now = Date.now()
  const fixture = FIXTURES[downloadId]
  if (fixture) {
    Object.assign(song, {
      slskdUsername: body.username, slskdFilename: body.filename, stage: 'DOWNLOADING', progressPercent: 0,
      failureCode: null, lastError: null, finishedAt: null, stageEnteredAt: iso(now), updatedAt: iso(now),
      candidateCount: 1, candidateIndex: 0,
    })
    const songs = FIXTURE_SONGS[downloadId]
    Object.assign(fixture, {
      stage: 'DOWNLOADING', finishedAt: null, updatedAt: iso(now), stageEnteredAt: iso(now),
      songsSucceeded: songs.filter(s => s.stage === 'SUCCEEDED').length,
      songsFailed: songs.filter(s => s.stage === 'FAILED').length,
      progressPercent: Math.round(songs.reduce((sum, s) => sum + (s.progressPercent ?? 0), 0) / songs.length),
    })
    return fixture
  }
  const entry = mockDownloads.get(downloadId)!
  mockPicks.set(taskId, body)
  entry.createdAt = now - T_READY_END
  entry.outcome = 'SUCCEEDED'
  persistMockDownloads()
  return toView(entry, now)
}
