export interface Track {
  id: string
  iconURL: string
  streamURL: string
  name: string
  artists: string[]  // Artist display names, as the server sends them
  /** The artist page id behind each `artists` entry, index-aligned; null where YouTube gave none.
   *  Absent from an older server: then every name is plain text. */
  artistIds?: (string | null)[]
  albumId: string
  year: number
  /** YouTube Music's combined play count in its own wording, e.g. "7.2M plays"; null when YouTube gave
   *  none (the search's Top result row never has one). */
  plays: string | null
}

export interface Album {
  id: string
  iconURL: string
  name: string
  artists: string[]  // Artist display names, as the server sends them
  /** Index-aligned with `artists`; null where YouTube gave none; absent from an older server. */
  artistIds?: (string | null)[]
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
  /** The author's channel id(s), index-aligned with `artists`, null for a fan-made playlist. Not used
   *  for links: a playlist's author is a channel, not an artist page. */
  artistIds?: (string | null)[]
  /** The search endpoint does not populate this (always 0); GET /collections/{id} does. */
  trackCount: number
}

export interface SearchResponse {
  tracks: Track[]
  albums: Album[]
  artists: Artist[]
  playlists: Playlist[]
  /** All only: the parts the server could not load ('mixed', 'albums', 'artists', 'playlists');
   *  absent from an older server and from the category searches. */
  unavailable?: string[] | null
}

export type CollectionType = 'ALBUM' | 'PLAYLIST'
/** What the collection page can show: an album, a playlist, or a saved radio (GET /radios/{id}). A
 *  'RADIO' download is that saved radio, keyed by the radio's own id; the server downloads exactly the
 *  saved songs. */
export type CollectionPageType = CollectionType | 'RADIO'
/** 'CURATED' is one edition of a suggested playlist, downloaded as ONE download: the id is the curator's
 *  category key (e.g. "80s-indie-pop"), not a YouTube id. It is not a CollectionType because
 *  GET /collections rejects it: a suggested playlist is read on GET /suggested-playlists/{category}. */
export type DownloadType = 'SONG' | CollectionType | 'CURATED' | 'RADIO'
/** `GET /downloads/all?type=`: the Downloads page's pills as the server takes them. No CURATED or
 *  RADIO: the server does accept them but there is no pill for either, and PLAYLIST already counts
 *  suggested playlists and radios in. A word the server has never heard of is a 400. */
export type DownloadTypeFilter = Exclude<DownloadType, 'CURATED' | 'RADIO'>

/** One track inside a collection view. `id` is the YouTube videoId, `position` is 1-based. */
export interface CollectionTrack {
  id: string
  name: string
  artists: string[]
  /** Index-aligned with `artists`; null where YouTube gave none; absent from an older server. */
  artistIds?: (string | null)[]
  iconURL: string | null
  durationSeconds: number | null
  /** YouTube's own wording, e.g. "28M plays". Only album tracks carry one; null for playlist tracks. */
  plays: string | null
  position: number
}

/** GET /collections/{id}?type= - an album or playlist expanded to its downloadable tracks.
 *  `artists` are display names. Tracks the adapter marks unavailable are already filtered out. */
export interface CollectionDetail {
  id: string
  type: CollectionPageType
  name: string
  artists: string[]
  /** Index-aligned with `artists`; null where YouTube gave none; absent from an older server and from
   *  a saved radio. */
  artistIds?: (string | null)[]
  iconURL: string | null
  year: number | null
  /** Equals tracks.length. */
  trackCount: number
  tracks: CollectionTrack[]
  /** What YouTube Music plays this as: an album's OLAK5uy_ id, a playlist's bare id. Absent from an
   *  older server; null when YouTube gave none. */
  playlistId?: string | null
}

/** GET /artists/{id} - an artist's page: header plus the shelves YouTube Music shows. Every list is
 *  present (empty, never null) and capped at 10 by the server, in YouTube Music's own order. */
export interface ArtistDetail {
  id: string
  name: string
  /** "" when none. */
  iconURL: string
  description: string | null
  /** YouTube's own wording without the noun, e.g. "498K"; null when unknown. */
  subscribers: string | null
  /** `albumId` is always "" here: the server names the song's album but has no id for it. */
  topSongs: Track[]
  albums: Album[]
  singles: Album[]
  /** YouTube Music's own featured playlists linked to the artist, minus those titled after the artist or a
   *  related artist (those are effectively "best of" lists, not appearances). */
  playlists: Playlist[]
  /** `iconUrl` is the related artist's largest thumbnail, passed through by the adapter since 28-09-2026;
   *  "" only from an older adapter (the card then shows a plain disc). */
  similarArtists: Artist[]
}

/** An artist (`id` = channel id) or an album (`id` = browse id) named on a song's info page; the id
 *  is null when YouTube Music has no page for it, so the name is shown as plain text. */
export interface SongRef {
  id: string | null
  name: string
}

/** GET /songs/{videoId} - one song's info page: header, album, a few numbers and the credits
 *  YouTube Music lists. Resolved live; 404 for an unknown id. */
export interface SongInfo {
  id: string
  name: string
  artists: SongRef[]
  /** null for an official-video id: YouTube Music knows no album for those. */
  album: SongRef | null
  durationSeconds: number | null
  year: number | null
  /** YouTube Music's combined play count in its wording, e.g. "1.7B plays": the same number the song lists
   *  show. Null when YouTube gave none. */
  plays: string | null
  /** How many times this one video or upload was played, a smaller number than `plays` (Wonderwall:
   *  "1.7B plays", viewCount 97,645,262), so it is shown as views, never as plays. */
  viewCount: number | null
  /** "" when none. */
  iconURL: string
  /** null when unknown (official videos), not false. */
  explicit: boolean | null
  /** `role` is YouTube's own heading ("Written by", "Produced by"), rendered verbatim. Empty when
   *  YouTube Music lists none. */
  credits: { role: string; names: string[] }[]
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
  /** naviseerr's Soulseek client (slskd) is not logged in, so nothing could be searched. */
  | 'SOULSEEK_OFFLINE'
  /** The user stopped it. Comes with stage FAILED; shown in grey, not red. */
  | 'CANCELLED'

export interface ActiveDownloadView {
  downloadId: string
  youtubeId: string
  downloadType: DownloadType
  /** Null until the server has resolved metadata (i.e. while QUEUED). Null must never blank a
   *  title the client already has - see mergeCard. Same for `imageUrl` and an empty `artists`. */
  title: string | null
  artists: string[]
  /** YouTube Music channel ids, index-aligned with `artists`; null where the server has no page to
   *  link to. Absent, empty or shorter than `artists` on rows written before the server kept ids,
   *  so a missing entry reads as null. */
  artistIds?: (string | null)[]
  imageUrl: string | null
  stage: DownloadStage
  /** 0-100, meaningful only while stage is DOWNLOADING. Null must never overwrite a
   *  previously observed value - see mergeCard in useActiveDownloads. */
  progressPercent: number | null
  /** 1 for a song; the resolved track count for a collection (0 before admission). */
  songCount: number
  songsSucceeded: number
  songsFailed: number
  /** Songs the user stopped. Kept apart from songsFailed so the card never calls the user's own
   *  action a failure. Absent from an older server; read as 0. */
  songsCancelled?: number
  requestedAt: string
  stageEnteredAt: string
  /** Moves on every write, progress included; mergeCard reads it to tell a retry from a stale row.
   *  Not the order key: lists order by requestedAt, so a retry does not move a download. */
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
  /** Index-aligned with `artists`, like ActiveDownloadView.artistIds; absent on older rows. */
  artistIds?: (string | null)[]
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

/** GET /downloads/all?pageSize=&pageNumber=&type= - `totalPages` counts pages of the type asked for. */
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

/** GET /suggested-playlists - the playlist curator's latest edition per category. `enabled` is false on an
 *  install with no curator configured, so the section is hidden rather than shown empty; with a curator
 *  and nothing built yet the list is empty and `enabled` is true. */
export interface SuggestedPlaylistsResponse {
  enabled: boolean
  /** The weekday the weekly refresh runs, e.g. "MONDAY"; null when the server's schedule is not one plain
   *  weekday. Lets the shelf say "New edition every Monday". */
  refreshDay: string | null
  playlists: SuggestedPlaylistSummary[]
}

/** POST and GET /suggested-playlists/refresh: the curator's own record of a run - "make this week's
 *  playlists". Building takes minutes; `final` is true once the run is over, whatever the outcome. */
export interface CuratorRun {
  runId: string
  /** 'queued' | 'running' | 'succeeded' | 'partial' (some categories got a playlist) | 'failed'. Widened
   *  to string; `final` is the flag to branch on. */
  status: string
  requestedAt: string
  startedAt: string | null
  finishedAt: string | null
  final: boolean
  categories: CuratorCategoryResult[]
}

/** One category inside a run. `status` is 'queued' | 'running' | 'written' | 'exists' | 'no_albums' |
 *  'thin_pool' | 'error'; `message` is the curator's plain-language line. See categoryStatusCopy. */
export interface CuratorCategoryResult {
  key: string
  status: string
  editionDate: string | null
  trackCount: number | null
  message: string | null
}

export interface SuggestedPlaylistSummary {
  /** The curator's category key, e.g. "80s-indie-pop"; the id for GET /suggested-playlists/{category}. */
  category: string
  title: string
  /** The category's Discogs year range as the curator has it: "1980-1989", or "1950-2026" for an all-time
   *  list. Null (or absent, from an older server) when unknown; see eraOf. */
  year: string | null
  /** YYYY-MM-DD, the day this edition was built. */
  editionDate: string
  trackCount: number
}

/** One song of a suggested playlist. `id` is the YouTube videoId, the same id Track carries, so the info
 *  pop-up and POST /download/song work on it unchanged. `iconURL` is YouTube's predictable thumbnail:
 *  the curator stores no artwork. */
export interface SuggestedTrack {
  id: string
  name: string
  artists: string[]
  album: string | null
  albumYear: number | null
  /** The YouTube Music play count the pick was based on; null when unknown. */
  popularity: number | null
  /** Why it is in: 'top' (one of the most played in the pool), 'mid' (middle of the pack, one per artist
   *  and album) or 'random' (a discovery). Widened to string: the curator may add tiers; see tierCopy. */
  tier: string
  /** The curator's one-line explanation, e.g. "#23 of 1036 by plays". */
  reason: string | null
  iconURL: string
  /** 1-based, the curator's order. */
  position: number
}

/** GET /suggested-playlists/{category} - one edition with every song. `filters` are the Discogs filters
 *  behind the category (year, style, genre) for a one-line description. 404 when there is no edition yet,
 *  503 when this server has no curator, 502 when the curator is unreachable. */
export interface SuggestedPlaylist {
  category: string
  title: string
  filters: Record<string, string>
  editionDate: string
  trackCount: number
  tracks: SuggestedTrack[]
}

/** GET /status - is the server's Soulseek client logged in? `state` is slskd's own word ("None" before
 *  it has ever tried to connect, "Disconnected", "Connected, LoggedIn"), or UNREACHABLE when slskd itself
 *  cannot be reached, `detail` saying why. The strip keys on `loggedIn`. */
export interface StatusResponse {
  soulseek: { connected: boolean; loggedIn: boolean; state: string; detail: string | null }
}

// --- Manual import: the files Soulseek found for a song -------------------

export type CandidateStatus = 'READY' | 'SEARCHING' | 'NONE'
/** The server's verdict on a file: NONE is a file its matcher calls another song, listed anyway (every option, 08-10-2026). */
export type CandidateGrade = 'EXACT' | 'OTHER_VERSION' | 'UNVERIFIED' | 'NONE'

/** One file a Soulseek user shares that matched the song's search. `filename` is slskd's full path,
 *  verbatim (backslashes, share alias and all): shown as its name over its folder, sent back unchanged on a pick. */
export interface SongCandidate {
  username: string
  filename: string
  /** Bytes. */
  size: number
  /** slskd's bitRate; null for lossless files and when unknown. */
  bitrateKbps: number | null
  lengthSeconds: number | null
  /** Lower-case, taken from the file name's suffix (slskd's own extension field is unreliable). */
  extension: string
  /** Bytes per second as slskd reports; null when unknown. */
  uploadSpeed: number | null
  /** null when unknown. */
  freeSlot: boolean | null
  queueLength: number
  grade: CandidateGrade
  isCurrent: boolean
}

/** GET /downloads/{id}/tasks/{taskId}/candidates - every audio file the song's Soulseek search returned, uncapped,
 *  in the server's ranking: the files that are the song first, the NONE ones last. `candidates` is empty while SEARCHING and with NONE; `reason` says why
 *  there is nothing: BEFORE_CACHE (searched before lists were kept), NO_RESULTS, ALREADY_IN_LIBRARY. */
export interface SongCandidatesResponse {
  taskId: string
  status: CandidateStatus
  reason: string | null
  /** What Soulseek was asked for (the title alone); null when never searched. */
  query: string | null
  searchedAt: string | null
  songStage: DownloadStage
  /** The file being (or last) downloaded, or null. */
  current: { username: string; filename: string } | null
  candidates: SongCandidate[]
}

/** One of the album's songs as a sharer's folder holds it. `index` is the album position. */
export interface AlbumFolderFile {
  index: number
  taskId: string
  /** The file's basename inside the folder. */
  name: string
  title: string
  size: number
  bitrateKbps: number | null
  lengthSeconds: number | null
  extension: string
}

/** One sharer's folder holding (most of) the album. `folder` is slskd's full directory path, verbatim:
 *  shown as its name over the folder it sits in, sent back unchanged on a pick. */
export interface AlbumFolder {
  username: string
  folder: string
  /** How many of this album's songs the folder holds. */
  fileCount: number
  totalSize: number
  uploadSpeed: number | null
  freeSlot: boolean | null
  queueLength: number
  /** Other audio files in the folder (a deluxe-edition hint). */
  extras: number
  /** How many of the album's songs come from this folder now, finished ones included. */
  songsCurrent: number
  isCurrent: boolean
  /** Whether Naviseerr's own album search would take this folder; false for one listed only for a person to
   *  choose (too few of the album's songs, no artist in its path, a low bit rate, a sharer that stalls). */
  judged: boolean
  files: AlbumFolderFile[]
}

/** GET /downloads/{id}/album-candidates - every folder the album's Soulseek search found holding any of its
 *  songs, uncapped, the judged ones first.
 *  `reason` with NONE: NO_WHOLE_FOLDER (songs were searched one by one), BEFORE_CACHE, NO_ALBUM_SEARCH.
 *  409 NOT_AN_ALBUM for a playlist or radio. */
export interface AlbumCandidatesResponse {
  downloadId: string
  status: CandidateStatus
  reason: string | null
  query: string | null
  searchedAt: string | null
  songCount: number
  folders: AlbumFolder[]
}
