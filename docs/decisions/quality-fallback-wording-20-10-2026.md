# How the quality screens describe a missing quality (20-10-2026)

## Context

The server tries the chosen download quality first, then every higher one (nearest first), then the lower ones
(`DownloadQuality.distance()` in the naviseerr server, PR #196). Client #119 described this in one 45-word sentence that
named Soulseek on the setup's first screen, before Soulseek is explained.

## Decision

- One sentence, kept in `QUALITY_FALLBACK` (`src/lib/downloadQuality.ts`) and shown word for word on the setup's first
  screen and in Settings > Download quality: "If a song isn't available in it, naviseerr gets the next best: a higher
  quality if there is one, otherwise a lower one." It says "naviseerr", not "Soulseek".
- Spotify's voice (its Audio quality screen explains its one extra switch in one plain sentence). Neither Spotify nor
  Apple Music has such a line, because their catalogue always has every quality.
- The pointer to a song's Choose a file pop-up is in Settings only. It means nothing on a first-run question.
- `scripts/check-quality.ts` checks that the sentence says "higher" before "lower", which is the server's order.

## How to flip

- Spell out the exact order under the chosen row (for example High: "Very high, then Lossless, then Normal, then Low"):
  add a `fallbackOrder(tier)` next to `QUALITY_FALLBACK` that copies the server's `distance()`, and keep the two in step.
- Put the Choose a file pointer back on the setup screen: add it to the `help` of the first step in `src/pages/SetupPage.tsx`.
- Name Soulseek again: edit `QUALITY_FALLBACK`, or write it in the Settings paragraph only.
