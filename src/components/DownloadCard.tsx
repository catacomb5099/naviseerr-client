import { useEffect, useRef, useState, type ReactNode } from 'react'
import { CircleCheck, AlertCircle, Search, ArrowDown, X } from 'lucide-react'
import { DownloadCardState } from '../lib/downloadPanel'

interface DownloadCardProps {
  card: DownloadCardState
  exiting: boolean
  pollIntervalMs: number
  onDismiss: () => void
}

function useElapsedSeconds(since: string): number {
  const [elapsed, setElapsed] = useState(() => Math.max(0, Math.round((Date.now() - Date.parse(since)) / 1000)))
  useEffect(() => {
    const handle = window.setInterval(() => {
      setElapsed(Math.max(0, Math.round((Date.now() - Date.parse(since)) / 1000)))
    }, 1000)
    return () => window.clearInterval(handle)
  }, [since])
  return elapsed
}

export function DownloadCard({ card, exiting, pollIntervalMs, onDismiss }: DownloadCardProps) {
  const fillRef = useRef<HTMLDivElement>(null)
  const shownRef = useRef(0)
  const elapsedSeconds = useElapsedSeconds(card.phaseEnteredAt)

  const isTerminal = card.status === 'SUCCEEDED' || card.status === 'FAILED'
  const isSearching = card.status === 'PENDING' || (card.status === 'IN_PROGRESS' && !card.progressPercent)

  useEffect(() => {
    if (isTerminal || isSearching) return
    const fill = fillRef.current
    if (!fill) return

    const target = Math.max(0, Math.min(100, card.progressPercent ?? 0))
    const goingBackwards = target < shownRef.current
    const durationMs = goingBackwards ? 150 : pollIntervalMs

    fill.style.transition = `transform ${durationMs}ms linear`
    const frame = requestAnimationFrame(() => {
      fill.style.transform = `scaleX(${target / 100})`
    })
    shownRef.current = target
    return () => cancelAnimationFrame(frame)
  }, [card.progressPercent, isTerminal, isSearching, pollIntervalMs])

  let glyph: ReactNode
  let subLabel: string
  let subColor = 'text-zinc-400'

  if (card.status === 'SUCCEEDED') {
    glyph = <CircleCheck className="w-4 h-4 text-green-500" aria-hidden="true" />
    subLabel = 'Downloaded'
    subColor = 'text-green-500'
  } else if (card.status === 'FAILED') {
    glyph = <AlertCircle className="w-4 h-4 text-red-500" aria-hidden="true" />
    subLabel = 'No source found'
    subColor = 'text-red-500'
  } else if (isSearching) {
    glyph = <Search className="w-4 h-4 text-zinc-400" aria-hidden="true" />
    subLabel = `Searching… ${elapsedSeconds}s`
  } else {
    glyph = <ArrowDown className="w-4 h-4 text-zinc-300" aria-hidden="true" />
    subLabel = `${Math.round(card.progressPercent ?? 0)}%`
  }

  return (
    <div
      className={`overflow-hidden transition-[max-height] duration-150 ${exiting ? 'max-h-0' : 'max-h-16'}`}
      style={{ order: -card.lastChangedAt }}
    >
      <div
        className={`flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-zinc-800 ${exiting ? 'animate-download-card-exit' : 'animate-download-card-enter'}`}
      >
        <span className="w-5 flex-none flex items-center justify-center">{glyph}</span>
        <div className="flex-1 min-w-0">
          <p className="text-xs text-white truncate">{card.songName}</p>
          <p className={`text-[11px] mt-0.5 ${subColor}`}>{subLabel}</p>
          {!isTerminal && !isSearching && (
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
          {isSearching && (
            <div className="download-indeterminate-fill h-[3px] bg-zinc-700 rounded-full overflow-hidden mt-1.5 relative" role="progressbar">
              <div className="absolute inset-0 w-[38%] bg-zinc-500 animate-download-indeterminate-sweep" />
            </div>
          )}
        </div>
        {isTerminal && (
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
