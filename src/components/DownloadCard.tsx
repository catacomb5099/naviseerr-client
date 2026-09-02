import { useEffect, useRef, useState, type ReactNode } from 'react'
import { CircleCheck, AlertCircle, Search, ArrowDown, Clock, X } from 'lucide-react'
import {
  DownloadCardState, isIndeterminate, isTerminal, showsElapsed, stageLabel,
} from '../lib/downloadPanel'

interface DownloadCardProps {
  card: DownloadCardState
  exiting: boolean
  pollIntervalMs: number
  onDismiss: () => void
}

/**
 * A wall clock in state, ticking once a second while `active`. Held as `now` rather than as a
 * precomputed elapsed count so that a change of stage is reflected on the very next render instead
 * of a second later: only the subtraction depends on which stage we are timing.
 *
 * A stage transition can leave `now` up to a tick behind the new stageEnteredAt, which the clamp in
 * elapsedSeconds turns into "0s" - the right answer for a stage that just began.
 */
function useNow(active: boolean): number {
  const [now, setNow] = useState(() => Date.now())
  useEffect(() => {
    if (!active) return
    const handle = window.setInterval(() => setNow(Date.now()), 1000)
    return () => window.clearInterval(handle)
  }, [active])
  return now
}

export function DownloadCard({ card, exiting, pollIntervalMs, onDismiss }: DownloadCardProps) {
  const fillRef = useRef<HTMLDivElement>(null)
  const shownRef = useRef(0)

  // Everything below reads `stage` and nothing else. The old version inferred "searching" from
  // `!card.progressPercent`, which made a genuine 0% download read as searching and collapsed four
  // distinct stages - queued, starting, searching, waiting for a transfer slot - into one label.
  const terminal = isTerminal(card.stage)
  const indeterminate = isIndeterminate(card.stage)
  const now = useNow(showsElapsed(card.stage))
  const elapsedSeconds = Math.max(0, Math.round((now - Date.parse(card.stageEnteredAt)) / 1000))

  useEffect(() => {
    if (card.stage !== 'DOWNLOADING') return
    const fill = fillRef.current
    if (!fill) return

    const target = Math.max(0, Math.min(100, card.progressPercent ?? 0))
    // Backwards is a real event - a retry or a failover starts the transfer over - so it animates
    // quickly and honestly rather than being clamped away.
    const goingBackwards = target < shownRef.current
    const durationMs = goingBackwards ? 150 : pollIntervalMs

    fill.style.transition = `transform ${durationMs}ms linear`
    const frame = requestAnimationFrame(() => {
      fill.style.transform = `scaleX(${target / 100})`
    })
    shownRef.current = target
    return () => cancelAnimationFrame(frame)
  }, [card.progressPercent, card.stage, pollIntervalMs])

  let glyph: ReactNode
  let subColor = 'text-zinc-400'

  switch (card.stage) {
    case 'SUCCEEDED':
      glyph = <CircleCheck className="w-4 h-4 text-green-500" aria-hidden="true" />
      subColor = 'text-green-500'
      break
    case 'FAILED':
      glyph = <AlertCircle className="w-4 h-4 text-red-500" aria-hidden="true" />
      subColor = 'text-red-500'
      break
    case 'QUEUED':
      glyph = <Clock className="w-4 h-4 text-zinc-400" aria-hidden="true" />
      break
    case 'STARTING':
    case 'SEARCHING':
      glyph = <Search className="w-4 h-4 text-zinc-400" aria-hidden="true" />
      break
    default:
      glyph = <ArrowDown className="w-4 h-4 text-zinc-300" aria-hidden="true" />
  }

  const subLabel = stageLabel(card, elapsedSeconds)

  return (
    <div className={`overflow-hidden transition-[max-height] duration-150 ${exiting ? 'max-h-0' : 'max-h-16'}`}>
      <div
        className={`flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-zinc-800 ${exiting ? 'animate-download-card-exit' : 'animate-download-card-enter'}`}
      >
        <span className="w-5 flex-none flex items-center justify-center">{glyph}</span>
        <div className="flex-1 min-w-0">
          <p className="text-xs text-white truncate">{card.songName}</p>
          <p className={`text-[11px] mt-0.5 ${subColor}`}>{subLabel}</p>
          {card.stage === 'DOWNLOADING' && (
            <div className="h-[3px] bg-zinc-700 rounded-full overflow-hidden mt-1.5">
              <div
                ref={fillRef}
                className="download-progress-fill h-full w-full bg-green-600 origin-left"
                style={{ transform: 'scaleX(0)', willChange: 'transform' }}
                role="progressbar"
                aria-valuenow={Math.round(card.progressPercent ?? 0)}
                aria-valuemin={0}
                aria-valuemax={100}
              />
            </div>
          )}
          {indeterminate && (
            <div className="download-indeterminate-fill h-[3px] bg-zinc-700 rounded-full overflow-hidden mt-1.5 relative" role="progressbar">
              <div className="absolute inset-0 w-[38%] bg-zinc-500 animate-download-indeterminate-sweep" />
            </div>
          )}
        </div>
        {terminal && (
          <button
            className="flex-none p-1 rounded text-zinc-400 hover:text-white hover:bg-zinc-700"
            aria-label={`Dismiss ${card.songName}`}
            onClick={onDismiss}
          >
            <X className="w-3.5 h-3.5" aria-hidden="true" />
          </button>
        )}
      </div>
    </div>
  )
}
