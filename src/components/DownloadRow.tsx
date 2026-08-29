import { useEffect, useRef, useState } from 'react'
import { Card } from './ui/card'
import { X } from 'lucide-react'
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

export function DownloadRow({ item, pollIntervalMs, onRemove }: DownloadRowProps) {
  const [iconFailed, setIconFailed] = useState(false)
  const fillRef = useRef<HTMLDivElement>(null)
  const shownRef = useRef(0)

  const animating = item.stage === 'DOWNLOADING' && item.live

  useEffect(() => {
    if (!animating) return
    const fill = fillRef.current
    if (!fill) return

    const target = Math.max(0, Math.min(100, item.progressPercent ?? 0))
    const goingBackwards = target < shownRef.current
    const durationMs = goingBackwards ? 150 : pollIntervalMs

    fill.style.transition = `transform ${durationMs}ms linear`
    const frame = requestAnimationFrame(() => {
      fill.style.transform = `scaleX(${target / 100})`
    })
    shownRef.current = target
    return () => cancelAnimationFrame(frame)
  }, [animating, item.progressPercent, pollIntervalMs])

  const secondaryLine = item.albumName
    ? `${item.artistNames.length > 0 ? item.artistNames.join(', ') : 'Unknown Artist'} · ${item.albumName}`
    : (item.artistNames.length > 0 ? item.artistNames.join(', ') : 'Unknown Artist')

  return (
    <Card className="bg-zinc-900 border-zinc-800">
      <div className="p-4 flex items-center gap-4">
        <div className="w-16 h-16 flex-shrink-0">
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
          <h3 className="text-white font-medium truncate">{item.trackName}</h3>
          <p className="text-sm text-zinc-400 truncate">{secondaryLine}</p>
          {animating && (
            <div className="h-[3px] bg-zinc-700 rounded-full overflow-hidden mt-1.5">
              <div
                ref={fillRef}
                className="h-full w-full bg-green-600 origin-left"
                style={{ transform: 'scaleX(0)', willChange: 'transform' }}
                role="progressbar"
                aria-valuenow={Math.round(item.progressPercent ?? 0)}
                aria-valuemin={0}
                aria-valuemax={100}
              />
            </div>
          )}
        </div>

        <span className={`text-sm flex-none ${stageColor(item)}`}>{itemStageLabel(item)}</span>

        <button
          className="flex-none p-1 rounded text-zinc-400 hover:text-white hover:bg-zinc-700"
          aria-label={`Remove ${item.trackName} from downloads`}
          onClick={onRemove}
        >
          <X className="w-4 h-4" aria-hidden="true" />
        </button>
      </div>
    </Card>
  )
}
