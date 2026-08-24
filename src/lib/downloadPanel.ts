import { ActiveDownloadView } from '../api/types'

/** How long a terminal (SUCCEEDED/FAILED) card lingers before auto-dismissing,
 *  scaled to how many cards are on screen so a busy list doesn't bloat. */
export function dismissTtlMs(cardCount: number): number {
  if (cardCount <= 3) return 30000
  if (cardCount <= 10) return 10000
  return 5000
}

export function isTerminal(status: ActiveDownloadView['status']): boolean {
  return status === 'SUCCEEDED' || status === 'FAILED'
}

export interface DownloadCardState {
  downloadId: string
  songName: string
  status: ActiveDownloadView['status']
  progressPercent: number | null
  phaseEnteredAt: string
  lastChangedAt: number
  lastSeenAt: number
  shownPercent: number
}

/** Most-recently-changed first. */
export function sortCards(cards: DownloadCardState[]): DownloadCardState[] {
  return [...cards].sort((a, b) => b.lastChangedAt - a.lastChangedAt)
}
