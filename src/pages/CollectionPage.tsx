import { useEffect, useState } from 'react'
import { ArrowDownToLine, ArrowLeft, Check, Info, Loader2 } from 'lucide-react'
import { useLocation, useNavigate, useParams } from 'react-router-dom'
import { getCollection, getSongViews } from '../api/endpoints'
import { useRetry } from '../hooks/useRetry'
import { CollectionDetail, CollectionTrack, CollectionType, DownloadType } from '../api/types'
import { DownloadMetaInput } from '../lib/downloadLibrary'
import { formatDuration, formatViews } from '../lib/utils'
import { AppHeader } from '../components/AppHeader'
import { PageNavButton } from '../components/PageNavButton'
import { TypeBadge } from '../components/TypeBadge'

interface CollectionPageProps {
  /** From the route: /album/:id or /playlist/:id. The id is read from the URL. */
  type: CollectionType
  /** Resolves true once the server accepted the request; the button that asked shows it. The
   *  downloads panel stays the source of truth for what actually queued. */
  onDownload: (id: string, type: DownloadType, meta: DownloadMetaInput) => Promise<boolean>
  /** Opens the song info pop-up App owns. */
  onInfo: (videoId: string) => void
}

type Load =
  | { status: 'error' }
  | { status: 'ready'; detail: CollectionDetail }

/** One button's request, keyed by what it posted (the collection id or a track id). Absent means
 *  never asked. `sent` and `pending` keep the button in place but inert, so focus is not dropped. */
export type RequestState = 'pending' | 'sent' | 'failed'

export const REQUEST_FAILED_COPY = "Couldn't request this — try again"

/** Ids per GET /songs/views. The server takes 50; half that fills the first rows sooner. */
const VIEWS_CHUNK = 25

/** "52 min" / "5 hr 34 min"; null when no track carried a duration. */
function formatTotal(tracks: CollectionTrack[]): string | null {
  const known = tracks.filter(t => t.durationSeconds != null)
  if (known.length === 0) return null
  const minutes = Math.round(known.reduce((sum, t) => sum + (t.durationSeconds ?? 0), 0) / 60)
  const hr = Math.floor(minutes / 60)
  return hr > 0 ? `${hr} hr ${minutes % 60} min` : `${minutes} min`
}

/** An album or playlist as its own page. Everything comes from the URL and one fetch, so a deep
 *  link or a refresh works with no search state behind it: skeleton until the detail arrives. */
export function CollectionPage({ type, onDownload, onInfo }: CollectionPageProps) {
  const { id = '' } = useParams()
  const navigate = useNavigate()
  // The router gives an entry the key 'default' only when it has no history behind it: a typed
  // address, a fresh tab, an external link. A refresh keeps the entry's key. Anything else was
  // reached from inside the app, so the browser's back is the right way out and keeps the search
  // results the user came from.
  const cameFromApp = useLocation().key !== 'default'
  // Keyed by what was fetched: a result for another collection (or an earlier attempt) is simply
  // not ours yet, which is what "loading" means. No state reset needed when the key changes.
  const [fetched, setFetched] = useState<(Load & { key: string }) | null>(null)
  const [attempt, retry] = useRetry(`${type}:${id}`)
  // Forgotten on leaving the page - the panel is the record of what queued.
  const [requests, setRequests] = useState<Record<string, RequestState>>({})
  // What the live region reads out. Text, not an icon: the check alone says nothing to a reader.
  const [announcement, setAnnouncement] = useState('')
  // How many times each video was viewed, by id, for the songs that came without plays.
  const [views, setViews] = useState<Record<string, number>>({})

  const key = `${type}:${id}:${attempt}`
  useEffect(() => {
    let cancelled = false
    getCollection(id, type, { fresh: attempt > 0 })
      .then(detail => { if (!cancelled) setFetched({ key, status: 'ready', detail }) })
      .catch(() => { if (!cancelled) setFetched({ key, status: 'error' }) })
    return () => { cancelled = true }
  }, [id, type, key, attempt])

  const load: Load | { status: 'loading' } = fetched?.key === key ? fetched : { status: 'loading' }
  const detail = load.status === 'ready' ? load.detail : null
  // Only songs YouTube Music gave no play count are asked about: playlist songs. An album's tracks all
  // carry plays, so an album asks nothing.
  useEffect(() => {
    if (!detail) return
    const ids = Array.from(new Set(detail.tracks.filter(t => t.plays == null).map(t => t.id)))
    let cancelled = false
    void (async () => {
      // One chunk after another on purpose: the first rows fill first, and the server (one YouTube
      // call per id) is not handed a whole playlist at once. A StrictMode remount stops the first run
      // after its first chunk, which the request cache shares with the second, so nothing is asked twice.
      for (let i = 0; i < ids.length && !cancelled; i += VIEWS_CHUNK) {
        // A failed chunk is skipped: those rows just show no number.
        const counts = await getSongViews(ids.slice(i, i + VIEWS_CHUNK)).catch(() => ({}))
        if (!cancelled) setViews(prev => ({ ...prev, ...counts }))
      }
    })()
    return () => { cancelled = true }
  }, [detail])
  const name = detail?.name ?? ''
  // The tab, bookmark and history entry are labelled by the page, not just "Naviseerr".
  useEffect(() => {
    document.title = name ? `${name} - Naviseerr` : 'Naviseerr'
    return () => { document.title = 'Naviseerr' }
  }, [name])
  const artists = detail?.artists ?? []
  const iconURL = detail?.iconURL ?? null
  const isAlbum = type === 'ALBUM'
  const isEmpty = detail?.tracks.length === 0

  const meta: string[] = []
  if (detail) {
    if (isAlbum) {
      if (artists.length > 0) meta.push(artists.join(', '))
      if (detail.year) meta.push(String(detail.year))
    } else {
      meta.push(`By ${artists[0] ?? 'Unknown Artist'}`)
    }
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

  const downloadAll = () => send(id, type, name, {
    youtubeId: id,
    downloadType: type,
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

  const allState = requests[id]
  // Inert (not `disabled`) while it cannot be pressed, so a keyboard user's focus stays on it: while
  // the list is still loading, when there is nothing to download, and once the request is in flight
  // or accepted.
  const allInert = load.status !== 'ready' || isEmpty || allState === 'pending' || allState === 'sent'

  return (
    <div className="max-w-7xl mx-auto px-4 py-6 md:px-6">
      <AppHeader action={
        <PageNavButton
          label="Back"
          icon={<ArrowLeft className="w-4 h-4" />}
          onClick={() => cameFromApp ? navigate(-1) : navigate('/')}
        />
      } />

      <main>
        {/* Header */}
        <div className="flex flex-col sm:flex-row gap-6" aria-busy={load.status === 'loading'}>
          {iconURL ? (
            <img src={iconURL} alt="" referrerPolicy="no-referrer" className="h-40 w-40 sm:h-48 sm:w-48 flex-shrink-0 rounded-md object-cover shadow-lg" />
          ) : (
            <div className={`h-40 w-40 sm:h-48 sm:w-48 flex-shrink-0 rounded-md bg-zinc-800 shadow-lg ${detail ? '' : 'animate-pulse motion-reduce:animate-none'}`} />
          )}
          <div className="min-w-0 flex flex-col gap-2">
            <TypeBadge type={type} className="self-start" />
            {detail ? (
              <>
                <h2 className="text-3xl font-bold line-clamp-2">{name}</h2>
                <p className="text-sm text-zinc-400">{meta.join(' · ')}</p>
              </>
            ) : (
              <>
                {/* Same heights as the real title and meta line, so nothing jumps when they land. */}
                <div className="h-9 w-64 max-w-full rounded bg-zinc-800/60 animate-pulse motion-reduce:animate-none" />
                <div className="h-5 w-40 rounded bg-zinc-800/60 animate-pulse motion-reduce:animate-none" />
              </>
            )}
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
        <div className="mt-8" aria-busy={load.status === 'loading'}>
          {load.status === 'loading' && (
            <ul aria-label="Loading songs" className="space-y-1">
              {Array.from({ length: 8 }, (_, i) => (
                <li key={i} className="h-14 rounded-md bg-zinc-800/60 animate-pulse motion-reduce:animate-none" />
              ))}
            </ul>
          )}
          {load.status === 'error' && (
            <div className="py-8 text-center text-zinc-400">
              <p role="status">Couldn't load the songs.</p>
              <button
                type="button"
                onClick={retry}
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
                // "plays" is YouTube Music's combined count, which album tracks carry. A playlist song
                // (mostly music videos and fan uploads) has only its own video's count, a smaller
                // number, so it reads "views": a views number is never labelled as plays.
                const plays = track.plays ?? formatViews(views[track.id])
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
                    {/* Hidden on phones, where the row has no room for it. */}
                    {plays && (
                      <span className="hidden sm:inline w-20 text-right text-xs text-zinc-400 tabular-nums whitespace-nowrap">
                        {plays}
                      </span>
                    )}
                    <span className="w-12 text-right text-xs text-zinc-400 tabular-nums">
                      {track.durationSeconds != null && formatDuration(track.durationSeconds)}
                    </span>
                    <button
                      type="button"
                      onClick={() => onInfo(track.id)}
                      aria-label={`Details for ${track.name}`}
                      className="inline-flex h-8 w-8 items-center justify-center rounded-full text-zinc-400 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green-500"
                    >
                      <Info className="w-4 h-4" aria-hidden="true" />
                    </button>
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
      </main>
    </div>
  )
}
