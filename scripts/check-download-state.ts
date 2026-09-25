/**
 * Self-check for the download state logic. No test framework in this repo, so this is a plain
 * script: `npm run check` compiles it with the installed tsc and runs it; any failed assertion
 * throws and exits non-zero.
 */
import { ActiveDownloadView } from '../src/api/types'
import { DownloadCardState, isTerminal, mergeCard } from '../src/lib/downloadPanel'
import { DownloadMeta, evictToCap, pageItems } from '../src/lib/downloadLibrary'

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(`check failed: ${message}`)
}

const T0 = '2026-01-01T00:00:00.000Z'

const card: DownloadCardState = {
  downloadId: 'd1', youtubeId: 'v1', downloadType: 'SONG',
  title: 'Down', artists: ['Jay Sean'], imageUrl: 'https://img/1.png',
  stage: 'SEARCHING', progressPercent: null,
  songCount: 1, songsSucceeded: 0, songsFailed: 0, failureCode: null,
  requestedAt: T0, stageEnteredAt: T0, updatedAt: T0,
  lastChangedAt: 1, lastSeenAt: 1,
}

const row: ActiveDownloadView = {
  downloadId: 'd1', youtubeId: 'v1', downloadType: 'SONG',
  title: null, artists: [], imageUrl: null,
  stage: 'SEARCHING', progressPercent: null,
  songCount: 1, songsSucceeded: 0, songsFailed: 0,
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

// A terminal card ignores a later non-terminal row.
const done: DownloadCardState = { ...card, stage: 'SUCCEEDED' }
assert(mergeCard(done, { ...row, stage: 'DOWNLOADING', progressPercent: 50 }) === done,
  'terminal card must not walk back to an active stage')

assert(isTerminal('PARTIAL_SUCCESS') && isTerminal('SUCCEEDED') && isTerminal('FAILED'), 'terminal stages')
assert(!isTerminal('DOWNLOADING') && !isTerminal('QUEUED'), 'non-terminal stages')

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

const [bare] = pageItems([row], {}, [])
assert(bare.title === 'Untitled download' && bare.artistNames.length === 0 && bare.albumName === null && bare.iconURL === null,
  'no metadata anywhere reads as untitled rather than hiding the row')

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

console.log('check-download-state: ok')
