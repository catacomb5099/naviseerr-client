import { useEffect, useRef, useState } from 'react'
import { Download as DownloadIcon, ChevronDown, ChevronUp, Volume2, VolumeX } from 'lucide-react'
import { DownloadCard } from './DownloadCard'
import { DownloadCardState, displayTitle, failureCopy } from '../lib/downloadPanel'

interface DownloadPanelProps {
  cards: DownloadCardState[]
  exiting: Set<string>
  pollIntervalMs: number
  minimized: boolean
  onToggleMinimized: () => void
  onDismiss: (id: string) => void
  muted: boolean
  onToggleMuted: () => void
}

export function DownloadPanel({
  cards,
  exiting,
  pollIntervalMs,
  minimized,
  onToggleMinimized,
  onDismiss,
  muted,
  onToggleMuted,
}: DownloadPanelProps) {
  const [announcement, setAnnouncement] = useState('')
  const announcedRef = useRef<Set<string>>(new Set())

  useEffect(() => {
    cards.forEach(card => {
      if (announcedRef.current.has(card.downloadId)) return
      const title = displayTitle(card)
      if (card.stage === 'SUCCEEDED') {
        announcedRef.current.add(card.downloadId)
        setAnnouncement(`${title} finished downloading.`)
      } else if (card.stage === 'PARTIAL_SUCCESS') {
        announcedRef.current.add(card.downloadId)
        setAnnouncement(`${title} partly downloaded: ${card.songsSucceeded} of ${card.songCount} songs.`)
      } else if (card.stage === 'FAILED') {
        announcedRef.current.add(card.downloadId)
        // The reason belongs in the announcement too - a screen reader user gets no glance at the
        // sub-label, so "failed to download" alone withholds the only actionable part.
        setAnnouncement(`${title} failed to download. ${failureCopy(card.failureCode)}.`)
      }
    })
  }, [cards])

  if (cards.length === 0) return null

  if (minimized) {
    return (
      <button
        onClick={onToggleMinimized}
        className="fixed bottom-4 right-4 flex items-center gap-2 bg-zinc-900 border border-zinc-800 rounded-full px-3 py-2 text-white hover:bg-zinc-800"
        style={{ zIndex: 'var(--z-download-panel)' }}
        aria-label="Expand active downloads"
      >
        <DownloadIcon className="w-4 h-4 text-green-500" aria-hidden="true" />
        <span className="text-xs">Active downloads</span>
        <span className="text-[11px] bg-zinc-800 rounded-full px-2 py-0.5">{cards.length}</span>
        <ChevronUp className="w-3.5 h-3.5 text-zinc-400" aria-hidden="true" />
      </button>
    )
  }

  return (
    <div
      role="region"
      aria-label="Active downloads"
      className="fixed bottom-4 right-4 w-[322px] bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden"
      style={{ zIndex: 'var(--z-download-panel)' }}
    >
      <button
        onClick={onToggleMinimized}
        className="w-full flex items-center gap-2 px-3 py-2.5 border-b border-zinc-800 text-left hover:bg-zinc-800"
      >
        <DownloadIcon className="w-4 h-4 text-green-500 flex-none" aria-hidden="true" />
        <span className="text-xs text-white flex-1">Active downloads</span>
        <span className="text-[11px] bg-zinc-800 rounded-full px-2 py-0.5 text-zinc-300">{cards.length}</span>
        <span
          role="button"
          tabIndex={0}
          aria-label={muted ? 'Unmute download sounds' : 'Mute download sounds'}
          className="p-1 rounded text-zinc-400 hover:text-white hover:bg-zinc-700"
          onClick={e => { e.stopPropagation(); onToggleMuted() }}
          onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') { e.stopPropagation(); onToggleMuted() } }}
        >
          {muted ? <VolumeX className="w-3.5 h-3.5" aria-hidden="true" /> : <Volume2 className="w-3.5 h-3.5" aria-hidden="true" />}
        </span>
        <ChevronDown className="w-3.5 h-3.5 text-zinc-400" aria-hidden="true" />
      </button>

      <div className="flex flex-col p-1.5" style={{ maxHeight: 'min(60vh, 236px)', overflowY: 'auto' }}>
        {cards.map(card => (
          <DownloadCard
            key={card.downloadId}
            card={card}
            exiting={exiting.has(card.downloadId)}
            pollIntervalMs={pollIntervalMs}
            onDismiss={() => onDismiss(card.downloadId)}
          />
        ))}
      </div>

      <div aria-live="polite" className="sr-only">{announcement}</div>
    </div>
  )
}
