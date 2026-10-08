import { apiClient } from './client'
import {
  SearchResponse, Track, Album, Artist, Playlist, Download, DownloadType, ActiveDownloadsResponse,
  ActiveDownloadView, DownloadsByIdResponse, DownloadDetailView, AllDownloadsResponse, DownloadTypeFilter,
  CollectionDetail, CollectionType, ArtistDetail, SongInfo, SuggestedPlaylist, SuggestedPlaylistsResponse,
  CuratorRun, StatusResponse, SongCandidatesResponse,
} from './types'
import {
  getMockSearchResults, getMockDownload, getMockActiveDownloads, getMockDownloadsByIds,
  getMockDownloadDetail, getMockAllDownloads, getMockCollection, getMockArtist, getMockSongInfo,
  getMockSuggestedPlaylists, getMockSuggestedPlaylist, requestMockSuggestedRefresh, getMockSuggestedRefresh,
  cancelMockDownload, retryMockDownload, getMockSongViews, getMockSongCandidates, pickMockSongCandidate,
} from './mockData'

// Toggle between mock and real API
export const USE_MOCK_DATA = false

/** How long a search result or a page (album, artist, playlist, song info) is reused for the same
 *  address: long enough for a browse and a Back, short enough that this week's new edition shows up
 *  in the same sitting. Downloads endpoints are not kept at all; their data has to stay live. */
const BROWSE_CACHE_MS = 5 * 60 * 1000

/** `fresh` asks the server again instead of reusing a kept answer: "Try again" and a repeated search. */
type Freshness = { fresh?: boolean }

/** `limit`: how many a category search returns. The server gives 20 unasked and at most 100; "Show more"
 *  asks again for more. */
type SearchOpts = Freshness & { limit?: number }

function categorySearch(query: string, category: 'tracks' | 'albums' | 'artists' | 'playlists', { limit, ...opts }: SearchOpts = {}) {
  const path = `/search/${encodeURIComponent(query)}/${category}${limit ? `?limit=${limit}` : ''}`
  return apiClient<SearchResponse>(path, { ...opts, cacheMs: BROWSE_CACHE_MS })
}


/**
 * Search all (songs, albums, artists, playlists)
 * GET /search/{query}
 */
export async function search(query: string, opts?: Freshness): Promise<SearchResponse> {
  if (USE_MOCK_DATA) {
    console.log(`[Mock] search called with query: ${query}`)
    return Promise.resolve(getMockSearchResults(query))
  }
  const data = await apiClient<SearchResponse>(`/search/${encodeURIComponent(query)}`, { ...opts, cacheMs: BROWSE_CACHE_MS })
  // Tolerate a server that predates playlists in the mixed response.
  return { ...data, playlists: data.playlists ?? [] }
}

/**
 * Search songs only
 * GET /search/{query}/tracks
 */
export async function searchSongs(query: string, opts?: SearchOpts): Promise<Track[]> {
  if (USE_MOCK_DATA) {
    console.log(`[Mock] searchSongs called with query: ${query}`)
    const results = getMockSearchResults(query)
    return Promise.resolve(results.tracks)
  }
  return (await categorySearch(query, 'tracks', opts)).tracks
}

/**
 * Search albums only
 * GET /search/{query}/albums
 */
export async function searchAlbums(query: string, opts?: SearchOpts): Promise<Album[]> {
  if (USE_MOCK_DATA) {
    console.log(`[Mock] searchAlbums called with query: ${query}`)
    return Promise.resolve(getMockSearchResults(query).albums)
  }
  return (await categorySearch(query, 'albums', opts)).albums
}

/**
 * Search artists only
 * GET /search/{query}/artists
 */
export async function searchArtists(query: string, opts?: SearchOpts): Promise<Artist[]> {
  if (USE_MOCK_DATA) {
    console.log(`[Mock] searchArtists called with query: ${query}`)
    const results = getMockSearchResults(query)
    return Promise.resolve(results.artists)
  }
  return (await categorySearch(query, 'artists', opts)).artists
}

/**
 * Search playlists only
 * GET /search/{query}/playlists
 */
export async function searchPlaylists(query: string, opts?: SearchOpts): Promise<Playlist[]> {
  if (USE_MOCK_DATA) {
    console.log(`[Mock] searchPlaylists called with query: ${query}`)
    return Promise.resolve(getMockSearchResults(query).playlists)
  }
  return (await categorySearch(query, 'playlists', opts)).playlists ?? []
}

/**
 * Expand an album or playlist to its tracks
 * GET /collections/{id}?type=ALBUM|PLAYLIST
 *
 * `id` must be the same id later posted to downloadCollection: the server keys the download by it.
 */
export async function getCollection(id: string, type: CollectionType, opts?: Freshness): Promise<CollectionDetail> {
  if (USE_MOCK_DATA) {
    console.log(`[Mock] getCollection called with id: ${id}, type: ${type}`)
    return Promise.resolve(getMockCollection(id, type))
  }
  return apiClient<CollectionDetail>(`/collections/${encodeURIComponent(id)}?type=${type}`, { ...opts, cacheMs: BROWSE_CACHE_MS })
}

/** A radio as the server sends it: a collection without the album-only year. */
type RadioView = Omit<CollectionDetail, 'type' | 'year'>

const asRadio = (radio: RadioView): CollectionDetail => ({ ...radio, type: 'RADIO', year: null })

/**
 * Start a radio: songs YouTube Music picks as like this song, album or playlist, saved by the server
 * under the radio's own id (YouTube makes a different list every time, so the saved one is what the
 * page shows and what a download gets). A new radio on every call.
 * POST /radios?seed={song, album or playlist id}  (404 when YouTube has no radio for it)
 */
export async function startRadio(seedId: string): Promise<CollectionDetail> {
  if (USE_MOCK_DATA) {
    console.log(`[Mock] startRadio called with seed: ${seedId}`)
    return Promise.resolve({ ...getMockCollection(seedId, 'PLAYLIST'), id: `radio-${seedId}`, type: 'RADIO', year: null })
  }
  return asRadio(await apiClient<RadioView>(`/radios?seed=${encodeURIComponent(seedId)}`, { method: 'POST' }))
}

/**
 * A radio started earlier, exactly as it was saved. It never changes, so it is kept like any page.
 * GET /radios/{id}  (404 for an id never started)
 */
export async function getRadio(id: string, opts?: Freshness): Promise<CollectionDetail> {
  if (USE_MOCK_DATA) {
    console.log(`[Mock] getRadio called with id: ${id}`)
    return Promise.resolve({ ...getMockCollection(id, 'PLAYLIST'), id, type: 'RADIO', year: null })
  }
  return asRadio(await apiClient<RadioView>(`/radios/${encodeURIComponent(id)}`, { ...opts, cacheMs: BROWSE_CACHE_MS }))
}

/**
 * An artist's page: header, top songs, albums, singles, playlists, similar artists
 * GET /artists/{channelId}  (404 for an id the adapter does not know)
 */
export async function getArtist(id: string, opts?: Freshness): Promise<ArtistDetail> {
  if (USE_MOCK_DATA) {
    console.log(`[Mock] getArtist called with id: ${id}`)
    return Promise.resolve(getMockArtist(id))
  }
  return apiClient<ArtistDetail>(`/artists/${encodeURIComponent(id)}`, { ...opts, cacheMs: BROWSE_CACHE_MS })
}

/**
 * One song's info page: header, album, numbers and credits
 * GET /songs/{videoId}  (404 for an id YouTube Music does not know)
 */
export async function getSongInfo(id: string, opts?: Freshness): Promise<SongInfo> {
  if (USE_MOCK_DATA) {
    console.log(`[Mock] getSongInfo called with id: ${id}`)
    return Promise.resolve(getMockSongInfo(id))
  }
  return apiClient<SongInfo>(`/songs/${encodeURIComponent(id)}`, { ...opts, cacheMs: BROWSE_CACHE_MS })
}

/**
 * How many times each video was viewed, for songs YouTube Music gives no play count (playlist songs)
 * GET /songs/views?ids=a,b,c  (at most 50 ids; an id with no answer is absent from the map)
 *
 * The server asks YouTube once per id, so a big list takes seconds: callers send it in chunks.
 */
export async function getSongViews(ids: string[], opts?: Freshness): Promise<Record<string, number>> {
  if (USE_MOCK_DATA) return Promise.resolve(getMockSongViews(ids))
  const data = await apiClient<Record<string, number>>(
    `/songs/views?ids=${ids.map(encodeURIComponent).join(',')}`, { ...opts, cacheMs: BROWSE_CACHE_MS })
  // apiClient returns `undefined` for a non-JSON (e.g. empty) response body.
  return data ?? {}
}

/**
 * The playlist curator's latest edition per category - what the "Made for you" shelf shows
 * GET /suggested-playlists
 */
export async function getSuggestedPlaylists(signal?: AbortSignal, opts?: Freshness): Promise<SuggestedPlaylistsResponse> {
  if (USE_MOCK_DATA) return Promise.resolve(getMockSuggestedPlaylists())
  const data = await apiClient<SuggestedPlaylistsResponse>('/suggested-playlists', { ...opts, signal, cacheMs: BROWSE_CACHE_MS })
  // apiClient returns `undefined` for a non-JSON (e.g. empty) response body.
  return data ?? { enabled: false, refreshDay: null, playlists: [] }
}

/**
 * One suggested playlist with every song
 * GET /suggested-playlists/{category}  (404 before the first edition; 503 on a server with no curator)
 */
export async function getSuggestedPlaylist(category: string, opts?: Freshness): Promise<SuggestedPlaylist> {
  if (USE_MOCK_DATA) return Promise.resolve(getMockSuggestedPlaylist(category))
  return apiClient<SuggestedPlaylist>(`/suggested-playlists/${encodeURIComponent(category)}`, { ...opts, cacheMs: BROWSE_CACHE_MS })
}

/**
 * "Make this week's playlists now": asks the server to run the curator. Answers at once with the run;
 * asking during a run returns that run.
 * POST /suggested-playlists/refresh  (503 on a server with no curator)
 */
export async function requestSuggestedRefresh(): Promise<CuratorRun> {
  if (USE_MOCK_DATA) return Promise.resolve(requestMockSuggestedRefresh())
  return apiClient<CuratorRun>('/suggested-playlists/refresh', { method: 'POST' })
}

/**
 * The most recent curator run, to follow one in progress
 * GET /suggested-playlists/refresh  (404 when the curator never ran)
 */
export async function getSuggestedRefresh(signal?: AbortSignal): Promise<CuratorRun> {
  if (USE_MOCK_DATA) return Promise.resolve(getMockSuggestedRefresh())
  return apiClient<CuratorRun>('/suggested-playlists/refresh', { signal })
}

/**
 * Download one song by YouTube videoId
 * POST /download/song/{videoId}
 */
export async function downloadSong(videoId: string): Promise<Download> {
  if (USE_MOCK_DATA) {
    console.log(`[Mock] downloadSong called with videoId: ${videoId}`)
    return Promise.resolve(getMockDownload(videoId, 'SONG'))
  }
  return apiClient<Download>(`/download/song/${encodeURIComponent(videoId)}`, { method: 'POST' })
}

/**
 * Download every track of an album or playlist, or every song of a suggested playlist's edition
 * POST /download/collection/{id}?type=ALBUM|PLAYLIST|CURATED
 *
 * For CURATED, `id` is the curator's category key, the same one GET /suggested-playlists/{category} takes.
 */
export async function downloadCollection(id: string, type: Exclude<DownloadType, 'SONG'>): Promise<Download> {
  if (USE_MOCK_DATA) {
    console.log(`[Mock] downloadCollection called with id: ${id}, type: ${type}`)
    return Promise.resolve(getMockDownload(id, type))
  }
  return apiClient<Download>(
    `/download/collection/${encodeURIComponent(id)}?type=${type}`, { method: 'POST' })
}

/**
 * One download with its per-song breakdown
 * GET /downloads/{id}  (404 for an unknown id; `songs` is [] before admission)
 */
export async function getDownloadDetail(
  downloadId: string,
  signal?: AbortSignal,
): Promise<DownloadDetailView> {
  if (USE_MOCK_DATA) return Promise.resolve(getMockDownloadDetail(downloadId))
  return apiClient<DownloadDetailView>(`/downloads/${encodeURIComponent(downloadId)}`, { signal })
}

/**
 * Every file Soulseek found for one song of a download, from the server's cached search - what the
 * "choose a file" table shows. Never cached here: the status moves while a search runs.
 * GET /downloads/{id}/tasks/{taskId}/candidates  (404 unknown download or song)
 */
export async function getSongCandidates(downloadId: string, taskId: string, signal?: AbortSignal): Promise<SongCandidatesResponse> {
  if (USE_MOCK_DATA) return Promise.resolve(getMockSongCandidates(downloadId, taskId))
  return apiClient<SongCandidatesResponse>(
    `/downloads/${encodeURIComponent(downloadId)}/tasks/${encodeURIComponent(taskId)}/candidates`, { signal })
}

/** The pick body: the sharer and the file EXACTLY as the candidates list gave them (slskd path, verbatim). */
export interface CandidatePick {
  username: string
  filename: string
}

/**
 * Download this file instead: the song's current transfer is cancelled and the song restarts in place
 * (same row) with only the chosen file. Reopens a finished download.
 * POST /downloads/{id}/tasks/{taskId}/pick  (202 with the fresh card; 409 with the current card when the song is
 * already downloaded and filed or the file is not in its list; 404 unknown)
 */
export async function pickSongCandidate(downloadId: string, taskId: string, body: CandidatePick): Promise<ActiveDownloadView> {
  if (USE_MOCK_DATA) return Promise.resolve(pickMockSongCandidate(downloadId, taskId, body))
  return apiClient<ActiveDownloadView>(
    `/downloads/${encodeURIComponent(downloadId)}/tasks/${encodeURIComponent(taskId)}/pick`,
    { method: 'POST', body: JSON.stringify(body) })
}

/**
 * Cancel a download, or one song of it
 * POST /downloads/{id}/cancel[?taskId=]  (200 with the fresh card; 409 with the current card when nothing was left to cancel; 404 unknown)
 */
export async function cancelDownload(id: string, taskId?: string): Promise<ActiveDownloadView> {
  if (USE_MOCK_DATA) return Promise.resolve(cancelMockDownload(id))
  const query = taskId ? `?taskId=${encodeURIComponent(taskId)}` : ''
  return apiClient<ActiveDownloadView>(`/downloads/${encodeURIComponent(id)}/cancel${query}`, { method: 'POST' })
}

/**
 * Retry a finished download (every song without a file starts again), or one failed song of any
 * download, even one still running
 * POST /downloads/{id}/retry[?taskId=]  (202 with the fresh card; 409 with the current card when there is nothing to retry; 404 unknown)
 */
export async function retryDownload(id: string, taskId?: string): Promise<ActiveDownloadView> {
  if (USE_MOCK_DATA) return Promise.resolve(retryMockDownload(id, taskId))
  const query = taskId ? `?taskId=${encodeURIComponent(taskId)}` : ''
  return apiClient<ActiveDownloadView>(`/downloads/${encodeURIComponent(id)}/retry${query}`, { method: 'POST' })
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

/**
 * Is the server's Soulseek client logged in? Polled with the downloads feed.
 * GET /status
 */
export async function getStatus(signal?: AbortSignal): Promise<StatusResponse> {
  if (USE_MOCK_DATA) {
    return Promise.resolve({ soulseek: { connected: true, loggedIn: true, state: 'Connected, LoggedIn', detail: null } })
  }
  return apiClient<StatusResponse>('/status', { signal })
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

/** Server-side default page size for GET /downloads/all. */
export const DEFAULT_DOWNLOADS_PAGE_SIZE = 20
/** Server-side default page for GET /downloads/all. 1-based: page 1 is the first page, not page 0. */
export const FIRST_DOWNLOADS_PAGE = 1

/**
 * Every download the server knows about, newest first, ignoring both the terminal filter and the
 * retention window - the Downloads page's seed, as opposed to /downloads/active's live window.
 * GET /downloads/all?pageSize=&pageNumber=&type=
 *
 * Both paging params are required server-side, so they are always sent, even when the caller wants
 * the server's own defaults - `pageNumber` is 1-based. `type` narrows to one kind of download and
 * pages within it; left out, the server answers with every kind.
 */
export async function getAllDownloads(
  page?: { pageSize?: number; pageNumber?: number; type?: DownloadTypeFilter },
  signal?: AbortSignal,
): Promise<AllDownloadsResponse> {
  const pageSize = page?.pageSize ?? DEFAULT_DOWNLOADS_PAGE_SIZE
  const pageNumber = page?.pageNumber ?? FIRST_DOWNLOADS_PAGE
  if (USE_MOCK_DATA) return getMockAllDownloads(pageSize, pageNumber, page?.type)
  const type = page?.type ? `&type=${page.type}` : ''
  const data = await apiClient<AllDownloadsResponse>(
    `/downloads/all?pageSize=${pageSize}&pageNumber=${pageNumber}${type}`, { signal })
  // apiClient returns `undefined` for a non-JSON (e.g. empty) response body.
  return data ?? { downloads: [], totalPages: 0 }
}
