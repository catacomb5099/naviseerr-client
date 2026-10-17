import { DownloadStage } from '../api/types'
import { failureCopy, isCancelled, isTerminal } from './downloadPanel'

export interface CollectionTally {
  songCount: number
  songsSucceeded: number
  songsFailed: number
  songsCancelled: number
  stage: DownloadStage
  failureCode: string | null
}

export interface CollectionSegments {
  succeeded: number
  failed: number
  cancelled: number
  /** Songs neither settled nor still queued-by-count: only ever non-zero while the stage is live.
   *  Once terminal, whatever the tallies missed is simply not shown as moving. */
  inProgress: number
}

export function collectionSegments(t: CollectionTally): CollectionSegments {
  const settled = t.songsSucceeded + t.songsFailed + t.songsCancelled
  const inProgress = isTerminal(t.stage) ? 0 : Math.max(0, t.songCount - settled)
  return { succeeded: t.songsSucceeded, failed: t.songsFailed, cancelled: t.songsCancelled, inProgress }
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
  const { songCount, songsSucceeded, songsFailed, songsCancelled } = t
  if (isTerminal(t.stage)) {
    const failed = t.stage === 'FAILED'
    // Failed before any song was admitted (e.g. the collection itself could not be resolved, or it
    // was cancelled while queued): the reason is the whole story, "None of 0 downloaded" says nothing.
    if (failed && songCount === 0) return [{ text: failureCopy(t.failureCode), tone: isCancelled(t) ? 'muted' : 'failed' }]
    // Stopped by the user before anything landed or failed: one grey word, not a red "None of 12".
    if (failed && songsSucceeded === 0 && songsFailed === 0 && songsCancelled > 0) return [{ text: 'Cancelled', tone: 'muted' }]
    const tokens: SummaryToken[] = failed && songsSucceeded === 0
      ? [{ text: `None of ${songCount} downloaded`, tone: 'failed' }]
      : [{ text: `${songsSucceeded} of ${songCount} downloaded`, tone: songsSucceeded === songCount ? 'done' : 'muted' }]
    // "None of 12 downloaded · 12 failed" repeats itself, so the failed count is left out when
    // failures are the whole story - but not when cancelled songs share the rest.
    if (songsFailed > 0 && (songsSucceeded > 0 || songsCancelled > 0)) tokens.push({ text: `${songsFailed} failed`, tone: 'failed' })
    if (songsCancelled > 0) tokens.push({ text: `${songsCancelled} cancelled`, tone: 'muted' })
    // The server sends CANCELLED as the reason only when nothing really failed, and the count above
    // already says it.
    if (failed && t.failureCode !== 'CANCELLED') tokens.push({ text: failureCopy(t.failureCode), tone: 'failed' })
    return tokens
  }
  if (songCount === 0) return [{ text: 'Queued', tone: 'muted' }]
  const { inProgress } = collectionSegments(t)
  if (songsSucceeded === 0 && songsFailed === 0 && songsCancelled === 0) {
    return [
      { text: `${songCount} ${songCount === 1 ? 'song' : 'songs'}`, tone: 'muted' },
      { text: 'starting', tone: 'muted' },
    ]
  }
  const tokens: SummaryToken[] = []
  if (songsSucceeded > 0) tokens.push({ text: `${songsSucceeded} done`, tone: 'done' })
  if (songsFailed > 0) tokens.push({ text: `${songsFailed} failed`, tone: 'failed' })
  if (songsCancelled > 0) tokens.push({ text: `${songsCancelled} cancelled`, tone: 'muted' })
  if (inProgress > 0) tokens.push({ text: `${inProgress} in progress`, tone: 'active' })
  return tokens
}

export function summaryText(tokens: SummaryToken[]): string {
  return tokens.map(t => t.text).join(' · ')
}
