# A "Play" button that opens the song in YouTube Music

**Date:** 4 October 2026

For naviseerr's product owner. The question: can a song row get a "Play" button that does not stream anything through naviseerr, and instead opens YouTube Music with that song? Code facts come from the `move-fast-break-things` checkouts of all three projects, which match their remotes as of today. Web facts come from official docs, from the ytmusicapi source (version 1.12.2, the one the adapter pins), and from real HTTP requests sent today from the UK. Anything nobody tested is marked "(not verified)".

A few words used below:

- **videoId**: YouTube's 11-character id for one song or video, for example `hpSrLjc5SMs` (Oasis, Wonderwall).
- **browseId**: YouTube Music's id for an album page (`MPREb_...`) or an artist page (`UC...`).
- **Album playlist id** (ytmusicapi calls it `audioPlaylistId`): the album's track list as a playlist, `OLAK5uy_...`.
- **Playlist id**: `PL...` for a user's playlist, `RDCLAK5uy_...` for YouTube Music's own editorial playlists.

## Answer in one paragraph

Yes, and it is mostly a client job. Every song row the app shows today already has the song's YouTube videoId: search results, an artist's top songs, album and playlist tracks, suggested playlists, the song info pop-up, and each song of a download. The client can build `https://music.youtube.com/watch?v=<videoId>` itself, with no server change and no extra call to YouTube. Albums and playlists also work today: an album link `music.youtube.com/browse/<browseId>` lands on the same page as the album playlist, and a playlist link `music.youtube.com/playlist?list=<id>` works for both kinds of playlist id. The id is missing in three places: download rows from before collections existed (their id is a made-up `legacy-...` value), a suggested-playlist download row (its id is a category name, not a YouTube id), and any music that reached the library without naviseerr. For those, a search link `music.youtube.com/search?q=<title artist>` is a working fallback that needs no lookup. The link goes to the YouTube Music app on iPhone and Android when the app is installed, and to the website when it is not. What nobody can promise is that the song **starts playing by itself**. On a phone the app takes over, and that probably plays (not verified). On desktop it depends on the browser: Chrome probably plays for people who use YouTube Music often, while Safari and Firefox block sound by default, so the listener may have to press play once. Visitors who are logged out in the UK or EU first see a cookie-consent page, and after it they land on the song.

## In short

- **Possible without streaming anything.** It is a plain link, and YouTube plays the song on its own site or app. YouTube's terms allow watching and listening "for your personal, non-commercial use" on YouTube itself ([YouTube Terms](https://www.youtube.com/t/terms)).
- **The videoId already reaches the client on every song row.** No adapter or naviseerr change is needed for a song's Play button.
- **"Play album" works today as "open album".** `browse/MPREb_...` shows the album page, and YouTube itself redirects that page to `playlist?list=OLAK5uy_...` (observed). To start the album playing in one click, naviseerr would have to pass on the `OLAK5uy_` id. The adapter has it, but naviseerr drops it.
- **Starting by itself is up to the browser, not us.** Use a real link (`<a href target="_blank">`), not a script that opens a window. Accept that desktop Safari and Firefox users may need one more click.
- **Phones:** music.youtube.com is registered for both the iOS app and the Android app (observed in the two verification files below). With no app, the phone's browser opens the site.
- **Fallback:** a YouTube Music search link built from title and artist. It needs no call to YouTube, so there is no rate-limit risk.

## 1. Which ids each song already has

### The adapter (ytmusic-adapter)

The adapter wraps ytmusicapi and passes ids through unchanged.

| What it returns | Song id | Album / playlist ids | Source |
|---|---|---|---|
| Search rows (`GET /v1/search*`) | `videoId` on songs and videos | `browseId` (album `MPREb_`, artist `UC`, playlist `VL...`), `playlistId` (album `OLAK5uy_`, playlist bare id) | `app/models/search.py:6-21`, `app/mappers.py:162-176, 190-204` (line 164 comment: "OLAK5uy_... audioPlaylistId") |
| Album (`GET /v1/albums/{browseId}`) | `tracks[].videoId` | `browseId`, `audioPlaylistId` | `app/models/album.py:21-35`, `app/mappers.py:230-248` |
| Playlist (`GET /v1/playlists/{id}`) | `tracks[].videoId`, plus `isAvailable` | `id` | `app/models/playlist.py:6-15`, `app/mappers.py:286-304` |
| Artist (`GET /v1/artists/{channelId}`) | `topSongs[].videoId`, `videos[].videoId` | `albums[].browseId`, `singles[].browseId` | `app/models/artist.py:13-25`, `app/models/common.py:14-40` |
| Song (`GET /v1/songs/{id}` and `/details`) | `videoId` | album `browseId` on `/details` | `app/models/song.py:6-42` |

What the adapter does **not** pass on:

- `videoType`, the field that says whether an id is an album track (`ATV`), an official music video (`OMV`) or a fan upload (`UGC`). ytmusicapi provides it (`parsers/search.py:53-77`, `parsers/watch.py:43`), but the adapter's models have no field for it. The adapter uses it once, internally, to skip the credits call for official videos (`app/mappers.py:331-333`). A link does not need it, because YouTube Music opens all three kinds.
- An artist's "Shuffle" and "Radio" playlist ids (`shuffleId`, `radioId`), which ytmusicapi reads at `mixins/browsing.py:286-287`. Only needed for "play this artist".

### The server (naviseerr)

| Surface | Wire field holding the id | What it is | Where it can be missing | Source |
|---|---|---|---|---|
| Search: songs | `Track.id` | videoId | `""` if the adapter gave none. Search "video" rows are thrown away, so only songs appear | `util/YtMusicSearchResponseMapper.java:54, 64-67, 75-86` (line 77 `orEmpty(item.getVideoId())`) |
| Search: albums | `Album.id` | browseId `MPREb_` | **The `OLAK5uy_` id is dropped** here: the adapter sends `playlistId`, but `mapAlbum` does not copy it | `util/YtMusicSearchResponseMapper.java:88-96`; adapter field at `services/ytmusic/model/YtMusicSearchResponse.java:40` |
| Search: playlists | `Playlist.id` | bare playlist id (`PL...`, `RDCLAK5uy_...`) | Rows with no id are dropped | `util/YtMusicSearchResponseMapper.java:57-63, 111-119` |
| Artist page: top songs | `topSongs[].id` | videoId | Rows with no videoId or marked unavailable are dropped | `services/ArtistView.java:47-53` |
| Album / playlist page | `CollectionView.id` (album browseId or playlist id), `tracks[].id` (videoId) | as named | **No `audioPlaylistId`**: `YtMusicDetailResponse.Collection` has no field for it, so Jackson ignores it | `services/CollectionView.java:23-45` (line 37 drops tracks with no id); `services/ytmusic/model/YtMusicDetailResponse.java:95-115`; unavailable tracks dropped at `services/ytmusic/YtMusicService.java:208` |
| Suggested playlist songs | `SuggestedTrackView.id` | videoId from the curator | Songs with no videoId are dropped | `curator/SuggestedPlaylistView.java:29-41`, `curator/CuratorTrack.java:14` |
| Song info pop-up | `SongInfoView.id`, `album.id` | videoId, album browseId | album is null for official videos | `services/SongInfoView.java:25-51` |
| Downloads list (one row per request) | `ActiveDownloadView.youtubeId` + `downloadType` | SONG: videoId. ALBUM: browseId. PLAYLIST: playlist id. **CURATED: the curator's category key** (e.g. `80s-indie-pop`), not a YouTube id | **Rows from before database version V5 have a made-up `legacy-<uuid>` id** | `download/ActiveDownloadView.java:50-68`; `download/Download.java:35-41`; `db/migration/V10__curated_downloads.sql:1-3`; `db/migration/V6__download_metadata.sql:39-43` |
| Downloads: each song inside a download | `DownloadSongView.youtubeId` | the song's own videoId | **null for songs admitted before V5** | `download/DownloadSongView.java:33-35`; `download/DownloadTask.java:28-29`; `db/migration/V5__collection_downloads.sql:41-43` |
| Database | `downloads.youtube_id` (NOT NULL), `download_tasks.youtube_id` (nullable), `media_items.youtube_id` (key) | as above | as above | `db/migration/V5__collection_downloads.sql:12-15, 41-43`; `V6__download_metadata.sql:15-26, 72-73` |

**Library / owned songs.** There is no library or "songs you own" screen on the mainline client. The organiser records where each finished song's file went (`download_tasks.library_path`, `db/migration/V8__library_organiser.sql:11-12`) on the same row as its videoId, so the server could join a file back to its YouTube song if a library screen ever needs one. The files themselves do not carry the videoId. The unmerged branch that writes YouTube details into tags (`origin/feat/ai-youtube-tags`, `download/SongTagger.java`) writes album, artist, year and cover, but no YouTube id. Music the owner copied into the library by hand has no YouTube id anywhere.

### The client (naviseerr-client)

| Screen | Type and field | Source |
|---|---|---|
| Home search, artist top songs | `Track.id` (videoId) | `src/api/types.ts:1-12, 96-97`; rendered by `src/components/SongCard.tsx:56-73` from `src/pages/HomePage.tsx:232-234` and `src/pages/ArtistPage.tsx:157`. `HomePage.tsx:233` already handles an empty id (`track.id \|\| \`song-${index}\``) |
| Album and playlist search cards | `Album.id` (browseId), `Playlist.id` | `src/api/types.ts:14-38` |
| Album / playlist page | `CollectionDetail.id`, `CollectionTrack.id` (videoId) | `src/api/types.ts:60-84`; rows at `src/pages/CollectionPage.tsx:225-262` |
| Suggested playlist page | `SuggestedTrack.id` (videoId) | `src/api/types.ts:314-333`; rows at `src/pages/SuggestedPlaylistPage.tsx:214-247` |
| Song info pop-up | `SongInfo.id`, `SongInfo.album.id` | `src/api/types.ts:116-137`; title at `src/components/SongInfoDialog.tsx:141` |
| Downloads page and panel | `ActiveDownloadView.youtubeId` + `downloadType`; per-song `DownloadSongView.youtubeId` | `src/api/types.ts:182-241`; `src/lib/downloadLibrary.ts:50-61` already branches on type to build the "Open" link; per-song rows at `src/components/DownloadRow.tsx:87-137` |

The client links to nothing outside the app today: there is no `target="_blank"` anywhere in `src/`, and no install-to-home-screen (PWA) manifest.

**Conclusion for question 1:** the videoId reaches the client on every song row the app shows. It is missing only on old `legacy-` download rows and on pre-V5 songs inside them. The album playlist id (`OLAK5uy_`) never reaches the client: naviseerr drops it in two places, the search album mapper and the collection detail model.

## 2. Link formats

Each link below was requested today with the same "decline cookies" cookie ytmusicapi sends on every call (`SOCS=CAI`, `ytmusic.py:102`). That skips the UK consent page so the real page comes back. The "Result" column is what YouTube's own page reports as its canonical address and title.

| Link | What it does | Result today |
|---|---|---|
| `music.youtube.com/watch?v=hpSrLjc5SMs` | Opens the player on that song. After it, YouTube's automatic radio continues | 200, title "Wonderwall", canonical = same link |
| `…/watch?v=ID&list=RDAMVM<ID>` | The song plus its radio (a station of similar songs). ytmusicapi builds exactly this id when it asks for a song's "up next" list (`mixins/watch.py:120-122`) | 200, canonical keeps `list=RDAMVMhpSrLjc5SMs&index=0` |
| `…/watch?v=ID&list=OLAK5uy_…` | The song, with the rest of its album queued after it | 200, canonical keeps the album list |
| `…/playlist?list=OLAK5uy_…` | The album as a page (press play to start) | 200, title "(What's The Story) Morning Glory?" |
| `…/browse/MPREb_…` | The album page | 200, **canonical is `playlist?list=OLAK5uy_kunInnOpcKECWIBQGB0Qj6ZjquxDvfckg`**: YouTube treats the album page and the album playlist as the same page |
| `…/playlist?list=RDCLAK5uy_…` | An editorial playlist page | 200, title "Oasis 2025 Setlist" |
| `…/watch?v=ID&t=60` | Meant to start 60 seconds in | 200, but the canonical drops `t`. Whether the player honours it is not verified. We do not need it |
| `…/search?q=wonderwall+oasis` | YouTube Music's own search results page | 200. The page's built-in data names "Wonderwall" 75 times, so the results come with the page. **Works as the fallback** |
| `…/watch?v=XXXXXXXXXXX` (an id that does not exist) | – | **200** with a generic "YouTube Music" title. A broken id cannot be detected from the response code |
| `www.youtube.com/watch_videos?video_ids=A,B` | Undocumented YouTube trick that makes a temporary queue | Redirects (303) to a temporary `TL...` list on youtube.com. On music.youtube.com the same address gives a generic page. **Do not rely on it** for "play this suggested playlist" |

Logged out and with no cookie, every music.youtube.com link above answers with a redirect (302) to `consent.youtube.com/m?continue=<the original link>&gl=GB…`. The full original address, `list=` and `t=` included, is kept in `continue`, so the visitor lands on the song after choosing a cookie option (observed).

ytmusicapi's own sample response for a song shows the same canonical form: `"urlCanonical": "https://music.youtube.com/watch?v=AjXQiKP5kMs"` (`mixins/browsing.py:804`).

## 3. Does it start playing by itself?

"Autoplay" means the browser lets a page start sound without the listener pressing play on that page. Browsers limit it on purpose. naviseerr cannot change that, because the playing happens on YouTube's page.

| Where | Rule (official) | What that likely means for our link |
|---|---|---|
| Chrome, desktop | Sound may autoplay if the user clicked on the site during the session, or has often played media there (Chrome measures this per site and calls it the "Media Engagement Index"), or installed the site as an app ([Chrome blog](https://developer.chrome.com/blog/autoplay), [Chromium policy](https://www.chromium.org/audio-video/autoplay/)). The Chromium page adds that the interaction rule "only applies to contiguous navigations", and that for a link opened in a new tab from the right-click menu "the user gesture will be counted" | Regular YouTube Music listeners: probably plays at once. A first-time visitor: may open paused (not verified with YouTube Music) |
| Safari, Mac | "Media elements with sound" are blocked from autoplaying "by default on most websites". The user can allow it per site in Safari's website settings ([WebKit](https://webkit.org/blog/7734/auto-play-policy-changes-for-macos/)) | Probably opens paused unless the listener allowed autoplay for music.youtube.com (not verified) |
| Firefox | Blocks media with sound by default. Users can choose "Allow Audio and Video" ([Mozilla support](https://support.mozilla.org/en-US/kb/block-autoplay)) | Probably opens paused (not verified) |
| YouTube Music app (iPhone, Android) | Browser rules do not apply inside a native app | Probably plays straight away, since this is how links shared from the app open (not verified) |

Other things that change what the listener sees:

- **Logged out, UK/EU:** the cookie-consent page comes first, then the song (observed, section 2). Logged-in users have already answered it.
- **Free vs Premium:** free YouTube Music includes "on-demand playback for podcasts, songs and music videos" with ads ([YouTube Music help](https://support.google.com/youtubemusic/answer/9698084?hl=en-GB)). Premium adds no ads, plus background play: listening "while using other apps or when your screen is off" ([help](https://support.google.com/youtubemusic/answer/6313552?hl=en)). So a free user on a phone hears an ad first, and the music stops when they switch back to naviseerr.
- **Song vs video:** an `ATV` id plays the album audio. An `OMV` id plays the official video. "Audio mode for music is only available with a YouTube Music Premium or YouTube Premium subscription" ([help](https://support.google.com/youtubemusic/answer/6313574?hl=en)). Search in naviseerr only keeps song rows (`YtMusicSearchResponseMapper.java:54, 64-67`), so most Play links will be album audio. Playlist and top-song rows can be videos.
- **Not available in the listener's country:** owners can limit a video to some countries, and YouTube may block content to follow local law ([YouTube help](https://support.google.com/youtube/answer/92571?hl=en)). YouTube shows its own error page. naviseerr already hides playlist tracks the adapter marks unavailable (`YtMusicService.java:208`), but that check reflects the adapter's own region (its `location` setting), not the listener's.

## 4. Phones

**The app opens directly.** Both phone systems let a website name an app that may open its links. The site publishes a small verification file, and the phone checks it when the app is installed. Apple calls these Universal Links. Android calls them App Links.

- iPhone: `https://music.youtube.com/.well-known/apple-app-site-association` (200, fetched today) lists the YouTube Music app `EQHXZ8M8AV.com.google.ios.youtubemusic` for every path (`"*"`) except the Premium sign-up pages.
- Android: `https://music.youtube.com/.well-known/assetlinks.json` (200, fetched today) lists `com.google.android.apps.youtube.music` with `handle_all_urls`, plus a second package `com.google.android.apps.youtube.music.pwa`.
- Apple: "If the person hasn't installed your app, the system opens the URL in their default web browser". Also, a tap on "a universal link in a different domain" opens the app, while one on the same domain stays in Safari ([Apple](https://developer.apple.com/documentation/xcode/allowing-apps-and-websites-to-link-to-your-content)). naviseerr is a different domain, so a tap opens the app.
- Android: "users who don't have the app installed go to your website instead — no 404s, no errors" ([Android](https://developer.android.com/training/app-links/about)).

**Custom scheme.** Every YouTube Music page states its app address, for example `vnd.youtube.music://music.youtube.com/watch?v=hpSrLjc5SMs&feature=applinks` (observed in the `al:ios:url` / `al:android:url` tags; also in ytmusicapi's sample at `mixins/browsing.py:822`). `youtubemusic://` is not it. Do not use the custom scheme: when the app is missing it fails with an error, while the normal https link falls back to the website.

**`target="_blank"` and in-app browsers.**

- A new tab keeps naviseerr (and its download polling) open behind the music. `target="_blank"` already "implicitly provides the same `rel` behavior as setting `rel="noopener"`" ([MDN](https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Elements/a)). That means the YouTube page gets no handle back to naviseerr's window. Add `noreferrer` too, so YouTube is not told the address of the owner's server.
- Use a real `<a href>`, not `window.open()` from a script. Chrome on Android "won't launch an external app" for a link "initiated without user gesture" ([Chrome docs](https://developer.chrome.com/docs/android/intents)). A real link also supports long-press, copy link and middle-click.
- naviseerr has no installed-app (PWA) mode, so that case does not arise today. Links tapped inside other apps' built-in browsers (e.g. a chat app) may stay inside that browser instead of opening YouTube Music (not verified; it depends on the app).

## 5. Limits and risks

- **Terms.** A link sends the person to YouTube, where YouTube plays the song. This is the "personal, non-commercial use" the terms allow, and it involves no downloading or re-streaming ([YouTube Terms](https://www.youtube.com/t/terms)). Embedding a player would be allowed too ("the embeddable YouTube player") but is more work and not asked for. The real terms risk sits elsewhere: the terms ban accessing the Service by "automated means (such as robots, botnets or scrapers)" without permission, which describes what ytmusic-adapter already does to fetch metadata. Play links add no new automated access.
- **Branding.** Use our own play icon (lucide `Play`) and the words "Play on YouTube Music", not YouTube's logo. Their badges have strict rules ([YouTube brand resources](https://brand.youtube)).
- **Ids that go stale.** A video can be removed or blocked by country after we stored it. The link still answers 200 (section 2), so we cannot check it cheaply, and YouTube shows its own error. Acceptable for a link.
- **No videoId:** `legacy-` download rows and pre-V5 song rows. Their title and artists are still in `media_items` (`V6__download_metadata.sql:45-60`), so the search fallback works. A CURATED download row is a naviseerr playlist with no YouTube copy, so it gets no Play button: the "Open" link to the suggested-playlist page already covers it.
- **Different recording.** The Soulseek file may be a different version from the YouTube song (live, remaster). Play opens the version the user picked on YouTube, not their file. That is fine for a "listen first" button.
- **Lookups and rate limits.** None needed while the videoId is on the row. Finding an id for music that never had one would cost one adapter search per song, and the project has seen YouTube calls fail when sent in parallel (see `search-more-results` notes). The search link avoids this: YouTube Music runs the search on the listener's own device.
- **Mock mode.** The client's mock data uses fake ids such as `song-1` (`src/api/mockData.ts:383`), so Play links lead nowhere in mock mode.

## 6. Smallest build, per project

**ytmusic-adapter: nothing.** Every id needed is already sent.

**naviseerr: nothing for song Play.** One optional PR, only if "Play album" should start the album in one click instead of opening the album page:

- Add `audioPlaylistId` to `YtMusicDetailResponse.Collection` (`services/ytmusic/model/YtMusicDetailResponse.java:101-115`) and carry it on `CollectionView` (`services/CollectionView.java:23`). That is two fields and one test. Optionally add the search album card too (`YtMusicSearchResponseMapper.java:88-96`, from `item.getPlaylistId()`). Skip this until someone asks: `browse/<browseId>` already opens the same album, one tap short of playing.

**naviseerr-client: one PR.**

1. A tiny helper, e.g. `src/lib/youtubeMusic.ts`:
   ```ts
   const YTM = 'https://music.youtube.com'
   /** A song's YouTube Music link; a search link when there is no usable videoId. */
   export function songLink(videoId: string | null | undefined, title: string, artists: string[]): string {
     return videoId && !videoId.startsWith('legacy-')
       ? `${YTM}/watch?v=${encodeURIComponent(videoId)}`
       : `${YTM}/search?q=${encodeURIComponent([title, ...artists.slice(0, 1)].join(' '))}`
   }
   export const albumLink = (browseId: string) => `${YTM}/browse/${encodeURIComponent(browseId)}`
   export const playlistLink = (id: string) => `${YTM}/playlist?list=${encodeURIComponent(id)}`
   ```
2. A Play link, `<a href={songLink(...)} target="_blank" rel="noopener noreferrer" aria-label={`Play ${name} on YouTube Music`}>`, on:
   - `SongCard` (search and artist top songs), next to the info button (`SongCard.tsx:56`)
   - album/playlist track rows (`CollectionPage.tsx:262`)
   - suggested-playlist rows (`SuggestedPlaylistPage.tsx:247`)
   - the song info pop-up header (`SongInfoDialog.tsx:141`)
   - SONG rows on the Downloads page, and per-song rows inside a collection (`DownloadRow.tsx`, using `song.youtubeId`)
3. An "Open in YouTube Music" link in the album/playlist page header: `albumLink(id)` for ALBUM, `playlistLink(id)` for PLAYLIST.

Product choices in this proposal, all easy to flip:

- Opens in a new tab.
- No Play button on a CURATED download row.
- The fallback search uses title plus first artist only.
- The tooltip promises "Play on YouTube Music", not "Plays now", because the browser may open it paused.

## What to check by hand

Things only a real device can confirm (not verified here):

1. Desktop Chrome, logged in, a regular YouTube Music listener: does the new tab start playing with no second click?
2. Desktop Safari and Firefox: does it open paused? Is one click on Play enough?
3. iPhone with the app, and without it; Android the same: does the app open on the song and play?
4. A logged-out private window: consent page, then the song?
5. A `RDAMVM` radio link and an `&list=OLAK5uy_…` album link: does the queue match what YouTube Music's own Play button gives?

## Sources

Code (local checkouts, branch `move-fast-break-things`):

- ytmusic-adapter: `app/models/{common,search,album,playlist,artist,song}.py`, `app/mappers.py`, `app/routers/*.py`
- ytmusicapi 1.12.2 (installed in the adapter's `.venv`; same files upstream): https://github.com/sigma67/ytmusicapi/blob/1.12.2/ytmusicapi/mixins/watch.py, https://github.com/sigma67/ytmusicapi/blob/1.12.2/ytmusicapi/mixins/browsing.py, https://github.com/sigma67/ytmusicapi/blob/1.12.2/ytmusicapi/parsers/search.py, https://github.com/sigma67/ytmusicapi/blob/1.12.2/ytmusicapi/parsers/albums.py, https://github.com/sigma67/ytmusicapi/blob/1.12.2/ytmusicapi/ytmusic.py
- naviseerr: `src/main/java/com/catacomb5099/naviseerr/{util/YtMusicSearchResponseMapper,services/ytmusic/YtMusicService,services/ytmusic/model/YtMusicDetailResponse,services/ytmusic/model/YtMusicSearchResponse,services/CollectionView,services/ArtistView,services/SongInfoView,curator/SuggestedPlaylistView,curator/CuratorTrack,download/Download,download/DownloadTask,download/ActiveDownloadView,download/DownloadSongView}.java`, `src/main/resources/db/migration/V5, V6, V8, V10`; branch `origin/feat/ai-youtube-tags` `download/SongTagger.java`
- naviseerr-client: `src/api/types.ts`, `src/lib/downloadLibrary.ts`, `src/components/SongCard.tsx`, `src/components/SongInfoDialog.tsx`, `src/components/DownloadRow.tsx`, `src/pages/{HomePage,ArtistPage,CollectionPage,SuggestedPlaylistPage}.tsx`, `src/api/mockData.ts`

HTTP responses observed 4 October 2026 (from the UK):

https://music.youtube.com/.well-known/apple-app-site-association
https://music.youtube.com/.well-known/assetlinks.json
https://music.youtube.com/watch?v=hpSrLjc5SMs
https://music.youtube.com/watch?v=hpSrLjc5SMs&list=RDAMVMhpSrLjc5SMs
https://music.youtube.com/watch?v=hpSrLjc5SMs&list=OLAK5uy_kunInnOpcKECWIBQGB0Qj6ZjquxDvfckg
https://music.youtube.com/playlist?list=OLAK5uy_kunInnOpcKECWIBQGB0Qj6ZjquxDvfckg
https://music.youtube.com/browse/MPREb_IInSY5QXXrW
https://music.youtube.com/playlist?list=RDCLAK5uy_mWTdoSEwzAScsxFgMV-8jIP8Xn2jM7ZLM
https://music.youtube.com/watch?v=hpSrLjc5SMs&t=60
https://music.youtube.com/search?q=wonderwall+oasis
https://www.youtube.com/watch_videos?video_ids=hpSrLjc5SMs,Hj0aJ1R2UAw

Official docs:

https://developer.chrome.com/blog/autoplay
https://www.chromium.org/audio-video/autoplay/
https://webkit.org/blog/7734/auto-play-policy-changes-for-macos/
https://support.mozilla.org/en-US/kb/block-autoplay
https://developer.mozilla.org/en-US/docs/Web/Media/Guides/Autoplay
https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Elements/a
https://developer.apple.com/documentation/xcode/allowing-apps-and-websites-to-link-to-your-content
https://developer.apple.com/documentation/xcode/supporting-universal-links-in-your-app
https://developer.android.com/training/app-links/about
https://developer.chrome.com/docs/android/intents
https://www.youtube.com/t/terms
https://brand.youtube
https://support.google.com/youtubemusic/answer/9698084?hl=en-GB
https://support.google.com/youtubemusic/answer/6313552?hl=en
https://support.google.com/youtubemusic/answer/6313574?hl=en
https://support.google.com/youtubemusic/answer/9266556?hl=en
https://support.google.com/youtube/answer/92571?hl=en
