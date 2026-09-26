import { useEffect, useRef, useState } from 'react'
import { DownloadItem, itemStageLabel } from '../lib/downloadLibrary'
import { isTerminal } from '../lib/downloadPanel'
import { collectionSummary } from '../lib/collectionProgress'
import { CollectionProgress, CollectionSummary } from './CollectionProgress'
import { TypeBadge } from './TypeBadge'

interface DownloadRowProps {
  item: DownloadItem
  pollIntervalMs: number
}

function stageColor(item: DownloadItem): string {
  if (item.stage === 'SUCCEEDED') return 'text-green-500'
  if (item.stage === 'FAILED') return 'text-red-500'
  if (item.stage === 'PARTIAL_SUCCESS') return 'text-amber-500'
  return 'text-zinc-400'
}

/** The album name (client-only) for a song. A collection adds nothing here: the TypeBadge says the
 *  kind and the summary line below owns the song count. */
function kindLine(item: DownloadItem): string | null {
  return item.downloadType === 'SONG' ? item.albumName : null
}

export function DownloadRow({ item, pollIntervalMs }: DownloadRowProps) {
  const [iconFailed, setIconFailed] = useState(false)
  const fillRef = useRef<HTMLDivElement>(null)
  const shownRef = useRef(0)

  const terminal = isTerminal(item.stage)
  const collection = item.downloadType !== 'SONG'
  // Only a stage the feed is reporting right now animates. A stage read once from /downloads/all has
  // no newer reading coming, so a transition on it would be a fabricated one.
  const animating = !collection && item.stage === 'DOWNLOADING' && item.live

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

  const secondaryLine = [item.artistNames.join(', ') || 'Unknown Artist', kindLine(item)]
    .filter(Boolean)
    .join(' · ')
  const summaryId = `download-row-summary-${item.downloadId}`

  return (
    <div className="flex items-center gap-4 py-3">
      <div className="w-16 h-16 flex-shrink-0">
        {item.iconURL && !iconFailed ? (
          <img
            src={item.iconURL}
            alt={item.title}
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
        <h3 className="text-white font-medium leading-6 truncate">
          <TypeBadge type={item.downloadType} className="mr-2 align-middle" />
          {item.title}
        </h3>
        <p className="text-sm text-zinc-400 leading-5 truncate">{secondaryLine}</p>
        {collection ? (
          <>
            <CollectionSummary id={summaryId} tokens={collectionSummary(item)} className="text-xs leading-4" />
            {/* Fixed height like the song slot below: the bar appears once the count is known and
                the row must not grow when it does. */}
            <div className="mt-1.5 h-1.5 min-w-40 max-w-sm">
              <CollectionProgress
                songCount={item.songCount}
                songsSucceeded={item.songsSucceeded}
                songsFailed={item.songsFailed}
                stage={item.stage}
                size="table"
                summaryId={summaryId}
                animate={item.live && !terminal}
              />
            </div>
          </>
        ) : (
          <>
            <p className={`text-xs leading-4 truncate ${stageColor(item)}`}>{itemStageLabel(item)}</p>
            {/* Reserved whether or not it is filled: the row must not change height when a download
                enters or leaves DOWNLOADING, or the whole list shifts under the pointer. */}
            <div className={`mt-1.5 h-[3px] ${animating ? 'bg-zinc-700 rounded-full overflow-hidden' : ''}`}>
              {animating && (
                <div
                  ref={fillRef}
                  className="download-progress-fill h-full w-full bg-green-600 origin-left"
                  style={{ transform: 'scaleX(0)', willChange: 'transform' }}
                  role="progressbar"
                  aria-valuenow={Math.round(item.progressPercent ?? 0)}
                  aria-valuemin={0}
                  aria-valuemax={100}
                />
              )}
            </div>
          </>
        )}
      </div>
    </div>
  )
}
