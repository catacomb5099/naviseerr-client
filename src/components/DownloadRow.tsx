import { useEffect, useRef, useState, type ReactNode } from 'react'
import { AlertCircle, ChevronRight, CircleCheck, Clock, Loader2 } from 'lucide-react'
import { getDownloadDetail } from '../api/endpoints'
import { DownloadSongView, DownloadStage } from '../api/types'
import { DownloadItem, itemStageLabel } from '../lib/downloadLibrary'
import { failureCopy, isTerminal } from '../lib/downloadPanel'
import { collectionSummary } from '../lib/collectionProgress'
import { formatDuration } from '../lib/utils'
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

const WAITING_COPY: Partial<Record<DownloadStage, string>> = {
  QUEUED: 'Queued',
  STARTING: 'Starting',
  SEARCHING: 'Searching',
  READY_TO_DOWNLOAD: 'Ready to download',
}

function songStatus(song: DownloadSongView): { glyph: ReactNode; word: string; color: string } {
  switch (song.stage) {
    case 'SUCCEEDED':
      return { glyph: <CircleCheck className="w-4 h-4" aria-hidden="true" />, word: 'Done', color: 'text-green-500' }
    case 'FAILED':
      return { glyph: <AlertCircle className="w-4 h-4" aria-hidden="true" />, word: failureCopy(song.failureCode), color: 'text-red-500' }
    case 'DOWNLOADING':
      return {
        glyph: <Loader2 className="w-4 h-4 animate-spin motion-reduce:animate-none" aria-hidden="true" />,
        word: `Downloading ${Math.round(song.progressPercent ?? 0)}%`,
        color: 'text-zinc-300',
      }
    default:
      return { glyph: <Clock className="w-4 h-4" aria-hidden="true" />, word: WAITING_COPY[song.stage] ?? 'Queued', color: 'text-zinc-400' }
  }
}

function SongRow({ song }: { song: DownloadSongView }) {
  const status = songStatus(song)
  return (
    <li className="flex items-center gap-3 h-12">
      {song.imageUrl ? (
        <img src={song.imageUrl} alt="" loading="lazy" decoding="async" referrerPolicy="no-referrer"
          className="w-8 h-8 rounded-sm object-cover flex-none" />
      ) : (
        <div className="w-8 h-8 rounded-sm bg-zinc-800 flex-none" />
      )}
      <div className="flex-1 min-w-0">
        <p className="text-sm text-white truncate">{song.title ?? 'Untitled'}</p>
        <p className="text-xs text-zinc-400 truncate">{song.artists.join(', ') || 'Unknown Artist'}</p>
      </div>
      <span className={`flex items-center gap-1.5 text-xs ${status.color}`}>
        {status.glyph}
        {status.word}
      </span>
      <span className="w-12 text-right text-xs text-zinc-400 tabular-nums">
        {song.durationSeconds !== null && formatDuration(song.durationSeconds)}
      </span>
    </li>
  )
}

export function DownloadRow({ item, pollIntervalMs }: DownloadRowProps) {
  const [iconFailed, setIconFailed] = useState(false)
  const [expanded, setExpanded] = useState(false)
  const [songs, setSongs] = useState<DownloadSongView[] | null>(null)
  const [loadFailed, setLoadFailed] = useState(false)
  const [attempt, setAttempt] = useState(0)
  const fillRef = useRef<HTMLDivElement>(null)
  const shownRef = useRef(0)

  const terminal = isTerminal(item.stage)
  const collection = item.downloadType !== 'SONG'
  // Only a stage the feed is reporting right now animates. A stage read once from /downloads/all has
  // no newer reading coming, so a transition on it would be a fabricated one.
  const animating = !collection && item.stage === 'DOWNLOADING' && item.live
  // Per-song stages only move while the collection is live; a finished one is fetched once.
  const refreshing = expanded && item.live && !terminal

  useEffect(() => {
    if (!expanded) return
    const controller = new AbortController()
    let timer: number | undefined
    const load = async () => {
      try {
        const detail = await getDownloadDetail(item.downloadId, controller.signal)
        setSongs(detail.songs)
        setLoadFailed(false)
      } catch (err) {
        if (controller.signal.aborted) return
        console.error('Failed to load download songs:', err)
        setLoadFailed(true)
      }
      if (refreshing) timer = window.setTimeout(load, pollIntervalMs)
    }
    void load()
    return () => {
      controller.abort()
      window.clearTimeout(timer)
    }
  }, [expanded, refreshing, item.downloadId, pollIntervalMs, attempt])

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
  const songsId = `download-songs-${item.downloadId}`

  const toggle = () => setExpanded(e => !e)

  return (
    <div>
      {/* The chevron button is the toggle assistive tech sees; the block's own onClick is a bigger
          pointer target for the same thing (the button stops propagation, or it would toggle twice).
          A plain div, not role=button, so the heading, image and progressbar inside stay in the
          accessibility tree. */}
      <div
        className={`flex items-center gap-4 py-3 ${collection ? 'cursor-pointer hover:bg-white/5 rounded-md' : ''}`}
        onClick={collection ? toggle : undefined}
      >
        {/* Chevron for a collection, empty for a song, so every row's art starts at the same x. */}
        <div className="w-6 flex-none flex items-center justify-center">
          {collection && (
            <button
              type="button"
              aria-expanded={expanded}
              aria-controls={songsId}
              aria-label={`Show songs in ${item.title}`}
              onClick={e => { e.stopPropagation(); toggle() }}
              className="w-6 h-6 flex items-center justify-center rounded text-zinc-500 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green-600"
            >
              <ChevronRight
                className={`w-4 h-4 transition-transform duration-150 motion-reduce:transition-none ${expanded ? 'rotate-90' : ''}`}
                aria-hidden="true"
              />
            </button>
          )}
        </div>

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

      {collection && expanded && (
        <div id={songsId} className="ml-3 mb-3 pl-10 bg-zinc-900/40 border-l-2 border-zinc-800 rounded-r-md">
          {songs === null || songs.length === 0 ? (
            <p className="h-12 flex items-center text-sm text-zinc-400">
              {loadFailed && songs === null ? (
                <>
                  Couldn&apos;t load songs
                  <button
                    type="button"
                    className="ml-3 rounded-full h-7 px-3 text-xs font-medium bg-zinc-800 text-white hover:bg-zinc-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
                    onClick={() => setAttempt(a => a + 1)}
                  >
                    Try again
                  </button>
                </>
              ) : songs === null ? 'Loading songs…'
                // An empty list only means "nothing was downloaded" once the collection is over;
                // before that the server simply has not admitted the songs yet.
                : terminal ? 'No songs were downloaded'
                : refreshing ? 'Waiting for the song list…'
                : 'No song list available'}
            </p>
          ) : (
            <ul className="pr-3">
              {songs.map(song => <SongRow key={song.taskId} song={song} />)}
            </ul>
          )}
        </div>
      )}
    </div>
  )
}
