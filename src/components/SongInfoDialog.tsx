import { useEffect, useRef, useState } from 'react'
import { ArrowDownToLine, Check, Loader2, X } from 'lucide-react'
import { Link } from 'react-router-dom'
import { getSongInfo } from '../api/endpoints'
import { useRetry } from '../hooks/useRetry'
import { ApiError } from '../api/client'
import { DownloadType, SongInfo } from '../api/types'
import { DownloadMetaInput } from '../lib/downloadLibrary'
import { REQUEST_FAILED_COPY, RequestState } from '../pages/CollectionPage'
import { formatDuration } from '../lib/utils'

interface SongInfoDialogProps {
  /** The YouTube videoId to show, or null while closed. */
  videoId: string | null
  onClose: () => void
  /** Same plumbing as the song rows: App requests the download and records its metadata. Resolves
   *  true once the server accepted it - the page behind the backdrop is inert, so the button in the
   *  footer is the only place that feedback can show. */
  onDownload: (id: string, type: DownloadType, meta: DownloadMetaInput) => Promise<boolean>
}

type Load =
  | { status: 'error' }
  | { status: 'notFound' }
  | { status: 'ready'; info: SongInfo }

/** "1.2M", "998K" - how YouTube itself abbreviates a play count. */
const COMPACT = new Intl.NumberFormat('en', { notation: 'compact', maximumFractionDigits: 1 })

const PULSE = 'rounded bg-zinc-800/60 animate-pulse motion-reduce:animate-none'
const BUTTON = 'rounded-full border border-zinc-700 px-4 h-9 text-sm text-white hover:bg-zinc-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green-500'
const LINK = 'hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green-500 rounded'

/** One song's details and credits as a pop-up over whatever page asked for it. The native dialog
 *  owns open/close, Esc and focus: showModal() moves focus inside and close() hands it back to the
 *  info button that opened it. One instance lives in App; every song row opens it with a videoId. */
export function SongInfoDialog({ videoId, onClose, onDownload }: SongInfoDialogProps) {
  const dialogRef = useRef<HTMLDialogElement>(null)
  // Keyed by what was fetched: a result for another song (or an earlier attempt) is simply not ours
  // yet, which is what "loading" means; a result for this exact key is ours and is not fetched again.
  const [fetched, setFetched] = useState<(Load & { key: string }) | null>(null)
  const [attempt, retry] = useRetry(videoId ?? '')
  // Keyed by song, so reopening the same song still shows it was requested and another song starts fresh.
  const [request, setRequest] = useState<{ id: string; state: RequestState } | null>(null)

  useEffect(() => {
    const dialog = dialogRef.current
    if (!dialog) return
    if (videoId && !dialog.open) dialog.showModal()
    if (!videoId && dialog.open) dialog.close()
  }, [videoId])

  const key = `${videoId}:${attempt}`
  const cached = fetched?.key === key
  useEffect(() => {
    if (!videoId || cached) return
    let cancelled = false
    getSongInfo(videoId, { fresh: attempt > 0 })
      .then(info => { if (!cancelled) setFetched({ key, status: 'ready', info }) })
      .catch(err => {
        if (cancelled) return
        const notFound = err instanceof ApiError && err.status === 404
        setFetched({ key, status: notFound ? 'notFound' : 'error' })
      })
    return () => { cancelled = true }
  }, [videoId, key, cached, attempt])

  if (!videoId) return <dialog ref={dialogRef} onClose={onClose} />

  const load: Load | { status: 'loading' } = fetched?.key === key ? fetched : { status: 'loading' }
  const info = load.status === 'ready' ? load.info : null
  const state = request?.id === videoId ? request.state : undefined
  const inert = state === 'pending' || state === 'sent'

  const download = async (info: SongInfo) => {
    setRequest({ id: info.id, state: 'pending' })
    const accepted = await onDownload(info.id, 'SONG', {
      youtubeId: info.id,
      downloadType: 'SONG',
      title: info.name,
      artistNames: info.artists.map(a => a.name),
      albumName: info.album?.name ?? null,
      iconURL: info.iconURL || null,
    })
    setRequest({ id: info.id, state: accepted ? 'sent' : 'failed' })
  }

  const facts: string[] = []
  if (info?.durationSeconds != null) facts.push(formatDuration(info.durationSeconds))
  if (info?.year) facts.push(String(info.year))
  if (info?.viewCount != null) facts.push(`${COMPACT.format(info.viewCount)} plays`)

  return (
    <dialog
      ref={dialogRef}
      onClose={onClose}
      // Clicks on the backdrop land on the <dialog> itself; clicks inside land on children. A drag that
      // selects text and ends over the backdrop also counts as a click on the dialog, so it is ignored.
      onClick={e => { if (e.target === e.currentTarget && !window.getSelection()?.toString()) onClose() }}
      aria-label="Song details"
      className="w-[min(100vw-2rem,32rem)] bg-zinc-900 border border-zinc-800 rounded-xl p-0 text-white backdrop:bg-black/70"
    >
      <div className="relative max-h-[85vh] overflow-y-auto overscroll-contain p-6" aria-busy={load.status === 'loading'}>
        <button
          type="button"
          onClick={onClose}
          aria-label="Close"
          className="absolute top-3 right-3 h-8 w-8 inline-flex items-center justify-center rounded-full text-zinc-400 hover:text-white hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green-500"
        >
          <X className="w-4 h-4" aria-hidden="true" />
        </button>

        {load.status === 'notFound' && (
          <p role="status" className="py-12 text-center text-zinc-400">YouTube Music doesn't know this song.</p>
        )}
        {load.status === 'error' && (
          <div className="py-12 text-center text-zinc-400">
            <p role="status">Couldn't load this song's details.</p>
            <button type="button" onClick={retry} className={`mt-3 ${BUTTON}`}>
              Try again
            </button>
          </div>
        )}

        {(load.status === 'loading' || info) && (
          <>
            {/* Header */}
            <div className="flex gap-5 pr-8">
              {info?.iconURL ? (
                <img src={info.iconURL} alt="" referrerPolicy="no-referrer" className="h-28 w-28 flex-shrink-0 rounded-md object-cover bg-zinc-800 shadow-lg" />
              ) : (
                <div className={`h-28 w-28 flex-shrink-0 rounded-md bg-zinc-800 shadow-lg ${info ? '' : 'animate-pulse motion-reduce:animate-none'}`} />
              )}
              <div className="min-w-0 flex flex-col gap-1.5">
                {info ? (
                  <>
                    <h2 className="text-xl font-bold line-clamp-2">{info.name}</h2>
                    <p className="text-sm text-zinc-300">
                      {info.artists.length === 0 && 'Unknown Artist'}
                      {info.artists.map((artist, i) => (
                        <span key={i}>
                          {i > 0 && ', '}
                          {/* Following the link is leaving this song, so the pop-up closes with it. */}
                          {artist.id
                            ? <Link to={`/artist/${encodeURIComponent(artist.id)}`} onClick={onClose} className={LINK}>{artist.name}</Link>
                            : artist.name}
                        </span>
                      ))}
                    </p>
                    {info.album && (
                      <p className="text-sm text-zinc-400 truncate">
                        {info.album.id
                          ? <Link to={`/album/${encodeURIComponent(info.album.id)}`} onClick={onClose} className={LINK}>{info.album.name}</Link>
                          : info.album.name}
                      </p>
                    )}
                    {(facts.length > 0 || info.explicit) && (
                      <p className="text-xs text-zinc-400 flex items-center gap-2 flex-wrap">
                        {info.explicit && (
                          <span className="rounded bg-zinc-700 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-zinc-200">Explicit</span>
                        )}
                        {facts.join(' · ')}
                      </p>
                    )}
                  </>
                ) : (
                  <>
                    {/* Same heights as the real lines, so nothing jumps when they land. */}
                    <div className={`h-7 w-56 max-w-full ${PULSE}`} />
                    <div className={`h-5 w-32 ${PULSE}`} />
                    <div className={`h-5 w-40 ${PULSE}`} />
                    <div className={`h-4 w-28 ${PULSE}`} />
                  </>
                )}
              </div>
            </div>

            {/* Credits */}
            <section className="mt-6">
              <h3 className="text-sm font-semibold uppercase tracking-wide text-zinc-400 mb-3">Credits</h3>
              {info ? (
                info.credits.length === 0 ? (
                  <p className="text-sm text-zinc-500">No credits available from YouTube Music</p>
                ) : (
                  <dl className="grid grid-cols-[auto_1fr] gap-x-6 gap-y-2 text-sm">
                    {info.credits.map((credit, i) => (
                      <div key={i} className="contents">
                        <dt className="text-zinc-400">{credit.role}</dt>
                        <dd className="text-white">{credit.names.join(', ')}</dd>
                      </div>
                    ))}
                  </dl>
                )
              ) : (
                <div className="space-y-2">
                  {Array.from({ length: 3 }, (_, i) => <div key={i} className={`h-5 w-3/4 ${PULSE}`} />)}
                </div>
              )}
            </section>

            {/* Footer */}
            <div className="mt-6 flex flex-col items-start gap-1.5">
              {/* Inert (not `disabled`) while the details load and once asked, so focus stays on it. */}
              <button
                type="button"
                onClick={() => { if (info && !inert) void download(info) }}
                aria-disabled={!info || inert}
                className="inline-flex items-center gap-2 bg-green-600 hover:bg-green-500 aria-disabled:bg-zinc-700 aria-disabled:hover:bg-zinc-700 aria-disabled:text-zinc-300 aria-disabled:cursor-default rounded-full h-10 px-5 font-semibold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
              >
                {state === 'sent' && <Check className="w-4 h-4" aria-hidden="true" />}
                {state === 'pending' && <Loader2 className="w-4 h-4 animate-spin motion-reduce:animate-none" aria-hidden="true" />}
                {!state || state === 'failed' ? <ArrowDownToLine className="w-4 h-4" aria-hidden="true" /> : null}
                {state === 'sent' ? 'Requested' : state === 'pending' ? 'Requesting…' : 'Download'}
              </button>
              {state === 'failed' && <p role="status" className="text-xs text-red-400">{REQUEST_FAILED_COPY}</p>}
            </div>
          </>
        )}
      </div>
    </dialog>
  )
}
