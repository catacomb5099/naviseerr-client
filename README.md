# Naviseerr Client

React-based music search and download client with Spotify-inspired UI.

## Features

- Search for songs, albums, artists, and playlists; a playlist card says how many times the playlist was viewed on YouTube Music ("375K views", YouTube's own words) where YouTube Music's own search row shows it; album cards show no count, as on YouTube Music
- Filter results by category (All, Songs, Albums, Artists, Playlists)
- Open an album or playlist and download one song or all of them; a playlist's header also says how many times it was viewed on YouTube Music, in YouTube's own words, when YouTube Music shows a count for it
- Open an artist to see their top songs, albums, singles, the playlists they are featured on, and similar artists
- Artist names under songs and albums, on album pages and on the Downloads page open the artist's page; playlist authors stay plain text
- Press "i" on any song to see its details and credits before downloading
- Songs in search results, on artist pages, in albums and in suggested playlists show their YouTube Music play count; playlist songs, which YouTube gives no play count, show how many times their video was viewed
- A "Made for you" shelf shows the weekly suggested playlists the server's curator built, one row per era (all-time hits, then each decade); open one to see why each song is in, download a song, or download the whole playlist as one download
- Download a song by its YouTube id; the server works out what to fetch
- Downloads panel and history show server-resolved artwork and titles as they arrive
- On the Downloads page a failed song inside an album or playlist can be retried on its own, even while the rest of the collection is still downloading; cancelled songs can be retried the same way
- Download buttons know what you already asked for: grey "Downloading…" while it runs, "Downloaded" once you have it, and a click on a grey button opens the Downloads page instead of queuing it again; if the server already has something you ask for, the page says "Already downloading" / "You already have" and shows that download instead of an error; a finished row on the Downloads page has a "Download again" button for when the files have since gone (deleted, moved), which asks for the same item once more as a new download
- When YouTube Music cannot be reached, or is rate-limiting the server, the search page, artist pages, album and playlist pages, the song pop-up and the Start radio button say so in the server's own words ("YouTube Music is not answering right now. Try again in a minute.") instead of a bare "Couldn't load"
- An amber bar at the top says when you're offline or the server can't be reached, and a green "Back online." bar shows for 12 s once it returns; progress polling pauses while offline and slows down while the server is unreachable
- On the Downloads page, the person icon on a song opens every audio file Soulseek returned for it as a sortable, filterable table: the file's name with the sharer's whole folder path under it (both wrap, so nothing is ever cut; a Folder button in the header sorts by the path to keep one sharer's folder together), format and quality in one column ("FLAC · Lossless", "MP3 · 320 kbps"), length, size, sharer speed, queue, and Naviseerr's own verdict (Exact, Other version, Unverified or Not a match); press Download on any row to fetch that file instead (a download already under way asks before it is replaced). The same icon on an album lists every sharer folder holding any of the album's songs, the whole folder path first, the ones Naviseerr's own search would take before the rest marked "Not judged", each unfolding into its files, and takes the remaining songs from the folder you pick. On a phone the same two lines wrap in a narrower cell and nothing hides under the Download button
- When that pop-up has no list, it says what really happened to the search and when (slskd refused it, the song was never searched on its own because the album's folder supplied its file, it was searched before lists were kept on 8 October 2026 or its search never completed, it was cancelled) and names slskd's own search id and time, so you can find that search in slskd's Searches page
- A "Search Soulseek for" box under the pop-up's header, prefilled with the words Naviseerr searched with, lets you type your own Soulseek search for the song when those words missed; Enter runs it, the pop-up says "Searching Soulseek for …" for a few seconds, and the same table then shows what that search found, any row of which can be picked; the same box in the album pop-up searches for the whole album and lists every sharer folder that search found
- Where the search can be run again (a failed song, a finished album), a Try again button in that pop-up does just that: the row underneath restarts, the pop-up says "Still searching Soulseek", and the list fills in on its own when the search finishes (for an album the server looks for a whole-album sharer again first); a song or album still live gets a note instead
- An amber strip across the top says "Not connected to Soulseek as <username>" while the server's Soulseek login is down (the account name when the server knows it, so a taken or mistyped name is recognisable from the strip); downloads wait until it is back
- Settings → Soulseek (the gear at the top right of every page, `/settings`, also the strip's "Fix" link) shows the Soulseek account this install logs in with: the one made up for you, with its password behind a Show button so you can write it down (it cannot be reset), or the one you chose; says whether Soulseek accepted it; and lets you switch to your own account, with Soulseek's name rules as helper text and "Checking with Soulseek…" for up to 30 s after Save, then "Connected to Soulseek as X", the plain sentence that the login was not accepted, or that the Soulseek client is not answering; when the compose file sets the account, the page says a change here lasts only until the next restart and which two values to clear. The wording follows Jellyfin's first-run wizard and Navidrome's single admin step
- A second amber strip says "Downloads cannot be filed into your music library" with the server's reason (the folder is missing, or cannot be written to) while that is so; finished songs wait in Soulseek's download folder until it is fixed, so "Downloaded" is never silently untrue
- A third amber strip says "YouTube Music isn't answering — search won't work and new downloads will wait until it is back" while the server cannot reach YouTube Music (its helper is down, or YouTube is unreachable from it); it clears by itself within about a minute of YouTube Music answering again
- Responsive design for mobile and desktop: on a phone the active-downloads panel is a bottom sheet that starts folded and leaves the page room, list rows give the title the width (smaller art, status under the title, no duration), every button is at least 40 px and no text is smaller than 12 px
- Settings (the gear top right, or `/settings`), with a Login section to connect your Authentik (19-10-2026): Authentik address, Client ID, Client secret (never shown again), the Redirect URL to paste into Authentik with a Copy button, "Save and test" (the server reads Authentik's OpenID configuration first and says in plain words what to fix), and a successful Save and test turns the login on at once (19-10-2026 22:40: the section then says "The login is on. Sign in to carry on." with the Continue with Authentik button, which brings you back to the same page signed in); "Turn off Authentik login" opens the app again, and Save and test turns it back on. The fields follow Immich's OAuth settings; the check follows Audiobookshelf's "Auto-populate"
- Log in with Authentik (19-10-2026): once Authentik is connected (Save and test succeeded), every visitor sees a login screen with one button, "Continue with Authentik" (Immich's "Login with OAuth", Grafana's "Sign in with ..."), lands back on the page they opened, stays signed in for 30 days per device, and has a "Log out" button top right; any API answer of 401 brings the login screen back. Against an install with no login on, or a server from before the login existed, nothing is asked and no button is shown
- First-run setup (19-10-2026): the first time the web app opens on a new install (after the Authentik login, when one is on) it asks one question per screen, like a new phone, instead of showing Search: the download quality, your Soulseek account (keep the one made up for you, or type your own), which app plays your music, the weekly playlists and the internet login; every screen has one line of help and either a "Not sure? Skip for now" link that keeps the default or, where the screen's own controls are the choice, a Next that does the same, and the last screen says what was set and where music lands before Finish opens the app. The server remembers that it was finished, so no other device sees it again; everything it asked is under Settings. Follows Jellyfin's setup wizard (the account first, "You're Done!" last) and Home Assistant's "You can always change this later in the settings". A server from before the setup existed shows nothing new
- Settings → Music app, and the setup's third screen "Which app plays your music?" (19-10-2026): pick Navidrome or Jellyfin (or Neither), type its address and login (Navidrome: an admin username and password; Jellyfin: an API key), press "Save and test": the server asks that app for one rescan with those values and keeps them only when it worked, saying in plain words what to fix otherwise ("Could not reach 192.168.1.10:4533: Connection refused…", "Navidrome refused the username or password."); from then on it asks that app to rescan the moment a song or playlist lands, no restart. The saved state reads the app's last outcome, with Change and Remove; values that come from the install file's lines say so. Sonarr's "Test" on a download client is the model; Immich's help that names the outside service
- Settings → Suggested playlists, and the setup's fourth screen "Want a fresh set of playlists every week?" (19-10-2026): one switch, "Make weekly playlists for me", off for a new install. Switching it on starts the first set at once (about 90 minutes) and the "Made for you" shelf appears when it is ready; off, no playlists are made and the shelf stays hidden. The server says in one sentence what each flip did (when the playlist maker is not answering, that no first set was started and the weekly run will try again). On an install with no playlist maker the switch is disabled and says so. Home Assistant's analytics opt-in is the model (off by default, one line of help, Next keeps your answer: this screen has no separate Skip link, since Next with the switch off is the skip)
- The setup's fifth and last question, "Will you reach naviseerr from outside your home?" (19-10-2026): a short plain-words note on why an app reachable from the internet needs a login in front (bots and strangers can hammer search until YouTube Music blocks your server, fill your disk with downloads and read your whole library), then two buttons: "Continue with Authentik" opens the same Authentik fields Settings → Login has (address, Client ID, Client secret, the Redirect URL to copy, Save and test, which turns the login on, then the sign-in), "Not now, it stays open" moves on with no login. Never a silent Next, and no Skip link: the second button is the skip. After a successful Save and test the login is on and the one way on is "Continue with Authentik" (no Skip, no Next until you are signed in); back from Authentik the screen says the login is on and offers Next. Jellyfin's "Set up Remote Access" (last step, one choice) is the position; Home Assistant's analytics question the explicit two-way choice; the Authentik screen itself is unchanged
- Use your own slskd (19-10-2026): the Soulseek screen of the setup, and Settings → Soulseek, have a third choice next to "Keep it" and "Use my own account": "Use my own slskd", for people who already run a Soulseek client. Type its address and API key, press "Save and test": the server asks that slskd who it is and, when it answers, talks to it from then on (searches, downloads, the status strip), no restart; one line of help says the one thing that matters, that naviseerr must see that slskd's downloads folder (point the install file's downloads volume at it) or nothing is filed, and that downloads under way when you switch fail within a minute and can be retried. The section then shows your slskd's address with Change and "Back to the bundled slskd". Sonarr keeps "your own download client" in Settings the same way
- Settings → Download quality, and the setup's first screen "What quality do you want your music in?" (19-10-2026): five rows, Spotify's Audio quality words with the bit rate under each (Low, about 128 kbit/s; Normal, about 192; High, about 256; Very high, about 320; Lossless, FLAC and other lossless files). Pressing a row saves it at once; from then on every download, songs, albums and playlists alike, looks for files at that quality first and, when Soulseek has none at that quality, takes the next quality up, and lower ones only when nothing higher exists; a song's Choose a file pop-up (the person icon on the Downloads page) shows every file's quality and marks the one taken. Until you choose, the default row says "(what naviseerr did until now)". In the setup, Next with a row marked is the way on (no Skip link: a row saves the moment it is pressed, so a Skip after one would read as undoing it). Follows Spotify's Audio quality setting (its words and list; the bit rates are what Soulseek files come in). On a server from before the setting the screen says so and downloads take lossless or 320 kbps files as before
- Your own playlists (20-10-2026): the list icon at the top right of every page opens "Your playlists" (`/library`), with "New playlist" first and your playlists after it, last edited first. A playlist's page shows its cover (four song pictures as a 2x2 grid, as Spotify and YouTube Music draw one), the name and description, edited where they stand (click, type, Enter), and its songs; the X on a row takes a song out. "Create" downloads every song in your order and adds the playlist to your music app; from then on it is kept as it was ("Created on 20 Oct. Duplicate it to make changes."). "Duplicate" makes a new draft "Copy of …"; "Delete" (drafts only) asks first in the app's own pop-up. A hint says when another of your playlists has the same name, since both would write one playlist file. Follows Spotify's playlist page and YouTube Music's Library > Playlists
- Add to playlist (20-10-2026): the list-with-a-plus button on every song row (search results, artist top songs, album, playlist, radio and suggested playlist pages) and "Add to playlist" in those pages' headers, in your own playlist's header and in a song's details pop-up (the way on a phone, where rows have no room for the button) open one pop-up: a name field with "New playlist" on top, then your drafts, last edited first; created playlists are not listed, since they cannot change. For an album or playlist, "Choose songs" lists its songs with ticks to leave some out. Songs already in the playlist are skipped, and a line at the bottom of the page says so ("Added 9 songs to Road trip · 3 were already in it") with an Open link. Follows YouTube Music's "Save to playlist" pop-up
- Reorder your playlist (20-10-2026): drag a song by the dotted grip on the left of its row, with a mouse or a finger; the row moves as you drag, the page scrolls when you reach its edge, and the new order is saved when you let go. With a keyboard, the grip takes the up and down arrows, one place per press, and a screen reader hears "Moved Down to position 3 of 12". Only drafts have grips. Spotify, YouTube Music and Apple Music all use a drag handle in edit mode
- A picture for your playlist (20-10-2026): click a draft's cover, "Choose picture", pick a JPEG, PNG or WebP of at least 300 × 300 pixels (up to 20 MB); the pop-up shows the middle square that will be used, and Save keeps it. The browser makes it a square JPEG of at most 1200 px before sending, so the server only stores a small JPEG; that picture is what Navidrome and Jellyfin show for the created playlist. "Remove picture" goes back to the four-picture grid. Follows YouTube Music's playlist picture upload (with the automatic middle square instead of its crop box) and Spotify's "Choose photo"
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

**Behind another reverse proxy** (TrueNAS, Nginx Proxy Manager, a Caddy doing HTTPS): the Caddyfile
trusts `X-Forwarded-*` headers from private addresses (`trusted_proxies static private_ranges`), so the
server sees that the request came over HTTPS, marks the login cookie Secure and shows an `https://`
Redirect URL under Settings -> Login. A proxy on a public address is not trusted. Caddy also tells the
server the public path it strips (`X-Forwarded-Prefix: /api`), which is why that Redirect URL reads
`https://your.address/api/auth/authentik/callback`; a different proxy in front of the server itself
must set the same header, or the shown URL lacks the prefix.

**Browser hardening headers (19-10-2026):** every answer carries `X-Content-Type-Options: nosniff`,
`X-Frame-Options: DENY` (the app cannot be framed by another site), `Referrer-Policy:
strict-origin-when-cross-origin` and a `Permissions-Policy` denying camera, microphone and location; `/api`
answers get `Cache-Control: no-store` unless the server set one. All in the Caddyfile, so an HTTPS proxy
in front has nothing to add (HSTS belongs on that proxy, which owns the certificate).

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
- `GET /playlists`, `POST /playlists`, `GET|PATCH|DELETE /playlists/{id}`, `DELETE /playlists/{id}/songs/{videoId}`, `POST /playlists/{id}/songs`, `PUT /playlists/{id}/order`, `PUT|DELETE|GET /playlists/{id}/cover`, `POST /playlists/{id}/copy` - Your own playlists: list, new draft, one with its songs, rename or describe, delete a draft, take a song out, add songs by (type, id), put them in a new order, set, remove or show the picture, duplicate; `POST /download/collection/{id}?type=CUSTOM` is "Create"
- `GET /settings/login`, `PUT /settings/login`, `DELETE /settings/login` - How this install connects to Authentik (address, Client ID, whether a secret is set, whether the login is on, the Redirect URL), save and test it, turn the login off
- `GET /auth/session` - Is a login on, and is this browser signed in (`{mode: open}` or `{mode: authentik, authenticated}`)
- `GET /auth/authentik/start?to=` - Where "Continue with Authentik" sends the browser (a redirect to Authentik, then back to `to`)
- `POST /auth/logout` - End this browser's session
- `GET /status` - Whether the server's Soulseek client is connected, which Soulseek account it logs in with, and whether the music library folder can be written to (polled with the downloads feed)
- `GET /downloads/all?pageSize=&pageNumber=&type=SONG|ALBUM|PLAYLIST` - Every download, paged, for the Downloads page; `type` is optional and narrows to one kind (PLAYLIST includes suggested playlists), with page counts per kind
- `GET /downloads/{id}/tasks/{taskId}/candidates` - Every file Soulseek found for one song, from the server's cached search
- `POST /downloads/{id}/tasks/{taskId}/pick` - Download this file for the song instead, replacing the current transfer in place
- `GET /downloads/{id}/album-candidates` - The sharers' folders holding a whole album, with the files each one has
- `POST /downloads/{id}/album-pick` - Take the album's remaining songs from this sharer's folder instead

## License

MIT
