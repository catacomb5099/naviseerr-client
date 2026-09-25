import { useEffect, useRef, useState } from 'react'
import { ArrowDownToLine, Check, Loader2, X } from 'lucide-react'
import { getCollection } from '../api/endpoints'
import { CollectionDetail, CollectionTrack, CollectionType, DownloadType } from '../api/types'
import { DownloadMetaInput } from '../lib/downloadLibrary'
import { formatDuration } from '../lib/utils'
import { TypeBadge } from './TypeBadge'

/** What a search card knows about the collection it opened; enough to draw the header while the
 *  tracks load. `id` is the exact Album.id / Playlist.id the search returned. */
export interface OpenCollection {
  id: string
  type: CollectionType
  name: string
  iconURL: string
  artists: string[]
  /** Albums only. Known from the search result, so the meta line does not reflow when the detail
   *  lands. */
  year?: number
}

interface CollectionDialogProps {
  collection: OpenCollection | null
  onClose: () => void
  /** Resolves true once the server accepted the request. The page behind the modal backdrop is
   *  inert, so the downloads panel cannot give that feedback - the button that asked shows it. The
   *  panel stays the source of truth for what actually queued. */
  onDownload: (id: string, type: DownloadType, meta: DownloadMetaInput) => Promise<boolean>
}

type Load =
  | { status: 'error' }
  | { status: 'ready'; detail: CollectionDetail }

/** One button's request, keyed by what it posted (the collection id or a track id). Absent means
 *  never asked. `sent` and `pending` keep the button in place but inert, so focus is not dropped. */
type RequestState = 'pending' | 'sent' | 'failed'

const REQUEST_FAILED_COPY = "Couldn't request this — try again"

/** "52 min" / "5 hr 34 min"; null when no track carried a duration. */
function formatTotal(tracks: CollectionTrack[]): string | null {
  const known = tracks.filter(t => t.durationSeconds != null)
  if (known.length === 0) return null
  const minutes = Math.round(known.reduce((sum, t) => sum + (t.durationSeconds ?? 0), 0) / 60)
  const hr = Math.floor(minutes / 60)
  return hr > 0 ? `${hr} hr ${minutes % 60} min` : `${minutes} min`
}

export function CollectionDialog({ collection, onClose, onDownload }: CollectionDialogProps) {
  const dialogRef = useRef<HTMLDialogElement>(null)
  // Keyed by what was fetched: a result for another collection (or an earlier attempt) is simply
  // not ours yet, which is what "loading" means. No state reset needed when the key changes.
  const [fetched, setFetched] = useState<(Load & { key: string }) | null>(null)
  const [attempt, setAttempt] = useState(0)
  // Forgotten on close - the panel is the record of what queued.
  const [requests, setRequests] = useState<Record<string, RequestState>>({})
  // What the live region reads out. Text, not an icon: the check alone says nothing to a reader.
  const [announcement, setAnnouncement] = useState('')

  // The native dialog owns open/close, Esc, and focus: showModal() moves focus inside and close()
  // hands it back to the card that opened it.
  useEffect(() => {
    const dialog = dialogRef.current
    if (!dialog) return
    if (collection && !dialog.open) dialog.showModal()
    if (!collection && dialog.open) dialog.close()
  }, [collection])

  // Forget the last result on close so reopening after an error shows the skeleton, not a stale
  // error panel for one frame before the refetch lands.
  const close = () => { setFetched(null); setRequests({}); setAnnouncement(''); onClose() }

  const id = collection?.id
  const type = collection?.type
  const key = `${type}:${id}:${attempt}`
  useEffect(() => {
    if (!id || !type) return
    let cancelled = false
    getCollection(id, type)
      .then(detail => { if (!cancelled) setFetched({ key, status: 'ready', detail }) })
      .catch(() => { if (!cancelled) setFetched({ key, status: 'error' }) })
    return () => { cancelled = true }
  }, [id, type, key])

  if (!collection) return <dialog ref={dialogRef} onClose={close} />

  const load: Load | { status: 'loading' } = fetched?.key === key ? fetched : { status: 'loading' }
  const detail = load.status === 'ready' ? load.detail : null
  const name = detail?.name ?? collection.name
  const artists = detail?.artists ?? collection.artists
  const iconURL = detail?.iconURL ?? collection.iconURL
  const year = detail?.year ?? collection.year
  const isAlbum = collection.type === 'ALBUM'
  const isEmpty = detail?.tracks.length === 0

  const meta: string[] = []
  if (isAlbum) {
    if (artists.length > 0) meta.push(artists.join(', '))
    if (year) meta.push(String(year))
  } else {
    meta.push(`By ${artists[0] ?? 'Unknown Artist'}`)
  }
  if (detail) {
    meta.push(`${detail.trackCount} songs`)
    const total = formatTotal(detail.tracks)
    if (total) meta.push(total)
  }

  const send = async (id: string, type: DownloadType, title: string, meta: DownloadMetaInput) => {
    setRequests(prev => ({ ...prev, [id]: 'pending' }))
    const accepted = await onDownload(id, type, meta)
    setRequests(prev => ({ ...prev, [id]: accepted ? 'sent' : 'failed' }))
    setAnnouncement(accepted ? `Requested ${title}` : `Couldn't request ${title}`)
  }

  const downloadAll = () => send(collection.id, collection.type, name, {
    youtubeId: collection.id,
    downloadType: collection.type,
    title: name,
    artistNames: artists,
    albumName: null,
    iconURL: iconURL || null,
  })

  const downloadTrack = (track: CollectionTrack) => send(track.id, 'SONG', track.name, {
    youtubeId: track.id,
    downloadType: 'SONG',
    title: track.name,
    artistNames: track.artists,
    albumName: isAlbum ? name : null,
    iconURL: track.iconURL || iconURL || null,
  })

  const allState = requests[collection.id]
  // Inert (not `disabled`) while it cannot be pressed, so a keyboard user's focus stays on it: while
  // the list is still loading, when there is nothing to download, and once the request is in flight
  // or accepted.
  const allInert = load.status !== 'ready' || isEmpty || allState === 'pending' || allState === 'sent'

  return (
    <dialog
      ref={dialogRef}
      onClose={close}
      // Clicks on the backdrop land on the <dialog> itself; clicks inside land on children.
      onClick={e => { if (e.target === e.currentTarget) close() }}
      aria-labelledby="collection-dialog-title"
      className="w-[min(100vw-2rem,40rem)] bg-zinc-900 border border-zinc-800 rounded-xl p-0 text-white backdrop:bg-black/70"
    >
      <div className="relative max-h-[70vh] overflow-y-auto overscroll-contain p-6">
        <button
          type="button"
          onClick={close}
          aria-label="Close"
          className="absolute top-3 right-3 h-8 w-8 inline-flex items-center justify-center rounded-full text-zinc-400 hover:text-white hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green-500"
        >
          <X className="w-4 h-4" aria-hidden="true" />
        </button>

        {/* Header */}
        <div className="flex flex-col sm:flex-row gap-6 pr-8">
          {iconURL ? (
            <img src={iconURL} alt="" referrerPolicy="no-referrer" className="h-32 w-32 sm:h-40 sm:w-40 flex-shrink-0 rounded-md object-cover shadow-lg" />
          ) : (
            <div className="h-32 w-32 sm:h-40 sm:w-40 flex-shrink-0 rounded-md bg-zinc-800 shadow-lg" />
          )}
          <div className="min-w-0 flex flex-col gap-2">
            <TypeBadge type={collection.type} className="self-start" />
            <h2 id="collection-dialog-title" className="text-2xl font-bold line-clamp-2">{name}</h2>
            <p className="text-sm text-zinc-400">{meta.join(' · ')}</p>
            <div className="mt-auto flex flex-col items-start gap-1.5">
              <button
                type="button"
                onClick={() => { if (!allInert) void downloadAll() }}
                aria-disabled={allInert}
                className="inline-flex items-center gap-2 bg-green-600 hover:bg-green-500 aria-disabled:bg-zinc-700 aria-disabled:hover:bg-zinc-700 aria-disabled:text-zinc-300 aria-disabled:cursor-default rounded-full h-10 px-5 font-semibold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
              >
                {allState === 'sent' && <Check className="w-4 h-4" aria-hidden="true" />}
                {allState === 'pending' && <Loader2 className="w-4 h-4 animate-spin motion-reduce:animate-none" aria-hidden="true" />}
                {allState === 'sent' ? 'Requested' : allState === 'pending' ? 'Requesting…' : 'Download all'}
              </button>
              {allState === 'failed' && <p className="text-xs text-red-400">{REQUEST_FAILED_COPY}</p>}
            </div>
          </div>
        </div>

        {/* Tracks */}
        <div className="mt-6" aria-busy={load.status === 'loading'}>
          {load.status === 'loading' && (
            <ul aria-label="Loading songs" className="space-y-1">
              {Array.from({ length: 5 }, (_, i) => (
                <li key={i} className="h-14 rounded-md bg-zinc-800/60 animate-pulse motion-reduce:animate-none" />
              ))}
            </ul>
          )}
          {load.status === 'error' && (
            <div className="py-8 text-center text-zinc-400">
              <p role="status">Couldn't load the songs.</p>
              <button
                type="button"
                onClick={() => setAttempt(a => a + 1)}
                className="mt-3 rounded-full border border-zinc-700 px-4 h-9 text-sm text-white hover:bg-zinc-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green-500"
              >
                Try again
              </button>
            </div>
          )}
          {isEmpty && <p role="status" className="py-8 text-center text-zinc-400">No downloadable songs.</p>}
          {detail && !isEmpty && (
            <ul className="space-y-0.5">
              {/* position, not id: a playlist can hold the same video twice. */}
              {detail.tracks.map(track => {
                const thumb = track.iconURL || iconURL
                const state = requests[track.id]
                const inert = state === 'pending' || state === 'sent'
                return (
                  <li key={track.position} className="h-14 flex items-center gap-3 rounded-md px-2 hover:bg-white/10">
                    {isAlbum ? (
                      <span className="w-8 text-right text-sm text-zinc-500 tabular-nums">{track.position}</span>
                    ) : thumb ? (
                      <img src={thumb} alt="" referrerPolicy="no-referrer" className="h-10 w-10 rounded object-cover bg-zinc-800" />
                    ) : (
                      <div className="h-10 w-10 rounded bg-zinc-800" />
                    )}
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-white truncate">{track.name}</p>
                      {/* The error takes the artist line's slot so the 56px row does not grow. */}
                      {state === 'failed' ? (
                        <p className="text-xs text-red-400 truncate">{REQUEST_FAILED_COPY}</p>
                      ) : (
                        <p className="text-xs text-zinc-400 truncate">
                          {track.artists.length > 0 ? track.artists.join(', ') : 'Unknown Artist'}
                        </p>
                      )}
                    </div>
                    <span className="w-12 text-right text-xs text-zinc-400 tabular-nums">
                      {track.durationSeconds != null && formatDuration(track.durationSeconds)}
                    </span>
                    {/* The same element through every state, so a keyboard user's focus stays put
                        when a click turns the arrow into a check. */}
                    <button
                      type="button"
                      onClick={() => { if (!inert) void downloadTrack(track) }}
                      aria-disabled={inert}
                      aria-label={state === 'sent' ? `Requested ${track.name}` : `Download ${track.name}`}
                      className="inline-flex h-8 w-8 items-center justify-center rounded-full text-zinc-400 hover:text-white aria-disabled:hover:text-zinc-400 aria-disabled:cursor-default focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green-500"
                    >
                      {state === 'sent' ? (
                        <Check className="w-4 h-4 text-green-500" aria-hidden="true" />
                      ) : state === 'pending' ? (
                        <Loader2 className="w-4 h-4 animate-spin motion-reduce:animate-none text-zinc-500" aria-hidden="true" />
                      ) : (
                        <ArrowDownToLine className="w-4 h-4" aria-hidden="true" />
                      )}
                    </button>
                  </li>
                )
              })}
            </ul>
          )}
        </div>

        <p role="status" className="sr-only">{announcement}</p>
      </div>
    </dialog>
  )
}
