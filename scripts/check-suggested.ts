/** Self-check for the suggested playlists' copy helpers; pulled in by check-download-state.ts. */
import {
  cadenceCopy, categoryStatusCopy, coverGradient, editionDateLong, editionLabel, filtersCopy, runSummary, tierCopy,
} from '../src/lib/suggested'
import { CuratorRun } from '../src/api/types'

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(`check failed: ${message}`)
}

// Monday 28 September 2026, local time - the date the labels are relative to.
const now = new Date(2026, 8, 28, 15, 30)

assert(editionLabel('2026-09-28', now) === 'Updated today', 'same day is today')
assert(editionLabel('2026-09-27', now) === 'Updated yesterday', 'one day back is yesterday')
assert(editionLabel('2026-09-24', now) === 'Updated Thursday', 'inside a week names the weekday')
assert(editionLabel('2026-09-22', now) === 'Updated Tuesday', 'six days back still names the weekday')
assert(editionLabel('2026-09-21', now) === 'Updated 21 Sep', 'a week back is a date, else "Monday" would mean today')
assert(editionLabel('2025-12-29', now) === 'Updated 29 Dec 2025', 'another year says so')
assert(editionLabel('2026-10-05', now) === 'Updated today', 'a date in the future (clock skew) is not "in -7 days"')
assert(editionLabel('soon', now) === 'Edition soon', 'an unreadable date is shown, not hidden')
assert(editionLabel('2026-02-30', now) !== 'Edition 2026-02-30' || true, 'an impossible day never throws')

assert(editionDateLong('2026-09-27') === '27 September 2026', 'long form is day month year')
assert(editionDateLong('nope') === 'nope', 'long form falls back to the raw text')

assert(filtersCopy({ style: 'Indie Pop', year: '1980-1989' }) === '1980-1989 · Indie Pop', 'the year comes first')
assert(filtersCopy({ genre: 'Pop', year: '2024-2026' }) === '2024-2026 · Pop', 'genre reads like style')
assert(filtersCopy({}) === '', 'no filters, no text')

assert(tierCopy('top') === 'Top hit' && tierCopy('mid') === 'Deep cut' && tierCopy('random') === 'Wild card', 'the three tiers have plain words')
assert(tierCopy('new-tier') === 'new-tier', 'an unknown tier shows its raw word')

assert(coverGradient('80s-indie-pop') === coverGradient('80s-indie-pop'), 'a category keeps its cover')
assert(coverGradient('80s-indie-pop') !== coverGradient('current-pop'), 'two categories differ')

assert(cadenceCopy('MONDAY') === 'New edition every Monday.', 'the server\'s weekday becomes a sentence')
assert(cadenceCopy(null) === 'A new edition every week.', 'no weekday, no false promise')

assert(categoryStatusCopy('written') === 'ready' && categoryStatusCopy('no_albums') === 'nothing found on Discogs', 'statuses have plain words')
assert(categoryStatusCopy('later') === 'later', 'an unknown status shows its raw word')

const run = (final: boolean, statuses: string[]): CuratorRun => ({
  runId: 'r', status: final ? 'partial' : 'running', requestedAt: '', startedAt: null, finishedAt: null, final,
  categories: statuses.map((status, i) => ({ key: `c${i}`, status, editionDate: null, trackCount: null, message: null })),
})
assert(runSummary(run(false, ['written', 'running', 'queued'])) === "Making this week's playlists… 1 of 3 done. This usually takes a few minutes.", 'progress counts finished categories')
assert(runSummary(run(true, ['written', 'exists'])) === "This week's playlists are ready.", 'written or already there both count as ready')
assert(runSummary(run(true, ['written', 'no_albums', 'error'])) === '1 of 3 playlists are ready.', 'a partial run says how many')
assert(runSummary(run(true, ['no_albums'])) === "Couldn't make this week's playlists.", 'nothing ready is a failure')

console.log('check-suggested: ok')
