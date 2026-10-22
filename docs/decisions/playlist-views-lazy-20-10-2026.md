# A playlist asks for its songs' view counts only as you scroll to them

Date: 20 October 2026

## The problem

The owner asked for playlist view counts to "come from their own endpoint and load lazily". Measured on a live
adapter (research `sweep-1020-notes/research/playlist-views-lazy.md`):

- **The playlist's own count** ("60M views" in the header, "375K views" on a search card) costs nothing. It is
  read out of the same YouTube Music answer the page or the search already fetches. Its own endpoint would add one
  YouTube call per card (0.3-1 s each), so it stays where it is.
- **Each song's count** on a playlist page ("305.2M views" on a row) is one YouTube call per song. The page asked
  for every song as soon as it opened, 25 at a time, one batch after another: 131 calls and about 10 s of server
  work for a 132-song playlist, even when you only read the first ten rows.

## The decision

The page asks for a song's count only when its row comes within about 800 px of the screen (about twelve rows
ahead), using the browser's IntersectionObserver (it tells the page when an element scrolls into view). A scroll
gathers the rows it reveals for 100 ms into one request of at most 25 songs, and only one request runs at a time, as
before. Every answer is kept for as long as the browser tab is open, so Back and reopening a playlist, or the same
song in another playlist, show the number with no request. Only songs that came back with a number are kept:
if the adapter is down or YouTube is busy, those rows stay blank and the next visit asks again (the 5-minute
request cache stops quick repeats).

Opening the 132-song playlist now asks for 22 songs (15 on a phone) instead of all of them; scrolling to the end asks
for the rest, which is what it cost before; reopening it in the same tab asks for none.

## Not done

- No endpoint for the playlist's own count (slower, more YouTube calls).
- No server-side cache of song counts: one browser per owner is covered by the tab's memory.
- No drawing only the visible rows: 100-200 rows are cheap for the browser; the cost was the YouTube calls.

## How to flip

All in `src/hooks/useLazyViews.ts`: `AHEAD` (how far ahead rows are asked; `'0px'` = only rows on screen),
`VIEWS_CHUNK` (songs per request; the server takes at most 50), `GATHER_MS`. To forget counts after 5 minutes like
every other page, delete the `known` map and keep the counts in component state; the request cache already keeps
each answer 5 minutes.
