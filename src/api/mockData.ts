import { Song, Album, Artist, SearchResponse } from './types'

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

export const mockSongs: Song[] = [
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
  songs: mockSongs,
  albums: mockAlbums,
  artists: mockArtists
}

/**
 * Get mock data that matches a query (case-insensitive search)
 */
export function getMockSearchResults(query: string): SearchResponse {
  const lowerQuery = query.toLowerCase()

  // Filter results based on query
  const filteredSongs = mockSongs.filter(song =>
    song.name.toLowerCase().includes(lowerQuery) ||
    mockArtists.some(artist =>
      song.artists.includes(artist.id) &&
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
    tracks: filteredSongs,
    albums: filteredAlbums,
    artists: filteredArtists
  }
}
