# Naviseerr inside Feishin: a Discover page that frames this web app

**Date:** 20-10-2026
**Status:** Accepted. Three PRs here (frame header; sign-in back to Feishin; Play bridge) and two on the
Feishin fork `catacomb5099/feishin` (Discover page; Play from the library).

## Context

The owner listens in Feishin (a player for Navidrome and Jellyfin) and finds and downloads music in
Naviseerr. They wanted one app. Three ways were compared (sweep notes, research `feishin-discover.md`):
show this web app inside Feishin (A), share the React code between both (B), or rebuild every Naviseerr
screen natively in Feishin the way Fladder rebuilt Seerr (C). B and C make every later feature cost
twice; A keeps every feature in this repo and Feishin shows it the day the image is updated.

## Decisions

1. **Feishin shows this web app whole, in a full-height frame, on a "Discover" page** right under Home.
   Same spot as YouTube Music's "Explore". This repo builds every feature as before.
2. **Framing is opt-in per address.** Caddy sends `Content-Security-Policy: frame-ancestors 'self'
   $NAVISEERR_EMBED_ORIGINS` instead of `X-Frame-Options: DENY`. Empty (the default) lets nobody else
   frame the app, as before. `frame-ancestors` also wins over the `X-Frame-Options: SAMEORIGIN` the
   owner's proxy adds (measured in Chromium).
3. **Same domain only.** The login cookie is `SameSite=Lax`, so a frame gets it only when Feishin and
   Naviseerr share a site (`feishin.example.com` + `naviseerr.example.com`). The Feishin desktop app and
   another domain do not get it, so they are left out (Feishin hides the setting in its desktop app).
4. **Sign-in leaves the frame and comes back.** Feishin adds `?from=<its page>` to the frame address
   (the owner's proxy strips referrers between sites). `src/lib/embed.ts` keeps it for the tab; "Continue
   with Authentik" opens at the top (Authentik refuses frames) and returns to that page. The server
   accepts the return address only when it is in `AUTH_ALLOWED_ORIGINS`; otherwise the app's own home.
5. **Play asks Feishin first.** Inside Feishin, Play posts `{type: 'naviseerr:play', id, title,
   artists}` to Feishin's origin; Feishin searches its library, plays a match in its own player and
   answers `{type: 'naviseerr:played', id, played}`. Not played, or no answer in 1.5 s: YouTube Music
   opens as before. Every Play button asks, not only songs this browser saw finish: the downloads feed
   forgets a finished song about 30 s later, so the library is the only reliable "downloaded".
6. **Only `src/lib/embed.ts` looks at `window.top` / `window.parent`.** Messages go to Feishin's origin
   only and only its answers count; Feishin accepts messages only from the Naviseerr origin and its own
   frame.

## Not done

Theme sync (both apps are dark), hiding Naviseerr's own header, syncing the frame's page into
Feishin's address, the desktop app, telling Feishin to refresh its library when a download lands.
