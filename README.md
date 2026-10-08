# Naviseerr Client

React-based music search and download client with Spotify-inspired UI.

## Features

- Search for songs, albums, artists, and playlists
- Filter results by category (All, Songs, Albums, Artists, Playlists)
- Open an album or playlist and download one song or all of them
- Open an artist to see their top songs, albums, singles, the playlists they are featured on, and similar artists
- Artist names under songs and albums, on album pages and on the Downloads page open the artist's page; playlist authors stay plain text
- Press "i" on any song to see its details and credits before downloading
- Songs in search results, on artist pages, in albums and in suggested playlists show their YouTube Music play count; playlist songs, which YouTube gives no play count, show how many times their video was viewed
- A "Made for you" shelf shows the weekly suggested playlists the server's curator built, one row per era (all-time hits, then each decade); open one to see why each song is in, download a song, or download the whole playlist as one download
- Download a song by its YouTube id; the server works out what to fetch
- Downloads panel and history show server-resolved artwork and titles as they arrive
- On the Downloads page a failed song inside an album or playlist can be retried on its own, even while the rest of the collection is still downloading; cancelled songs can be retried the same way
- Download buttons know what you already asked for: grey "Downloading…" while it runs, "Downloaded" once you have it, and a click on a grey button opens the Downloads page instead of queuing it again; if the server already has something you ask for, the page says "Already downloading" / "You already have" and shows that download instead of an error
- An amber bar at the top says when you're offline or the server can't be reached, and a green "Back online." bar shows for 12 s once it returns; progress polling pauses while offline and slows down while the server is unreachable
- An amber strip across the top says "Not connected to Soulseek" while the server's Soulseek login is down; downloads wait until it is back
- On the Downloads page, the person icon on a song opens every audio file Soulseek returned for it (format, quality, length, size, sharer speed, queue, and Naviseerr's own verdict: Exact, Other version, Unverified or Not a match) as a sortable, filterable table; press Download on any row to fetch that file instead (a download already under way asks before it is replaced). The same icon on an album lists every sharer folder holding any of the album's songs, the ones Naviseerr's own search would take first and the rest marked "Not judged", each unfolding into its files, and takes the remaining songs from the folder you pick
- Responsive design for mobile and desktop
- Docker deployment

## Tech Stack

- React 18 + TypeScript
- Vite (build tool)
- Tailwind CSS + shadcn/ui
- Docker

## Development

### Prerequisites

- Node.js 20+
- npm or yarn

### Setup

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```

3. Create `.env` file:
   ```bash
   cp .env.example .env
   ```

4. Start dev server:
   ```bash
   npm run dev
   ```

5. Open http://localhost:5173

### Environment Variables

- `VITE_API_URL` - Backend API base URL (default: `http://localhost:8080`)

## Production

### Build

```bash
npm run build
```

`npm run check` runs the self-checks (`scripts/check-download-state.ts`, which pulls in the other `scripts/check-*.ts` files) with the installed tsc and node; there is no test framework.

Output: `dist/`

### Docker

The web app is part of naviseerr's all-in-one install: follow the
[Install](https://github.com/catacomb5099/naviseerr/tree/move-fast-break-things#install) section of the naviseerr README.

To build this image on its own:

```bash
docker build -t naviseerr-client .
```

It serves the app on port 80 and forwards `/api/*` to the server, which it expects to reach as
`naviseerr:8080` (the service name in naviseerr's compose file). The image checks its own health
(`docker compose ps` shows `healthy` once the app is served). `VITE_API_URL` is baked in when the
image is built (`/api`), so it cannot be changed when the container starts.

## Project Structure

```
src/
├── api/              # API client and endpoints
├── components/       # React components
│   ├── ui/           # shadcn components
│   └── *.tsx         # Custom components
├── lib/              # Utilities
├── App.tsx           # Main app
└── main.tsx          # Entry point
```

## Backend API

Expected endpoints:

- `GET /search/{query}` - Search all
- `GET /search/{query}/tracks` - Search songs only
- `GET /search/{query}/albums` - Search albums only
- `GET /search/{query}/artists` - Search artists only
- `GET /search/{query}/playlists` - Search playlists only
- `GET /collections/{id}?type=ALBUM|PLAYLIST` - Expand a collection to its tracks
- `GET /songs/{videoId}` - Details and credits for one song
- `GET /songs/views?ids=` - How many times each video was viewed (at most 50 ids)
- `POST /download/song/{videoId}` / `POST /download/collection/{id}?type=` - Trigger download
- `GET /downloads/active`, `GET /downloads?ids=`, `GET /downloads/{id}` - Download progress
- `GET /status` - Whether the server's Soulseek client is connected (polled with the downloads feed)
- `GET /downloads/all?pageSize=&pageNumber=&type=SONG|ALBUM|PLAYLIST` - Every download, paged, for the Downloads page; `type` is optional and narrows to one kind (PLAYLIST includes suggested playlists), with page counts per kind
- `GET /downloads/{id}/tasks/{taskId}/candidates` - Every file Soulseek found for one song, from the server's cached search
- `POST /downloads/{id}/tasks/{taskId}/pick` - Download this file for the song instead, replacing the current transfer in place
- `GET /downloads/{id}/album-candidates` - The sharers' folders holding a whole album, with the files each one has
- `POST /downloads/{id}/album-pick` - Take the album's remaining songs from this sharer's folder instead

## License

MIT
