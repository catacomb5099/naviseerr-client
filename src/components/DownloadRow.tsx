import { useEffect, useRef, useState, type ReactNode } from 'react'
import { X } from 'lucide-react'
import { isTerminal } from '../lib/downloadPanel'
import { DownloadItem, itemStageLabel } from '../lib/downloadLibrary'

interface DownloadRowProps {
  item: DownloadItem
  pollIntervalMs: number
  onRemove: () => void
}

function stageColor(item: DownloadItem): string {
  if (item.stage === 'SUCCEEDED') return 'text-green-500'
  if (item.stage === 'FAILED') return 'text-red-500'
  return 'text-zinc-400'
}

/** Artist, then the collection - the reference's second line. The separator is dropped rather than
 *  padded with "Unknown Album", because a trailing "·" reads as a rendering fault. */
function secondaryLine(item: DownloadItem): string {
  const artists = item.artistNames.length > 0 ? item.artistNames.join(', ') : 'Unknown Artist'
  return item.albumName ? `${artists} · ${item.albumName}` : artists
}

/**
 * The row's single right-hand slot. Exactly one control, always the same 36px circle, so the list's
 * text column starts and ends at the same x on every row whatever the stage - and so pause can be
 * added here later by returning a second button instead of by re-laying-out the card.
 *
 * In-flight rows get an empty circle rather than nothing: collapsing the slot would make the
 * dividers' text inset jump between neighbouring rows.
 */
function DownloadRowAction({ item, onRemove }: { item: DownloadItem; onRemove: () => void }) {
  let control: ReactNode = null

  // The mirror image of the floating panel's rule, and deliberately so: the panel's X dismisses a
  // finished notification, this one stops showing a download that is still running. A finished row
  // is a record of what was downloaded and offers no control at all.
  if (!isTerminal(item.stage)) {
    control = (
      <button
        className="w-9 h-9 rounded-full flex items-center justify-center text-zinc-400 hover:text-white hover:bg-zinc-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green-600"
        aria-label={`Stop showing ${item.trackName}`}
        onClick={onRemove}
      >
        <X className="w-4 h-4" aria-hidden="true" />
      </button>
    )
  }

  return <div className="flex-none w-9 h-9 flex items-center justify-center">{control}</div>
}

export function DownloadRow({ item, pollIntervalMs, onRemove }: DownloadRowProps) {
  const [iconFailed, setIconFailed] = useState(false)
  const fillRef = useRef<HTMLDivElement>(null)
  const shownRef = useRef(0)

  // Only a stage the feed is reporting right now animates. A stage replayed from localStorage has no
  // newer reading coming, so a transition on it would be a fabricated one.
  const animating = item.stage === 'DOWNLOADING' && item.live

  useEffect(() => {
    if (!animating) return
    const fill = fillRef.current
    if (!fill) return

    const target = Math.max(0, Math.min(100, item.progressPercent ?? 0))
    // Backwards is a real event - a retry or a candidate failover starts the transfer over - so it
    // animates quickly and honestly rather than being clamped away.
    const goingBackwards = target < shownRef.current
    const durationMs = goingBackwards ? 150 : pollIntervalMs

    fill.style.transition = `transform ${durationMs}ms linear`
    const frame = requestAnimationFrame(() => {
      fill.style.transform = `scaleX(${target / 100})`
    })
    shownRef.current = target
    return () => cancelAnimationFrame(frame)
  }, [animating, item.progressPercent, pollIntervalMs])

  return (
    <div className="flex items-center gap-4 py-3">
      <div className="w-16 h-16 flex-none">
        {item.iconURL && !iconFailed ? (
          <img
            src={item.iconURL}
            alt={item.trackName}
            loading="lazy"
            decoding="async"
            referrerPolicy="no-referrer"
            className="w-full h-full object-cover rounded"
            onError={() => setIconFailed(true)}
          />
        ) : (
          <div className="w-full h-full bg-zinc-800 rounded"></div>
        )}
      </div>

      <div className="flex-1 min-w-0">
        <h3 className="text-white font-medium leading-6 truncate">{item.trackName}</h3>
        <p className="text-sm text-zinc-400 leading-5 truncate">{secondaryLine(item)}</p>
        <p className={`text-xs leading-4 truncate ${stageColor(item)}`}>{itemStageLabel(item)}</p>
        {/* Reserved whether or not it is filled: the row must not change height when a download
            enters or leaves DOWNLOADING, or the whole list shifts under the pointer. */}
        <div className="mt-1.5 h-[3px]" aria-hidden={!animating}>
          {animating && (
            <div className="h-full bg-zinc-700 rounded-full overflow-hidden">
              <div
                ref={fillRef}
                className="download-progress-fill h-full w-full bg-green-600 origin-left"
                style={{ transform: 'scaleX(0)', willChange: 'transform' }}
                role="progressbar"
                aria-valuenow={Math.round(item.progressPercent ?? 0)}
                aria-valuemin={0}
                aria-valuemax={100}
              />
            </div>
          )}
        </div>
      </div>

      <DownloadRowAction item={item} onRemove={onRemove} />
    </div>
  )
}
