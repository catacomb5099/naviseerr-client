# One request per page, and Back reuses what was already fetched

Date: 28 September 2026

## The problem

Two things the owner saw in the browser's Network tab:

1. **Every request appears twice.** Load a search, open an album, open an artist, open a playlist:
   each shows up as two identical requests to the server.
2. **Going back re-asks.** Open an album from a search, press Back, and the search runs again even
   though the app had that exact answer a moment ago.

## What was actually happening

The doubling is not a bug in the pages. In development the app runs under React's StrictMode, which
deliberately mounts every component, unmounts it and mounts it again, to flush out code that does
not clean up after itself. Every page fetches when it mounts, so every fetch ran twice. The pages
already ignored the first answer (a `cancelled` flag, or an abort), but ignoring an answer does not
un-send the request: the server still did the work, and the Network tab still showed both.

The re-ask on Back is simpler: the router removes a page from the screen when you leave it, and a
page that has just appeared has nothing yet, so it fetches. Nothing remembered the previous answer.

## Options

- **Remove StrictMode.** Makes the double disappear in development. Rejected: StrictMode is what
  found the missing "tab shown again" listener in the polling work (see
  `adaptive-polling-28-09-2026.md`), and the production build never ran it anyway, so the doubling
  was a development-only symptom of a real gap: nothing shared requests.
- **Add a data-fetching library** (React Query, SWR). Solves both, at the cost of a new dependency,
  a new way of writing every fetch, and a provider at the root. Too much for two symptoms.
- **Share identical GETs in one small place.** The API client already funnels every request through
  one function. Teach that one function to notice a GET to the same address already in flight, and
  to keep a successful answer for a little while. Chosen: smallest change, no new dependency, no
  page has to know.

## What changed

One new file, `src/lib/requestCache.ts`, and the API client routes GETs through it. Only GETs; a
download request (POST) is never shared or kept.

- **While a request is in flight, every caller asking the same address joins it.** This is what
  removes the double: StrictMode's second mount joins the first mount's request instead of starting
  another. Each caller can still cancel on its own; the request itself is only cancelled when the
  last waiting caller has gone and nobody has come back a moment later. That last part matters:
  StrictMode unmounts and remounts in one go, so a page that cancels on unmount (the "Made for you"
  shelf, the downloads page and panel) lets go of the request and asks for it again in the same
  instant. Cancelling straight away would have made that second ask a second request.
- **Search results and pages are kept for five minutes**: search (all five pills), album and
  playlist pages, artist pages, the song info pop-up, the "Made for you" shelf and a suggested
  playlist's page. This is what makes Back free: the page mounts, asks, and gets the kept answer
  without a request. Five minutes covers a browse; a new weekly edition still shows up in the same
  sitting.
- **Downloads data is never kept**: what is downloading now, the downloads list, a download's
  detail, and the curator's run in progress. Two callers asking at the same instant still share
  the one request, but the moment it arrives it is forgotten, so the next poll really polls.
- **"Try again" and re-running the same search go past the kept answer.** Every page already had a
  retry counter; a retry now asks the server again rather than being handed back the same failure
  or the same stale list. A failed request is never kept in the first place. The counter belongs to
  one subject (one search, one artist, one song): a page stays on screen while its subject changes,
  and a retry on one must not make every later fetch from that page skip what was kept.
- **The memory is bounded** at 200 kept answers; the oldest go first.

StrictMode stays. Production builds behave the same as before in every way except that Back no
longer refetches within five minutes.

## What it does not do

- No persistence: a page reload starts empty.
- No invalidation from writes. Requesting a download does not clear anything; nothing that is kept
  depends on downloads.
- No change to how often anything polls; see the adaptive polling record for that.

## When to revisit

- If a kept page is ever visibly wrong (an album's tracks changed within five minutes), lower
  `BROWSE_CACHE_MS` in `src/api/endpoints.ts` or pass `fresh` from the place that knows better.
- If the app grows many more endpoints with their own staleness rules, that is the point to look at
  a data-fetching library rather than growing this file.
