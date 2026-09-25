import { DownloadStage } from '../api/types'
import { failureCopy, isTerminal } from './downloadPanel'

export interface CollectionTally {
  songCount: number
  songsSucceeded: number
  songsFailed: number
  stage: DownloadStage
  failureCode: string | null
}

export interface CollectionSegments {
  succeeded: number
  failed: number
  /** Songs neither settled nor still queued-by-count: only ever non-zero while the stage is live.
   *  Once terminal, whatever the tallies missed is simply not shown as moving. */
  inProgress: number
}

export function collectionSegments(t: CollectionTally): CollectionSegments {
  const settled = t.songsSucceeded + t.songsFailed
  const inProgress = isTerminal(t.stage) ? 0 : Math.max(0, t.songCount - settled)
  return { succeeded: t.songsSucceeded, failed: t.songsFailed, inProgress }
}

export type SummaryTone = 'done' | 'failed' | 'active' | 'muted'

export interface SummaryToken {
  text: string
  tone: SummaryTone
}

/**
 * The counts a collection card or row reads out, as tokens the UI joins with " · ". Counts, never
 * a percentage: a collection is at most ~100 songs and "7 done · 2 failed" is the ratio the user
 * actually wants. Zero tokens are omitted so the line never says "0 failed".
 */
export function collectionSummary(t: CollectionTally): SummaryToken[] {
  const { songCount, songsSucceeded, songsFailed } = t
  if (isTerminal(t.stage)) {
    const failed = t.stage === 'FAILED'
    // Failed before any song was admitted (e.g. the collection itself could not be resolved): the
    // reason is the whole story, "None of 0 downloaded" says nothing.
    if (failed && songCount === 0) return [{ text: failureCopy(t.failureCode), tone: 'failed' }]
    const tokens: SummaryToken[] = failed && songsSucceeded === 0
      ? [{ text: `None of ${songCount} downloaded`, tone: 'failed' }]
      : [{ text: `${songsSucceeded} of ${songCount} downloaded`, tone: songsSucceeded === songCount ? 'done' : 'muted' }]
    if (songsFailed > 0 && songsSucceeded > 0) tokens.push({ text: `${songsFailed} failed`, tone: 'failed' })
    if (failed) tokens.push({ text: failureCopy(t.failureCode), tone: 'failed' })
    return tokens
  }
  if (songCount === 0) return [{ text: 'Queued', tone: 'muted' }]
  const { inProgress } = collectionSegments(t)
  if (songsSucceeded === 0 && songsFailed === 0) {
    return [
      { text: `${songCount} ${songCount === 1 ? 'song' : 'songs'}`, tone: 'muted' },
      { text: 'starting', tone: 'muted' },
    ]
  }
  const tokens: SummaryToken[] = []
  if (songsSucceeded > 0) tokens.push({ text: `${songsSucceeded} done`, tone: 'done' })
  if (songsFailed > 0) tokens.push({ text: `${songsFailed} failed`, tone: 'failed' })
  if (inProgress > 0) tokens.push({ text: `${inProgress} in progress`, tone: 'active' })
  return tokens
}

export function summaryText(tokens: SummaryToken[]): string {
  return tokens.map(t => t.text).join(' · ')
}
