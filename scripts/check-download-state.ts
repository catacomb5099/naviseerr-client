/**
 * Self-check for the download state logic. No test framework in this repo, so this is a plain
 * script: `npm run check` compiles it with the installed tsc and runs it; any failed assertion
 * throws and exits non-zero.
 */
import './check-collection-progress'
import './check-download-polling'
import './check-suggested'
import './check-request-cache'
import { ActiveDownloadView } from '../src/api/types'
import { DownloadCardState, failureCopy, isCancelled, isTerminal, mergeCard, replaceCard } from '../src/lib/downloadPanel'
import { DownloadMeta, collectionPath, evictToCap, pageItems, parseTypeFilter } from '../src/lib/downloadLibrary'
import { formatPlays } from '../src/lib/utils'

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(`check failed: ${message}`)
}

const T0 = '2026-01-01T00:00:00.000Z'

const card: DownloadCardState = {
  downloadId: 'd1', youtubeId: 'v1', downloadType: 'SONG',
  title: 'Down', artists: ['Jay Sean'], imageUrl: 'https://img/1.png',
  stage: 'SEARCHING', progressPercent: null,
  songCount: 1, songsSucceeded: 0, songsFailed: 0, songsCancelled: 0, failureCode: null,
  requestedAt: T0, stageEnteredAt: T0, updatedAt: T0,
  lastChangedAt: 1, lastSeenAt: 1,
}

const row: ActiveDownloadView = {
  downloadId: 'd1', youtubeId: 'v1', downloadType: 'SONG',
  title: null, artists: [], imageUrl: null,
  stage: 'SEARCHING', progressPercent: null,
  songCount: 1, songsSucceeded: 0, songsFailed: 0, songsCancelled: 0,
  requestedAt: T0, stageEnteredAt: T0, updatedAt: T0, finishedAt: null, failureCode: null,
}

// Null metadata from the server never blanks what the optimistic card already shows.
const filled = mergeCard(card, row)
assert(filled.title === 'Down', 'null title must not blank the card')
assert(filled.artists.length === 1 && filled.artists[0] === 'Jay Sean', 'empty artists must not blank the card')
assert(filled.imageUrl === 'https://img/1.png', 'null imageUrl must not blank the card')
assert(filled.lastChangedAt === 1, 'an unchanged row must not bump lastChangedAt')

// Server-resolved metadata wins once it arrives.
const resolved = mergeCard(card, { ...row, title: 'Down (Remix)', artists: ['A', 'B'], imageUrl: 'x' })
assert(resolved.title === 'Down (Remix)' && resolved.artists.length === 2 && resolved.imageUrl === 'x',
  'server metadata must replace the client guess')

// A tallies-only change is a change: the card floats to the top.
const tallied = mergeCard(card, { ...row, songsSucceeded: 1 })
assert(tallied.lastChangedAt > 1, 'songsSucceeded change must bump lastChangedAt')
assert(mergeCard(card, { ...row, songsFailed: 1 }).lastChangedAt > 1, 'songsFailed change must bump lastChangedAt')
assert(mergeCard(card, { ...row, songsCancelled: 1 }).lastChangedAt > 1, 'songsCancelled change must bump lastChangedAt')
assert(mergeCard(card, { ...row, songsCancelled: undefined }).songsCancelled === 0, 'an older server with no songsCancelled reads as 0')

// A terminal card ignores a later non-terminal row at the SAME timestamp: the two-second window in
// which every song is finished but the download has not yet concluded must not reopen the card.
const done: DownloadCardState = { ...card, stage: 'SUCCEEDED' }
assert(mergeCard(done, { ...row, stage: 'DOWNLOADING', progressPercent: 50 }) === done,
  'terminal card must not walk back to an active stage at the same timestamp')

const T1 = '2026-01-01T00:00:10.000Z', T2 = '2026-01-01T00:00:20.000Z'
const failedCard: DownloadCardState = { ...card, stage: 'FAILED', failureCode: 'TIMED_OUT', progressPercent: 40, updatedAt: T1 }
// A strictly newer live row reopens a finished card, and the old outcome does not leak into the new attempt.
const reopened = mergeCard(failedCard, { ...row, stage: 'STARTING', progressPercent: null, failureCode: null, updatedAt: T2 })
assert(reopened.stage === 'STARTING', 'a newer live row reopens a finished card')
assert(reopened.failureCode === null, 'the old failure code does not survive a retry')
assert(reopened.progressPercent === null, 'the old progress does not survive a retry')
assert(reopened.lastChangedAt > failedCard.lastChangedAt, 'reopening is a change')
assert(mergeCard(failedCard, { ...row, stage: 'STARTING', updatedAt: T1 }) === failedCard, 'an equal-timestamp live row is the two-second quirk, not a retry')
// A stale finished row must not close a card that has since been reopened.
const liveCard: DownloadCardState = { ...card, stage: 'STARTING', updatedAt: T2 }
assert(mergeCard(liveCard, { ...row, stage: 'FAILED', failureCode: 'TIMED_OUT', updatedAt: T1 }) === liveCard, 'an older finished row is dropped')
assert(mergeCard(liveCard, { ...row, stage: 'FAILED', failureCode: 'TIMED_OUT', updatedAt: T2 }).stage === 'FAILED', 'an equal-timestamp finished row lands (fail-before-admission)')
// Live to live is untouched by the timestamp rule: the optimistic card's clock is the server's JVM, the rows' is Postgres.
assert(mergeCard(liveCard, { ...row, stage: 'SEARCHING', updatedAt: T1 }).stage === 'SEARCHING', 'live rows merge regardless of timestamp')

// The body of the user's own click replaces stage and counts outright, but metadata still only fills in.
const fromBody = replaceCard(card, { ...row, stage: 'FAILED', failureCode: 'CANCELLED', title: null, updatedAt: T0 })
assert(fromBody.stage === 'FAILED' && fromBody.failureCode === 'CANCELLED', 'the body wins on stage and outcome')
assert(fromBody.title === 'Down' && fromBody.imageUrl === 'https://img/1.png', 'a null title in the body does not blank the card')
assert(fromBody.lastChangedAt > card.lastChangedAt, 'an action restarts the dismiss clock')

assert(isTerminal('PARTIAL_SUCCESS') && isTerminal('SUCCEEDED') && isTerminal('FAILED'), 'terminal stages')
assert(!isTerminal('DOWNLOADING') && !isTerminal('QUEUED'), 'non-terminal stages')
assert(failureCopy('CANCELLED') === 'Cancelled', 'cancelled wording')
assert(isCancelled({ stage: 'FAILED', failureCode: 'CANCELLED' }), 'a failed card with the cancelled code is cancelled')
assert(!isCancelled({ stage: 'DOWNLOADING', failureCode: 'CANCELLED' }), 'a live album with one cancelled song is not itself cancelled')
assert(!isCancelled({ stage: 'PARTIAL_SUCCESS', failureCode: 'CANCELLED' }), 'a partly downloaded album is not cancelled')

// Page rows: the server's row first, then the live card, then the cached meta.
const meta: DownloadMeta = {
  downloadId: 'd1', youtubeId: 'v1', downloadType: 'SONG', title: 'Cached', artistNames: ['Cached Artist'],
  albumName: 'All or Nothing', iconURL: 'cached.png', requestedAt: T0,
}
const [fromMeta] = pageItems([row], { d1: meta }, [])
assert(fromMeta.title === 'Cached' && fromMeta.artistNames[0] === 'Cached Artist' && fromMeta.iconURL === 'cached.png',
  'an unresolved row with no live card falls back to the cached meta')
assert(fromMeta.albumName === 'All or Nothing', 'the album name is client-only and comes from the cache')
assert(!fromMeta.live && fromMeta.stage === 'SEARCHING', 'a row with no live card reads the row stage and is not live')

const [fromCard] = pageItems([row], { d1: meta }, [{ ...card, stage: 'DOWNLOADING', progressPercent: 40 }])
assert(fromCard.title === 'Down' && fromCard.artistNames[0] === 'Jay Sean' && fromCard.iconURL === 'https://img/1.png',
  'the live card beats the cached meta')
assert(fromCard.live && fromCard.stage === 'DOWNLOADING' && fromCard.progressPercent === 40,
  'the live card stage and progress win over the row')

const serverRow: ActiveDownloadView = {
  ...row, title: 'Server Title', artists: ['Server Artist'], imageUrl: 'server.png',
  stage: 'SUCCEEDED', songsSucceeded: 1,
}
const [fromServer] = pageItems([serverRow], { d1: meta }, [card])
assert(fromServer.title === 'Server Title' && fromServer.artistNames[0] === 'Server Artist' && fromServer.iconURL === 'server.png',
  'server metadata wins over the card and the cache')
assert(fromServer.stage === 'SEARCHING', 'stage still follows the live card when there is one')
assert(fromServer.songsSucceeded === 0, 'tallies follow the live card too')

// Artist ids ride along with the server's names only, padded with null where the server sent fewer
// ids than names (older rows) or none at all.
const [linked] = pageItems([{ ...serverRow, artists: ['A', 'B'], artistIds: ['id-a'] }], {}, [])
assert(linked.artistIds.length === 2 && linked.artistIds[0] === 'id-a' && linked.artistIds[1] === null,
  'artistIds is padded to the names with null')
const [unlinked] = pageItems([serverRow], {}, [])
assert(unlinked.artistIds.length === 1 && unlinked.artistIds[0] === null, 'a row without artistIds reads as no links')
assert(fromCard.artistIds.length === 1 && fromCard.artistIds[0] === null, 'names from the live card carry no ids')
assert(fromMeta.artistIds.length === 1 && fromMeta.artistIds[0] === null, 'names from the cached meta carry no ids')
const [strayIds] = pageItems([{ ...row, artistIds: ['id-x'] }], {}, [card])
assert(strayIds.artistNames[0] === 'Jay Sean' && strayIds.artistIds[0] === null,
  'ids on a row whose names lost to the card are not applied to the card names')

const [bare] = pageItems([row], {}, [])
assert(bare.title === 'Untitled download' && bare.artistNames.length === 0 && bare.albumName === null && bare.iconURL === null,
  'no metadata anywhere reads as untitled rather than hiding the row')
assert(bare.artistIds.length === 0, 'no names means no ids either')

// Rows are the server's, in its order; a live card with no row adds nothing.
const ordered = pageItems([{ ...row, downloadId: 'b' }, { ...row, downloadId: 'a' }], {}, [{ ...card, downloadId: 'zzz' }])
assert(ordered.length === 2 && ordered[0].downloadId === 'b' && ordered[1].downloadId === 'a',
  'pageItems is 1:1 over the server rows')

// Eviction keeps the most recently requested.
const many: Record<string, DownloadMeta> = {}
for (let i = 0; i < 5; i++) {
  many[`m${i}`] = { ...meta, downloadId: `m${i}`, requestedAt: `2026-01-0${i + 1}T00:00:00.000Z` }
}
const kept = evictToCap(many, 2)
assert(Object.keys(kept).length === 2 && 'm4' in kept && 'm3' in kept, 'evictToCap keeps the newest entries')
assert(evictToCap(many, 10) === many, 'under the cap, evictToCap returns the same object')

// The downloads row's "Open" link: each collection kind has its own page, a song has none.
assert(collectionPath({ downloadType: 'ALBUM', youtubeId: 'MPREb_1' }) === '/album/MPREb_1', 'an album opens /album')
assert(collectionPath({ downloadType: 'PLAYLIST', youtubeId: 'PL1' }) === '/playlist/PL1', 'a playlist opens /playlist')
assert(collectionPath({ downloadType: 'CURATED', youtubeId: '80s indie/pop' }) === '/suggested/80s%20indie%2Fpop',
  'a suggested playlist opens /suggested by its encoded category key')
assert(collectionPath({ downloadType: 'SONG', youtubeId: 'v1' }) === null, 'a song has no page to open')
// The Downloads page's `?type=`: the three pills round-trip, everything else reads as All.
assert(parseTypeFilter('SONG') === 'SONG' && parseTypeFilter('ALBUM') === 'ALBUM' && parseTypeFilter('PLAYLIST') === 'PLAYLIST',
  'a pill value in the URL is that pill')
assert(parseTypeFilter(null) === undefined, 'no ?type= is every kind')
assert(parseTypeFilter('CURATED') === undefined && parseTypeFilter('song') === undefined && parseTypeFilter('') === undefined,
  'a word that is not a pill (even one the server accepts) falls back to every kind')
// Play counts read the way YouTube writes them; an unknown count stays unknown, never "0 plays".
assert(formatPlays(null) === null && formatPlays(undefined) === null, 'formatPlays: unknown count is null')
assert(formatPlays(998) === '998 plays', 'formatPlays: small counts are written in full')
assert(formatPlays(1_234_567) === '1.2M plays', 'formatPlays: millions are abbreviated to one decimal')

console.log('check-download-state: ok')
