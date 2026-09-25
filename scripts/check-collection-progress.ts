/**
 * Self-check for the collection progress bar's segments and summary line. Pulled in by
 * check-download-state.ts so `npm run check` runs it; any failed assertion throws and exits non-zero.
 */
import { DownloadStage } from '../src/api/types'
import { collectionSegments, collectionSummary, summaryText } from '../src/lib/collectionProgress'

function assert(cond: boolean, msg: string): void {
  if (!cond) throw new Error(`check-collection-progress: ${msg}`)
}

const seg = (songCount: number, songsSucceeded: number, songsFailed: number, stage: DownloadStage) =>
  collectionSegments({ songCount, songsSucceeded, songsFailed, stage, failureCode: null })
const sum = (songCount: number, songsSucceeded: number, songsFailed: number, stage: DownloadStage, failureCode: string | null = null) =>
  summaryText(collectionSummary({ songCount, songsSucceeded, songsFailed, stage, failureCode }))

assert(JSON.stringify(seg(12, 7, 2, 'DOWNLOADING')) === JSON.stringify({ succeeded: 7, failed: 2, inProgress: 3 }),
  'active collection splits into done / failed / in progress')
assert(JSON.stringify(seg(12, 10, 2, 'PARTIAL_SUCCESS')) === JSON.stringify({ succeeded: 10, failed: 2, inProgress: 0 }),
  'terminal collection has nothing in progress')
assert(JSON.stringify(seg(12, 0, 0, 'QUEUED')) === JSON.stringify({ succeeded: 0, failed: 0, inProgress: 12 }),
  'a queued collection with a known count is all in progress')
assert(JSON.stringify(seg(12, 5, 0, 'FAILED')) === JSON.stringify({ succeeded: 5, failed: 0, inProgress: 0 }),
  'a terminal collection with unsettled songs leaves them as track')

assert(sum(12, 7, 2, 'DOWNLOADING') === '7 done · 2 failed · 3 in progress', 'active summary')
assert(sum(12, 7, 0, 'DOWNLOADING') === '7 done · 5 in progress', 'zero tokens are omitted')
assert(sum(12, 0, 0, 'SEARCHING') === '12 songs · starting', 'nothing settled yet')
assert(sum(0, 0, 0, 'QUEUED') === 'Queued', 'queued before the count is known')
assert(sum(12, 12, 0, 'SUCCEEDED') === '12 of 12 downloaded', 'full success')
assert(sum(12, 10, 2, 'PARTIAL_SUCCESS') === '10 of 12 downloaded · 2 failed', 'partial success')
assert(sum(12, 0, 12, 'FAILED', 'TIMED_OUT') === 'None of 12 downloaded · Timed out', 'total failure keeps its reason')
assert(sum(12, 5, 7, 'FAILED', null) === '5 of 12 downloaded · 7 failed · Download failed', 'failed after some songs landed')
assert(sum(0, 0, 0, 'FAILED', 'METADATA_UNAVAILABLE') === "Couldn't find this on YouTube Music",
  'failed before admission reads the reason, not "None of 0"')
assert(collectionSummary({ songCount: 12, songsSucceeded: 12, songsFailed: 0, stage: 'SUCCEEDED', failureCode: null })[0].tone === 'done',
  'full success reads green')

console.log('check-collection-progress: ok')
