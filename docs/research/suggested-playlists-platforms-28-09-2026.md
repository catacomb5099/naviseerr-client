# How Spotify, YouTube Music and others do pre-computed playlists, and what naviseerr should copy

**Date:** 28 September 2026

For naviseerr's product owner. A second reviewer checked some facts. Facts nobody double-checked are marked "(not independently checked)". No claim failed checking, but a few were softened, and the softer wording is used here.

## In short

- Every big service builds personal playlists ahead of time, in one batch, and drops them on a fixed day. Spotify's Discover Weekly lands on Monday. YouTube Music's Discover Mix lands on Wednesday. Release Radar and Tidal's new-release list land on Friday.
- The lists are short: 10 to 50 songs. Spotify tested a 100-song version and people found it a burden.
- The refresh day is one plain sentence in the playlist description, such as "Updated every Monday". Services say the day, never the hour. Nobody shows a live timestamp badge.
- Each new edition replaces the old one. No mainstream service keeps last week's list. People complain about this and build their own archives.
- Cover art is a template per playlist, not per song: a colour block or gradient with the playlist name. YouTube Music adds a collage of album art from the songs inside.
- Almost nobody explains why a song was picked. The only cases are Spotify's Blend ("added for [friend]") and a small YouTube Music test ("Because you liked [artist]").
- When nothing is ready, services hide the shelf or show a card that says what to do and when to come back. Nobody shows an empty card. The old edition stays until the new one is fully in place.
- Spotify chose weekly on purpose. It makes each edition feel special, builds a habit, and a weak week is forgiven because the next one is days away.

## Spotify

Spotify's help centre lists all of these under "Made For You", reachable from Home, from Search, or by name ([Spotify help](https://support.spotify.com/us/article/find-playlists/)).

| Playlist | What it is | How often it refreshes | How it is presented |
|---|---|---|---|
| Discover Weekly | 30 songs you have not heard, picked from your listening | Every Monday ([Spotify help](https://support.spotify.com/us/article/find-playlists/), [Spotify newsroom, 2025](https://newsroom.spotify.com/2025-06-30/discover-weekly-turns-10-celebrating-100-billion-tracks-streamed-and-a-decade-of-personalized-discovery/)) | Card with a "Made for [username]" byline. Description ends "updated every Monday. You'll know when you hear it." (byline and description not independently checked, [playlist types](https://support.spotify.com/us/artists/article/types-of-spotify-playlists/), [playlist page](https://open.spotify.com/playlist/37i9dQZEVXcHoL0Ubg4lOK)) |
| Release Radar | About 30 new releases from artists you follow, plus new singles picked for you | Every Friday ([Spotify help](https://support.spotify.com/us/article/find-playlists/), [Spotify for Artists, 2016](https://artists.spotify.com/en/blog/say-hello-to-release-radar)) | "Fresh New Music" shelf on Home each Friday, and in the Made For You hub ([Spotify newsroom, July 2026](https://newsroom.spotify.com/2026-07-10/discovery-playlists-release-radar-control-updates/)). An unheard song can stay up to 4 weeks ([artist help](https://support.spotify.com/us/artists/article/getting-music-on-release-radar/)) |
| Spotify Mixes (Daily, Artist, Mood, Genre, Niche) | Your regular listens plus songs Spotify thinks you will like | "The more you listen, the more frequently it updates" ([Spotify help](https://support.spotify.com/us/article/spotify-mixes/)). Niche Mixes update daily (not independently checked, [newsroom, 2023](https://newsroom.spotify.com/2023-03-28/introducing-niche-mixes-personalized-playlists-for-almost-anything-you-can-think-of/)) | Search, then Made For You |
| On Repeat and Repeat Rewind | Your most played from the last 30 days, and older favourites | Every 5 days ([Spotify help](https://support.spotify.com/us/article/find-playlists/)) | Made For You hub and a "Uniquely Yours" shelf on Home (not independently checked, [newsroom, 2019](https://newsroom.spotify.com/2019-09-24/introducing-two-new-personalized-playlists-on-repeat-and-repeat-rewind/)) |
| daylist | A mood playlist whose title changes with the time of day | Several times a day. The playlist page shows when the next update lands (not independently checked, [newsroom, 2023](https://newsroom.spotify.com/2023-09-12/ever-changing-playlist-daylist-music-for-all-day/)) | Titles such as "windows down, thrillwave monday evening" |
| Your Time Capsule | 50 nostalgic songs | "Frequently refreshes" (not independently checked, [newsroom, 2020](https://newsroom.spotify.com/2020-09-28/spotifys-refreshed-time-capsule-playlist-gives-listeners-a-dose-of-nostalgia/)) | Made For You hub |

Worth knowing:

- Spotify states the day, never the hour. The "just after midnight on Monday" detail is one user in a [community thread](https://community.spotify.com/t5/Content-Questions/Discover-weekly-has-not-updated-this-Monday/td-p/5332101). Treat it as hearsay.
- New accounts see nothing until "a few weeks of listening" ([Spotify help](https://support.spotify.com/us/article/find-playlists/)). The old Daily Mix placeholder read "Play your favorites and come back soon" (not independently checked, [TechCrunch, 2016](https://techcrunch.com/2016/09/27/spotify-daily-mix/)).
- Covers are per playlist. Discover Weekly launched with the user's profile photo. The 2025 redesign moved to bright gradients that change weekly (not independently checked, [Spotify engineering, 2015](https://engineering.atspotify.com/2015/11/what-made-discover-weekly-one-of-our-most-successful-feature-launches-to-date), [Studio Herrström](https://www.studioherrstrom.com/work/spotify-discover-weekly)).
- No per-song reasons. The 2025 controls are genre chips at the top of the playlist (not independently checked, [TechCrunch, 2025](https://techcrunch.com/2025/06/30/spotify-will-revamp-its-discover-weekly-playlist-after-ten-years/)). Only Blend labels which friend a song was added for (not independently checked, [newsroom, 2022](https://newsroom.spotify.com/2022-03-30/discover-and-listen-to-music-with-even-more-friends-and-family-plus-some-of-your-favorite-artists-with-spotifys-newest-blend-update/)).
- Each refresh overwrites the list, so Spotify tells people to save what they like (not independently checked, [daylist, 2024](https://newsroom.spotify.com/2024-09-04/daylist-new-languages-expanding-worldwide/)). About 126,000 people run an [IFTTT archive applet](https://ifttt.com/applets/NFRkZeJu-automatically-create-a-discover-weekly-archive) to keep old editions (not independently checked).

## YouTube Music

All personal mixes sit in one Home shelf called "Mixed for you". It is a horizontal row of cards with a "More" button that opens a full grid (not independently checked, [9to5Google, 2022](https://9to5google.com/2022/06/24/youtube-music-mixed-for-you-grid/)). It is not the first shelf on Home; "Listen again" usually comes first (not independently checked, [9to5Google, 2024](https://9to5google.com/2024/02/28/youtube-music-homescreen-off/)).

| Playlist | What it is | How often it refreshes | How it is presented |
|---|---|---|---|
| Discover Mix | 50 songs you have not heard | Every Wednesday. Description: "Discover great music, picked just for you. Updated every Wednesday." (not independently checked, [Google blog](https://blog.google/intl/en-in/products/platforms/youtube-music-makes-discovery-more/), [9to5Google, 2019](https://9to5google.com/2019/09/21/youtube-music-discover-mix/)) | Card in Mixed for you. Can be saved to the library and downloaded for offline play ([MacRumors, 2019](https://www.macrumors.com/2019/09/23/youtube-music-gains-discover-mix-playlist/)) |
| New Release Mix | New releases picked for you | Big update every Friday plus small additions midweek (not independently checked, [Google blog](https://blog.google/intl/en-in/products/platforms/youtube-music-makes-discovery-more/)) | Card in Mixed for you |
| My Supermix | About 100 songs mixing favourites and new | "Updated daily" (not independently checked, [9to5Google, 2020](https://9to5google.com/2020/08/30/youtube-music-your-mix/)) | Card in Mixed for you. Autoplay continues after the list ends |
| My Mix 1 to 7 | Up to seven mixes, each around one sound | "Always updating" ([YouTube blog, 2020](https://blog.youtube/news-and-events/youtube-music-brings-personalization-your-everyday-moods-and-moments/)). "Daily" appears in one outlet only | Descriptive titles such as "Indie Pop Gems" have been rolling out since 2025, while the cover still reads "My Mix 1-7" ([9to5Google, 2025](https://9to5google.com/2025/02/21/youtube-music-mixes-naming/)) |
| Replay Mix | Up to 100 of your most played from recent weeks | Rolling, no set day (not independently checked, [9to5Google, 2021](https://9to5google.com/2021/06/11/youtube-music-adds-new-replay-mix-for-your-most-played-songs/)) | Card in Mixed for you |
| Archive Mix | Songs you have not played in a while, per community posts | Unknown (not independently checked, [Android Police, 2025](https://www.androidpolice.com/youtube-music-new-names-my-mix-playlists/)) | Card in Mixed for you |
| Recap | Yearly and seasonal top songs | Once a season. Needs 10 hours of listening a year, or 4 a season (not independently checked, [Google help](https://support.google.com/youtubemusic/answer/11418178?hl=en)) | Banner at the top of Home. Reached from the profile icon |

Worth knowing:

- Covers are made by the app: a collage of album art from the mix's own songs on a solid colour, with the mix name over it (not independently checked, [9to5Google, 2022](https://9to5google.com/2022/04/21/youtube-music-refreshes-mixed-for-you-covers-w-album-art-and-artist-profiles/)).
- New accounts get mixes after picking a couple of artists or playing a few songs. There is no placeholder tile; the shelf simply does not appear (not independently checked, [Google blog](https://blog.google/intl/en-in/products/platforms/youtube-music-makes-discovery-more/), [Google help](https://support.google.com/youtubemusic/answer/6364666?hl=en)).
- Per-song reasons exist only in the 2025 "Your Daily Discover" test: "Because you liked [artist]" under each cover (not independently checked, [Android Police, 2025](https://www.androidpolice.com/youtube-music-daily-discover-android/)).

## Others

| Service and playlist | What it is | How often it refreshes | How it is presented |
|---|---|---|---|
| Apple Music mixes (Your Essentials, New Music, Chill, Friends, Workout) | 25 songs each | One weekday each, spread across the week. Heavy Rotation Mix is daily (not independently checked, [9to5Mac, 2018](https://9to5mac.com/2018/08/07/apple-music-launches-new-weekly-friends-mix-in-for-you/), [MacRumors, 2024](https://www.macrumors.com/2024/02/28/apple-music-heavy-rotation-mix/)) | "Updated [weekday]" under the title (not independently checked, [Apple community](https://discussions.apple.com/thread/251789004)). Colour-block covers with the mix name, in a "Made For You" shelf (not independently checked, [9to5Mac, 2020](https://9to5mac.com/2020/06/17/apple-music-refreshes-made-for-you-playlist-artwork-ahead-of-wwdc/)) |
| Apple Music Replay | Your top songs of the year | Updated weekly. Past years stay browsable (not independently checked, [Apple support](https://support.apple.com/en-us/109356)) | Home, with "Go back in time" for old years |
| Amazon Music Weekly Vibe | An AI playlist around one theme | Every Monday (not independently checked, [TechCrunch, 2025](https://techcrunch.com/2025/09/08/amazon-musics-new-ai-feature-generates-personalized-playlists-every-monday)) | Library, then Made for You. Each week gets its own title and description |
| Amazon Music My Discovery Mix | Weekly discovery list | Sunday night or Monday, per users and press only. Amazon names the playlist but publishes no day ([Amazon FAQ](https://www.amazon.com/b?ie=UTF8&node=23680152011), [Digital Trends](https://www.digitaltrends.com/home-theater/what-is-amazon-music/), [Audiokarma](https://audiokarma.org/forums/threads/my-discovery-mix-on-amazon-music.1032829/)) | Users keep their own archive playlists because songs vanish on refresh |
| Tidal Daily Discovery | 10 songs | Daily, "in the US morning timezone" (not independently checked, [Tidal support](https://support.tidal.com/hc/en-us/articles/23351150845329-Daily-Discovery)) | Home. Help copy says the shelf fills "once we have data on your listening habits" |
| Tidal My New Arrivals | 30 new releases | Every Friday (not independently checked, [Tidal support](https://support.tidal.com/hc/en-us/articles/29710779228817-My-New-Arrivals)) | Home. Fewer songs show when there is not enough new music |
| Tidal My Mix | Up to 8 mixes by style | Faster the more you listen (not independently checked, [Tidal support](https://support.tidal.com/hc/en-us/articles/360000702697-My-Mix)) | Home, "usually within a day or two" of joining |
| Deezer Flow | An endless stream, not a list | Continuous. Unlocks after 16 favourites (not independently checked, [Deezer](https://www.deezer.com/explore/en-us/features/flow/)) | Mood wheel above the cover. Slider for favourites versus discoveries (not independently checked, [Deezer newsroom, 2023](https://newsroom-deezer.com/2023/07/deezer-takes-flow-to-the-next-level-and-makes-it-the-perfect-musical-companion-for-every-occasion/)) |
| Pandora Thumbprint Radio | A station of songs you thumbed up | Grows as you thumb (not independently checked, [Pandora glossary](https://developer.pandora.com/docs/glossary/thumbprint-radio/)) | Station, not a list |
| ListenBrainz, Explo, Navidrome, Jellyfin | Weekly discovery lists for self-hosters | ListenBrainz: Monday morning in the user's timezone. Explo and Jellyfin overwrite the last list by default (not independently checked, [ListenBrainz docs](https://listenbrainz.readthedocs.io/en/latest/general/data-update-intervals.html), [Explo](https://github.com/LumePart/Explo), [Jellyfin plugin](https://github.com/ranaldsgift/jellyfin-smartplaylist-plugin)) | Title carries the week, for example "Weekly Exploration, week of 2026-09-28" (not independently checked, [troi code](https://github.com/metabrainz/troi-recommendation-playground/blob/main/troi/patches/periodic_jams.py)) |

## How the big platforms build them

**Batch, not on demand.** Spotify rebuilt about 100 million Discover Weekly playlists every Sunday night so they were ready on Monday morning. Later it spread the work over several days (not independently checked, [IEEE Spectrum](https://spectrum.ieee.org/the-little-hack-that-could-the-story-of-spotifys-discover-weekly-recommendation-engine)). A "doorman" process swapped the new results in all at once, so nobody saw a half-finished list (not independently checked, [Spotify engineering, 2016](https://engineering.atspotify.com/2016/8/commodity-music-ml-services)).

**Heavy work ahead, light work on open.** YouTube and Spotify do the expensive picking offline. Only cheap steps, like ordering and filtering, run when the user opens the app (not independently checked, [Google Research](https://research.google/pubs/deep-neural-networks-for-youtube-recommendations/), [Spotify engineering, 2021](https://engineering.atspotify.com/2021/11/the-rise-and-lessons-learned-of-ml-models-to-personalize-content-on-home-part-i)).

**Batch makes checking possible.** For Wrapped 2025, Spotify built all 1.4 billion reports first, found a timezone bug, and rebuilt the bad ones before launch (not independently checked, [Spotify engineering, 2026](https://engineering.atspotify.com/2026/3/inside-the-archive-2025-wrapped)).

**Scheduling.** One named weekday, built the night before. ListenBrainz builds on Monday morning in each user's timezone (not independently checked). Navidrome does the opposite: build when someone opens the list, then hold it for a week. No scheduler, but no shared Monday moment either (not independently checked, [Navidrome docs](https://www.navidrome.org/docs/usage/features/smart-playlists/)).

**When nothing is ready.** Spotify shows nothing, or a "keep listening and come back" card. Tidal says the shelf fills once it has data. Self-hosted tools leave the old edition visible with an "Updated" time (not independently checked, [Explo FAQ](https://github.com/LumePart/Explo/wiki/8.-FAQ)). Spotify users treat any midweek change as a bug, and moderators agree (not independently checked, [community thread](https://community.spotify.com/t5/Your-Library/Discover-weekly-changed-midweek-while-I-was-listening-to-it/td-p/5329843)).

**Why weekly.** Spotify's team wrote that fewer songs feel more special, "quality over quantity", and that weekly refreshes build a habit (not independently checked, [Spotify engineering, 2015](https://engineering.atspotify.com/2015/11/what-made-discover-weekly-one-of-our-most-successful-feature-launches-to-date)). The product lead said users forgive a weak week: "I'll see you next week" (not independently checked, [Music Ally, 2016](https://musically.com/2016/03/21/matt-ogle-discover-weekly-spotify/)). YouTube Music picked Wednesday, a day no rival uses.

## What this means for naviseerr's Suggested playlists

1. **A "Made for you" shelf on Home.** One horizontal row of cards, one card per category, with a "See all" link to a grid page. It does not need to be the first shelf. Copies YouTube Music's Mixed for you shelf and its More button.

2. **Generated covers.** One cover per category: a two-colour gradient chosen from the category name so it stays the same every week, the category name in large text, and a small "Week of 28 Sep" line. No album art, since the batch job has none. Copies Apple's colour-block covers and Spotify's 2025 gradient look; skips YouTube Music's album collage.

3. **Freshness wording.** Card description: "40 songs. New edition every Monday." Under the title: "Updated Monday" when within the last 7 days, else "Updated 21 Sep". Never show an hour. Copies Tidal's "updated every Friday with 30 tracks" formula and Apple's "Updated [weekday]" line; Spotify states the day only.

4. **When this week's edition is not ready.** Keep last week's edition visible with a badge "New edition due Monday". If no edition exists yet, show the card with "First edition arrives Monday" and a button "Make this week's playlists now". After tapping, the button reads "Building, usually a few minutes" and the page checks back on its own. Copies Spotify's "come back soon" placeholder and the self-hoster habit of leaving the old list in place. The button is naviseerr's own; no platform offers it.

5. **Per-song hints.** A small tag on each row: "Top hit", "Deeper cut" or "Wild card", with the batch job's one-line reason as grey text under the song title. Copies the "Because you liked [artist]" style from YouTube Music's Daily Discover test. No weekly mix shows these, so keep it quiet.

6. **Reaching last week's edition.** Save each edition as its own record (category plus week). Show the current one by default, add a "Last week" link on the playlist page, and keep the last four. Copies Apple Music Replay's "Go back in time" and the week-in-the-title habit of ListenBrainz and Explo. No mainstream weekly mix does this, and the IFTTT archive numbers show people want it.

7. **Downloading.** A download icon on each song row, and a "Download all" button in the header that queues every song not yet in the library. Show "12 of 40 in your library". Copies YouTube Music's Discover Mix, which can be downloaded whole, plus Spotify's save-a-song nudge.

8. **Keep it at 40, with some familiar songs.** Do not grow the list. Each edition should hold a few songs the user already knows. Copies Spotify's finding that 100 songs felt like a burden and an all-unknown list felt intimidating (not independently checked, [TIME, 2015](https://time.com/4131520/spotify-discover-weekly-playlists/)).

9. **Publish all at once, built the night before.** The batch job checks the edition (song count, duplicates, availability) before the client can see it, and the scheduled run lands on Sunday night. Copies Spotify's Sunday-night build and doorman swap.

## Sources

https://support.spotify.com/us/article/find-playlists/
https://newsroom.spotify.com/2025-06-30/discover-weekly-turns-10-celebrating-100-billion-tracks-streamed-and-a-decade-of-personalized-discovery/
https://support.spotify.com/us/artists/article/types-of-spotify-playlists/
https://open.spotify.com/playlist/37i9dQZEVXcHoL0Ubg4lOK
https://artists.spotify.com/en/blog/say-hello-to-release-radar
https://newsroom.spotify.com/2026-07-10/discovery-playlists-release-radar-control-updates/
https://support.spotify.com/us/artists/article/getting-music-on-release-radar/
https://support.spotify.com/us/article/spotify-mixes/
https://newsroom.spotify.com/2023-03-28/introducing-niche-mixes-personalized-playlists-for-almost-anything-you-can-think-of/
https://newsroom.spotify.com/2019-09-24/introducing-two-new-personalized-playlists-on-repeat-and-repeat-rewind/
https://newsroom.spotify.com/2023-09-12/ever-changing-playlist-daylist-music-for-all-day/
https://newsroom.spotify.com/2020-09-28/spotifys-refreshed-time-capsule-playlist-gives-listeners-a-dose-of-nostalgia/
https://community.spotify.com/t5/Content-Questions/Discover-weekly-has-not-updated-this-Monday/td-p/5332101
https://techcrunch.com/2016/09/27/spotify-daily-mix/
https://engineering.atspotify.com/2015/11/what-made-discover-weekly-one-of-our-most-successful-feature-launches-to-date
https://www.studioherrstrom.com/work/spotify-discover-weekly
https://techcrunch.com/2025/06/30/spotify-will-revamp-its-discover-weekly-playlist-after-ten-years/
https://newsroom.spotify.com/2022-03-30/discover-and-listen-to-music-with-even-more-friends-and-family-plus-some-of-your-favorite-artists-with-spotifys-newest-blend-update/
https://newsroom.spotify.com/2024-09-04/daylist-new-languages-expanding-worldwide/
https://ifttt.com/applets/NFRkZeJu-automatically-create-a-discover-weekly-archive
https://9to5google.com/2022/06/24/youtube-music-mixed-for-you-grid/
https://9to5google.com/2024/02/28/youtube-music-homescreen-off/
https://blog.google/intl/en-in/products/platforms/youtube-music-makes-discovery-more/
https://9to5google.com/2019/09/21/youtube-music-discover-mix/
https://www.macrumors.com/2019/09/23/youtube-music-gains-discover-mix-playlist/
https://9to5google.com/2020/08/30/youtube-music-your-mix/
https://blog.youtube/news-and-events/youtube-music-brings-personalization-your-everyday-moods-and-moments/
https://9to5google.com/2025/02/21/youtube-music-mixes-naming/
https://9to5google.com/2021/06/11/youtube-music-adds-new-replay-mix-for-your-most-played-songs/
https://www.androidpolice.com/youtube-music-new-names-my-mix-playlists/
https://support.google.com/youtubemusic/answer/11418178?hl=en
https://9to5google.com/2022/04/21/youtube-music-refreshes-mixed-for-you-covers-w-album-art-and-artist-profiles/
https://support.google.com/youtubemusic/answer/6364666?hl=en
https://www.androidpolice.com/youtube-music-daily-discover-android/
https://9to5mac.com/2018/08/07/apple-music-launches-new-weekly-friends-mix-in-for-you/
https://www.macrumors.com/2024/02/28/apple-music-heavy-rotation-mix/
https://discussions.apple.com/thread/251789004
https://9to5mac.com/2020/06/17/apple-music-refreshes-made-for-you-playlist-artwork-ahead-of-wwdc/
https://support.apple.com/en-us/109356
https://techcrunch.com/2025/09/08/amazon-musics-new-ai-feature-generates-personalized-playlists-every-monday
https://www.amazon.com/b?ie=UTF8&node=23680152011
https://www.digitaltrends.com/home-theater/what-is-amazon-music/
https://audiokarma.org/forums/threads/my-discovery-mix-on-amazon-music.1032829/
https://support.tidal.com/hc/en-us/articles/23351150845329-Daily-Discovery
https://support.tidal.com/hc/en-us/articles/29710779228817-My-New-Arrivals
https://support.tidal.com/hc/en-us/articles/360000702697-My-Mix
https://www.deezer.com/explore/en-us/features/flow/
https://newsroom-deezer.com/2023/07/deezer-takes-flow-to-the-next-level-and-makes-it-the-perfect-musical-companion-for-every-occasion/
https://developer.pandora.com/docs/glossary/thumbprint-radio/
https://listenbrainz.readthedocs.io/en/latest/general/data-update-intervals.html
https://github.com/LumePart/Explo
https://github.com/ranaldsgift/jellyfin-smartplaylist-plugin
https://github.com/metabrainz/troi-recommendation-playground/blob/main/troi/patches/periodic_jams.py
https://spectrum.ieee.org/the-little-hack-that-could-the-story-of-spotifys-discover-weekly-recommendation-engine
https://engineering.atspotify.com/2016/8/commodity-music-ml-services
https://research.google/pubs/deep-neural-networks-for-youtube-recommendations/
https://engineering.atspotify.com/2021/11/the-rise-and-lessons-learned-of-ml-models-to-personalize-content-on-home-part-i
https://engineering.atspotify.com/2026/3/inside-the-archive-2025-wrapped
https://www.navidrome.org/docs/usage/features/smart-playlists/
https://github.com/LumePart/Explo/wiki/8.-FAQ
https://community.spotify.com/t5/Your-Library/Discover-weekly-changed-midweek-while-I-was-listening-to-it/td-p/5329843
https://musically.com/2016/03/21/matt-ogle-discover-weekly-spotify/
https://time.com/4131520/spotify-discover-weekly-playlists/
