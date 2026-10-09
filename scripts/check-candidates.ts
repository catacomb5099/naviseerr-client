/** Self-check for the manual-import table helpers; pulled in by check-download-state.ts. */
import {
  GRADE_HINT, GRADE_LABEL, basename, filterRows, folderOf, formatBytes, formatOf, formatSpeed, gradeRank, qualityLabel, qualityRank,
  searchLine, slotLabel, slotRank, sortRows, statusCopy,
} from '../src/lib/candidates'
import { shortDate } from '../src/lib/utils'

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(`check failed: ${message}`)
}

// slskd paths: backslashes with a share alias, and the odd sharer on forward slashes.
assert(basename('@@fqkje\\Music\\Oasis\\05 - Live Forever.flac') === '05 - Live Forever.flac', 'basename on backslashes')
assert(basename('music/oasis/05 - live forever.mp3') === '05 - live forever.mp3', 'basename on forward slashes')
assert(basename('bare.flac') === 'bare.flac', 'basename of a bare name')

// The folder is the rest of the path; name and folder put back together give the path slskd sent.
const path = '@@fqkje\\Music\\Oasis\\05 - Live Forever.flac'
assert(folderOf(path) === '@@fqkje\\Music\\Oasis', 'folderOf on backslashes keeps the share alias')
assert(folderOf('music/oasis/x.mp3') === 'music/oasis', 'folderOf on forward slashes')
assert(folderOf('bare.flac') === '', 'a bare name has no folder')
assert(folderOf('\\x.flac') === '', 'a leading separator alone is not a folder')
assert(`${folderOf(path)}\\${basename(path)}` === path, 'folder + name is the whole path')

// The format comes from the suffix only; slskd's extension field is not consulted.
assert(formatOf('@@a\\x\\Song.FLAC') === 'flac', 'formatOf lower-cases the suffix')
assert(formatOf('a\\b\\no-suffix') === '', 'formatOf without a suffix is blank')
assert(formatOf('a\\.hidden') === '', 'a leading dot is not a suffix')

assert(qualityLabel({ extension: 'flac', bitrateKbps: null }) === 'Lossless', 'flac is lossless without a bitrate')
assert(qualityLabel({ extension: 'wv', bitrateKbps: 900 }) === 'Lossless', 'a lossless suffix wins over a bitrate')
assert(qualityLabel({ extension: 'mp3', bitrateKbps: 320 }) === '320 kbps', 'lossy shows its bitrate')
assert(qualityLabel({ extension: 'm4a', bitrateKbps: null }) === '—', 'unknown bitrate shows a dash')
assert(qualityRank({ extension: 'flac', bitrateKbps: null })! > qualityRank({ extension: 'mp3', bitrateKbps: 320 })!, 'lossless ranks above 320')
assert(qualityRank({ extension: 'mp3', bitrateKbps: null }) === null, 'unknown quality ranks null (sorted last)')

assert(formatBytes(31234567) === '29.8 MB', `formatBytes MB: ${formatBytes(31234567)}`)
assert(formatBytes(412345678) === '393 MB', `formatBytes hundreds: ${formatBytes(412345678)}`)
assert(formatBytes(1536) === '1.5 KB', 'formatBytes KB')
assert(formatBytes(2 * 1024 ** 3) === '2.0 GB', 'formatBytes GB')
assert(formatBytes(null) === '—', 'formatBytes unknown')
assert(formatSpeed(1770000) === '1.7 MB/s', `formatSpeed: ${formatSpeed(1770000)}`)
assert(formatSpeed(0) === '—' && formatSpeed(null) === '—', 'formatSpeed unknown')

assert(slotLabel({ freeSlot: true, queueLength: 0 }) === 'Free', 'free slot')
assert(slotLabel({ freeSlot: false, queueLength: 12 }) === 'Queue 12', 'queue length')
assert(slotLabel({ freeSlot: false, queueLength: 0 }) === 'Busy', 'no slot, empty queue')
assert(slotLabel({ freeSlot: null, queueLength: 0 }) === '—', 'unknown slot')
assert(slotRank({ freeSlot: true, queueLength: 0 })! < slotRank({ freeSlot: false, queueLength: 0 })!, 'free before busy')
assert(slotRank({ freeSlot: false, queueLength: 2 })! < slotRank({ freeSlot: false, queueLength: 9 })!, 'shorter queue first')
assert(gradeRank('EXACT') < gradeRank('OTHER_VERSION') && gradeRank('OTHER_VERSION') < gradeRank('UNVERIFIED'), 'grade order')
assert(gradeRank('UNVERIFIED') < gradeRank('NONE'), 'a file the matcher calls another song sorts last')
assert(GRADE_LABEL.NONE === 'Not a match' && GRADE_HINT.NONE.includes('different song'), 'the NONE badge says what it is')

// Sorting: nulls last both ways, ties stable, text case-insensitive.
const rows = [
  { id: 'a', n: 3 as number | null, s: 'beta' },
  { id: 'b', n: null, s: 'Alpha' },
  { id: 'c', n: 1, s: 'gamma' },
  { id: 'd', n: 3, s: 'alpha' },
]
assert(sortRows(rows, r => r.n, 'asc').map(r => r.id).join('') === 'cadb', 'asc: nulls last, tie a before d')
assert(sortRows(rows, r => r.n, 'desc').map(r => r.id).join('') === 'adcb', 'desc: nulls still last, tie a before d')
assert(sortRows(rows, r => r.s, 'asc').map(r => r.id).join('') === 'bdac', 'text asc is case-insensitive and stable')
assert(sortRows(rows, r => r.s, 'desc').map(r => r.id).join('') === 'cabd', 'text desc')
assert(sortRows(rows, r => r.n, 'asc') !== rows && rows[0].id === 'a', 'sortRows returns a new array')
assert(sortRows([{ s: 'Track 10' }, { s: 'Track 2' }], r => r.s, 'asc')[0].s === 'Track 2', 'numeric-aware text order')

// Filtering: case-insensitive across every text the row offers; blank keeps everything.
const files = [
  { name: '05 - Live Forever.flac', sharer: 'alice', format: 'flac' },
  { name: 'live forever.mp3', sharer: 'Bob', format: 'mp3' },
]
const hay = (f: typeof files[number]) => [f.name, f.sharer, f.format]
assert(filterRows(files, 'FLAC', hay).length === 1, 'filter by format, any case')
assert(filterRows(files, 'bob', hay)[0].sharer === 'Bob', 'filter by sharer')
assert(filterRows(files, 'forever', hay).length === 2, 'filter by name')
assert(filterRows(files, '  ', hay) === files, 'blank filter hands back the same list')
assert(filterRows(files, 'zzz', hay).length === 0, 'no match, no rows')
// The dialog hands the whole path to the filter, so a folder word finds the file (09-10-2026).
assert(filterRows([{ p: '@@a\\Music\\Oasis\\x.flac' }], 'oasis', r => [r.p]).length === 1, 'filter matches a folder word')

// Status wording follows the contract.
assert(statusCopy('SONG', 'READY', null, 'x') === null, 'READY has no message')
assert(statusCopy('SONG', 'SEARCHING', null, null)!.startsWith('Still searching'), 'SEARCHING wording')
assert(statusCopy('SONG', 'NONE', 'NO_RESULTS', 'Live Forever')!.includes('“Live Forever”'), 'NO_RESULTS names the query')
assert(statusCopy('ALBUM', 'NONE', 'NO_WHOLE_FOLDER', null)!.includes('person icon on a song'), 'NO_WHOLE_FOLDER')
assert(statusCopy('SONG', 'NONE', 'ALREADY_IN_LIBRARY', null)!.includes('already in your library'), 'ALREADY_IN_LIBRARY')
assert(statusCopy('SONG', 'NONE', 'SOMETHING_NEW', null) !== null, 'an unknown reason still reads as a sentence')

// Since 09-10-2026 the empty list says what really happened to the search, dated from `searchedAt`
// (midday UTC, so the local day is 5 Oct in every time zone the check may run in).
const NOON = '2026-10-05T12:00:00Z'
const albumBefore = statusCopy('ALBUM', 'NONE', 'BEFORE_CACHE', 'Definitely Maybe', NOON)!
assert(albumBefore.includes('“Definitely Maybe”') && albumBefore.includes(' on 5 Oct ') && albumBefore.includes('8 October 2026'),
  `BEFORE_CACHE album names the query, the day and when lists began: ${albumBefore}`)
assert(!statusCopy('ALBUM', 'NONE', 'BEFORE_CACHE', null, null)!.includes(' on '), 'no date, no dangling "on"')
assert(statusCopy('SONG', 'NONE', 'BEFORE_CACHE', null)!.includes('before file lists were kept'), 'BEFORE_CACHE song')
assert(statusCopy('SONG', 'NONE', 'NO_RESULTS', 'Live Forever', NOON)!.includes('on 5 Oct'), 'NO_RESULTS is dated too')
const albumFailed = statusCopy('ALBUM', 'NONE', 'SEARCH_FAILED', null, NOON)!
assert(albumFailed.includes('refused') && !albumFailed.includes('Nobody shared'), 'a refused album search no longer reads as "nobody shared enough"')
assert(statusCopy('ALBUM', 'NONE', 'NOTHING_TO_SEARCH', null)!.includes('already started'), 'NOTHING_TO_SEARCH')
assert(statusCopy('ALBUM', 'NONE', 'CANCELLED', null, NOON)!.includes('cancelled with the download on 5 Oct'), 'CANCELLED is dated')
assert(statusCopy('SONG', 'NONE', 'NO_OWN_SEARCH', null)!.includes('never searched for on its own'), 'NO_OWN_SEARCH')
const songFailed = statusCopy('SONG', 'NONE', 'SEARCH_FAILED', null)!
assert(songFailed.includes('never completed') && songFailed.includes('slskd'), 'SEARCH_FAILED song names slskd')
assert(statusCopy('SONG', 'NONE', 'SOULSEEK_OFFLINE', null)!.includes('offline'), 'SOULSEEK_OFFLINE song')
for (const reason of ['BEFORE_CACHE', 'NO_OWN_SEARCH', 'SEARCH_FAILED', 'SOULSEEK_OFFLINE', 'NOTHING_TO_SEARCH', 'CANCELLED']) {
  for (const kind of ['SONG', 'ALBUM'] as const) {
    const text = statusCopy(kind, 'NONE', reason, 'x', NOON)!
    assert(!/Retry|Try again/.test(text) && !/undefined|null/.test(text), `${kind} ${reason} leaves the retrying to the button: ${text}`)
  }
}

// The grey line names slskd's own search so a person can find it in slskd's Searches page.
assert(searchLine(null, NOON) === null && searchLine(undefined, null) === null, 'no search id, no line (slskd never took one)')
assert(searchLine('abc-123', null) === 'Soulseek search abc-123', 'id alone when the time is unknown')
assert(/^Soulseek search abc-123 · 5 Oct \d{2}:\d{2}$/.test(searchLine('abc-123', NOON)!), `id, day and local time: ${searchLine('abc-123', NOON)}`)
assert(searchLine('abc-123', 'not a date') === 'Soulseek search abc-123', 'an unreadable time is left out, not printed as NaN')
assert(shortDate(new Date(2026, 9, 5), new Date(2026, 9, 9)) === '5 Oct', 'shortDate this year')
assert(shortDate(new Date(2025, 8, 21), new Date(2026, 9, 9)) === '21 Sep 2025', 'shortDate another year carries it')

console.log('check-candidates: ok')
