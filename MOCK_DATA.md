# Mock Data Documentation

## Overview

Mock data has been added to enable frontend development and testing without requiring the backend API to be running. The mock data is based on a real Last.fm API response for "jay sean" queries.

## Files

- **`src/api/mockData.ts`** - Contains all mock data and helper functions
- **`src/api/endpoints.ts`** - Updated to use mock data when `USE_MOCK_DATA = true`

## Enabling/Disabling Mock Data

In `src/api/endpoints.ts`, set the flag:

```typescript
const USE_MOCK_DATA = true  // Use mock data
const USE_MOCK_DATA = false // Use real backend API
```

## Mock Data Structure

### Artists (3 total)

```json
{
  "id": "artist-1",
  "iconUrl": "https://lastfm.freetls.fastly.net/i/u/300x300/2a96cbd8b46e442fc41c2b86b821562f.png",
  "name": "Jay Sean"
}
```

- `artist-1`: Jay Sean
- `artist-2`: Lil Wayne
- `artist-3`: Sean Paul

### Albums (4 total)

```json
{
  "id": "album-1",
  "iconURL": "https://lastfm.freetls.fastly.net/i/u/300x300/2a96cbd8b46e442fc41c2b86b821562f.png",
  "name": "All or Nothing",
  "artists": ["Jay Sean"],
  "year": 2009
}
```

Albums:
- `album-1`: All or Nothing (2009)
- `album-2`: My Own Way (2008)
- `album-3`: Neon (2013)
- `album-4`: Me Against Myself (2004)

### Songs (10 total)

```json
{
  "id": "song-1",
  "iconURL": "https://lastfm.freetls.fastly.net/i/u/300x300/2a96cbd8b46e442fc41c2b86b821562f.png",
  "streamURL": "https://www.last.fm/music/Jay+Sean/_/Down",
  "name": "Down",
  "artists": ["Jay Sean", "Lil Wayne"],
  "albumId": "album-1",
  "year": 2009
}
```

Songs include:
1. **Down** (feat. Lil Wayne) - All or Nothing (2009)
2. **Ride It** - My Own Way (2008)
3. **Do You Remember** (feat. Sean Paul) - All or Nothing (2009)
4. **Maybe** - Me Against Myself (2004)
5. **Stay** - Me Against Myself (2004)
6. **Tonight** - All or Nothing (2009)
7. **Cry** - All or Nothing (2009)
8. **War** - Neon (2013)
9. **Fire** - Neon (2013)
10. **2012 (It Ain't the End)** - Neon (2013)

### Playlists (1 total)

`PLmock-jay-sean-essentials`: Jay Sean Essentials (4 tracks). `artists` holds the author's name.

### Collections and downloads

- `getMockCollection(id, type)` - any album id expands to that album; anything else is the mock
  playlist. Both list the four "All or Nothing" tracks.
- `getMockDownload(id, type)` - starts a time-based simulated download (SONG, ALBUM or PLAYLIST)
  that walks every stage; metadata is null while QUEUED, like the real server.
- Two static fixtures are always in `/downloads/active`: an ALBUM at DOWNLOADING (4 songs, 2 done,
  1 failed) and a PLAYLIST that ended PARTIAL_SUCCESS. `getMockDownloadDetail(id)` returns the
  album fixture with its 4 per-song rows; other ids return `songs: []`.

## API Endpoints with Mock Data

### `/search/{query}` - Search All

Returns all songs, albums, artists and playlists matching the query.

**Example:** Search for "jay" returns all Jay Sean content
**Example:** Search for "down" returns the song "Down"
**Example:** Search for "2009" returns songs/albums from 2009

```typescript
const results = await search('jay')
// Returns: { tracks: Track[], albums: Album[], artists: Artist[], playlists: Playlist[] }
```

### `/search/{query}/songs` - Songs Only

Returns only songs matching the query.

```typescript
const songs = await searchSongs('down')
// Returns: [{ id: 'song-1', name: 'Down', ... }]
```

### `/search/{query}/albums` - Albums Only

Returns only albums matching the query.

```typescript
const albums = await searchAlbums('neon')
// Returns: [{ id: 'album-3', name: 'Neon', year: 2013, ... }]
```

### `/search/{query}/artists` - Artists Only

Returns only artists matching the query.

```typescript
const artists = await searchArtists('jay')
// Returns: [{ id: 'artist-1', name: 'Jay Sean', ... }]
```

## Search Functionality

The mock data includes a smart search function that filters by:
- Song name
- Album name
- Artist name
- Songs by artist (if artist name matches query)
- Albums by artist (if artist name matches query)

All searches are case-insensitive.

## Testing Scenarios

### Scenario 1: Search for "jay"
- **Songs**: All 10 songs (all by Jay Sean)
- **Albums**: All 4 albums (all by Jay Sean)
- **Artists**: Jay Sean

### Scenario 2: Search for "down"
- **Songs**: "Down"
- **Albums**: None
- **Artists**: None

### Scenario 3: Search for "2009"
- **Songs**: Down, Do You Remember, Tonight, Cry
- **Albums**: All or Nothing
- **Artists**: None

### Scenario 4: Search for "lil"
- **Songs**: Down (feat. Lil Wayne)
- **Albums**: None
- **Artists**: Lil Wayne

## Original Last.fm Response Structure

The mock data was created from a Last.fm API track search response with this structure:

```json
{
  "results": {
    "trackmatches": {
      "track": [
        {
          "name": "Down",
          "artist": "Jay Sean",
          "url": "https://www.last.fm/music/Jay+Sean/_/Down",
          "streamable": "0",
          "listeners": "949302",
          "image": [
            { "#text": "...", "size": "small" },
            { "#text": "...", "size": "medium" },
            { "#text": "...", "size": "large" },
            { "#text": "...", "size": "extralarge" }
          ],
          "mbid": ""
        }
      ]
    }
  }
}
```

### Mapping from Last.fm to Our Schema

| Last.fm Field | Our Field | Notes |
|---------------|-----------|-------|
| `mbid` or generated | `id` | Generated IDs (song-1, album-1, artist-1) |
| `image[3]["#text"]` | `iconURL` / `iconUrl` | Used "extralarge" (300x300) |
| `url` | `streamURL` | Last.fm track URL |
| `name` | `name` | Direct mapping |
| `artist` (string) | `artists` (array) | Converted to an array of display names, as the real server sends them |
| N/A | `albumId` | Generated based on logical album grouping |
| N/A | `year` | Added based on known release years |

## Adding More Mock Data

To add more mock data:

1. **Add Artists** to `mockArtists` array
2. **Add Albums** to `mockAlbums` array (`artists` are display names)
3. **Add Songs** to `mockTracks` array (`artists` are display names; reference album IDs)

Ensure IDs are unique and album relationships are maintained through `albumId`.

## Switching to Real Backend

When the backend is ready:

1. Set `USE_MOCK_DATA = false` in `src/api/endpoints.ts`
2. Ensure backend is running and `VITE_API_URL` is set correctly in `.env`
3. Test each endpoint to ensure response format matches TypeScript types

The frontend expects the backend to return data in this exact structure:

```typescript
interface SearchResponse {
  tracks: Track[]
  albums: Album[]
  artists: Artist[]
  playlists: Playlist[]
}
```

Make sure your Spring backend matches these types!
