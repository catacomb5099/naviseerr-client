# Phone layout: a bottom sheet, folded by default, no tab bar

Date: 19 October 2026

## Context

The owner's words: "Mweb view needs to be bigger its too small to view not mobile friendly". A layout
audit at 375 and 390 px (headless Chromium emulating iOS Safari) found the page was not zoomed out: the
viewport meta was right and nothing overflowed sideways. Three things were wrong instead.

1. The floating "Active downloads" box was a fixed 322 px panel designed for a 1280 px window. On a
   phone it covered 86 % of the width and up to 280 px of height, the page reserved no room under it,
   and it started open. On an album page with live downloads not one track could be seen or scrolled
   into view until the panel was folded.
2. The Downloads page rows kept a 10 px kind badge, 64 px art, a fixed 96 px action column and a
   duration; the title was the only thing that shrank, down to 26 px ("S…"), and to 0 px for a song
   inside an album.
3. Nearly every control was 32 px or smaller (22 px in the panel cards and song rows); a third of the
   text on the Downloads page was 10-12 px.

## Decisions

1. **Phone-only classes, no new component.** Everything is a Tailwind `sm:` split (phones are under
   640 px): the desktop keeps every size it had. Three PRs, one per cause, in the order of user pain:
   rows, panel, sizes.
2. **The panel is a bottom sheet on phones.** Full width, flush with the bottom edge, rounded top
   corners; from tablet up it stays the floating box in the corner. This is the shape YouTube Music web
   and Spotify web use for anything that pops up from the bottom on a phone.
3. **It starts folded on a phone.** The panel reads the viewport (`matchMedia('(max-width: 639px)')`)
   and starts as the one-line pill. The moment the user folds or unfolds it, that choice is saved
   (`minimizedByUser` in the snapshot) and wins from then on. A snapshot without that flag is an
   autosave, not a choice: the hook has written `minimized` 300 ms after every visit since September, so
   every returning browser holds `minimized: false`, and honouring it would have kept every phone open.
   Tablets and desktops keep whatever was saved (open, unless folded by hand).
4. **The page leaves room under the pill.** `App` adds `pb-16` (64 px) on phones whenever there is a
   card, so the last row of any list can be scrolled out from under the pill. The open sheet is not
   reserved for: it starts folded, and its own list scrolls (Spotify's mini-player makes the same trade).
5. **No bottom tab bar yet.** The three streaming apps use one, with three to five destinations;
   naviseerr has two (Search, Downloads). The top-right button gets its word back and 44 px instead.
   Revisit when a third destination exists (a Library or an account page).
6. **Rows follow the streaming apps' phone lists.** 48 px art, 16 px title, 14 px subtitle, the status
   under the title, no duration (YouTube Music and Spotify show none in phone lists), 40 px controls
   (Apple HIG says 44 pt, WCAG 2.5.5 says 44 px, WCAG 2.5.8 AA says 24 px; 40 px is what the row
   budget allows with three buttons and still a readable title).

## Consequences

- Desktop screenshots at 1280 px are unchanged by any of the three PRs (measured).
- A phone that had the panel open before this change starts folded too; only a fold or unfold made after this
  change is remembered. A desktop that was folded by hand before this change stays folded.
- If a user unfolds the sheet on a phone it can still cover the last rows until folded again.
- The pop-ups (choose a file, song details) are not full-screen yet; that is a fourth PR that must wait
  for the manual-import work, which rewrites the same files.
- The Chrome extension is a separate copy of these components and does not pick this up; its popup is a
  fixed 400 px window, so phones are not its case.
