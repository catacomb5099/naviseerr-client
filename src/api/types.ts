export interface Track {
  id: string
  iconURL: string
  streamURL: string
  name: string
  artists: string[]  // Artist display names, as the server sends them
  albumId: string
  year: number
}

export interface Album {
  id: string
  iconURL: string
  name: string
  artists: string[]  // Artist display names, as the server sends them
  year: number
}

export interface Artist {
  id: string
  iconUrl: string
  name: string
}

/** A YouTube Music playlist as a search result. `artists` holds the author's display name(s),
 *  like Track/Album artists - there is nothing to resolve. */
export interface Playlist {
  /** Bare "PL..." id. Use this same id for GET /collections/{id} and POST /download/collection/{id}. */
  id: string
  iconURL: string
  name: string
  artists: string[]
  /** The search endpoint does not populate this (always 0); GET /collections/{id} does. */
  trackCount: number
}

export interface SearchResponse {
  tracks: Track[]
  albums: Album[]
  artists: Artist[]
  playlists: Playlist[]
}

export type CollectionType = 'ALBUM' | 'PLAYLIST'
export type DownloadType = 'SONG' | CollectionType

/** One track inside a collection view. `id` is the YouTube videoId, `position` is 1-based. */
export interface CollectionTrack {
  id: string
  name: string
  artists: string[]
  iconURL: string | null
  durationSeconds: number | null
  position: number
}

/** GET /collections/{id}?type= - an album or playlist expanded to its downloadable tracks.
 *  `artists` are display names. Tracks the adapter marks unavailable are already filtered out. */
export interface CollectionDetail {
  id: string
  type: CollectionType
  name: string
  artists: string[]
  iconURL: string | null
  year: number | null
  /** Equals tracks.length. */
  trackCount: number
  tracks: CollectionTrack[]
}

// Keep Song as alias for backwards compatibility
export type Song = Track

export type DownloadStatus = 'PENDING' | 'IN_PROGRESS' | 'FAILED' | 'SUCCEEDED' | 'PARTIAL_SUCCESS'

/** The 202 body from POST /download/song/{videoId} and POST /download/collection/{id}. Carries
 *  the real downloadId, which is what lets the optimistic card be created under its final identity
 *  - no temporary id to reconcile when the feed first reports it. It carries NO title: the server
 *  resolves metadata after admission, so the optimistic card is filled from what the client knew. */
export interface Download {
  downloadId: string
  youtubeId: string
  downloadType: DownloadType
  status: DownloadStatus
  failureReason: string | null
  createdAt: string
  admittedAt: string | null
  finishedAt: string | null
}

/** The only vocabulary the client knows about a download's position. The server folds its
 *  own status and phase into this, so there is no combination of the two to get wrong here. */
export type DownloadStage =
  | 'QUEUED'
  | 'STARTING'
  | 'SEARCHING'
  | 'READY_TO_DOWNLOAD'
  | 'DOWNLOADING'
  | 'SUCCEEDED'
  | 'FAILED'
  /** Terminal. Collections only: some songs succeeded, some failed. */
  | 'PARTIAL_SUCCESS'

export type DownloadFailureCode =
  | 'SEARCH_FAILED'
  | 'NO_CANDIDATES'
  | 'SOURCES_EXHAUSTED'
  | 'TIMED_OUT'
  | 'TRANSFER_NOT_FOUND'
  | 'METADATA_UNAVAILABLE'

export interface ActiveDownloadView {
  downloadId: string
  youtubeId: string
  downloadType: DownloadType
  /** Null until the server has resolved metadata (i.e. while QUEUED). Null must never blank a
   *  title the client already has - see mergeCard. Same for `imageUrl` and an empty `artists`. */
  title: string | null
  artists: string[]
  imageUrl: string | null
  stage: DownloadStage
  /** 0-100, meaningful only while stage is DOWNLOADING. Null must never overwrite a
   *  previously observed value - see mergeCard in useActiveDownloads. */
  progressPercent: number | null
  /** 1 for a song; the resolved track count for a collection (0 before admission). */
  songCount: number
  songsSucceeded: number
  songsFailed: number
  requestedAt: string
  stageEnteredAt: string
  /** Recency sort key, and the only field that moves when nothing but progress changes. */
  updatedAt: string
  finishedAt: string | null
  /** A DownloadFailureCode, or null. Deliberately widened to string: rows the server wrote
   *  before it used codes hold free prose, and the UI falls back rather than assuming. */
  failureCode: string | null
}

/** One song inside a download, from GET /downloads/{id}. `position` is 1-based within a
 *  collection and null for a single song. */
export interface DownloadSongView {
  taskId: string
  youtubeId: string
  position: number | null
  title: string | null
  artists: string[]
  imageUrl: string | null
  durationSeconds: number | null
  stage: DownloadStage
  progressPercent: number | null
  failureCode: string | null
  stageEnteredAt: string
  updatedAt: string
  finishedAt: string | null
  candidateCount: number
  candidateIndex: number
  retryIndex: number
  slskdUsername: string | null
  slskdFilename: string | null
  lastError: string | null
}

/** GET /downloads/{id}. `songs` is empty until the download has been admitted. */
export interface DownloadDetailView {
  download: ActiveDownloadView
  songs: DownloadSongView[]
}

/** GET /downloads/all?pageSize=&pageNumber= */
export interface AllDownloadsResponse {
  downloads: ActiveDownloadView[]
  totalPages: number
}

export interface ActiveDownloadsResponse {
  pollIntervalMs: number
  /** How long the server keeps reporting a finished download. The client's auto-dismiss delay
   *  and its memory of what the user dismissed are both sized against this. */
  terminalRetentionMs: number
  downloads: ActiveDownloadView[]
}

export interface DownloadsByIdResponse {
  downloads: ActiveDownloadView[]
}
