# Poll for download progress only as often as there is something to show

Date: 28 September 2026

## The problem

The app asks the server "what is downloading right now?" (`GET /downloads/active`) every 5 seconds,
all the time, even when nothing is downloading. On an idle tab that is about 12 requests a minute,
or roughly 17,000 a day per open tab, for an answer that never changes.

Two things the owner wanted:

1. Far fewer requests when nothing is happening.
2. The panel to update the moment a download is requested, not after the next tick.

## What was already true

Before changing anything, it was worth checking what the current code did. A fair amount of the
standard answer was already in place:

- Only one place polls. `useActiveDownloads` runs once at the top of the app and hands the result down
  to the download panel and the Downloads page as props. The Downloads page's own list
  (`GET /downloads/all`) is fetched on demand, when you open the page, change page or a new download
  appears; it is not polled.
- A hidden tab already stopped making requests (the timer kept ticking but skipped the fetch), and the
  tab coming back already triggered an immediate request.
- Clicking download already triggered an immediate request.

So the real gap was one thing: **there was one speed**, the server's suggested 5 seconds, whether or
not there was anything to watch.

## How this is usually solved

In increasing order of effort:

- **Adaptive polling.** Fast while there is something in flight (or the user just asked for one),
  slow when idle, paused when the tab is hidden, immediate on return. No server change.
- **One shared poller** so no endpoint is asked twice at once. Already the case here.
- **Server push** (Server-Sent Events or a WebSocket). Removes polling entirely, but needs a new
  endpoint on the backend and reconnection handling on the client.

We chose adaptive polling on top of the existing shared poller. It is the smallest change that
covers both asks and needs nothing from the backend.

## What changed

All the timing rules live in one small file, `src/lib/downloadPolling.ts`:

- **Active speed, 5 s**: something is downloading, or the user clicked download in the last 30 s.
  The server's own suggested interval wins if it sends a different one.
- **Idle speed, 30 s**: nothing to show. Still often enough to notice a download started from
  another tab or device.
- **30 s fast window after a click**: the server can take a few seconds to list a new download, and
  the user is looking at the panel right then, so we stay fast rather than trusting the first
  "nothing here" answer.
- **Hidden tab**: no timer at all now, rather than a timer that ticks and does nothing. When the tab
  is shown again we ask straight away and pick the right speed from the answer.
- **Clicking download** asks straight away (as before) and also re-books the next tick at the fast
  speed, so a pending 30 s idle timer does not delay the follow-up.

The UI is otherwise unchanged. Progress bar animation still uses the server's interval.

One bug found on the way: in development the app runs in React StrictMode, which runs each effect
twice. The "tab shown again" listener lived inside a run-once effect, so StrictMode removed it and
never put it back. That meant the "poll when the tab comes back" behaviour was silently missing in
development builds. It now has its own effect and survives.

## Numbers

Measured on a dev build against the local backend, counting `GET /downloads/active` over 60 s with
the tab visible and no downloads running:

| | Idle, tab visible | Idle, tab hidden | Active download |
|---|---|---|---|
| Before | 11 per minute | 0 | 11-12 per minute |
| After | 2 per minute | 0 | 11-12 per minute (unchanged by design) |

Active-download rate is unchanged: while a bar is moving, every 5 s is the right speed. Live
measurement of the active case was skipped because it would have started a real download against
the owner's library.

## When server push becomes worth it

Not yet. Move to Server-Sent Events when one of these is true:

- Many tabs or users are open at once and the idle traffic still shows up in server load.
- The owner wants sub-second progress updates, where even 5 s polling feels laggy.
- Other live things appear (queue position, per-song progress in the panel) that would each need
  their own poller.

Until then, adaptive polling gives most of the benefit for a client-only change.
