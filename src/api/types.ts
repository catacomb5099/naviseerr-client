export interface Song {
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
  songs: Song[]
  albums: Album[]
  artists: Artist[]
}
