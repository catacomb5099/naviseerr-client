# Manual import: choosing the Soulseek file (or folder) yourself

**Date:** 07-10-2026
**Status:** Accepted, implemented in three stacked PRs (see the list; look-only table, per-song pick, whole-album pick).
**Research:** built against a shared API contract and research notes kept in the owner's private sweep notes (not in this repository).

## Context

The server picks which Soulseek file to fetch for a song. It is usually right, but when it is not (a live
version, a low bitrate, a sharer with a long queue) the person had no way to point at a better file. Sonarr
and Radarr solve this with "manual import": a table of what was found, pick a row. The owner asked for the same.

## Decisions

1. **One pop-up, opened from a person icon on the Downloads page**: on single-song rows, on every song inside an
   expanded collection, and on album rows. Not on playlist, suggested-playlist or radio rows: those are many
   unrelated songs, so there is no single folder to choose; pick their songs one by one.
2. **The list comes from the server's cached search**, never a new search, so it opens at once. While the song is
   still searching the pop-up says so and asks again every 3 seconds.
3. **A native `<dialog>`, closed by the X or Escape only.** No click-outside dismiss, because the table carries a
   sort and a filter that a stray click should not wipe. Escape is kept: it is what every modal does, and Chrome
   cannot reliably block it anyway.
4. **Default order is the server's ranking** ("best match first"), so the first row is what the server would try;
   number columns sort biggest-first on the first click, text A to Z. Filtering is client-side over file name,
   sharer and format.
5. **Picking replaces in place.** The pick travels through `useActiveDownloads.pick` (the same path as Cancel and
   Retry), so the row underneath turns live and shows the new sharer; the pop-up closes once the server took it. A
   confirm ("This will replace your current download of X. Replace?") is asked only while a transfer is under way;
   a failed song has nothing to replace. A song already downloaded and filed cannot be re-picked (v1 server rule).
6. **Albums pick a folder, not a file.** One row per sharer holding the album as a folder; each row unfolds into
   its files (#, name, quality, length, size). Picking takes the songs still to be fetched from that folder and
   keeps finished ones; the confirm names how many songs are still downloading from the current sharer.
7. **Nested dialogs stop their `close` event**: React re-dispatches a `<dialog>` close up the component tree, so
   the confirm layer's close would otherwise close the main pop-up too.
8. **The path cell shows the folder under the name** (added 09-10-2026). The server always sent the whole slskd
   path; the table showed only the last piece, so two "12 - Song.flac" rows from a proper album folder and from a
   1001-songs compilation looked the same. Now a muted second line shows the folder, verbatim (share alias
   included), cut from the LEFT so the end (artist\album) stays readable (`dir="rtl"` + `<bdi>`, measured in
   Chromium); the full path stays on hover and in the DOM. The filter box matches folder words too. No new
   column (the song table already scrolls sideways), no folder on the Downloads page's one-line song row.
9. **An empty list says what really happened to the search, dated** (added 09-10-2026, with naviseerr's
   `fix/ai-pick-list-says-what-happened`). The owner asked whether an album search had been made at all: the pop-up
   said "downloaded before folder lists were kept" for his album and "searched before lists were kept, or its search
   ended without results" for its songs, and when slskd refused an album search it said "nobody shared enough of this
   album as one folder". The server now sends the real reason and slskd's own `searchId`; the pop-up words each
   reason in one sentence with the day from `searchedAt` ("on 5 Oct") and the day lists began (8 October 2026):
   refused by slskd (`SEARCH_FAILED`), Soulseek offline, never searched on its own because the album's folder gave
   the song its file (`NO_OWN_SEARCH`), nothing left to search (`NOTHING_TO_SEARCH`), cancelled (a song and an album
   each in their own words), before lists were kept. For a song, `BEFORE_CACHE` keeps both possibilities ("searched
   before lists were kept, or its search never completed"): the server answers it for every song with no completed
   search that it cannot name a cause for, and a server older than #136 answers it for every failed search, so a
   confident dated sentence would be wrong for those rows (review, 09-10-2026). A grey line under the header, `Soulseek search <id> · 5 Oct 09:23` (local time), lets a person find the
   search in slskd's Searches page; it is absent when slskd never took a search, which is then the fact. The
   sentences no longer tell the person to retry: the in-dialog "Try again" button (next change) does that. Unknown
   reasons keep falling through to the generic sentence, so the web app works against older servers.

## Consequences

- New endpoints the client expects: `GET /downloads/{id}/tasks/{taskId}/candidates`,
  `POST /downloads/{id}/tasks/{taskId}/pick`, `GET /downloads/{id}/album-candidates`, `POST /downloads/{id}/album-pick`.
- `src/lib/candidates.ts` holds every pure helper (basename, format, quality label, sizes, sort, filter, status
  wording) with asserts in `scripts/check-candidates.ts`.
- The sharer now shows on each song row inside a collection ("· from alice"), so a swap is visible at a glance.
