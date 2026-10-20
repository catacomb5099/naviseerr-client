# Your own playlists in the web app

Date: 20 October 2026

## Context

The owner asked for playlists you make yourself in the app, from any song, album or playlist, with your own
order and picture, downloaded and handed to Navidrome or Jellyfin as one playlist. The server keeps them
(`playlists` table, a `CUSTOM` download; naviseerr ADR `custom-playlists-20-10-2026.md`). This records the web
app's side. Four PRs, stacked: the pages, Add to playlist, reordering, the picture.

## Decisions

1. **Two pages.** `/library` lists your playlists ("New playlist" first, then last edited first, as YouTube Music's
   Library > Playlists, Spotify's Your Library and Apple Music do). `/library/:id` is one playlist, laid out like
   the album page so rows look the same everywhere. Reached from a Library icon next to the gear on every page.
2. **A draft until Create, then frozen.** A draft's name and description are edited where they stand (click, type,
   Enter; Esc puts it back), songs are removed with the X, moved with the grip. Create is a `CUSTOM` download of
   the playlist; afterwards the page shows "Created on <date>. Duplicate it to make changes." and no edit controls.
   Duplicate makes a new draft "Copy of …". Delete is for drafts only and asks in the app's own `<dialog>` (a
   browser may silence `window.confirm` inside a frame, which Feishin uses).
3. **The cover.** Your picture, else four different song pictures as a 2x2 grid, else the first one, else a plain
   square: what Spotify, YouTube Music, Navidrome and Jellyfin draw, so the app and the music app match. The
   grid is computed from the songs on the page, so it follows a removal or a move at once.
4. **One Add to playlist pop-up for the whole app**, opened through a context from every song row, every
   collection header, the song details pop-up and your own playlist's header (YouTube Music's "Save to
   playlist"). A name field with New playlist on top, then your drafts. "Choose songs" leaves some of an album out;
   the songs come from the page that opened it. Only ids go to the server, which reads the songs itself and skips
   songs already in the playlist; the page then says what happened ("Added 9 songs to Road trip · 3 were already in
   it") with an Open link.
5. **Phones.** The row button is hidden under 640 px (a row already holds a picture and three buttons); the song
   details pop-up has it, two taps, like the streaming apps' "⋮ > Add to playlist". The header now holds a third
   icon, so the page-switch button (Back, Search, Downloads) shows only its icon on phones, like Log out. This
   revisits decision 5 of `phone-layout-19-10-2026.md` ("Revisit when a third destination exists"): a bottom tab
   bar is the follow-up if the icons prove too cryptic.
6. **Reordering without a library.** Pointer Events (one API for mouse, touch and pen) on a grip button with
   `touch-action: none`; the browser's own drag and drop does not fire for touch on Android Chrome. The row moves
   while dragging, the page scrolls near the window's edges, one save on release. ArrowUp/ArrowDown on the grip
   move one place and a live region says where. dnd-kit is the upgrade if a real phone finds it janky.
7. **The picture is made in the browser.** `createImageBitmap` → the middle square → a canvas of at most 1200 px →
   JPEG at quality 0.9, previewed, then sent as `image/jpeg`. So the server stores and serves only JPEG (what the
   playlist sidecar and Jellyfin's picture push need) and never decodes an image. JPEG, PNG or WebP, at least 300 px
   (Spotify's minimum), up to 20 MB picked; the server caps what it stores at 4 MB. No crop box (owner question 4,
   default a).

## Not decided

- Two of your playlists with one name write one playlist file; the page warns, nothing more.
- No row virtualisation: a 5,000-song draft renders every row.
