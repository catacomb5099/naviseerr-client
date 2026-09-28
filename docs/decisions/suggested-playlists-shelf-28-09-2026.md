# Suggested playlists: a "Made for you" shelf and a page per playlist

**Date:** 28-09-2026
**Status:** Accepted, implemented in three PRs (shelf + page; asking for this week's playlists when none are ready; Download all).
**Research:** `docs/research/suggested-playlists-platforms-28-09-2026.md` (how Spotify, YouTube Music, Apple Music, Tidal and others present their pre-computed playlists)

## Context

The server's playlist curator builds one 40-song "suggested playlist" per category once a week (80s indie
pop, current pop, and so on) and naviseerr serves them on `GET /suggested-playlists` and
`GET /suggested-playlists/{category}`. Nothing in the client showed them.

Every streaming service has this feature (Discover Weekly, Mixed for you, Apple's mixes) and they all present
it the same way. We copied the pattern rather than invent one; the research file has the sources.

## Decisions

1. **A "Made for you" shelf on the Home page**, in the empty state under the search hint, one card per
   category in the same horizontal row the search results use. Copies YouTube Music's "Mixed for you"
   shelf. Hidden entirely when the server has no curator (`enabled: false`) or predates the endpoint
   (404): an install that never set the curator up should not see an empty promise. That is what YouTube
   Music does for a new account: no placeholder tile, the shelf simply is not there.
2. **A generated cover**: the title set in large type on a two-colour gradient chosen from the category
   key, so a playlist keeps its look from week to week and no two categories share one. Copies Apple's
   colour-block covers and Spotify's 2025 gradients. The curator stores no artwork, so there is nothing
   else to show, and a mosaic of song thumbnails would change every week.
3. **Freshness in words, never a timestamp**: "Updated today", "Updated yesterday", "Updated Monday"
   within the week, then "Updated 21 Sep". Every service names the day and none shows an hour. The
   edition date comes from the curator as a calendar day, so the comparison is by local calendar day.
4. **The playlist page** mirrors the album/playlist page: cover, eyebrow badge, title, one meta line
   ("1980-1989 · Indie Pop · Edition of 28 September 2026 · 40 songs"), then the songs in the curator's
   order with album art (YouTube's thumbnail for the id), a download button and the info pop-up per
   song. The header says plainly that next week's edition replaces this one, the way Spotify nudges
   people to save songs before Monday.
5. **Why this song**: a quiet chip per row, "Top hit", "Deep cut" or "Wild card", with the curator's
   one-line reason as the tooltip and for screen readers. Hidden on phones, where the row has no room.
   The services show almost no per-song reasons (only YouTube Music's "Because you liked" test), so this
   is kept small. Words are in `lib/suggested.ts` so the wording lives in one place.
6. **Three empty states the server lets us tell apart**: not built yet (404: "Playlists are made once a
   week"), not set up on this server (503), and a real error with Try again (502 or network).

7. **"Make this week's playlists now."** When the shelf is empty, or a category is not built, the same
   spot shows the reason and a button that asks the server to run the curator
   (`POST /suggested-playlists/refresh`), then follows the run every few seconds
   (`GET /suggested-playlists/refresh`): "Making this week's playlists… 1 of 3 done", one line per
   category in plain words ("in progress", "ready", "nothing found on Discogs"), and the playlists
   appear by themselves when it is over. A run already in progress (the weekly one) is picked up and
   shown the same way. No streaming service offers this button; it is naviseerr's own, because the user
   owns the server. The shelf's subtitle names the refresh day the server reports ("New edition every
   Monday"), the way every service names its day.

8. **Download all.** The playlist page's header has the same green "Download all" button the album and
   playlist pages have. It requests the edition as ONE download of the server's `CURATED` type, keyed by
   the category, so the downloads panel shows one card ("80s indie pop · 40 songs") with the usual
   split progress, and the library gets one playlist file. The card wears a "Suggested" badge. Copies
   YouTube Music's Discover Mix, which can be saved and downloaded whole.

## Not in these PRs

- **Last week's edition.** The curator keeps every edition (`?date=`), naviseerr does not expose it yet.
  The research shows people want this (Spotify users run archive tools); a "Last week" link is the
  natural follow-up.
- **"See all" grid.** With two or three categories the row is enough.
