import { DownloadStage } from '../api/types'
import {
  collectionSegments, CollectionSegments, SummaryToken, SummaryTone,
} from '../lib/collectionProgress'

interface CollectionProgressProps {
  songCount: number
  songsSucceeded: number
  songsFailed: number
  stage: DownloadStage
  size: 'panel' | 'table'
  /** id of the visible summary line; the bar is labelled by it rather than repeating the counts. */
  summaryId: string
  /** Sweep the in-progress segment. Off for a stage replayed from storage, where nothing is moving. */
  animate: boolean
}

const ORDER: (keyof CollectionSegments)[] = ['succeeded', 'failed', 'inProgress']
const FILL: Record<keyof CollectionSegments, string> = {
  succeeded: 'bg-green-600',
  failed: 'bg-red-500',
  inProgress: 'bg-zinc-500',
}

/**
 * One bar per collection, split into grouped segments in the ratio done / failed / in progress /
 * not started (the zinc-800 track showing through) - never one bar per song. Hidden for a single
 * song, which has its own row state.
 */
export function CollectionProgress({
  songCount, songsSucceeded, songsFailed, stage, size, summaryId, animate,
}: CollectionProgressProps) {
  if (songCount <= 1) return null
  const segments = collectionSegments({ songCount, songsSucceeded, songsFailed, stage, failureCode: null })
  // The server's tallies can briefly overshoot songCount mid-race; never report more than the whole.
  const settled = Math.min(songCount, songsSucceeded + songsFailed)

  return (
    <div
      role="progressbar"
      aria-valuemin={0}
      aria-valuemax={songCount}
      aria-valuenow={settled}
      aria-labelledby={summaryId}
      className={`flex w-full rounded-full overflow-hidden bg-zinc-800 ${size === 'panel' ? 'h-[3px]' : 'h-1.5 gap-px'}`}
    >
      {ORDER.map(key => {
        const count = segments[key]
        if (count === 0) return null
        return (
          <div
            key={key}
            aria-hidden="true"
            className={`relative h-full overflow-hidden transition-[width] duration-300 ease-out motion-reduce:transition-none ${FILL[key]}`}
            style={{ width: `${Math.min(100, (count / songCount) * 100)}%`, minWidth: '2px' }}
          >
            {key === 'inProgress' && animate && (
              <div className="absolute inset-0 w-[38%] bg-zinc-400 animate-download-indeterminate-sweep motion-reduce:animate-none" />
            )}
          </div>
        )
      })}
    </div>
  )
}

const TONE: Record<SummaryTone, string> = {
  done: 'text-green-500',
  failed: 'text-red-400',
  active: 'text-zinc-300',
  muted: 'text-zinc-400',
}

interface CollectionSummaryProps {
  tokens: SummaryToken[]
  id: string
  className?: string
}

/** The visible counts line the bar is labelled by: "7 done · 2 failed · 3 in progress". */
export function CollectionSummary({ tokens, id, className = '' }: CollectionSummaryProps) {
  return (
    <p id={id} className={`truncate ${className}`}>
      {tokens.map((token, i) => (
        <span key={i} className={TONE[token.tone]}>
          {i > 0 && <span className="text-zinc-500"> · </span>}
          {token.text}
        </span>
      ))}
    </p>
  )
}
