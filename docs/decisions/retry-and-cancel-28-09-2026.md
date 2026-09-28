# A download that starts again replaces its finished card

Date: 28 September 2026

## The problem

`mergeCard` had one rule for a terminal card: once the panel had shown "Downloaded" or "Failed",
no later poll could walk it back to a live stage. That was correct for the world before this
feature - a finished download stayed finished - but Retry breaks it. Click Retry on a failed card
and the very next poll would answer with a live row (`STARTING`, no failure code) that the old
rule threw away, so the card would sit reading "Failed" forever while the download quietly ran
again underneath it.

## What was already true

`mergeCard` already had a card for "the server knows less than the client right now" (null
metadata never blanks a filled-in title) and for "a non-terminal stage is taken as given, even
backwards" (a candidate failover resetting progress to 0 is real). Neither helps here: the
question isn't "does this row know less", it's "did the download actually restart", and the only
signal for that is time.

## The rule

The server's `updatedAt` is monotonic per download: every write stamps it, and concluding a
download (deriving its final status from its songs) does not. That gap is exactly the signal
needed, in both directions:

- **Finished → live: only if strictly newer.** A retry calls `now()`. The one case that must NOT
  reopen the card is the two-second row where every song has finished but the download hasn't
  been concluded yet - that row shares the finished card's timestamp exactly, so "strictly newer"
  excludes it and "equal" still routes to the terminal read.
- **Live → finished: only if not strictly older.** A stale poll answer that was in flight when the
  user clicked Retry must not slam the reopened card shut. But a fail-before-admission row (a
  download that failed before it had any songs) carries the download's `created_at`, which equals
  the optimistic card's own timestamp - "not strictly older" lets that one land instead of hanging
  forever.
- **Live → live is untouched.** The optimistic card's clock is the server's JVM; the rows' clock is
  Postgres. They're not comparable, and the existing rule (non-terminal stage taken as given) never
  needed to compare them - only crossing the terminal boundary does.

A reopened card also drops the old attempt's `failureCode` and `progressPercent` before the new
row's own values are applied: an old outcome is not an observation about a fresh attempt, and 40%
progress from the last failure has no meaning until the retry says otherwise.

The existing check (equal-timestamp live row over a finished card → unchanged) is exactly the
finished→live "equal" case above, so it keeps passing unmodified.

## The un-dismiss rule

Dismissing a card (the panel's X, or auto-dismiss) records the id so future rows are ignored -
otherwise a dismissed card would reappear on the next poll. Retry from the Downloads page has to
be able to bring a dismissed card back: `applyRows` now lets a *live* row for a dismissed id
through (it can only mean a retry, from this tab or another) while a *finished* row for a
dismissed id still stays skipped, matching the design.

## What the buttons will do (next PRs)

This PR only teaches the panel to render whatever the server reports; nothing yet calls
`POST /downloads/{id}/retry` or `/cancel`. PR #45 (cancel button) adds `retry`/`cancel` to the hook
and a Cancel button; #46 (retry button) adds a Retry button; #47 (cancel one song) adds cancelling one
song inside a collection. Until then a retry can only come from another client (the Downloads page in
a different tab, or a future CLI) - this PR makes sure the panel doesn't lie about it when it happens.

## When to revisit

If the server ever stops stamping `updatedAt` on every write (for example a bulk backfill that
touches `phase` without touching the timestamp), this whole rule silently breaks in the direction
of a card getting stuck. There's no test that would catch that from the client side; it would need
to be caught on the server, which is why the design document pins `updatedAt`'s monotonicity as a
contract, not an implementation detail.
