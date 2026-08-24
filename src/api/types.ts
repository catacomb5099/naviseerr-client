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

export interface Download {
  downloadId: string
  songName: string
  status: DownloadStatus
  createdAt: string
}

export interface ActiveDownloadView {
  downloadId: string
  songName: string
  status: DownloadStatus
  progressPercent: number | null
  phaseEnteredAt: string
}

export interface ActiveDownloadsResponse {
  pollIntervalMs: number
  downloads: ActiveDownloadView[]
}
