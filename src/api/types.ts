export interface Track {
  id: string
  iconURL: string
  streamURL: string
  name: string
  artists: string[]  // List of artist IDs
  albumId: string
  year: number
}

export interface Album {
  id: string
  iconURL: string
  name: string
  artists: string[]  // List of artist IDs
  year: number
}

export interface Artist {
  id: string
  iconUrl: string
  name: string
}

export interface SearchResponse {
  tracks: Track[]
  albums: Album[]
  artists: Artist[]
}

// Keep Song as alias for backwards compatibility
export type Song = Track

export type DownloadStatus = 'PENDING' | 'IN_PROGRESS' | 'FAILED' | 'SUCCEEDED'

/** The 202 body from POST /download/{songName}. Carries the real downloadId, which is
 *  what lets the optimistic card be created under its final identity - no temporary id
 *  to reconcile when the feed first reports it. */
export interface Download {
  downloadId: string
  songName: string
  status: DownloadStatus
  createdAt: string
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

export type DownloadFailureCode =
  | 'SEARCH_FAILED'
  | 'NO_CANDIDATES'
  | 'SOURCES_EXHAUSTED'
  | 'TIMED_OUT'
  | 'TRANSFER_NOT_FOUND'

export interface ActiveDownloadView {
  downloadId: string
  songName: string
  stage: DownloadStage
  /** 0-100, meaningful only while stage is DOWNLOADING. Null must never overwrite a
   *  previously observed value - see mergeCard in useActiveDownloads. */
  progressPercent: number | null
  stageEnteredAt: string
  /** Recency sort key, and the only field that moves when nothing but progress changes. */
  updatedAt: string
  /** A DownloadFailureCode, or null. Deliberately widened to string: rows the server wrote
   *  before it used codes hold free prose, and the UI falls back rather than assuming. */
  failureCode: string | null
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
